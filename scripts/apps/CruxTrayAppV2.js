const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import CruxHooksManager from "../hooks/CruxHooksManager.js";
import CruxCompatibility from "../utils/CruxCompatibility.js";
import CruxDomUtils from "../utils/CruxDomUtils.js";
import CruxEffectsAppV2 from "./CruxEffectsAppV2.js";
import CruxUtils from "../utils/CruxUtilityManager.js";

/**
 * The main Crux tray application using ApplicationV2
 */
export default class CruxTrayAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    /**
     * Default configuration options for the application
     */
    static DEFAULT_OPTIONS = {
        id: "crux",
        popOut: false,
        classes: ["crux"],
        tag: "div",
        headerButtons: [],
        minimizable: false,
        isSidebar: true,
        hasFrame: false,
        form: {
            closeOnSubmit: false
        },
        window: {
            title: "Crux Tray"
        },
        actions: {
            endTurn: () => game.combat?.nextTurn(),
            toggleSkills: function(event, target) { this._onToggleSkills(event, target); },
            toggleSection: function(event, target) { this._onToggleSection(event, target); },
            toggleGroup: function(event, target) { this._onToggleGroup(event, target); },
            openSheet: function(event, target) { this._onOpenSheet(event, target); },
            activateItem: function(event, target) { this._onActivateItem(event, target); },
            rechargeItem: function(event, target) { this._onRechargeItem(event, target); },
            rollAbility: function(event, target) { this._onRollAbility(event, target); },
            rollSkill: function(event, target) { this._onRollSkill(event, target); },
            toggleTarget: function(event, target) { this._onToggleTarget(event, target); },
            openEffects: function(event, target) { this._onOpenEffects(event, target); },
            expandCollapse: function(event, target) { this._onExpandCollapse(event, target); },
            addToCombat: function(event, target) { this._onAddToCombat(event, target); },
            setElevation: function(event, target) { this._onSetElevation(event, target); },
            openToken: function(event, target) { this._onOpenToken(event, target); },
            rollInitiative: function(event, target) { this._onRollInitiative(event, target); },
            shortRest: function(event, target) { this._onShortRest(event, target); },
            longRest: function(event, target) { this._onLongRest(event, target); },
            toggleQSpinner: function(event, target) { this._onToggleQSpinner(event, target); },
            toggleUSpinner: function(event, target) { this._onToggleUSpinner(event, target); }
        }
    };

    /**
     * Template parts used by the application
     */
    static PARTS = {
        tray: {
            template: "modules/crux/templates/crux.hbs"
        }
    };

    /**
     * Prepare data for rendering
     */
    async _prepareContext(options) {
        const settingShowNoUses = game.settings.get("crux", "show-no-uses");
        const settingShowUnpreparedCantrips = game.settings.get("crux", "show-unprepared-cantrips");
        const settingSkillMode = game.settings.get("crux", "skill-mode");
        const settingSortAlphabetically = game.settings.get("crux", "sort-alphabetic");
        const settingShowAllNpcItems = game.settings.get("crux", "show-all-npc-items");
        const settingExcludeContainerItems = game.settings.get("crux", "exclude-container-items");
        const settingSkillsExpanded = game.settings.get("crux", "skills-expanded") === "open";
        const settingMainSectionsExpanded = game.settings.get("crux", "main-sections-expanded") === "open";
        const settingSubSectionsExpanded = game.settings.get("crux", "sub-sections-expanded") === "open";
        const useTidy5e = game.settings.get("crux", "use-tidy5e-sections");
        const actors = game.crux.state.getActiveActors().map(actor => {
            const actorData = actor.system;
            const canCastUnpreparedRituals = !!actor.items.find(i => i.name === "Wizard");
            let sections = {
                favorites: { items: [], title: "crux.category.favorites" },
                equipped: { items: [], title: "crux.category.equipped" },
                inventory: {
                    title: "crux.category.inventory",
                    groups: {
                        ammunition: { items: [], title: "crux.category.ammunition" },
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
                        ...this._getSystemFeatureGroups()
                    }
                },
                spell: {
                    title: "crux.category.spell",
                    groups: {
                        innate: { items: [], title: "crux.category.innate" },
                        atwill: { items: [], title: "crux.category.atwill" },
                        pact: { items: [], title: "crux.category.pact" },
                        apothecary: { items: [], title: "crux.category.apothecary" },
                        ...[...Array(10).keys()].reduce((prev, cur) => {
                            prev[`spell${cur}`] = { items: [], title: `crux.category.spell${cur}` }
                            return prev;
                        }, {})
                    }
                },
                passive: { items: [], title: "crux.category.passive" }
            };

            let itemsToProcess = actor.items;
            if (settingExcludeContainerItems) {
                itemsToProcess = itemsToProcess.filter(item => item.container === undefined);
            }
            
            for (let item of itemsToProcess) {
                const itemData = item.system;
                const uses = this._calculateUsesForItem(item);
                const hasUses = settingShowNoUses || !uses || uses.available;
                const favoriteEntry = actorData.favorites?.find(f => {
                    const favoriteId = f.id.startsWith(".") ? f.id.substring(1) : f.id;
                    return favoriteId === `Item.${item.id}` && f.type === "item";
                });
                const trayVisibility = item.getFlag("crux", "trayVisibility") || "default";
                if (trayVisibility === "hide") {
                    continue;
                }
                
                if (favoriteEntry && (trayVisibility !== "hide")) {
                    sections.favorites.items.push({ item, uses, sort: favoriteEntry.sort });
                }
                const forceShow = trayVisibility === "show" || trayVisibility === "force";

                if (item.type === "spell" && (trayVisibility !== "hide")) {
                    const activationType = CruxCompatibility.getActivationType(item);
                    const hasActivities = CruxCompatibility.isDnDv4() ? CruxCompatibility.hasActivities(item, false) : activationType && activationType !== "none";                    
                    if (forceShow || actor.type === "npc" && settingShowAllNpcItems) {
                        this._categorizeSpell(item, itemData, sections, useTidy5e, canCastUnpreparedRituals, settingShowUnpreparedCantrips, uses, true);
                    } else if (hasActivities) {
                        this._categorizeSpell(item, itemData, sections, useTidy5e, canCastUnpreparedRituals, settingShowUnpreparedCantrips, uses);
                    } else if (actor.type === "npc") {
                        sections.passive.items.push({ item, uses });
                    }
                } else {
                    const activationType = CruxCompatibility.getActivationType(item);
                    const isDnDv4 = CruxCompatibility.isDnDv4();
                    let shouldShow = false;                    
                    if (isDnDv4) {
                        shouldShow = !item.getFlag("crux", "hidden") && 
                                    (forceShow || (settingShowNoUses || !uses || !uses.hasMaxUses || uses.available) &&
                                    (CruxCompatibility.hasActivities(item, false) || 
                                     (item.type === "consumable" && item.system.type?.value === "ammo")));
                    } else {
                        shouldShow = !item.getFlag("crux", "hidden") && 
                                    (forceShow || (settingShowNoUses || !uses || uses.available) &&
                                    ((activationType && activationType !== "none") || 
                                     (item.type === "consumable" && item.system.type?.value === "ammo")));
                    }

                    if (shouldShow) {
                        this._categorizeItem(item, itemData, uses, sections, useTidy5e, canCastUnpreparedRituals, settingShowUnpreparedCantrips);
                    } else if (actor.type === "npc") {
                        if (settingShowAllNpcItems) {
                            this._categorizeItem(item, itemData, uses, sections, useTidy5e, canCastUnpreparedRituals, settingShowUnpreparedCantrips, true);
                        } else {
                            sections.passive.items.push({ item, uses });
                        }
                    }
                }
            }

            if (CruxCompatibility.isDnDv4() && actorData.favorites?.length) {                
                const activityFavorites = actorData.favorites.filter(f => f.type === "activity");                
                for (const favoriteEntry of activityFavorites) {
                    const favoriteId = favoriteEntry.id.startsWith(".") ? favoriteEntry.id.substring(1) : favoriteEntry.id;
                    const idParts = favoriteId.split(".");                    
                    if (idParts.length >= 4 && idParts[0] === "Item" && idParts[2] === "Activity") {
                        const itemId = idParts[1];
                        const activityId = idParts[3];                      
                        const parentItem = actor.items.find(i => i.id === itemId);
                        if (!parentItem || parentItem.getFlag("crux", "hidden")) {
                            continue;
                        }
                        let activity = null;
                        try {
                            const entries = Array.from(parentItem.system.activities.entries());
                            const activityEntry = entries.find(entry => entry[0] === activityId);
                            if (activityEntry) {
                                activity = activityEntry[1];
                            }
                        } catch (e) {
                            if (parentItem.system.activities?.contents) {
                                if (parentItem.system.activities.contents[activityId]) {
                                    activity = parentItem.system.activities.contents[activityId];
                                } else {
                                    const activities = Object.values(parentItem.system.activities.contents)
                                        .filter(a => a !== undefined);
                                    activity = activities.find(a => a.id === activityId || a._id === activityId);
                                }
                            }
                        }
                        
                        if (activity) {
                            const activityEntry = {
                                item: parentItem,
                                activityId: activityId,
                                activityName: activity.name,
                                uses: this._calculateUsesForItem(parentItem),
                                sort: favoriteEntry.sort
                            };
                            sections.favorites.items.push(activityEntry);
                        } else {
                        }
                    } else {
                        console.error("CRUX | Invalid activity ID format:", favoriteId);
                    }
                }
            }
            
            sections = this._removeEmptySections(sections);
            sections = this._addSpellLevelUses(sections, actorData);
            sections = this._sortItems(sections, settingSortAlphabetically);
            const combatant = game.combat?.combatants.find(c => c.actor?.id === actor.id);
            const needsInitiative = combatant && combatant.initiative === null;
            const isCurrentTurn = combatant && game.combat?.current?.combatantId === combatant.id;
            const actorState = game.crux.state.getActorState(actor);
            let doShowSkills = false;
            if (actorState?.showSkills !== undefined) {
                doShowSkills = actorState.showSkills;
            } else if (settingSkillMode === "dropdown") {
                doShowSkills = settingSkillsExpanded;
            }

            const abilities = {};
            for (const [abbr, details] of Object.entries(actorData.abilities)) {
                abilities[abbr] = {
                    ...details,
                    label: CONFIG.DND5E.abilities[abbr]?.label || abbr.toUpperCase(),
                    abbr: abbr,
                    save: CruxCompatibility.isDnDv4() ? details.save?.value : details.save
                };
            }

            const token = actor.getActiveTokens()[0];
            const elevation = token?.elevation ?? 0;

            return {
                actor: actor,
                name: actor.name,
                sections,
                needsInitiative,
                isCurrentTurn,
                skills: CONFIG.DND5E.skills,
                skillMode: settingSkillMode,
                showSkills: doShowSkills,
                abilities: abilities,
                elevation: elevation
            };
        });

        const iconSize = this._prefix(game.settings.get("crux", "icon-size"), "icon");
        const showSpellDots = game.settings.get("crux", "show-spell-dots");
        const showSpellFractions = game.settings.get("crux", "show-spell-fractions");
        const showQuantity = game.settings.get("crux", "show-quantity");
        const showUses = game.settings.get("crux", "show-uses");

    return {
        actors,
        iconSize,
        showSpellDots,
        showSpellFractions,
        showQuantity,
        showUses,
        settings: {
            "health-overlay-enabled": game.settings.get("crux", "health-overlay-enabled"),
            "health-overlay-direction": game.settings.get("crux", "health-overlay-direction"),
            "empty-tray-icon": game.settings.get("crux", "empty-tray-icon")
        }
    };
    }

    _getSystemFeatureGroups() {
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

    /**
     * Calculate uses for an item
     * @private
     */
    _calculateUsesForItem(item) {
        const uses = CruxCompatibility.getUses(item);
        if (!uses) return null;
        if (CruxCompatibility.isDnDv4()) {
            return {
                available: uses.value,
                maximum: uses.max,
                hasMaxUses: uses.max > 0
            };
        } else {
            return {
                available: uses.value,
                maximum: uses.max
            };
        }
    }

    /**
     * Categorize an item into appropriate sections
     * @private
     */
    _categorizeItem(item, itemData, uses, sections, useTidy5e, canCastUnpreparedRituals, showUnpreparedCantrips, bypassPreparedCheck = false) {
        switch (item.type) {
            case "feat":
                this._categorizeFeature(item, sections, useTidy5e, uses);
                break;
            case "spell":
                this._categorizeSpell(item, itemData, sections, useTidy5e, canCastUnpreparedRituals, showUnpreparedCantrips, uses, bypassPreparedCheck);
                break;
            default:
                this._categorizeInventoryItem(item, itemData, uses, sections, useTidy5e);
                break;
        }
    }

    /**
     * Categorize a feature
     * @private
     */
    _categorizeFeature(item, sections, useTidy5e, uses) {
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
        const capitalize = (str) => {
            return str.split(/[\s-_]+/).map(word => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
        };

        if (subtype) {
            if (!sections.feature.groups[subtype]) {
                sections.feature.groups[subtype] = {
                    items: [],
                    title: capitalize(subtype)
                };
            }
            sections.feature.groups[subtype].items.push({ item, uses });
        } else if (type) {
            if (!sections.feature.groups[type]) {
                sections.feature.groups[type] = {
                    items: [],
                    title: capitalize(type)
                };
            }
            sections.feature.groups[type].items.push({ item, uses });
            } else {
                sections.feature.groups.general.items.push({ item, uses });
            }
        }
    }

    /**
     * Categorize a spell
     * @private
     */
    _categorizeSpell(item, itemData, sections, useTidy5e, canCastUnpreparedRituals, showUnpreparedCantrips, uses, bypassPreparedCheck = false) {
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
            const spellMethod = CruxCompatibility.getSpellMethod(item);
            switch (spellMethod) {
                case "prepared":
                case "always":
                    const isAlways = spellMethod !== "prepared";
                    const isPrepared = CruxCompatibility.getSpellPrepared(item);
                    const isCastableRitual = (canCastUnpreparedRituals && itemData.components?.ritual);
                    const isDisplayableCantrip = itemData.level == 0 && showUnpreparedCantrips;
                    if (bypassPreparedCheck || isAlways || isPrepared || isCastableRitual || isDisplayableCantrip) {
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
                case "apothecary":
                    sections.spell.groups.apothecary.items.push({ item, uses });
                    break;
                default:
                    if (bypassPreparedCheck && itemData.level !== undefined) {
                        sections.spell.groups[`spell${itemData.level}`].items.push({ item, uses });
                    }
                    break;
            }
        }
    }

    /**
     * Categorize an inventory item
     * @private
     */
    _categorizeInventoryItem(item, itemData, uses, sections, useTidy5e) {
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
                    if (itemData.consumableType === "ammo" || itemData.type?.value === "ammo") {
                        sections.inventory.groups.ammunition.items.push({ item, uses });
                    } else {
                        sections.inventory.groups.consumable.items.push({ item, uses });
                    }
                    break;
                default:
                    sections.inventory.groups.other.items.push({ item, uses });
            }
        }
    }

    /**
     * Remove empty sections
     * @private
     */
    _removeEmptySections(sections) {
        function hasItems(object) {
            if (!object || typeof object !== "object") return false;
            const keys = Object.keys(object);
            if (keys.includes("groups") && Object.values(object.groups).some(g => hasItems(g))) return true;
            if (keys.includes("items")) return !!object.items.length;
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

    /**
     * Add spell level uses
     * @private
     */
    _addSpellLevelUses(sections, actorData) {
        const showSpellsSection = game.settings.get("crux", "show-spells-section");
        if (!sections.spell && showSpellsSection) {
            if (actorData.spells.pact.max || actorData.spells.apothecary?.max) {
                sections.spell = {
                    title: "crux.category.spell",
                    groups: {}
                };

                if (actorData.spells.pact.max) {
                    sections.spell.groups.pact = { items: [], title: "crux.category.pact" };
                }

                if (actorData.spells.apothecary?.max) {
                    sections.spell.groups.apothecary = { items: [], title: "crux.category.apothecary" };
                }
            }
        }

        if (!sections.spell) return sections;

        for (let l = 1; l <= 9; l++) {
            const group = sections.spell.groups[`spell${l}`];
            if (group) {
                const sl = actorData.spells[`spell${l}`];
                group.uses = { available: sl.value, maximum: sl.max };
            }
        }

        if (actorData.spells.pact.max) {
            if (!sections.spell.groups.pact) {
                sections.spell.groups.pact = { items: [], title: "crux.category.pact" };
            }
            sections.spell.groups.pact.uses = {
                available: actorData.spells.pact.value,
                maximum: actorData.spells.pact.max
            };
        }

        if (actorData.spells.apothecary?.max) {
            if (!sections.spell.groups.apothecary) {
                sections.spell.groups.apothecary = { items: [], title: "crux.category.apothecary" };
            }
            sections.spell.groups.apothecary.uses = {
                available: actorData.spells.apothecary.value,
                maximum: actorData.spells.apothecary.max
            };
        }

        return sections;
    }

    /**
     * Sort items in sections
     * @private
     */
    _sortItems(sections, sortAlphabetically) {
        if (!sections || typeof sections !== "object") return sections;

        Object.entries(sections).forEach(([sectionKey, value]) => {
            if (!value || typeof value !== "object") return;
            if (Array.isArray(value.items)) {
                if (sectionKey === "favorites") {
                    value.items.sort((a, b) => a.sort - b.sort);
                } else {
                    value.items.sort((a, b) => {
                        if (sortAlphabetically) {
                            return a.item.name.localeCompare(b.item.name);
                        } else {
                            return a.item.sort - b.item.sort;
                        }
                    });
                }
            }
            if (value.groups) {
                this._sortItems(value.groups, sortAlphabetically);
            }
        });
        return sections;
    }

    /**
     * Prefix utility
     * @private
     */
    _prefix(tgt, str) {
        return tgt ? [str, tgt].join("-") : tgt;
    }

    /**
     * Update the tray size based on the setting
     * @private
     */
    _updateTraySize() {
        const traySize = game.settings.get("crux", "tray-size");
        document.documentElement.style.setProperty('--crux-width', traySize + 'px');
        if (this.element) {
            this.element.style.width = traySize + 'px';
            this.element.style.position = 'fixed';
            this.element.style.top = '0px';
            this.element.style.left = '0px';
            this.element.style.bottom = 'var(--crux-tray-bottom-offset)';
            this.element.style.height = 'auto';
        }
    }

    /**
     * Initialize the tray size from settings
     * This ensures the tray size is properly set on page load
     */
    _initializeTraySize() {
        this._updateTraySize();
    }

    /**
     * Handle rendering into the DOM
     */
    async _render(force, options) {
        const html = await super._render(force, options);
        const interfaceEl = document.querySelector("#interface");
        
        if (this.element && interfaceEl) {
            interfaceEl.insertBefore(this.element, interfaceEl.firstChild);
            this._initializeTraySize();
            
            const trayMode = game.settings.get("crux", "tray-mode");
            if (trayMode === "always") {
                this.element.classList.add("active");
                this.element.classList.add("always-on");
                interfaceEl.classList.add("crux-active");
            }
            else if (trayMode === "auto") {
                const hasSelectedTokens = canvas.tokens.controlled.length > 0;
                
                if (hasSelectedTokens) {
                    this.element.classList.add("active");
                    interfaceEl.classList.add("crux-active");
                } else {
                    this.element.classList.remove("active");
                    interfaceEl.classList.remove("crux-active");
                }
            }
        }
        this._setupTaskbarCompatibility();
        const activeActors = game.crux.state.getActiveActors();
        const currentCombatant = game.combat?.combatant;
        const actorsInCombat = activeActors.filter(actor => 
            game.combat?.combatants.some(c => c.actor?.id === actor.id)
        );
        const isCurrentCombatant = activeActors.some(actor => 
            currentCombatant?.actor?.id === actor.id
        );
        if (isCurrentCombatant) {
            this.element.classList.add("is-current-combatant");
        } else {
            this.element.classList.remove("is-current-combatant");
        }
        activeActors.forEach(actor => {
            const actorElement = this.element.querySelector(`.crux__actor[data-actor-uuid="${actor.uuid}"]`);
            if (actorElement) {
                const combatant = game.combat?.combatants.find(c => c.actor?.id === actor.id);
                if (combatant) {
                    const needsInitiative = combatant.initiative === null;
                    const isCurrentTurn = game.combat?.current?.combatantId === combatant.id;
                    const combatActions = actorElement.querySelector('.crux__combat-actions');
                    if (!combatActions) {
                        const combatActionsDiv = document.createElement('div');
                        combatActionsDiv.className = 'crux__combat-actions';
                        const topSection = actorElement.querySelector('.crux__top-section');
                        if (topSection && topSection.nextSibling) {
                            actorElement.insertBefore(combatActionsDiv, topSection.nextSibling);
                        } else {
                            actorElement.appendChild(combatActionsDiv);
                        }
                    }
                    const combatActionsContainer = actorElement.querySelector('.crux__combat-actions');
                    
                    if (needsInitiative) {
                        const initiativeButton = combatActionsContainer.querySelector('.crux__initiative');
                        if (!initiativeButton) {
                            const initiativeHtml = `
                                <a class="crux__initiative flexrow" data-action="rollInitiative">
                                    <i class="flex0 fas fa-swords crux__initiative-icon"></i>
                                    <div>${game.i18n.localize("crux.roll-initiative")}</div>
                                </a>
                            `;
                            combatActionsContainer.insertAdjacentHTML('afterbegin', initiativeHtml);
                            const newInitiativeButton = combatActionsContainer.querySelector('.crux__initiative');
                            if (newInitiativeButton) {
                                newInitiativeButton.addEventListener('click', (event) => {
                                    this._onRollInitiative(event, newInitiativeButton);
                                });
                            }
                        }
                    } else {
                        const initiativeButton = combatActionsContainer.querySelector('.crux__initiative');
                        if (initiativeButton) {
                            initiativeButton.remove();
                        }
                    }
                    if (isCurrentTurn) {
                        const endTurnButton = combatActionsContainer.querySelector('.crux__end-turn-button');
                        if (!endTurnButton) {
                            const endTurnHtml = `
                                <a class="crux__end-turn-button flexrow" data-action="endTurn">
                                    <i class="flex0 fas fa-hourglass-end"></i>
                                    <div>${game.i18n.localize("crux.end-turn")}</div>
                                </a>
                            `;
                            combatActionsContainer.insertAdjacentHTML('beforeend', endTurnHtml);
                            const newEndTurnButton = combatActionsContainer.querySelector('.crux__end-turn-button');
                            if (newEndTurnButton) {
                                newEndTurnButton.addEventListener('click', () => {
                                    game.combat?.nextTurn();
                                });
                            }
                        }
                    } else {
                        const endTurnButton = combatActionsContainer.querySelector('.crux__end-turn-button');
                        if (endTurnButton) {
                            endTurnButton.remove();
                        }
                    }
                }
            }
        });
        
        return html;
    }

    /**
     * Handle post-render setup
     */
    _onRender(context, options) {
        super._onRender(context, options);
        this._restoreScrollPosition();
        const container = this.element.querySelector('.crux__container');
        if (container) {
            container.addEventListener('scroll', this._onScroll.bind(this));
        }

        this.element.querySelectorAll('.crux__info-section h1').forEach(nameElement => {
            const nameLength = nameElement.textContent.trim().length;
            nameElement.classList.remove('long-name', 'very-long-name');
            if (nameLength > 30) {
                nameElement.classList.add('very-long-name');
            } else if (nameLength > 20) {
                nameElement.classList.add('long-name');
            }
        });

        this.element.querySelectorAll('.crux__portrait').forEach(portrait => {
            portrait.addEventListener('click', () => portrait.classList.toggle('flipped'));
        });

        this.element.querySelectorAll('.crux__actor-name').forEach(name => {
            name.addEventListener('click', (event) => {
                const actorUuid = event.currentTarget.closest('.crux__actor').dataset.actorUuid;
                const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
                if (actor) {
                    if (!actor.sheet.rendered) actor.sheet.render(true);
                    else actor.sheet.close();
                }
            });
        });

        this.element.querySelectorAll('.rollable.item-name').forEach(item => {
            item.addEventListener('mouseenter', (event) => {
                const itemUuid = event.currentTarget.closest(".item").dataset.itemUuid;
                const item = CruxHooksManager.fromUuid(itemUuid);
                if (item) Hooks.callAll("actorItemHoverIn", item, event.currentTarget);
            });
            item.addEventListener('mouseleave', (event) => {
                const itemUuid = event.currentTarget.closest(".item").dataset.itemUuid;
                const item = CruxHooksManager.fromUuid(itemUuid);
                if (item) Hooks.callAll("actorItemHoverOut", item, event.currentTarget);
            });
        });

        this.element.querySelectorAll('.rollable .item-image, .rollable.item-name').forEach(element => {
            element.addEventListener('mousedown', this._onItemMouseDown.bind(this));
        });

        this.element.querySelectorAll('.group-dots .dot').forEach(dot => {
            dot.addEventListener('click', async (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                const actorUuid = event.currentTarget.closest('.crux__actor').dataset.actorUuid;
                const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
                const group = event.currentTarget.closest('.group-dots').dataset.groupName;
                const slot = parseInt(event.currentTarget.dataset.slot) + 1;
                const current = actor.system.spells?.[group]?.value;
                if (current !== undefined) {
                    try {
                        const key = `system.spells.${group}.value`;
                        const newValue = current !== slot ? slot : slot - 1;
                        await actor.update({ [key]: newValue });
                        this.render();
                    } catch (error) {
                        console.error("Failed to update spell slot:", error);
                        ui.notifications.error(`Failed to update spell slot: ${error.message}`);
                    }
                }
            });
        });

        const settingMainSectionsExpanded = game.settings.get("crux", "main-sections-expanded") === "open";
        const settingSubSectionsExpanded = game.settings.get("crux", "sub-sections-expanded") === "open";
        const settingSkillsExpanded = game.settings.get("crux", "skills-expanded") === "open";

        if (!settingMainSectionsExpanded) {
            this.element.querySelectorAll('.crux__section').forEach(section => {
                section.classList.add('is-collapsed');
            });
        }
        if (!settingSubSectionsExpanded) {
            this.element.querySelectorAll('.crux__group').forEach(group => {
                group.classList.add('is-collapsed');
            });
        }
        if (settingSkillsExpanded) {
            this.element.querySelectorAll('.crux__skill-container').forEach(container => {
                container.classList.add('is-open');
            });
        }
        const actors = game.crux.state.getActiveActors();
        if (actors.length === 1) {
            const actor = actors[0];
            const state = game.crux.state.getActorState(actor);
            if (state) {
                if (state.sectionStates) {
                    this.element.querySelectorAll('.crux__section').forEach(section => {
                        const title = section.querySelector('.crux__section-header span')?.textContent;
                        if (title && state.sectionStates[title] !== undefined) {
                            section.classList.toggle('is-collapsed', !state.sectionStates[title]);
                        }
                    });
                }
                if (state.groupStates) {
                    this.element.querySelectorAll('.crux__group').forEach(group => {
                        const title = group.querySelector('.crux__group-header h3 span')?.textContent;
                        if (title && state.groupStates[title] !== undefined) {
                            group.classList.toggle('is-collapsed', !state.groupStates[title]);
                        }
                    });
                }
                if (state.showSkills !== undefined) {
                    this.element.querySelectorAll('.crux__skill-container').forEach(container => {
                        container.classList.toggle('is-open', state.showSkills);
                    });
                }
            }
        }
    }

    /**
     * Handle scroll events
     * @private
     */
    _onScroll(event) {
        const actors = game.crux.state.getActiveActors();
        if (actors.length === 1) {
            const actor = actors[0];
            game.crux.state.updateActorState(actor, {
                scroll: event.currentTarget.scrollTop,
                showSkills: this.element.querySelector('.crux__skill-container')?.classList.contains('is-open')
            });
        } else {
            game.crux.state.resetScrollPosition();
        }
    }

    /**
     * Restore scroll position
     * @private
     */
    _restoreScrollPosition() {
        const actors = game.crux.state.getActiveActors();
        if (actors.length === 1) {
            const actor = actors[0];
            const state = game.crux.state.getActorState(actor);
            if (state?.scroll !== undefined) {
                const container = this.element.querySelector('.crux__container');
                if (container) container.scrollTop = state.scroll;
            }
        }
    }

    /**
     * Override setPosition to ignore scale parameter from uiscaler
     * @override
     */
    setPosition(options={}) {
        let result;
        if (options.scale !== undefined) {
            const { scale, ...otherOptions } = options;
            result = super.setPosition(otherOptions);
        } else {
            result = super.setPosition(options);
        }
        this._updateTraySize();
        return result;
    }

    /**
     * Toggle the tray visibility
     */
    toggleTray() {
        if (!this.element || !document.body.contains(this.element)) {
            this.render(true);
            return;
        }
        
        const trayMode = game.settings.get("crux", "tray-mode");
        const interfaceEl = document.querySelector("#interface");
        
        if (trayMode === "always") {
            if (!this.element.classList.contains("active")) {
                this.element.classList.add("active");
                this.element.classList.add("always-on");
                if (interfaceEl) interfaceEl.classList.add("crux-active");
            }
            return;
        }
        if (trayMode === "auto") {
            ui.notifications.info("Tray visibility is set to Automatic mode. It will show when tokens are selected.");
            return;
        }
        this.element.classList.toggle("active");
        if (interfaceEl) interfaceEl.classList.toggle("crux-active");
    }
    
    /**
     * Clean up resources when the application is closed
     * @override
     */
    async close(options={}) {
        if (options?.closeKey) {
            return false;
        }
        
        document.removeEventListener('keydown', this._onHotkeyDown);
        document.removeEventListener('keyup', this._onHotkeyUp);
        if (this._taskbarObserver) {
            this._taskbarObserver.disconnect();
            this._taskbarObserver = null;
        }
        
        return super.close(options);
    }
    
    /**
     * Set up taskbar compatibility if the module is active and compatibility is enabled
     * @private
     */
    _setupTaskbarCompatibility() {
        const isTaskbarActive = game.modules.get("foundry-taskbar")?.active;
        const isCompatEnabled = game.settings.get("crux", "taskbar-compatibility");
        const taskbar = document.querySelector("#taskbar");
        const taskbarHeight = taskbar?.getBoundingClientRect().height ?? 0;
        const shouldOffsetTray = isTaskbarActive && isCompatEnabled && taskbarHeight > 0;
        const offset = shouldOffsetTray ? `${taskbarHeight}px` : '0px';
        document.documentElement.style.setProperty('--ft-height', `${taskbarHeight || 50}px`);
        document.documentElement.style.setProperty('--crux-tray-bottom-offset', offset);
        document.body.style.setProperty('--crux-tray-bottom-offset', offset);
        document.body.classList.toggle("crux-taskbar-compat", shouldOffsetTray);
    }

    _onToggleSkills(event, target) {
        if (!event && !target) {
            const skillContainers = this.element.querySelectorAll('.crux__skill-container');
            if (!skillContainers.length) return;
            
            skillContainers.forEach(container => {
                container.classList.toggle("is-open");
                
                const actors = game.crux.state.getActiveActors();
                if (actors.length === 1) {
                    const actor = actors[0];
                    game.crux.state.updateActorState(actor, {
                        scroll: this.element.querySelector('.crux__container')?.scrollTop,
                        showSkills: container.classList.contains('is-open')
                    });
                }
            });
            return;
        }
        
        const skillContainer = target.closest('.crux__skill-container');
        if (!skillContainer) return;
        skillContainer.classList.toggle("is-open");        
        const actors = game.crux.state.getActiveActors();
        if (actors.length === 1) {
            const actor = actors[0];
            game.crux.state.updateActorState(actor, {
                scroll: this.element.querySelector('.crux__container')?.scrollTop,
                showSkills: skillContainer.classList.contains('is-open')
            });
        }
    }

    _onToggleSection(event, target) {
        const section = target.closest('.crux__section');
        if (!section) return;
        section.classList.toggle('is-collapsed');        
        const actors = game.crux.state.getActiveActors();
        if (actors.length === 1) {
            const actor = actors[0];
            const title = section.querySelector('.crux__section-header span')?.textContent;
            if (!title) return;            
            const isCollapsed = section.classList.contains('is-collapsed');
            game.crux.state.updateSectionState(actor, title, isCollapsed);
            game.crux.state.updateActorState(actor, {
                scroll: this.element.querySelector('.crux__container')?.scrollTop
            });
        }
    }

    _onToggleGroup(event, target) {
        const group = target.closest('.crux__group');
        if (!group) return;
        group.classList.toggle('is-collapsed');        
        const actors = game.crux.state.getActiveActors();
        if (actors.length === 1) {
            const actor = actors[0];
            const title = group.querySelector('.crux__group-header h3 span')?.textContent;
            if (!title) return;            
            const isCollapsed = group.classList.contains('is-collapsed');
            game.crux.state.updateGroupState(actor, title, isCollapsed);
            game.crux.state.updateActorState(actor, {
                scroll: this.element.querySelector('.crux__container')?.scrollTop
            });
        }
    }

    _onOpenSheet(event, target) {
        const itemUuid = target.closest(".item")?.dataset.itemUuid;
        if (!itemUuid) return;        
        const item = CruxHooksManager.fromUuid(itemUuid);
        if (item) item.sheet.render(true);
    }

    async _onActivateItem(event, target) {
        let actionId = target.dataset.actionId;
        let actionButton = target;
        if (!actionId && target.tagName.toLowerCase() === 'img') {
            actionButton = target.closest('.crux__action-button');
            if (actionButton) {
                actionId = actionButton.dataset.actionId;
            }
        }
        if (actionId) {
            let actorElement = actionButton.closest('.crux__actor');
            let actorUuid;
            if (!actorElement) {
                const actors = game.crux.state.getActiveActors();
                if (actors.length === 1) {
                    actorElement = this.element.querySelector('.crux__actor');
                    if (actorElement) {
                        actorUuid = actorElement.dataset.actorUuid;
                    } else {
                        actorUuid = actors[0].uuid;
                    }
                }                
                if (!actorUuid) return;
            } else {
                actorUuid = actorElement.dataset.actorUuid;
            }
            
            const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
            if (!actor) return;

            const actionName = game.i18n.localize(`crux.action.${actionId}`);
            const matchingItem = actor.items.find(item => {
                const name = item.name.toLowerCase();
                return name === actionId.toLowerCase() || name === actionName.toLowerCase();
            });

            if (matchingItem) {
                event.fromCrux = true;
                await CruxUtils.activateItem(matchingItem.uuid, null, event);
            } else {
                const content = `<p>${actor.name} uses ${actionName}</p>`;
                await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content
                });
            }
            return;
        }

        const itemUuid = target.closest(".item")?.dataset.itemUuid;
        if (!itemUuid) return;
        
        const item = await CruxHooksManager.fromUuid(itemUuid);
        if (!item) return;
        
        const isItemImage = target.classList.contains('item-image') || target.closest('.item-image');
        const isItemNameH4 = target.tagName === 'H4' || target.closest('h4');
        
        if (isItemNameH4 && event.which === 2) {
            event.preventDefault();
            return this._onOpenSheet(event, target);
        }

        if (isItemNameH4 && event.which === 1 && !event.shiftKey) {
            const li = target.closest(".item");
            
            if (li.classList.contains("expanded")) {
                let summary = li.querySelector(".item-summary");
                if (summary) {
                    if (window.jQuery) {
                        window.jQuery(summary).slideUp(200, () => summary.remove());
                    } else {
                        summary.remove();
                    }
                }
                } else {
                    const description = await CruxCompatibility.getDescription(item);
                    const enrichedDescription = await TextEditor.enrichHTML(description, {
                        secrets: false,
                        rollData: item.getRollData ? item.getRollData() : {}
                    });
                    let div = document.createElement('div');
                    div.className = 'item-summary';
                    div.innerHTML = enrichedDescription;
                    const chatData = await item.getChatData({ secrets: item.actor.isOwner });
                if (chatData && chatData.properties && chatData.properties.length) {
                    let props = document.createElement('div');
                    props.className = 'item-properties';                    
                    chatData.properties.forEach(p => {
                        let span = document.createElement('span');
                        span.className = 'tag';
                        span.textContent = p;
                        props.appendChild(span);
                    });
                    if (item.system.quantity !== undefined && item.system.quantity > 0) {
                        let qtySpan = document.createElement('span');
                        qtySpan.className = 'tag';
                        qtySpan.textContent = `Qty: ${item.system.quantity}`;
                        props.appendChild(qtySpan);
                    }
                    
                    div.appendChild(props);
                }  
                li.appendChild(div);
                if (window.jQuery) {
                    window.jQuery(div).hide().slideDown(200);
                }
            }            
            li.classList.toggle("expanded");
            return;
        }

        if (event.shiftKey && CruxCompatibility.canModifyUses(item)) {
            const uses = CruxCompatibility.getUses(item);
            if (!uses) return;
            let newValue;
            if (event.which === 1) {
                newValue = Math.min(uses.value + 1, uses.max);
            } else if (event.which === 3) {
                newValue = Math.max(uses.value - 1, 0);
            }
            if (newValue !== undefined && newValue !== uses.value) {
                await CruxCompatibility.updateUses(item, newValue);
                this.render();
            }
            return;
        }
        event.fromCrux = true;
        
        const itemEntry = target.closest('.crux__item');
        const activityId = itemEntry?.dataset?.activityId;
        return CruxUtils.activateItem(itemUuid, activityId, event);
    }

    async _onRechargeItem(event, target) {
        const itemUuid = target.closest(".item")?.dataset.itemUuid;
        if (!itemUuid) return;
        const item = await CruxHooksManager.fromUuid(itemUuid);
        if (!item) return;
        try {
            if (CruxCompatibility.isDnDv4()) {
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
            this.render();
        } catch (error) {
            ui.notifications.error(`Failed to recharge ${item.name}: ${error.message}`);
        }
    }

    _onRollAbility(event, target) {
        const abl = target.dataset.ability;
        if (!abl) return;        
        let actorElement = target.closest('.crux__actor');
        let actorUuid;
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
                if (actorElement) {
                    actorUuid = actorElement.dataset.actorUuid;
                } else {
                    actorUuid = actors[0].uuid;
                }
            }
            if (!actorUuid) return;
        } else {
            actorUuid = actorElement.dataset.actorUuid;
        }        
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (actor) {
            actor.rollAbility({ ability: abl }, {}, {});
        }
    }

    _onRollSkill(event, target) {
        const skill = target.dataset.skill;
        if (!skill) return;        
        let actorElement = target.closest('.crux__actor');
        let actorUuid;
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
                if (actorElement) {
                    actorUuid = actorElement.dataset.actorUuid;
                } else {
                    actorUuid = actors[0].uuid;
                }
            }
            if (!actorUuid) return;
        } else {
            actorUuid = actorElement.dataset.actorUuid;
        }        
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (actor) {
            actor.rollSkill({ skill: skill }, {}, {});
        }
    }

    /**
     * Toggle targeting for the actor's token
     * @param {Event} event - The triggering event
     * @param {HTMLElement} target - The target element
     * @private
     */
    _onToggleTarget(event, target) {
        let actorElement = target.closest('.crux__actor');
        let actorUuid;
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
                if (actorElement) {
                    actorUuid = actorElement.dataset.actorUuid;
                } else {
                    actorUuid = actors[0].uuid;
                }
            }
            if (!actorUuid) return;
        } else {
            actorUuid = actorElement.dataset.actorUuid;
        }        
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (!actor) return;

        const token = actor.getActiveTokens()[0];
        if (token) {
            token.setTarget(!token.isTargeted, { releaseOthers: false });
        }
    }

    _onOpenEffects(event, target) {
        let actorElement = target.closest('.crux__actor');
        let actorUuid;
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
                if (actorElement) {
                    actorUuid = actorElement.dataset.actorUuid;
                } else {
                   actorUuid = actors[0].uuid;
                }
            }
            if (!actorUuid) return;
        } else {
            actorUuid = actorElement.dataset.actorUuid;
        }        
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (!actor) return;
        const token = actor.getActiveTokens()[0];
        if (token) {
            if (CruxEffectsAppV2.activeInstance?.rendered && 
                CruxEffectsAppV2.activeInstance.actor.id === actor.id) {
                CruxEffectsAppV2.activeInstance.close();
            } else {
                const app = new CruxEffectsAppV2(actor, token, event.currentTarget);
                app.render(true);
            }
        }
    }

    _onExpandCollapse(event, target) {
        let actorElement = target.closest('.crux__actor');
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
            }
            if (!actorElement) return;
        }
        
        const sections = actorElement.querySelectorAll('.crux__section');
        const groups = actorElement.querySelectorAll('.crux__group');        
        const isAnySectionCollapsed = Array.from(sections).some(section => 
            section.classList.contains('is-collapsed')
        );
        const isAnyGroupCollapsed = Array.from(groups).some(group => 
            group.classList.contains('is-collapsed')
        );
        const newSectionState = isAnySectionCollapsed;
        const newGroupState = isAnyGroupCollapsed;        
        sections.forEach(section => {
            section.classList.toggle('is-collapsed', !newSectionState);
        });        
        groups.forEach(group => {
            group.classList.toggle('is-collapsed', !newGroupState);
        });        
        const actor = game.crux.state.getActiveActors()[0];
        if (actor) {
            sections.forEach(section => {
                const title = section.querySelector('.crux__section-header span')?.textContent;
                if (title) {
                    game.crux.state.updateSectionState(actor, title, !newSectionState);
                }
            });
            groups.forEach(group => {
                const title = group.querySelector('.crux__group-header h3 span')?.textContent;
                if (title) {
                    game.crux.state.updateGroupState(actor, title, !newGroupState);
                }
            });
            game.crux.state.updateActorState(actor, {
                scroll: this.element.querySelector('.crux__container')?.scrollTop
            });
        }
    }

    async _onAddToCombat(event, target) {
        const actors = game.crux.state.getActiveActors();
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
    }

    _onSetElevation(event, target) {
        let actorElement = target.closest('.crux__actor');
        let actorUuid;
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
                if (actorElement) {
                    actorUuid = actorElement.dataset.actorUuid;
                } else {
                    actorUuid = actors[0].uuid;
                }
            }
            if (!actorUuid) return;
        } else {
            actorUuid = actorElement.dataset.actorUuid;
        }        
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
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
    }

    _onOpenToken(event, target) {
        let actorElement = target.closest('.crux__actor');
        let actorUuid;
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
                if (actorElement) {
                    actorUuid = actorElement.dataset.actorUuid;
                } else {
                    actorUuid = actors[0].uuid;
                }
            }
            if (!actorUuid) return;
        } else {
            actorUuid = actorElement.dataset.actorUuid;
        }
        
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (!actor) return;

        const token = actor.getActiveTokens()[0];
        if (token) {
            token.sheet.render(true);
        }
    }

    /**
     * Show a context menu with item activities
     * @param {Event} event - The triggering event
     * @param {Item} item - The item to show activities for
     * @private
     */
    async _showItemActivitiesMenu(event, item) {
        if (!CruxCompatibility.isDnDv4() || !item) return false;        
        const menu = document.createElement('div');
        menu.classList.add('crux__activities-menu');
        menu.dataset.cruxContextMenu = 'true';
        menu.style.position = 'absolute';
        menu.style.zIndex = '1000';
        const header = document.createElement('div');
        header.classList.add('crux__activities-header');
        header.textContent = item.name;
        header.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.body.removeChild(menu);
            document.removeEventListener('click', onClickOutside);
        });
        menu.appendChild(header);
        const activityList = document.createElement('ul');
        activityList.classList.add('crux__activities-list');
        let activityEntries = [];
        if (item.system.activities && item.system.activities.contents) {
            const activities = Object.values(item.system.activities.contents)
                .filter(activity => activity !== undefined);
            activityEntries = activities.map(activity => [activity.id || activity.type, activity]);
        }        
        for (const [id, activity] of activityEntries) {
            if (!activity || !activity.name) continue;            
            const li = document.createElement('li');
            li.classList.add('crux__activity-item');
            li.dataset.activityId = id;
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('crux__activity-name');
            nameSpan.textContent = activity.name;
            li.appendChild(nameSpan);
            if (activity.activation?.type) {
                const typeSpan = document.createElement('span');
                typeSpan.classList.add('crux__activity-type');
                typeSpan.textContent = activity.activation.type;
                li.appendChild(typeSpan);
            }

            li.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (document.body.contains(menu)) {
                    document.body.removeChild(menu);
                }
                document.removeEventListener('click', onClickOutside);                
                
                try {
                    await CruxUtils.activateItem(item.uuid, id, event);
                } catch (error) {
                    ui.notifications.error(`Failed to use ${activity.name}: ${error.message}`);
                }
            });
            
            activityList.appendChild(li);
        }        
        menu.appendChild(activityList);
        const x = event.clientX;
        const y = event.clientY;
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        document.body.appendChild(menu);
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;        
        if (menuRect.right > viewportWidth) {
            menu.style.left = `${x - menuRect.width}px`;
        }        
        if (menuRect.bottom > viewportHeight) {
            menu.style.top = `${y - menuRect.height}px`;
        }
        const onClickOutside = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener('click', onClickOutside);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', onClickOutside);
        }, 100);
        
        return true;
    }

    /**
     * Handle initiative rolling
     * @private
     */
    _onRollInitiative(event, target) {
        let actorElement = target.closest('.crux__actor');
        let actorUuid;
        if (!actorElement) {
            const actors = game.crux.state.getActiveActors();
            if (actors.length === 1) {
                actorElement = this.element.querySelector('.crux__actor');
                if (actorElement) {
                    actorUuid = actorElement.dataset.actorUuid;
                } else {
                    actorUuid = actors[0].uuid;
                }
            }
            if (!actorUuid) return;
        } else {
            actorUuid = actorElement.dataset.actorUuid;
        }        
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (!actor) return;
        const combatant = game.combat?.combatants.find(c => c.actor?.id === actor.id);
        if (!combatant) {
            return;
        }
        game.combat.rollInitiative(combatant.id, {
            messageOptions: {
                rollMode: CONST.DICE_ROLL_MODES.PUBLIC
            }
        });
    }

    /**
     * Handle short rest button click
     * @private
     */
    _onShortRest(event, target) {
        event.stopPropagation();        
        let actorElement = target.closest('.crux__actor');
        if (!actorElement) return;        
        const actorUuid = actorElement.dataset.actorUuid;
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (!actor) return;        
        actor.shortRest();
    }

    /**
     * Handle long rest button click
     * @private
     */
    _onLongRest(event, target) {
        event.stopPropagation();        
        let actorElement = target.closest('.crux__actor');
        if (!actorElement) return;        
        const actorUuid = actorElement.dataset.actorUuid;
        const actor = CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
        if (!actor) return;        
        actor.longRest();
    }

    /**
     * Handle mousedown events on item images and names
     * @private
     */
    /**
     * Handle Q spinner toggle
     * @param {Event} event - The triggering event
     * @param {HTMLElement} target - The target element
     * @private
     */
    _onToggleQSpinner(event, target) {
        event.stopPropagation();
        event.preventDefault();
        const isEdit = target.dataset.edit === "true";
        target.dataset.edit = !isEdit;
        const displayMode = target.querySelector('.display-mode');
        const editMode = target.querySelector('.edit-mode');
        displayMode.classList.toggle('hidden', !isEdit);
        editMode.classList.toggle('hidden', isEdit);
        if (!isEdit) {
            const input = editMode.querySelector('input');
            input.focus();
            input.select();

            const onBlur = () => {
                this._saveQSpinnerChanges(target);
                target.dataset.edit = "false";
                displayMode.classList.remove('hidden');
                editMode.classList.add('hidden');
                input.removeEventListener('blur', onBlur);
            };
            input.addEventListener('blur', onBlur);
        }
    }

    /**
     * Handle U spinner toggle
     * @param {Event} event - The triggering event
     * @param {HTMLElement} target - The target element
     * @private
     */
    _onToggleUSpinner(event, target) {
        event.stopPropagation();
        event.preventDefault();
        const isEdit = target.dataset.edit === "true";
        target.dataset.edit = !isEdit;
        const displayMode = target.querySelector('.display-mode');
        const editMode = target.querySelector('.edit-mode');
        displayMode.classList.toggle('hidden', !isEdit);
        editMode.classList.toggle('hidden', isEdit);
        if (!isEdit) {
            const input = editMode.querySelector('input');
            input.focus();
            input.select();

            const onBlur = () => {
                this._saveUSpinnerChanges(target);
                target.dataset.edit = "false";
                displayMode.classList.remove('hidden');
                editMode.classList.add('hidden');
                input.removeEventListener('blur', onBlur);
            };
            input.addEventListener('blur', onBlur);
        }
    }

    /**
     * Save changes from Q spinner
     * @param {HTMLElement} spinner - The spinner element
     * @private
     */
    async _saveQSpinnerChanges(spinner) {
        const itemUuid = spinner.dataset.itemUuid;
        if (!itemUuid) return;
        const item = await fromUuid(itemUuid);if (!item || !item.isOwner || !item.parent) return;
        const input = spinner.querySelector('input');
        const value = Math.max(0, parseInt(input.value) || 0);        
        await item.parent.updateEmbeddedDocuments("Item", [{
            _id: item.id,
            "system.quantity": value
        }]);        
        spinner.querySelector('.value').textContent = value;
        input.value = value;
        if (item.sheet?.rendered) {
            item.sheet.render(false);
        }
    }

    /**
     * Save changes from U spinner
     * @param {HTMLElement} spinner - The spinner element
     * @private
     */
    async _saveUSpinnerChanges(spinner) {
        const itemUuid = spinner.dataset.itemUuid;
        if (!itemUuid) return;    
        const item = await fromUuid(itemUuid);
        if (!item || !item.isOwner || !item.parent) return;    
        const input = spinner.querySelector('input');
        const max = parseInt(input.max) || 0;
        const rawValue = parseInt(input.value);
        const value = Math.min(max, Math.max(0, isNaN(rawValue) ? 0 : rawValue));
        const spent = max - value;    
        await item.parent.updateEmbeddedDocuments("Item", [{
            _id: item.id,
            "system.uses.spent": spent
        }]);    
        spinner.querySelector('.value').textContent = `${value}/${max}`;
        input.value = value;    
        if (item.sheet?.rendered) {
            item.sheet.render(false);
        }
    }

    async _onItemMouseDown(event) {
        if (event.target.closest('[data-crux-context-menu="true"]')) {
            return false;
        }        
        const itemElement = event.currentTarget.closest(".item");
        if (!itemElement) return false;        
        const itemUuid = itemElement.dataset.itemUuid;
        if (!itemUuid) return false;        
        const item = await CruxHooksManager.fromUuid(itemUuid);
        if (!item) return false;
        if (event.which === 2) {
            event.preventDefault();
            event.stopPropagation();
            const itemEntry = itemElement.closest('.crux__item');
            const activityId = itemEntry?.dataset?.activityId;            
            if (CruxCompatibility.isDnDv4() && activityId) {
                return this._showItemActivitiesMenu(event, item);
            } else if (CruxCompatibility.isDnDv4() && CruxCompatibility.hasActivities(item)) {
                return this._showItemActivitiesMenu(event, item);
            } else {
                return this._onOpenSheet(event, event.currentTarget);
            }
        }
        if (event.currentTarget.classList.contains('item-image')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
        if (event.currentTarget.classList.contains('item-name')) {
            if (event.shiftKey && CruxCompatibility.canModifyUses(item)) {
                event.preventDefault();
                event.stopPropagation();                
                const uses = CruxCompatibility.getUses(item);
                if (!uses) return false;                
                let newValue;
                if (event.which === 1) {
                    newValue = Math.min(uses.value + 1, uses.max);
                } else if (event.which === 3) {
                    newValue = Math.max(uses.value - 1, 0);
                }                
                if (newValue !== undefined && newValue !== uses.value) {
                    await CruxCompatibility.updateUses(item, newValue);
                    this.render();
                    return false;
                }
            }
            
            if (event.which === 3 && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();                
                const li = itemElement;                
                if (li.classList.contains("expanded")) {
                    let summary = li.querySelector(".item-summary");
                    if (summary) {
                        if (window.jQuery) {
                            window.jQuery(summary).slideUp(200, () => summary.remove());
                        } else {
                            summary.remove();
                        }
                    }
                } else {
                    const description = CruxCompatibility.getDescription(item);
                    const enrichedDescription = await TextEditor.enrichHTML(description, {
                        secrets: false,
                        rollData: item.getRollData ? item.getRollData() : {}
                    });
                    let div = document.createElement('div');
                    div.className = 'item-summary';
                    div.innerHTML = enrichedDescription;
                    const chatData = await item.getChatData({ secrets: item.actor.isOwner });
                    if (chatData && chatData.properties && chatData.properties.length) {
                        let props = document.createElement('div');
                        props.className = 'item-properties';                        
                        chatData.properties.forEach(p => {
                            let span = document.createElement('span');
                            span.className = 'tag';
                            span.textContent = p;
                            props.appendChild(span);
                        });
                        if (item.system.quantity !== undefined && item.system.quantity > 0) {
                            let qtySpan = document.createElement('span');
                            qtySpan.className = 'tag';
                            qtySpan.textContent = `Qty: ${item.system.quantity}`;
                            props.appendChild(qtySpan);
                        }
                        
                        div.appendChild(props);
                    }
                    li.appendChild(div);
                    if (window.jQuery) {
                        window.jQuery(div).hide().slideDown(200);
                    }
                }
                
                li.classList.toggle("expanded");
            }
        }
        
        return false;
    }
}
