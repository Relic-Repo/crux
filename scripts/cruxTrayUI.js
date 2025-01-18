import { resolveActor, fromUuid } from "./cruxHooks.js";
import CruxEffectsApp from "./cruxEffectsApp.js";

/**
 * Checks if the DnD5e system version is 4.0 or higher
 * @returns {boolean} True if system version is 4.0+, false otherwise
 */
function DnDv4() {
    const system = game.system;
    if (system.id !== "dnd5e") return false;
    const version = system.version;
    const majorVersion = parseInt(version.split('.')[0]);
    return majorVersion >= 4;
}

/**
 * Handles item recharge based on system version
 * @param {Item} item - The item to recharge
 */
function handleItemRecharge(item) {
    if (DnDv4()) {
        item.system.uses.rollRecharge();
    } else {
        item.rollRecharge();
    }
}
import { calculateUsesForItem } from "./cruxItem.js";
import { getActiveActors, scrollPosition, updateScrollPosition } from "./cruxTrayState.js";

/**
 * Updates the tray's content and binds event handlers
 * This is the main function that renders and manages the tray UI
 */
export async function updateTray() {
    const settingShowNoUses = game.settings.get("crux", "show-no-uses");
    const settingShowUnpreparedCantrips = game.settings.get("crux", "show-unprepared-cantrips");
    const settingSkillMode = game.settings.get("crux", "skill-mode");
    const settingSortAlphabetically = game.settings.get("crux", "sort-alphabetic");
    const settingSkillsExpanded = game.settings.get("crux", "skills-expanded") === "open";
    const settingMainSectionsExpanded = game.settings.get("crux", "main-sections-expanded") === "open";
    const settingSubSectionsExpanded = game.settings.get("crux", "sub-sections-expanded") === "open";
    const useTidy5e = game.settings.get("crux", "use-tidy5e-sections");

    const actors = getActiveActors().map(actor => {
        const actorData = actor.system;

        const canCastUnpreparedRituals = !!actor.items.find(i => i.name === "Wizard");

        const sections = {
            favorites: { items: [], title: "crux.category.favorites" },
            equipped: { items: [], title: "crux.category.equipped" },
            inventory: {
                title: "crux.category.inventory",
                groups: {
                    weapon: { items: [], title: "crux.category.weapon" },
                    equipment: { items: [], title: "crux.category.equipment" },
                    consumable: { items: [], title: "crux.category.consumable" },
                    other: { items: [], title: "crux.category.other" }
                }
            },
            feature: { 
                items: [], 
                title: "crux.category.feature", 
                groups: {
                    ...systemFeatureGroups()
                }
            },
            spell: {
                title: "crux.category.spell",
                groups: {
                    innate: { items: [], title: "crux.category.innate" },
                    atwill: { items: [], title: "crux.category.atwill" },
                    pact: { items: [], title: "crux.category.pact" },
                    ...[...Array(10).keys()].reduce((prev, cur) => {
                        prev[`spell${cur}`] = { items: [], title: `crux.category.spell${cur}` }
                        return prev;
                    }, {})
                }
            },
            passive: { items: [], title: "crux.category.passive" }
        };

    for (let item of actor.items) {
        const itemData = item.system;
        const uses = calculateUsesForItem(item);
        const hasUses = settingShowNoUses || !uses || uses.available;
        const favoriteEntry = actorData.favorites?.find(f => {
            const favoriteId = f.id.startsWith(".") ? f.id.substring(1) : f.id;
            return favoriteId === `Item.${item.id}`;
        });
        if (favoriteEntry && !item.getFlag("crux", "hidden")) {
            sections.favorites.items.push({ item, uses, sort: favoriteEntry.sort });
        }

            if (hasUses && itemData.activation?.type && itemData.activation.type !== "none" && !item.getFlag("crux", "hidden")) {
                switch (item.type) {
                    case "feat":
                        const featureSection = useTidy5e ? item.flags?.["tidy5e-sheet"]?.section : null;
                        if (featureSection) {
                            const sectionKey = `tidy5e_${featureSection.toLowerCase().replace(/\s+/g, '_')}`;
                            if (!sections.feature.groups[sectionKey]) {
                                sections.feature.groups[sectionKey] = {
                                    items: [],
                                    title: featureSection
                                };
                            }
                            sections.feature.groups[sectionKey].items.push({ item, uses });
                        } else {
                            const type = item.system.type.value;
                            const subtype = item.system.type.subtype;

                            if (subtype) {
                                sections.feature.groups[subtype].items.push({ item, uses });
                            } else if (type) {
                                sections.feature.groups[type].items.push({ item, uses });
                            } else {
                                sections.feature.groups.general.items.push({ item, uses });
                            }
                        }
                        break;
                    case "spell":
                        const spellSection = useTidy5e ? item.flags?.["tidy5e-sheet"]?.section : null;
                        if (spellSection) {
                            const sectionKey = `tidy5e_${spellSection.toLowerCase().replace(/\s+/g, '_')}`;
                            if (!sections.spell.groups[sectionKey]) {
                                sections.spell.groups[sectionKey] = {
                                    items: [],
                                    title: spellSection
                                };
                            }
                            sections.spell.groups[sectionKey].items.push({ item, uses });
                        } else {
                            switch (itemData.preparation?.mode) {
                                case "prepared":
                                case "always":
                                    const isAlways = itemData.preparation?.mode !== "prepared";
                                    const isPrepared = itemData.preparation?.prepared;
                                    const isCastableRitual = (canCastUnpreparedRituals && itemData.components?.ritual);
                                    const isDisplayableCantrip = itemData.level == 0 && settingShowUnpreparedCantrips;
                                    if (isAlways || isPrepared || isCastableRitual || isDisplayableCantrip) {
                                        sections.spell.groups[`spell${itemData.level}`].items.push({ item, uses });
                                    }
                                    break;
                                case "atwill":
                                    sections.spell.groups.atwill.items.push({ item, uses });
                                    break;
                                case "innate":
                                    sections.spell.groups.innate.items.push({ item, uses });
                                    break;
                                case "pact":
                                    sections.spell.groups.pact.items.push({ item, uses });
                                    break;
                            }
                        }
                        break;
                    default:
                        const inventorySection = useTidy5e ? item.flags?.["tidy5e-sheet"]?.section : null;
                        if (inventorySection) {
                            const sectionKey = `tidy5e_${inventorySection.toLowerCase().replace(/\s+/g, '_')}`;
                            if (!sections.inventory.groups[sectionKey]) {
                                sections.inventory.groups[sectionKey] = {
                                    items: [],
                                    title: inventorySection
                                };
                            }
                            sections.inventory.groups[sectionKey].items.push({ item, uses });
                        } else {
                            switch (item.type) {
                                case "weapon":
                                    if (itemData.equipped) {
                                        sections.equipped.items.push({ item, uses });
                                    } else {
                                        sections.inventory.groups.weapon.items.push({ item, uses });
                                    }
                                    break;
                                case "equipment":
                                    sections.inventory.groups.equipment.items.push({ item, uses });
                                    break;
                                case "consumable":
                                    if (itemData.consumableType !== "ammo") {
                                        sections.inventory.groups.consumable.items.push({ item, uses });
                                    }
                                    break;
                                default:
                                    sections.inventory.groups.other.items.push({ item, uses });
                            }
                        }
                        break;
                }
            } else if (actor.type === "npc") {
                sections.passive.items.push({ item, uses });
            }
        }

        function systemFeatureGroups() {
            const groups = Object.entries(CONFIG.DND5E.featureTypes).reduce((prev, cur) => {
                prev[cur[0]] = {
                    items: [],
                    title: cur[1].label
                };
                if (cur[1].subtypes) {
                    for (const sub in cur[1].subtypes) {
                        prev[sub] = {
                            items: [],
                            title: cur[1].subtypes[sub]
                        };
                    }
                }
                return prev;
            }, {});
            
            groups.general = {
                items: [],
                title: "crux.category.general"
            };
            
            return groups;
        }

    function removeEmptySections(sections) {
        function hasItems(object) {
            if (!object || typeof object !== "object") { return false; }
            const keys = Object.keys(object);
            if (keys.includes("groups") && Object.values(object.groups).some(g => hasItems(g))) { return true; }
            if (keys.includes("items")) { return !!object.items.length; }
            return Object.values(object).some(v => hasItems(v));
        }

        return Object.entries(sections).reduce((acc, [key, value]) => {
            if (key === 'favorites' || hasItems(value)) {
                acc[key] = value;
            }
            return acc;
        }, {});
    }

        function addSpellLevelUses(sections) {
            for (let l = 1; l <= 9; l++) {
                const group = sections.spell?.groups[`spell${l}`];
                if (group) {
                    const sl = actorData.spells[`spell${l}`];
                    group.uses = { available: sl.value, maximum: sl.max };
                }
            }

            if (actorData.spells.pact.max) {
                sections.spell.groups.pact.uses = {
                    available: actorData.spells.pact.value,
                    maximum: actorData.spells.pact.max
                };
            }

            return sections;
        }

        function sortItems(sections) {
            if (!sections || typeof sections !== "object") return sections;

            Object.entries(sections).forEach(([sectionKey, value]) => {
                if (!value || typeof value !== "object") return;
                if (Array.isArray(value.items)) {
                    if (sectionKey === "favorites") {
                        value.items.sort((a, b) => a.sort - b.sort);
                    } else {
                        value.items.sort((a, b) => {
                            if (settingSortAlphabetically) {
                                return a.item.name.localeCompare(b.item.name);
                            } else {
                                return a.item.sort - b.item.sort;
                            }
                        });
                    }
                }
                if (value.groups) {
                    sortItems(value.groups);
                }
            });
            return sections;
        }

        const combatant = game.combat?.combatants.find(c => c.actor === actor);
        const needsInitiative = combatant && !combatant.initiative;
        let doShowSkills = false;
        const { uuid, showSkills } = scrollPosition;
        if (actor.uuid === uuid && showSkills !== undefined) {
            doShowSkills = showSkills;
        } else if (settingSkillMode === "dropdown") {
            doShowSkills = settingSkillsExpanded;
        }

        const abilities = {};
        for (const [abbr, details] of Object.entries(actorData.abilities)) {
            abilities[abbr] = {
                ...details,
                label: CONFIG.DND5E.abilities[abbr]?.label || abbr.toUpperCase(),
                abbr: abbr
            };
        }

        const token = actor.getActiveTokens()[0];
        const elevation = token?.elevation ?? 0;

        return {
            actor: actor,
            name: actor.name,
            sections: addSpellLevelUses(sortItems(removeEmptySections(sections))),
            needsInitiative,
            skills: CONFIG.DND5E.skills,
            skillMode: settingSkillMode,
            showSkills: doShowSkills,
            abilities: abilities,
            elevation: elevation
        };
    });

    function prefix(tgt, str) {
        return tgt ? [str, tgt].join("-") : tgt;
    }

    const iconSize = prefix(game.settings.get("crux", "icon-size"), "icon");
    const traySize = prefix(game.settings.get("crux", "tray-size"), "tray");
    const showSpellDots = game.settings.get("crux", "show-spell-dots");

    const htmlString = await renderTemplate("modules/crux/templates/crux.hbs", { actors, iconSize, showSpellDots });
    const container = $('#crux');
    const html = container.html(htmlString);
    container[0].classList.remove("tray-small", "tray-medium", "tray-large");
    container[0].classList.add(traySize);

    if (actors.length == 1) {
        const currentUuid = actors[0].actor.uuid;
        const { uuid, scroll } = scrollPosition;
        if (currentUuid === uuid && scroll !== undefined) {
            html.find('.crux__container')[0].scrollTop = scroll;
        }
    } else {
        updateScrollPosition({});
    }

    function roll(event) {
        event.preventDefault();
        const itemUuid = event.currentTarget.closest(".item").dataset.itemUuid;
        const item = fromUuid(itemUuid);
        if (item) {
            if (!game.modules.get("wire")?.active && game.modules.get("itemacro")?.active && game.settings.get("itemacro", "defaultmacro")) {
                if (item.hasMacro()) {
                    item.executeMacro();
                    return false;
                }
            }

            item.use({}, event);
        }
        return false;
    }

    function openSheet(event) {
        event.preventDefault();
        const itemUuid = event.currentTarget.closest(".item").dataset.itemUuid;
        const item = fromUuid(itemUuid);
        if (item) item.sheet.render(true);
        return false;
    }

    function hover(event, hookName) {
        const itemId = event.currentTarget.closest(".item").dataset.itemUuid;
        const item = fromUuid(itemId);
        Hooks.callAll(hookName, item, $(event.currentTarget));
    }

    html.find('.rollable .item-image').mousedown(roll);

    html.find('.rollable.item-name')
        .hover(
            event => hover(event, "actorItemHoverIn"),
            event => hover(event, "actorItemHoverOut")
        );

    html.find('.rollable.item-name').mousedown(async function(event) {
        if (event.which == 2) {
            return openSheet(event);
        }

        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        const item = await fromUuid(li.data("item-uuid"));
        const chatData = await item.getChatData({ secrets: item.actor.isOwner });

        if (li.hasClass("expanded")) {
            let summary = li.children(".item-summary");
            summary.slideUp(200, () => summary.remove());
        } else {
            let div = $(`<div class="item-summary">${chatData.description.value}</div>`);
            let props = $('<div class="item-properties"></div>');
            chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
            div.append(props);
            li.append(div.hide());
            div.slideDown(200);
        }
        li.toggleClass("expanded");
    });

    html.find('.rollable.item-recharge').mousedown(function(event) {
        const li = $(event.currentTarget).parents(".item");
        const item = fromUuid(li.data("item-uuid"));
        handleItemRecharge(item);
        event.preventDefault();
        return false;
    });

    html.find('.group-dots .dot').click(function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        const group = this.closest('.group-dots').dataset.groupName;
        const slot = parseInt(this.dataset.slot) + 1;

        const current = actor.system.spells?.[group]?.value;
        if (current !== undefined) {
            const key = `system.spells.${group}.value`;
            const newValue = current !== slot ? slot : slot - 1;
            actor.update({ [key]: newValue });
        }
    });

    html.find('.crux__ability').click(function(event) {
        const abl = this.dataset.ability;
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (abl && actor) {
            actor.rollAbility(abl, { event: event });
        }
    });

    html.find('.crux__skill-row').click(function(event) {
        const skill = event.currentTarget.dataset.skill;
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        return actor.rollSkill(skill, { event: event });
    });


    html.find('.crux__skill-header').click(function(event) {
        const skillContainer = event.target.closest('.crux__skill-container');
        skillContainer.classList.toggle("is-open");
        
        if (getActiveActors().length == 1) {
            const actor = getActiveActors()[0];
            if (!actor) return;
            
            updateScrollPosition({
                uuid: actor.uuid,
                scroll: $('.crux__container')[0].scrollTop,
                showSkills: skillContainer.classList.contains("is-open")
            });
        }
    });

    html.find('.crux__section-header').click(function(event) {
        const section = $(this).closest('.crux__section');
        section.toggleClass('is-collapsed');
        
        if (getActiveActors().length == 1) {
            const actor = getActiveActors()[0];
            if (!actor) return;

            const newState = {
                uuid: actor.uuid,
                scroll: $('.crux__container')[0].scrollTop,
                showSkills: $('.crux__skill-container').hasClass("is-open"),
                sectionStates: { ...scrollPosition.sectionStates }
            };
            
            const sectionTitle = $(this).find('span').text();
            newState.sectionStates[sectionTitle] = !section.hasClass('is-collapsed');
            
            updateScrollPosition(newState);
        }
    });

    html.find('.crux__group-header').click(function(event) {
        const group = $(this).closest('.crux__group');
        group.toggleClass('is-collapsed');
        
        if (getActiveActors().length == 1) {
            const actor = getActiveActors()[0];
            if (!actor) return;

            const newState = {
                uuid: actor.uuid,
                scroll: $('.crux__container')[0].scrollTop,
                showSkills: $('.crux__skill-container').hasClass("is-open"),
                sectionStates: { ...scrollPosition.sectionStates },
                groupStates: { ...scrollPosition.groupStates }
            };
            
            const groupTitle = $(this).find('h3 span').text();
            newState.groupStates[groupTitle] = !group.hasClass('is-collapsed');
            
            updateScrollPosition(newState);
        }
    });

    
    html.find('.crux__open-token-button').click(async function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (!actor) return;

        const token = actor.getActiveTokens()[0];
        if (token) {
            token.sheet.render(true);
        }
    });

    html.find('.crux__toggle-target-button').click(async function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (!actor) return;

        const token = actor.getActiveTokens()[0];
        if (token) {
            token.setTarget(!token.isTargeted, { releaseOthers: false });
        }
    });

    html.find('.crux__status-effects-button').click(async function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (!actor) return;

        const token = actor.getActiveTokens()[0];
        if (token) {
            const app = new CruxEffectsApp(actor, token, this);
            app.render(true);
        }
    });

    html.find('.crux__expand-collapse-button').click(function(event) {
        const actor = $(this).closest('.crux__actor');
        const sections = actor.find('.crux__section');
        const groups = actor.find('.crux__group');
        
        const isAnySectionCollapsed = sections.toArray().some(section => $(section).hasClass('is-collapsed'));
        const isAnyGroupCollapsed = groups.toArray().some(group => $(group).hasClass('is-collapsed'));
        
        if (isAnySectionCollapsed) {
            sections.removeClass('is-collapsed');
        } else {
            sections.addClass('is-collapsed');
        }
        
        if (isAnyGroupCollapsed) {
            groups.removeClass('is-collapsed');
        } else {
            groups.addClass('is-collapsed');
        }
        
        if (getActiveActors().length == 1) {
            const actor = getActiveActors()[0];
            if (!actor) return;
            
            const newScrollState = {
                uuid: actor.uuid,
                scroll: $('.crux__container')[0].scrollTop,
                showSkills: skillContainer.hasClass("is-open"),
                sectionStates: {},
                groupStates: {}
            };
            
            sections.each(function() {
                const title = $(this).find('.crux__section-header span').text();
                newScrollState.sectionStates[title] = !$(this).hasClass('is-collapsed');
            });
            
            groups.each(function() {
                const title = $(this).find('.crux__group-header h3 span').text();
                newScrollState.groupStates[title] = !$(this).hasClass('is-collapsed');
            });
            
            updateScrollPosition(newScrollState);
        }
    });
    html.find('.crux__add-to-combat-button').click(async function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (!actor) return;

        const combat = game.combat;
        const isGM = game.user.isGM;

        if (combat) {
            const combatant = combat.combatants.find(c => c.actor?.uuid === actor.uuid);
            if (combatant) {
                ui.notifications.warn(`${actor.name} is already in combat.`);
                return;
            }
        } else if (isGM) {
            await Combat.create();
        } else {
            ui.notifications.warn(`No Active Combat Encounter. Please wait for creation and try again.`);
            return;
        }

        const token = actor.getActiveTokens()[0];
        if (token) {
            await game.combat.createEmbeddedDocuments("Combatant", [{
                actorId: actor.id,
                tokenId: token.id,
                hidden: false
            }]);
        }
    });

    html.find('.crux__set-elevation-button').click(async function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (!actor) return;

        const token = actor.getActiveTokens()[0];
        if (!token) return;

        const currentElevation = token.elevation ?? 0;

        const content = `
            <form>
                <div class="form-group">
                    <label>${game.i18n.localize("crux.elevation.label")}</label>
                    <input type="number" name="elevation" value="${currentElevation}" step="any" style="width: 80px;"/>
                </div>
            </form>`;

        new foundry.applications.api.DialogV2({
            window: { title: game.i18n.localize("crux.elevation.title") },
            content: content,
            buttons: [
                {
                    action: "set",
                    label: game.i18n.localize("crux.elevation.set"),
                    default: true,
                    callback: async (event, button, dialog) => {
                        const newElevation = Number(button.form.elements.elevation.value);
                        await token.document.update({ elevation: newElevation });
                    }
                },
                {
                    action: "cancel",
                    label: game.i18n.localize("crux.elevation.cancel")
                }
            ],
            default: "set"
        }).render(true);
    });

    if (settingMainSectionsExpanded === false) {
        html.find('.crux__section').addClass('is-collapsed');
    }
    if (settingSubSectionsExpanded === false) {
        html.find('.crux__group').addClass('is-collapsed');
    }
    if (settingSkillsExpanded === true) {
        html.find('.crux__skill-container').addClass('is-open');
    }

    if (actors.length == 1) {
        const currentUuid = actors[0].actor.uuid;
        const { uuid, sectionStates, groupStates } = scrollPosition;
        if (currentUuid === uuid) {
            if (sectionStates) {
                html.find('.crux__section').each(function() {
                    const title = $(this).find('.crux__section-header span').text();
                    if (sectionStates[title] === false) {
                        $(this).addClass('is-collapsed');
                    }
                });
            }
            if (groupStates) {
                html.find('.crux__group').each(function() {
                    const title = $(this).find('.crux__group-header h3 span').text();
                    if (groupStates[title] === false) {
                        $(this).addClass('is-collapsed');
                    }
                });
            }
        }
    }

    html.find('.crux__portrait').click(function(event) {
        $(this).toggleClass('flipped');
    });

    html.find('.crux__actor-name').click(function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (actor) {
            if (!actor.sheet.rendered) actor.sheet.render(true);
            else actor.sheet.close();
        }
    });

    html.find('.crux__end-turn').click(function(event) {
        game.combat?.nextTurn();
    });

    html.find('.crux__initiative').click(function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        const combatantId = game.combat?.combatants.find(c => c.actor === actor).id;
        game.combat?.rollInitiative([combatantId]);
    });

    html.find('.crux__action-button').click(async function(event) {
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        if (!actor) return;

        const action = this.dataset.action;
        const actionName = game.i18n.localize(`crux.action.${action}`);
        const matchingItem = actor.items.find(item => {
            const name = item.name.toLowerCase();
            return name === action.toLowerCase() || name === actionName.toLowerCase();
        });

        if (matchingItem) {
            await matchingItem.use({}, event);
        } else {
            const content = `<p>${actor.name} uses ${actionName}</p>`;
            await ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ actor }),
                content,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }
    });

    html.find('.crux__container').on("scroll", function(event) {
        if (getActiveActors().length == 1) {
            const actor = getActiveActors()[0];
            if (!actor) return;
            
            updateScrollPosition({
                uuid: actor.uuid,
                scroll: event.currentTarget.scrollTop,
                showSkills: $('.crux__skill-container').hasClass("is-open")
            });
        } else {
            updateScrollPosition({});
        }
    });

    $(document).off('keydown.crux-favorites');
    
    Hooks.once('closeTray', () => {
        $(document).off('keydown.crux-favorites');
    });
    
    Hooks.call('crux.updateTray', html, actors);
}

Handlebars.registerHelper({
    cruxSlots: (available, maximum) => {
        const slots = [];
        for (let i = 0; i < maximum; i++) {
            slots.push(i < available);
        }
        return slots;
    },
    has: (collection, value) => {
        if (!collection) return false;
        if (collection instanceof Set) return collection.has(value);
        if (Array.isArray(collection)) return collection.includes(value);
        return false;
    },
    add: (a, b) => {
        return Number(a) + Number(b);
    },
    uppercase: (str) => {
        if (!str) return '';
        return str.toUpperCase();
    }
});
