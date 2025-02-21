import { resolveActor, fromUuid } from "./cruxHooks.js";
import CruxEffectsApp from "./cruxEffectsApp.js";
import { DnDv4, getActivationType, hasRechargeRecovery, hasRemainingUses, getRechargeFormula, isDragTargetingEnabled, getDescription } from "./cruxUtils.js";

let isShiftHeld = false;
document.addEventListener("keydown", (event) => {
    if (event.key === "Shift") {
        isShiftHeld = true;
    }
});

document.addEventListener("keyup", (event) => {
    if (event.key === "Shift") {
        isShiftHeld = false;
    }
});

/**
 * Calculates the health overlay height percentage based on current and max HP
 * @param {number} currentHP - Current hit points
 * @param {number} maxHP - Maximum hit points
 * @returns {number} The calculated height percentage for the overlay
 */
function calculateHealthOverlay(currentHP, maxHP) {
    const percentage = ((maxHP - currentHP) / maxHP) * 100;
    if (percentage > 50) {
        return Math.round(percentage / 10) * 10;
    } else if (percentage > 10) {
        return Math.round(percentage / 5) * 5;
    }
    return Math.round(percentage);
}

/**
 * Captures the current UI state for later restoration
 * @returns {Object} The captured UI state
 */
function captureUIState() {
    if (getActiveActors().length !== 1) return null;
    
    const state = {
        scroll: $('.crux__container')[0]?.scrollTop,
        showSkills: $('.crux__skill-container').hasClass("is-open"),
        sectionStates: {},
        groupStates: {}
    };

    $('.crux__section').each(function() {
        const title = $(this).find('.crux__section-header span').text();
        state.sectionStates[title] = !$(this).hasClass('is-collapsed');
    });

    $('.crux__group').each(function() {
        const title = $(this).find('.crux__group-header h3 span').text();
        state.groupStates[title] = !$(this).hasClass('is-collapsed');
    });

    return state;
}

/**
 * Restores the UI state after an update
 * @param {Object} state - The UI state to restore
 */
function restoreUIState(state) {
    if (!state) return;

    if (state.scroll !== undefined) {
        $('.crux__container')[0].scrollTop = state.scroll;
    }

    const skillContainer = $('.crux__skill-container');
    if (state.showSkills) {
        skillContainer.addClass('is-open');
    } else {
        skillContainer.removeClass('is-open');
    }

    if (state.sectionStates) {
        $('.crux__section').each(function() {
            const title = $(this).find('.crux__section-header span').text();
            if (state.sectionStates[title] === false) {
                $(this).addClass('is-collapsed');
            } else {
                $(this).removeClass('is-collapsed');
            }
        });
    }

    if (state.groupStates) {
        $('.crux__group').each(function() {
            const title = $(this).find('.crux__group-header h3 span').text();
            if (state.groupStates[title] === false) {
                $(this).addClass('is-collapsed');
            } else {
                $(this).removeClass('is-collapsed');
            }
        });
    }
}

/**
 * Handles item recharge based on system version
 * @param {Item} item - The item to recharge
 */
