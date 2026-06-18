import CruxCompatibility from "../../utils/CruxCompatibility.js";
import CruxPanelRegistry from "../../panels/CruxPanelRegistry.js";
import CruxFoundryAccess from "../../runtime/CruxFoundryAccess.js";
import CruxDnd5eAccess from "../../runtime/dnd5e/CruxDnd5eAccess.js";

export default class CruxDnd5eSystemAdapter {
    systemId = "dnd5e";

    bindRenderedControls(app, root) {
        root?.querySelectorAll(".group-dots .dot").forEach(dot => {
            dot.addEventListener("click", async event => {
                event.preventDefault();
                event.stopPropagation();

                const actor = app._resolveActor(event.currentTarget);
                const group = event.currentTarget.closest(".group-dots")?.dataset.groupName;
                const slot = parseInt(event.currentTarget.dataset.slot) + 1;
                if (!actor || !group) return;

                try {
                    const updated = await this.toggleSpellSlot(actor, group, slot);
                    if (updated) app.render();
                } catch (error) {
                    console.error("Failed to update spell slot:", error);
                    ui.notifications.error(`Failed to update spell slot: ${error.message}`);
                }
            });
        });
    }

    async prepareTrayContext(app) {
        const settings = this._getSettings();
        const actors = game.crux.state.getActiveActors().map(actor => this._prepareActorContext(app, actor, settings));
        const iconSize = this._prefix(game.settings.get("crux", "icon-size"), "icon");
        const activePanel = CruxPanelRegistry.getActivePanel(app.activeTab);
        const baseContext = {
            app,
            actors,
            activeTab: app.activeTab,
            activePanel,
            systemId: this.systemId,
            user: game.user,
            scene: canvas.scene
        };
        const panelContext = await activePanel.prepareContext?.(baseContext) ?? {};

        return {
            actors,
            activeTab: app.activeTab,
            activePanel,
            panelContext,
            tabs: CruxPanelRegistry.getTabs({ app, actors, systemId: this.systemId }),
            iconSize,
            showSpellDots: game.settings.get("crux", "show-spell-dots"),
            showSpellFractions: game.settings.get("crux", "show-spell-fractions"),
            showQuantity: game.settings.get("crux", "show-quantity"),
            showUses: game.settings.get("crux", "show-uses"),
            settings: {
                "health-overlay-enabled": game.settings.get("crux", "health-overlay-enabled"),
                "health-overlay-direction": game.settings.get("crux", "health-overlay-direction"),
                "empty-tray-icon": game.settings.get("crux", "empty-tray-icon")
            }
        };
    }

    _getSettings() {
        return {
            showNoUses: game.settings.get("crux", "show-no-uses"),
            showUnpreparedCantrips: game.settings.get("crux", "show-unprepared-cantrips"),
            skillMode: game.settings.get("crux", "skill-mode"),
            sortAlphabetically: game.settings.get("crux", "sort-alphabetic"),
            showAllNpcItems: game.settings.get("crux", "show-all-npc-items"),
            excludeContainerItems: game.settings.get("crux", "exclude-container-items"),
            skillsExpanded: game.settings.get("crux", "skills-expanded") === "open",
            useTidy5e: game.settings.get("crux", "use-tidy5e-sections")
        };
    }