async function handleItemRecharge(item) {
    try {
        const uiState = captureUIState();
        
        if (DnDv4()) {
            const recovery = item.system.uses?.recovery;
            if (recovery?.period === 'recharge' && recovery.formula) {
                const roll = await new Roll(recovery.formula).evaluate({async: true});
                if (roll.total >= parseInt(recovery.formula)) {
                    await item.update({"system.uses.value": item.system.uses.max});
                }
                roll.toMessage({
                    flavor: game.i18n.format('DND5E.ItemRechargeCheck', {name: item.name}),
                    speaker: ChatMessage.getSpeaker({actor: item.actor})
                });
            }
        } else {
            await item.rollRecharge();
        }
        
        await updateTray();
        restoreUIState(uiState);
    } catch (error) {
        console.error("Failed to recharge item:", error);
        ui.notifications.error(`Failed to recharge ${item.name}: ${error.message}`);
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

            const activationType = getActivationType(item);
            if (hasUses && !item.getFlag("crux", "hidden") && 
                (DnDv4() ? item.system.activities?.size > 0 : activationType && activationType !== "none")) {
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

        function isSectionEnabled(key) {
            const settingMap = {
                favorites: "show-favorites-section",
                equipped: "show-equipped-section",
                feature: "show-features-section",
                spell: "show-spells-section",
                inventory: "show-inventory-section"
            };
            const setting = settingMap[key];
            return !setting || game.settings.get("crux", setting);
        }

        return Object.entries(sections).reduce((acc, [key, value]) => {
            if ((key === 'favorites' || hasItems(value)) && isSectionEnabled(key)) {
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
                abbr: abbr,
                save: DnDv4() ? details.save?.value : details.save
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
    const showSpellFractions = game.settings.get("crux", "show-spell-fractions");
    const toggleTargetMode = game.settings.get("crux", "toggle-target-mode");

    const htmlString = await renderTemplate("modules/crux/templates/crux.hbs", { 
        actors, 
        iconSize, 
        showSpellDots, 
        showSpellFractions,
        toggleTargetMode,
        settings: {
            "health-overlay-enabled": game.settings.get("crux", "health-overlay-enabled"),
            "health-overlay-direction": game.settings.get("crux", "health-overlay-direction")
        }
    });
    const cruxContainer = $('#crux');
    const html = cruxContainer.html(htmlString);
    cruxContainer[0].classList.remove("tray-small", "tray-medium", "tray-large");
    cruxContainer[0].classList.add(traySize);

    if (actors.length == 1) {
        const currentUuid = actors[0].actor.uuid;
        const { uuid, scroll } = scrollPosition;
        if (currentUuid === uuid && scroll !== undefined) {
            html.find('.crux__container')[0].scrollTop = scroll;
        }
    } else {
        updateScrollPosition({});
    }

async function activateItem(event, options = {}) {
        event.preventDefault();
        const itemUuid = event.currentTarget?.closest(".item")?.dataset.itemUuid || options.itemUuid;
        const item = await fromUuid(itemUuid);
        if (!item) return false;
        if (event.currentTarget?.classList.contains('item-image')) {
            return item.use({
                legacy: false,
                event: event
            });
        }

        if (event.shiftKey && item.system.uses?.max > 0) {
            try {
                const currentValue = parseInt(item.system.uses.value) || 0;
                const maxValue = parseInt(item.system.uses.max) || 0;
                let newValue;

                if (event.which === 1) {
                    newValue = Math.min(currentValue + 1, maxValue);
                } else if (event.which === 3) {
                    newValue = Math.max(currentValue - 1, 0);
                }

                if (newValue !== undefined && newValue !== currentValue) {
                    const uiState = captureUIState();
                    await item.actor.updateEmbeddedDocuments("Item", [{
                        _id: item.id,
                        "system.uses.value": newValue
                    }]);
                    await updateTray();
                    restoreUIState(uiState);
                    return false;
                }
            } catch (error) {
                console.error("Failed to update item uses:", error);
                ui.notifications.error(`Failed to update uses for ${item.name}: ${error.message}`);
                return false;
            }
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

    const isTargetMode = game.settings.get("crux", "toggle-target-mode");
    let isDragModeEnabled = isTargetMode ? game.settings.get("crux", "drag-target-state") : false;
    let isActivelyDragging = false;
    const trayContainer = html.find('.crux__container');
    
    if (isTargetMode) {
        const containers = html.find('.crux__toggle-target');
        containers.each(function() {
            const container = $(this);
            if (isDragModeEnabled) {
                container.addClass('toggled-on').removeClass('toggled-off');
            } else {
                container.addClass('toggled-off').removeClass('toggled-on');
            }
        });
        
        if (isDragModeEnabled) {
            trayContainer.addClass('crux-targeting');
            html.find('.rollable .item-image').each(function() {
                this.draggable = true;
                $(this).attr('draggable', 'true');
            });
        }
    }

    function updateDragMode(enabled) {
        isDragModeEnabled = enabled;
        if (!isDragTargetingEnabled()) {
            trayContainer.removeClass('crux-targeting');
            html.find('.rollable .item-image').each(function() {
                this.draggable = false;
                $(this).removeAttr('draggable');
            });
            return;
        }
        
        if (enabled) {
            trayContainer.addClass('crux-targeting');
            html.find('.rollable .item-image').each(function() {
                this.draggable = true;
                $(this).attr('draggable', 'true');
            });
        } else if (!isActivelyDragging) {
            trayContainer.removeClass('crux-targeting');
            html.find('.rollable .item-image').each(function() {
                this.draggable = false;
                $(this).removeAttr('draggable');
            });
        }
    }

    trayContainer.on('mouseenter', function() {
        if (isTargetMode && isDragModeEnabled) {
            trayContainer.addClass('crux-targeting');
        }
        
        $(document).on('keydown.crux-drag keyup.crux-drag', function(event) {
            const dragKey = game.keybindings.get("crux", "item-drag")[0];
            const isKeyDown = event.type === 'keydown' && event.code === dragKey.key;
            
            if (!isTargetMode) {
                if (isKeyDown && !event.repeat) {
                    updateDragMode(true);
                } else if (!event.repeat && !isActivelyDragging) {
                    updateDragMode(false);
                }
            }
        });
    });

    trayContainer.on('mouseleave', function() {
        if (!isActivelyDragging) {
            trayContainer.removeClass('crux-targeting');
        }
        if (!isTargetMode) {
            $(document).off('keydown.crux-drag keyup.crux-drag');
        }
    });

    html.find('.rollable .item, .rollable .item *').on('mousedown mouseup click', function(event) {
        const dragKey = game.keybindings.get("crux", "item-drag")[0];
        if (game.keyboard.downKeys.has(dragKey.key)) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    });

    html.find('.rollable .item-image').on('dragstart', async function(event) {
        event.stopPropagation();
        
        const dragKey = game.keybindings.get("crux", "item-drag")[0];
        const isToggleMode = game.settings.get("crux", "toggle-target-mode");
        if (!isDragModeEnabled && !game.keyboard.downKeys.has(dragKey.key) && !isToggleMode) {
            event.preventDefault();
            return false;
        }
        
        const itemUuid = event.currentTarget.closest(".item").dataset.itemUuid;
        const item = await fromUuid(itemUuid);
        if (!item) {
            console.error("Crux | Invalid drag: Failed to resolve item from UUID", itemUuid);
            event.preventDefault();
            return false;
        }
        
        isActivelyDragging = true;
        trayContainer.addClass('active-drag');
        
        const dragImage = document.createElement('img');
        dragImage.src = item.img;
        dragImage.style.width = '32px';
        dragImage.style.height = '32px';
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        document.body.appendChild(dragImage);
        
        try {
        if (!itemUuid) {
            console.error("Crux | Invalid drag: Missing item UUID");
            event.preventDefault();
            return false;
        }

        if (!isDragTargetingEnabled()) {
            event.preventDefault();
            return false;
        }

        const dragData = {
            type: "Item",
            uuid: itemUuid
        };
            
        event.originalEvent.dataTransfer.setData("text/plain", JSON.stringify(dragData));
        event.originalEvent.dataTransfer.effectAllowed = "all";
        event.originalEvent.dataTransfer.setDragImage(dragImage, 16, 16);
        event.currentTarget.dragImage = dragImage;
            
            return true;
        } catch (error) {
            console.error("Drag operation failed:", error);
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
            isActivelyDragging = false;
            trayContainer.removeClass('active-drag');
            event.preventDefault();
            return false;
        }
    });

    html.find('.rollable .item-image').on('drag', function(event) {
        event.stopPropagation();
        const dragKey = game.keybindings.get("crux", "item-drag")[0];
        const isToggleMode = game.settings.get("crux", "toggle-target-mode");
        if (!isDragModeEnabled && !game.keyboard.downKeys.has(dragKey.key) && !isToggleMode) {
            event.preventDefault();
            return false;
        }
        return true;
    });
    
    canvas.app.view.addEventListener('dragover', (event) => {
        event.preventDefault();
        const dragKey = game.keybindings.get("crux", "item-drag")[0];
        const isToggleMode = game.settings.get("crux", "toggle-target-mode");
        if (isDragModeEnabled || game.keyboard.downKeys.has(dragKey.key) || isToggleMode) {
            event.dataTransfer.dropEffect = 'copy';
        }
    });

    html.find('.rollable .item-image').on('dragend', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        isActivelyDragging = false;
        trayContainer.removeClass('active-drag');
        
        if (!isTargetMode || !isDragModeEnabled) {
            trayContainer.removeClass('crux-targeting');
            html.find('.rollable .item-image').each(function() {
                this.draggable = false;
                $(this).removeAttr('draggable');
            });
        }
        
        if (event.currentTarget.dragImage && document.body.contains(event.currentTarget.dragImage)) {
            document.body.removeChild(event.currentTarget.dragImage);
            event.currentTarget.dragImage = null;
        }
    });

    html.find('.rollable .item-image, .rollable.item-name').on('mousedown', async function(event) {
        const dragKey = game.keybindings.get("crux", "item-drag")[0];
        const isToggleMode = game.settings.get("crux", "toggle-target-mode");
        if (game.keyboard.downKeys.has(dragKey.key) || (isToggleMode && isDragModeEnabled)) {
            return false;
        }
        event.preventDefault();
        event.stopPropagation();

        if ($(event.currentTarget).hasClass('item-name') && event.which === 2) {
            return openSheet(event);
        }

        if (event.currentTarget.classList.contains('item-image')) {
            if (event.which === 1) {
                return activateItem(event, { shiftKey: event.shiftKey });
            }
        } else if (event.currentTarget.classList.contains('item-name')) {
            const itemUuid = event.currentTarget.closest(".item").dataset.itemUuid;
            const item = fromUuid(itemUuid);
            if (!item) return false;
            if (event.shiftKey && item.system.uses?.max > 0) {
                try {
                    const currentValue = parseInt(item.system.uses.value) || 0;
                    const maxValue = parseInt(item.system.uses.max) || 0;
                    let newValue;

                    if (event.which === 1) {
                        newValue = Math.min(currentValue + 1, maxValue);
                    } else if (event.which === 3) {
                        newValue = Math.max(currentValue - 1, 0);
                    }

                    if (newValue !== undefined && newValue !== currentValue) {
                        const uiState = captureUIState();                       
                        await item.actor.updateEmbeddedDocuments("Item", [{
                            _id: item.id,
                            "system.uses.value": newValue
                        }]);
                        await updateTray();
                        restoreUIState(uiState);
                        return false;
                    }
                } catch (error) {
                    console.error("Failed to update item uses:", error);
                    ui.notifications.error(`Failed to update uses for ${item.name}: ${error.message}`);
                    return false;
                }
            }
            
            if (event.which === 1 && !event.shiftKey) {
                const li = $(event.currentTarget).closest(".item");
                const chatData = await item.getChatData({ secrets: item.actor.isOwner });

                if (li.hasClass("expanded")) {
                    let summary = li.children(".item-summary");
                    summary.slideUp(200, () => summary.remove());
                } else {
                    let div = $(`<div class="item-summary">${getDescription(item)}</div>`);
                    let props = $('<div class="item-properties"></div>');
                    chatData.properties.forEach(p => props.append(`<span class="tag">${p}</span>`));
                    div.append(props);
                    li.append(div.hide());
                    div.slideDown(200);
                }
                li.toggleClass("expanded");
            }
        }
        return false;
    });

    html.find('.rollable.item-name').hover(
        event => hover(event, "actorItemHoverIn"),
        event => hover(event, "actorItemHoverOut")
    );

    html.find('.rollable.item-recharge').mousedown(function(event) {
        const itemUuid = event.currentTarget.closest(".item").dataset.itemUuid;
        const item = fromUuid(itemUuid);
        if (item) {
            handleItemRecharge(item);
        }
        return false;
    });

    html.find('.group-dots .dot').click(async function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const actorUuid = this.closest('.crux__actor').dataset.actorUuid;
        const actor = resolveActor(fromUuid(actorUuid));
        const group = this.closest('.group-dots').dataset.groupName;
        const slot = parseInt(this.dataset.slot) + 1;

        const current = actor.system.spells?.[group]?.value;
        if (current !== undefined) {
            try {
                const uiState = captureUIState();
                
                const key = `system.spells.${group}.value`;
                const newValue = current !== slot ? slot : slot - 1;
                await actor.update({ [key]: newValue });
                
                await updateTray();
                restoreUIState(uiState);
            } catch (error) {
                console.error("Failed to update spell slot:", error);
                ui.notifications.error(`Failed to update spell slot: ${error.message}`);
            }
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

        if (game.settings.get("crux", "toggle-target-mode")) {
            isDragModeEnabled = !isDragModeEnabled;
            game.settings.set("crux", "drag-target-state", isDragModeEnabled);
            updateDragMode(isDragModeEnabled);
            const container = $(this).closest('.crux__toggle-target');
            container.toggleClass('toggled-on', isDragModeEnabled);
            container.toggleClass('toggled-off', !isDragModeEnabled);
        } else {
            const token = actor.getActiveTokens()[0];
            if (token) {
                token.setTarget(!token.isTargeted, { releaseOthers: false });
            }
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
        const actors = getActiveActors();
        if (!actors.length) return;

        const combat = game.combat;
        const isGM = game.user.isGM;
        if (!combat && isGM) {
            await Combat.create();
        } else if (!combat) {
            ui.notifications.warn(`No Active Combat Encounter. Please wait for creation and try again.`);
            return;
        }

        const newActors = actors.filter(actor => {
            const token = actor.getActiveTokens()[0];
            if (!token) return false;
            const alreadyInCombat = game.combat.combatants.some(c => 
                c.actorId === actor.id && c.tokenId === token.id
            );
            
            if (alreadyInCombat) {
                ui.notifications.warn(`${actor.name} is already in combat.`);
                return false;
            }
            return true;
        });

        if (newActors.length) {
            const combatants = newActors.map(actor => ({
                actorId: actor.id,
                tokenId: actor.getActiveTokens()[0].id,
                hidden: false
            }));

            if (combatants.length) {
                await game.combat.createEmbeddedDocuments("Combatant", combatants);
            }
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
            await matchingItem.use({
                legacy: false,
                event: event
            });
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
    getActivationType: (item) => getActivationType(item),
    hasRechargeRecovery: (item) => hasRechargeRecovery(item),
    hasRemainingUses: (item) => hasRemainingUses(item),
    getRechargeFormula: (item) => getRechargeFormula(item),
    calculateHealthOverlay: (currentHP, maxHP) => {
        const percentage = ((maxHP - currentHP) / maxHP) * 100;
        if (percentage > 50) {
            return Math.round(percentage / 10) * 10;
        } else if (percentage > 10) {
            return Math.round(percentage / 5) * 5;
        }
        return Math.round(percentage);
    },
    localize_by_mode: function(toggleMode, key1, key2) {
        return game.i18n.localize(toggleMode ? key1 : key2);
    },
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