    _prepareActorContext(app, actor, settings) {
        const actorData = actor.system;
        const canCastUnpreparedRituals = !!actor.items.find(i => i.name === "Wizard");
        let sections = this._buildSections();
        let itemsToProcess = actor.items;

        if (settings.excludeContainerItems) {
            itemsToProcess = itemsToProcess.filter(item => item.container === undefined);
        }

        for (const item of itemsToProcess) {
            const itemData = item.system;
            const uses = this._calculateUsesForItem(item);
            const favoriteEntry = actorData.favorites?.find(f => {
                const favoriteId = f.id.startsWith(".") ? f.id.substring(1) : f.id;
                return favoriteId === `Item.${item.id}` && f.type === "item";
            });
            const trayVisibility = item.getFlag("crux", "trayVisibility") || "default";
            if (trayVisibility === "hide") continue;

            if (favoriteEntry) {
                sections.favorites.items.push({ item, uses, sort: favoriteEntry.sort });
            }

            const forceShow = trayVisibility === "show" || trayVisibility === "force";

            if (item.type === "spell") {
                const activationType = CruxCompatibility.getActivationType(item);
                const hasActivities = CruxCompatibility.isDnDv4()
                    ? CruxCompatibility.hasActivities(item, false)
                    : activationType && activationType !== "none";

                if (forceShow || actor.type === "npc" && settings.showAllNpcItems) {
                    this._categorizeSpell(item, itemData, sections, settings.useTidy5e, canCastUnpreparedRituals, settings.showUnpreparedCantrips, uses, true);
                } else if (hasActivities) {
                    this._categorizeSpell(item, itemData, sections, settings.useTidy5e, canCastUnpreparedRituals, settings.showUnpreparedCantrips, uses);
                } else if (actor.type === "npc") {
                    sections.passive.items.push({ item, uses });
                }
            } else {
                const activationType = CruxCompatibility.getActivationType(item);
                const isDnDv4 = CruxCompatibility.isDnDv4();
                const shouldShow = !item.getFlag("crux", "hidden") && (
                    forceShow
                    || (settings.showNoUses || !uses || (isDnDv4 ? !uses.hasMaxUses || uses.available : uses.available))
                    && (
                        isDnDv4
                            ? CruxCompatibility.hasActivities(item, false) || item.type === "consumable" && item.system.type?.value === "ammo"
                            : activationType && activationType !== "none" || item.type === "consumable" && item.system.type?.value === "ammo"
                    )
                );

                if (shouldShow) {
                    this._categorizeItem(item, itemData, uses, sections, settings.useTidy5e, canCastUnpreparedRituals, settings.showUnpreparedCantrips);
                } else if (actor.type === "npc") {
                    if (settings.showAllNpcItems) {
                        this._categorizeItem(item, itemData, uses, sections, settings.useTidy5e, canCastUnpreparedRituals, settings.showUnpreparedCantrips, true);
                    } else {
                        sections.passive.items.push({ item, uses });
                    }
                }
            }
        }

        this._addActivityFavorites(actor, sections);

        sections = this._removeEmptySections(sections);
        sections = this._addSpellLevelUses(sections, actorData);
        sections = this._sortItems(sections, settings.sortAlphabetically);

        const combatant = app._getCombatantForActor(actor);
        const actorState = game.crux.state.getActorState(actor);
        const showSkills = actorState?.showSkills !== undefined
            ? actorState.showSkills
            : settings.skillsExpanded;
        const token = app._getSelectedTokenForActor(actor) ?? actor.getActiveTokens()[0];

        return {
            actor,
            name: actor.name,
            isNpc: actor.type === "npc",
            sections,
            actorStats: this.getActorStats(actorData, actor, token),
            actorIdentity: this.getActorIdentity(actor),
            actorTraits: this.getActorTraits(actor),
            needsInitiative: combatant && combatant.initiative === null,
            isCurrentTurn: combatant && game.combat?.current?.combatantId === combatant.id,
            skills: CONFIG.DND5E.skills,
            skillMode: settings.skillMode,
            showSkills,
            abilities: this._getAbilities(actorData),
            elevation: CruxFoundryAccess.getTokenElevation(token?.document)
        };
    }

    _buildSections() {
        return {
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
                groups: this.getSystemFeatureGroups()
            },
            spell: {
                title: "crux.category.spell",
                groups: {
                    innate: { items: [], title: "crux.category.innate" },
                    atwill: { items: [], title: "crux.category.atwill" },
                    pact: { items: [], title: "crux.category.pact" },
                    apothecary: { items: [], title: "crux.category.apothecary" },
                    ...[...Array(10).keys()].reduce((prev, cur) => {
                        prev[`spell${cur}`] = { items: [], title: `crux.category.spell${cur}` };
                        return prev;
                    }, {})
                }
            },
            passive: { items: [], title: "crux.category.passive" }
        };
    }

    _getAbilities(actorData) {
        const abilities = {};
        for (const [abbr, details] of Object.entries(actorData.abilities)) {
            abilities[abbr] = {
                ...details,
                label: CONFIG.DND5E.abilities[abbr]?.label || abbr.toUpperCase(),
                abbr,
                save: CruxCompatibility.isDnDv4() ? details.save?.value : details.save
            };
        }
        return abilities;
    }

    getSystemFeatureGroups() {
        const groups = Object.entries(CONFIG.DND5E.featureTypes).reduce((prev, cur) => {
            prev[cur[0]] = { items: [], title: cur[1].label };
            if (cur[1].subtypes) {
                for (const sub in cur[1].subtypes) {
                    prev[sub] = { items: [], title: cur[1].subtypes[sub] };
                }
            }
            return prev;
        }, {});

        groups.general = { items: [], title: "crux.category.general" };
        return groups;
    }

    getActorStats(actorData, actor, token) {
        const attributes = CruxDnd5eAccess.getActorAttributes({ system: actorData });
        const details = CruxDnd5eAccess.getActorDetails({ system: actorData });
        const hp = CruxDnd5eAccess.getHp({ system: actorData });
        const hitDice = attributes.hd ?? {};
        const initiative = attributes.init ?? {};
        const senses = CruxDnd5eAccess.getSenses({ system: actorData });
        const death = attributes.death ?? {};
        const exhaustionValue = attributes.exhaustion ?? details.exhaustion ?? 0;
        const exhaustion = Number(exhaustionValue?.value ?? exhaustionValue) || 0;
        const hpValue = Number(hp.value ?? 0) || 0;
        const hpMax = Number(hp.max ?? 0) || 0;
        const hdValue = Number(hitDice.value ?? hitDice.available ?? 0) || 0;
        const hdMax = Number(hitDice.max ?? hitDice.total ?? 0) || 0;
        const percentage = (value, max) => max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

        return {
            ac: attributes.ac?.value ?? 0,
            hp: { value: hpValue, max: hpMax, temp: hp.temp ?? 0, pct: percentage(hpValue, hpMax) },
            hitDice: { value: hdValue, max: hdMax, pct: percentage(hdValue, hdMax) },
            death: {
                success: Math.min(Math.max(Number(death.success ?? 0) || 0, 0), 3),
                failure: Math.min(Math.max(Number(death.failure ?? 0) || 0, 0), 3)
            },
            initiative: initiative.total ?? initiative.mod ?? 0,
            proficiency: attributes.prof ?? 0,
            movement: this.getMovementDisplay(actor, token),
            exhaustion: Math.min(Math.max(exhaustion, 0), 6),
            senses: {
                darkvision: senses.darkvision ?? 0,
                blindsight: senses.blindsight ?? 0,
                tremorsense: senses.tremorsense ?? 0,
                truesight: senses.truesight ?? 0
            }
        };
    }

    getMovementDisplay(actor, token) {
        const movement = CruxDnd5eAccess.getMovement(actor);
        const sourceAction = CruxFoundryAccess.getTokenMovementAction(token?.document);
        const effectiveAction = CruxFoundryAccess.getEffectiveTokenMovementAction(token?.document);
        const action = sourceAction ?? null;
        const displayAction = action ?? "speed";
        const actionConfig = CONFIG.Token.movement.actions?.[effectiveAction] ?? CONFIG.Token.movement.actions?.walk ?? {};
        return {
            action,
            effectiveAction,
            label: this.getMovementLabel(displayAction),
            value: this._formatMovementAmount(this.getMovementAmount(displayAction, movement)),
            title: action ? game.i18n.localize(actionConfig.label) : `SPD (${game.i18n.localize(actionConfig.label)})`,
            icon: actionConfig.icon,
            img: actionConfig.img
        };
    }

    getMovementLabel(action) {
        return {
            speed: "SPD",
            walk: "WLK",
            burrow: "BRRW",
            fly: "FLY",
            swim: "SWM",
            climb: "CLMB",
            crawl: "CRWL",
            jump: "JMP",
            blink: "BLNK"
        }[action] ?? String(action ?? "SPD").toUpperCase();
    }

    getMovementAmount(action, movement) {
        const walk = Number(movement.walk ?? movement.speed ?? 0) || 0;
        const halfWalk = walk ? Math.floor(walk / 2) : undefined;
        switch (action) {
            case "speed": return movement.speed ?? movement.walk;
            case "walk": return movement.walk;
            case "burrow": return movement.burrow;
            case "fly": return movement.fly;
            case "swim": return movement.swim || halfWalk;
            case "climb": return movement.climb || halfWalk;
            case "crawl": return halfWalk;
            case "jump": return movement.jump;
            case "blink": return Infinity;
            default: return movement[action];
        }
    }

    getActorIdentity(actor) {
        if (actor.type === "npc") return this._getNpcIdentity(actor);
        const race = actor.system.details?.race;
        const background = actor.system.details?.background;
        const raceItem = race?.uuid ? race : actor.items.find(item => item.type === "race");
        const backgroundItem = background?.uuid ? background : actor.items.find(item => item.type === "background");
        const type = raceItem?.system?.type ?? actor.system.details?.type;
        const typeValue = type?.value ?? type;
        const typeLabel = typeValue === "custom" ? type?.custom : CONFIG.DND5E.creatureTypes?.[typeValue]?.label ?? typeValue;
        const subtype = type?.subtype ?? "";
        const speciesSize = raceItem?.system?.size ?? raceItem?.system?.traits?.size ?? actor.system.traits?.size;
        const sizeLabel = CONFIG.DND5E.actorSizes?.[speciesSize]?.label ?? speciesSize;

        return {
            creatureType: {
                label: typeLabel || "Creature Type",
                subtitle: subtype || raceItem?.name || "",
                img: CONFIG.DND5E.creatureTypes?.[typeValue]?.icon || raceItem?.img || "icons/svg/mystery-man.svg",
                uuid: raceItem?.uuid
            },
            species: {
                label: raceItem?.name || "Species",
                subtitle: sizeLabel || "",
                img: raceItem?.img || "icons/svg/mystery-man.svg",
                uuid: raceItem?.uuid
            },
            background: {
                label: backgroundItem?.name || "Background",
                subtitle: "",
                img: backgroundItem?.img || "icons/svg/book.svg",
                uuid: backgroundItem?.uuid
            }
        };
    }

    getActorTraits(actor) {
        if (actor.type === "npc") return this._getNpcTraits(actor);
        const actorData = actor.system;
        const traits = actorData.traits ?? {};
        const categories = [
            { id: "senses", label: "Senses", icon: "fas fa-eye", tags: this._getSenseTags(CruxDnd5eAccess.getSenses({ system: actorData })) },
            { id: "resistances", label: "Resistances", icon: "fas fa-shield-virus", tags: this._getTraitTags(traits.dr, CONFIG.DND5E.damageTypes) },
            { id: "immunities", label: "Immunities", icon: "fas fa-shield-alt", tags: [
                ...this._getTraitTags(traits.di, CONFIG.DND5E.damageTypes),
                ...this._getTraitTags(traits.ci, CONFIG.DND5E.conditionTypes)
            ] },
            { id: "vulnerabilities", label: "Vulnerabilities", icon: "fas fa-heart-crack", tags: this._getTraitTags(traits.dv, CONFIG.DND5E.damageTypes) },
            { id: "armor", label: "Armor", icon: "fas fa-shield", tags: this._getTraitTags(traits.armorProf, CONFIG.DND5E.armorProficiencies) },
            { id: "weapons", label: "Weapons", icon: "fas fa-swords", tags: this._getTraitTags(traits.weaponProf, CONFIG.DND5E.weaponProficiencies) },
            { id: "tools", label: "Tools", icon: "fas fa-toolbox", tags: this._getTraitTags(traits.toolProf, CONFIG.DND5E.toolProficiencies) },
            { id: "languages", label: "Languages", icon: "fas fa-flag", tags: this._getTraitTags(traits.languages, CONFIG.DND5E.languages) }
        ];
        return categories.filter(category => category.tags.length);
    }

    rollAbility(actor, ability, event) {
        return actor?.rollAbility?.({ ability, event }, {}, {});
    }

    rollSavingThrow(actor, ability, event) {
        return actor?.rollSavingThrow?.({ ability, event }, {}, {});
    }

    rollSkill(actor, skill, event) {
        return actor?.rollSkill?.({ skill, event }, {}, {});
    }

    async rollInitiative(actor, combatant, rollOptions = {}) {
        if (combatant) {
            await this.rollCombatantsInitiative([combatant], rollOptions);
            return;
        }
        await actor?.rollInitiative?.({ createCombatants: true }, rollOptions);
    }

    async rollCombatantsInitiative(combatants, rollOptions = {}) {
        const cachedActors = new Set();
        try {
            for (const combatant of combatants) {
                const actor = combatant?.actor;
                if (!actor?.getInitiativeRoll) continue;
                actor._cachedInitiativeRoll = actor.getInitiativeRoll(rollOptions);
                cachedActors.add(actor);
            }
            await game.combat?.rollInitiative(combatants.map(combatant => combatant.id));
        } finally {
            for (const actor of cachedActors) {
                delete actor._cachedInitiativeRoll;
            }
        }
    }

    shortRest(actor) {
        return actor?.shortRest?.();
    }

    longRest(actor) {
        return actor?.longRest?.();
    }

    isModernDnd5e() {
        return CruxCompatibility.isDnDv4();
    }

    hasActivities(item) {
        return CruxCompatibility.hasActivities(item);
    }

    getActivityEntries(item) {
        if (!this.isModernDnd5e()) return [];
        return CruxDnd5eAccess.getActivityEntries(item);
    }

    canModifyUses(item) {
        return CruxCompatibility.canModifyUses(item);
    }

    getUses(item) {
        return CruxCompatibility.getUses(item);
    }

    updateUses(item, value) {
        return CruxCompatibility.updateUses(item, value);
    }

    getDescription(item) {
        return CruxDnd5eAccess.getDescription(item);
    }

    async rechargeItem(item) {
        if (this.isModernDnd5e()) {
            const uses = CruxDnd5eAccess.getUses(item);
            const recovery = uses.recovery;
            if (recovery?.period !== "recharge" || !recovery.formula) return;
            const roll = await new Roll(recovery.formula).evaluate({ async: true });
            if (roll.total >= parseInt(recovery.formula)) {
                await item.update({ [CruxDnd5eAccess.usesValueUpdatePath()]: uses.max });
            }
            roll.toMessage({
                flavor: game.i18n.format("DND5E.ItemRechargeCheck", { name: item.name }),
                speaker: ChatMessage.getSpeaker({ actor: item.actor })
            });
            return;
        }

        await item.rollRecharge();
    }

    async toggleSpellSlot(actor, group, slot) {
        const current = CruxDnd5eAccess.getSpellGroup(actor, group)?.value;
        if (current === undefined) return false;
        const value = current !== slot ? slot : slot - 1;
        await actor.update({ [CruxDnd5eAccess.spellSlotUpdatePath(group)]: value });
        return true;
    }

    async saveHpField(actor, field, rawValue) {
        if (!actor?.isOwner) return;
        const currentHp = CruxDnd5eAccess.getHp(actor);
        const fallback = field === "temp" ? Number(currentHp.temp ?? 0) || 0 : Number(currentHp.value ?? 0) || 0;
        const parsedValue = isNaN(rawValue) ? fallback : rawValue;
        const value = field === "temp"
            ? Math.max(0, parsedValue)
            : Math.min(Number(currentHp.max ?? 0) || 0, Math.max(0, parsedValue));
        const updatePath = CruxDnd5eAccess.hpUpdatePath(field);
        await actor.update({ [updatePath]: value });
    }

    getItemQuantity(item) {
        const quantity = CruxDnd5eAccess.getQuantity(item);
        return quantity !== undefined && quantity > 0 ? quantity : null;
    }

    _getNpcIdentity(actor) {
        const details = actor.system.details ?? {};
        const type = details.type ?? {};
        const typeValue = type.value ?? type;
        const typeLabel = this._localizeLabel(type.label ?? CONFIG.DND5E.creatureTypes?.[typeValue]?.label ?? typeValue ?? "Creature Type");
        const subtype = type.subtype ?? "";
        const size = actor.system.traits?.size;
        const sizeLabel = this._localizeLabel(CONFIG.DND5E.actorSizes?.[size]?.label ?? size ?? "Size");
        return {
            creatureType: {
                label: typeLabel || "Creature Type",
                subtitle: subtype,
                img: CONFIG.DND5E.creatureTypes?.[typeValue]?.icon || "icons/svg/mystery-man.svg"
            },
            species: { label: sizeLabel || "Size", subtitle: "Size", img: "icons/svg/upgrade.svg" },
            background: { label: details.alignment || "Alignment", subtitle: "Alignment", img: "icons/svg/aura.svg" }
        };
    }

    _getNpcTraits(actor) {
        const actorData = actor.system;
        const traits = actorData.traits ?? {};
        const categories = [
            { id: "speed", label: "Speed", icon: "fas fa-shoe-prints", tags: this._getNpcSpeedTags(actorData.attributes?.movement ?? {}) },
            { id: "skills", label: "Skills", icon: "fas fa-briefcase", tags: this._getNpcSkillTags(actorData.skills ?? {}) },
            { id: "senses", label: "Senses", icon: "fas fa-eye", tags: this._getSenseTags(CruxDnd5eAccess.getSenses({ system: actorData })) },
            { id: "resistances", label: "Resistances", icon: "fas fa-shield-virus", tags: this._getTraitTags(traits.dr, CONFIG.DND5E.damageTypes) },
            { id: "damage-immunities", label: "Damage Immunities", icon: "fas fa-shield-alt", tags: this._getTraitTags(traits.di, CONFIG.DND5E.damageTypes) },
            { id: "condition-immunities", label: "Condition Immunities", icon: "fas fa-shield-heart", tags: this._getTraitTags(traits.ci, CONFIG.DND5E.conditionTypes) },
            { id: "vulnerabilities", label: "Vulnerabilities", icon: "fas fa-heart-crack", tags: this._getTraitTags(traits.dv, CONFIG.DND5E.damageTypes) },
            { id: "damage-modification", label: "Damage Modification", icon: "fas fa-notes-medical", tags: this._getDamageModificationTags(traits.dm) },
            { id: "languages", label: "Languages", icon: "fas fa-flag", tags: this._getTraitTags(traits.languages, CONFIG.DND5E.languages) },
            { id: "habitat", label: "Habitat", icon: "fas fa-mountain", tags: this._getTraitTags(actorData.details?.habitat, CONFIG.DND5E.habitats) },
            { id: "treasure", label: "Treasure", icon: "fas fa-gem", tags: this._getTraitTags(actorData.details?.treasure, CONFIG.DND5E.treasure) }
        ];
        return categories.filter(category => category.tags.length);
    }

    _calculateUsesForItem(item) {
        const uses = CruxCompatibility.getUses(item);
        if (!uses) return null;
        return CruxCompatibility.isDnDv4()
            ? { available: uses.value, maximum: uses.max, hasMaxUses: uses.max > 0 }
            : { available: uses.value, maximum: uses.max };
    }

    _categorizeItem(item, itemData, uses, sections, useTidy5e, canCastUnpreparedRituals, showUnpreparedCantrips, bypassPreparedCheck = false) {
        switch (item.type) {
            case "feat": return this._categorizeFeature(item, sections, useTidy5e, uses);
            case "spell": return this._categorizeSpell(item, itemData, sections, useTidy5e, canCastUnpreparedRituals, showUnpreparedCantrips, uses, bypassPreparedCheck);
            default: return this._categorizeInventoryItem(item, itemData, uses, sections, useTidy5e);
        }
    }

    _categorizeFeature(item, sections, useTidy5e, uses) {
        const featureSection = useTidy5e ? item.flags?.["tidy5e-sheet"]?.section : null;
        if (featureSection) {
            const sectionKey = this._tidySectionKey(featureSection);
            sections.feature.groups[sectionKey] ??= { items: [], title: featureSection };
            sections.feature.groups[sectionKey].items.push({ item, uses });
            return;
        }

        const type = item.system.type.value;
        const subtype = item.system.type.subtype;
        const key = subtype || type || "general";
        sections.feature.groups[key] ??= { items: [], title: key === "general" ? "crux.category.general" : this._capitalize(key) };
        sections.feature.groups[key].items.push({ item, uses });
    }

    _categorizeSpell(item, itemData, sections, useTidy5e, canCastUnpreparedRituals, showUnpreparedCantrips, uses, bypassPreparedCheck = false) {
        const spellSection = useTidy5e ? item.flags?.["tidy5e-sheet"]?.section : null;
        if (spellSection) {
            const sectionKey = this._tidySectionKey(spellSection);
            sections.spell.groups[sectionKey] ??= { items: [], title: spellSection };
            sections.spell.groups[sectionKey].items.push({ item, uses });
            return;
        }

        const spellMethod = CruxCompatibility.getSpellMethod(item);
        switch (spellMethod) {
            case "prepared":
            case "always": {
                const isAlways = spellMethod !== "prepared";
                const isPrepared = CruxCompatibility.getSpellPrepared(item);
                const isCastableRitual = canCastUnpreparedRituals && itemData.components?.ritual;
                const isDisplayableCantrip = itemData.level == 0 && showUnpreparedCantrips;
                if (bypassPreparedCheck || isAlways || isPrepared || isCastableRitual || isDisplayableCantrip) {
                    sections.spell.groups[`spell${itemData.level}`].items.push({ item, uses });
                }
                break;
            }
            case "atwill":
            case "innate":
            case "pact":
            case "apothecary":
                sections.spell.groups[spellMethod].items.push({ item, uses });
                break;
            default:
                if (bypassPreparedCheck && itemData.level !== undefined) {
                    sections.spell.groups[`spell${itemData.level}`].items.push({ item, uses });
                }
                break;
        }
    }

    _categorizeInventoryItem(item, itemData, uses, sections, useTidy5e) {
        const inventorySection = useTidy5e ? item.flags?.["tidy5e-sheet"]?.section : null;
        if (inventorySection) {
            const sectionKey = this._tidySectionKey(inventorySection);
            sections.inventory.groups[sectionKey] ??= { items: [], title: inventorySection };
            sections.inventory.groups[sectionKey].items.push({ item, uses });
            return;
        }

        switch (item.type) {
            case "weapon":
                if (itemData.equipped) sections.equipped.items.push({ item, uses });
                else sections.inventory.groups.weapon.items.push({ item, uses });
                break;
            case "equipment":
                sections.inventory.groups.equipment.items.push({ item, uses });
                break;
            case "consumable":
                if (itemData.consumableType === "ammo" || itemData.type?.value === "ammo") sections.inventory.groups.ammunition.items.push({ item, uses });
                else sections.inventory.groups.consumable.items.push({ item, uses });
                break;
            default:
                sections.inventory.groups.other.items.push({ item, uses });
        }
    }

    _addActivityFavorites(actor, sections) {
        const favorites = CruxDnd5eAccess.getActorFavorites(actor);
        if (!CruxCompatibility.isDnDv4() || !favorites.length) return;

        for (const favoriteEntry of favorites.filter(f => f.type === "activity")) {
            const favoriteId = favoriteEntry.id.startsWith(".") ? favoriteEntry.id.substring(1) : favoriteEntry.id;
            const idParts = favoriteId.split(".");
            if (idParts.length < 4 || idParts[0] !== "Item" || idParts[2] !== "Activity") {
                console.error("CRUX | Invalid activity ID format:", favoriteId);
                continue;
            }

            const parentItem = actor.items.find(i => i.id === idParts[1]);
            if (!parentItem || parentItem.getFlag("crux", "hidden")) continue;
            const activity = this._findActivity(parentItem, idParts[3]);
            if (!activity) continue;

            sections.favorites.items.push({
                item: parentItem,
                activityId: idParts[3],
                activityName: activity.name,
                uses: this._calculateUsesForItem(parentItem),
                sort: favoriteEntry.sort
            });
        }
    }

    _findActivity(item, activityId) {
        return CruxDnd5eAccess.getActivity(item, activityId);
    }

    _removeEmptySections(sections) {
        const hasItems = object => {
            if (!object || typeof object !== "object") return false;
            const keys = Object.keys(object);
            if (keys.includes("groups") && Object.values(object.groups).some(g => hasItems(g))) return true;
            if (keys.includes("items")) return !!object.items.length;
            return Object.values(object).some(v => hasItems(v));
        };
        const settingMap = {
            favorites: "show-favorites-section",
            equipped: "show-equipped-section",
            feature: "show-features-section",
            spell: "show-spells-section",
            inventory: "show-inventory-section"
        };
        return Object.entries(sections).reduce((acc, [key, value]) => {
            const setting = settingMap[key];
            if ((key === "favorites" || hasItems(value)) && (!setting || game.settings.get("crux", setting))) acc[key] = value;
            return acc;
        }, {});
    }

    _addSpellLevelUses(sections, actorData) {
        const showSpellsSection = game.settings.get("crux", "show-spells-section");
        if (!sections.spell && showSpellsSection && (actorData.spells.pact.max || actorData.spells.apothecary?.max)) {
            sections.spell = { title: "crux.category.spell", groups: {} };
            if (actorData.spells.pact.max) sections.spell.groups.pact = { items: [], title: "crux.category.pact" };
            if (actorData.spells.apothecary?.max) sections.spell.groups.apothecary = { items: [], title: "crux.category.apothecary" };
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
            sections.spell.groups.pact ??= { items: [], title: "crux.category.pact" };
            sections.spell.groups.pact.uses = { available: actorData.spells.pact.value, maximum: actorData.spells.pact.max };
        }
        if (actorData.spells.apothecary?.max) {
            sections.spell.groups.apothecary ??= { items: [], title: "crux.category.apothecary" };
            sections.spell.groups.apothecary.uses = { available: actorData.spells.apothecary.value, maximum: actorData.spells.apothecary.max };
        }
        return sections;
    }

    _sortItems(sections, sortAlphabetically) {
        if (!sections || typeof sections !== "object") return sections;
        Object.entries(sections).forEach(([sectionKey, value]) => {
            if (!value || typeof value !== "object") return;
            if (Array.isArray(value.items)) {
                value.items.sort(sectionKey === "favorites"
                    ? (a, b) => a.sort - b.sort
                    : (a, b) => sortAlphabetically ? a.item.name.localeCompare(b.item.name) : a.item.sort - b.item.sort);
            }
            if (value.groups) this._sortItems(value.groups, sortAlphabetically);
        });
        return sections;
    }

    _getNpcSpeedTags(movement) {
        const speed = movement.speed ?? movement.walk;
        const tags = [];
        if (speed) tags.push({ label: "Speed", value: speed });
        for (const key of ["walk", "burrow", "climb", "fly", "swim"]) {
            const value = Number(movement[key]) || 0;
            if (!value || value === speed && key === "walk") continue;
            tags.push({ label: key.titleCase?.() ?? key, value });
        }
        if (movement.special) tags.push({ label: movement.special });
        return this._uniqueTags(tags);
    }

    _getNpcSkillTags(skills) {
        const tags = [];
        for (const [key, skill] of Object.entries(skills)) {
            if (!(Number(skill.value) > 0 || Number(skill.effectValue) > 0)) continue;
            const label = this._localizeLabel(CONFIG.DND5E.skills?.[key]?.label ?? key.titleCase?.() ?? key);
            const total = Number(skill.total ?? 0) || 0;
            tags.push({ label, value: total >= 0 ? `+${total}` : total });
        }
        return tags;
    }

    _getDamageModificationTags(modification) {
        return Object.entries(modification?.amount ?? {})
            .map(([label, value]) => ({ label: this._localizeLabel(label), value }))
            .filter(tag => tag.value !== undefined && tag.value !== null && tag.value !== "");
    }

    _getTraitTags(trait, config = {}) {
        if (!trait) return [];
        const values = this._toArray(trait.value ?? trait);
        const tags = values.map(value => this._formatTraitValue(value, config)).filter(Boolean);
        const custom = String(trait.custom ?? "").split(/[;,]/).map(value => value.trim()).filter(Boolean);
        return this._uniqueTags([...tags, ...custom.map(label => ({ label }))]);
    }

    _getSenseTags(senses) {
        const config = CONFIG.DND5E.senses ?? {};
        const tags = [];
        const ranges = senses?.ranges ?? senses ?? {};
        for (const [key, value] of Object.entries(ranges)) {
            const distance = Number(value) || 0;
            if (distance <= 0) continue;
            const label = this._localizeLabel(config[key]?.label ?? config[key] ?? key.titleCase?.() ?? key);
            tags.push({ label, value: distance });
        }
        if (senses.special) tags.push({ label: senses.special });
        return this._uniqueTags(tags);
    }

    _formatTraitValue(value, config = {}) {
        if (!value) return null;
        const label = this._localizeLabel(config[value]?.label ?? config[value] ?? String(value).titleCase?.() ?? String(value));
        return { label };
    }

    _formatMovementAmount(value) {
        if (value === Infinity) return "\u221E";
        if (!Number.isFinite(Number(value))) return "--";
        return String(Number(value));
    }

    _localizeLabel(label) {
        if (typeof label !== "string") return String(label ?? "");
        return game.i18n?.has?.(label) ? game.i18n.localize(label) : label;
    }

    _uniqueTags(tags) {
        const seen = new Set();
        return tags.filter(tag => {
            const key = `${tag.label}|${tag.value ?? ""}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    _toArray(value) {
        if (!value) return [];
        if (value instanceof Set) return Array.from(value);
        if (Array.isArray(value)) return value;
        if (typeof value === "string") return value ? [value] : [];
        if (typeof value.values === "function") return Array.from(value.values());
        return [];
    }

    _tidySectionKey(section) {
        return `tidy5e_${section.toLowerCase().replace(/\s+/g, "_")}`;
    }

    _capitalize(str) {
        return str.split(/[\s-_]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
    }

    _prefix(tgt, str) {
        return tgt ? [str, tgt].join("-") : tgt;
    }
}
