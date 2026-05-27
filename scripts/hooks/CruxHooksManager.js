import CruxTrayAppV2 from "../apps/CruxTrayAppV2.js";
import CruxStateManager from "../state/CruxStateManager.js";
import CruxEffectsAppV2 from "../apps/CruxEffectsAppV2.js";
import CruxSettings from "../settings/CruxSettings.js";
import CruxCompatibility from "../utils/CruxCompatibility.js";

/**
 * Manages hook registrations and initialization for Crux
 */
export default class CruxHooksManager {
    /**
     * Initialize hooks
     */
    static init() {
        console.log("Crux | Initializing Crux hooks");
        
        this.#registerHooks();
        this.#registerKeybindings();
    }

    /**
     * Register all required hooks
     */
    static #registerHooks() {
        Hooks.once('ready', async () => {
            if (!game.crux?.app) {
                game.crux = {
                    ...game.crux,
                    app: new CruxTrayAppV2(),
                    state: CruxStateManager.getInstance(),
                    lastSelectedTokens: game.crux?.lastSelectedTokens ?? [],
                    cruxItemActive: game.crux?.cruxItemActive ?? false,
                    lastUsedItem: game.crux?.lastUsedItem ?? null
                };
            } else {
                if (!game.crux.lastSelectedTokens) game.crux.lastSelectedTokens = [];
                if (game.crux.cruxItemActive === undefined) game.crux.cruxItemActive = false;
                if (game.crux.lastUsedItem === undefined) game.crux.lastUsedItem = null;
            }
            await game.crux.app.render(true);
            CruxSettings._updateFontFamily();
            CruxSettings._updateCharacterNameSizeMultiplier();
            game.crux.app._initializeTraySize();
            if (game.crux.app.element && document.body.contains(game.crux.app.element)) {
                const trayMode = game.settings.get("crux", "tray-mode");
                const interfaceEl = document.querySelector("#interface");
                if (trayMode === "always") {
                    game.crux.app.element.classList.add("active", "always-on");
                    if (interfaceEl) interfaceEl.classList.add("crux-active");
                } else if (trayMode === "auto") {
                    const hasSelectedTokens = canvas.tokens.controlled.length > 0;
                    if (hasSelectedTokens) {
                        game.crux.app.element.classList.add("active");
                        if (interfaceEl) interfaceEl.classList.add("crux-active");
                    } else {
                        game.crux.app.element.classList.remove("active");
                        if (interfaceEl) interfaceEl.classList.remove("crux-active");
                    }
                }
            }
            game.settings.settings.get("crux.tray-mode").onChange = (value) => {
                if (game.crux?.app) {
                    CruxSettings._handleTrayModeChange(value);
                }
            };
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
            console.log("Crux | Checking tray visibility flags for all items...");        
            let needsUpdate = false;
            let updateCount = 0;
            const checkAndUpdate = async (item) => {
                if (!item) return;
                try {
                    const visibilitySetting = item.getFlag("crux", "trayVisibility");
                    if (visibilitySetting === undefined) {
                        if (!needsUpdate) {
                            needsUpdate = true;
                            ui.notifications.info("Crux: Initializing tray visibility flags for items. This may take a moment.");
                        }
                        if (await this._ensureItemTrayVisibility(item)) {
                            updateCount++;
                        }
                    }
                } catch (error) {
                    console.error(`Crux | Error checking/updating tray visibility for item ${item?.name} (${item?.id}):`, error);
                }
            };
            for (const item of game.items) {
                await checkAndUpdate(item);
            }
            for (const actor of game.actors) {
                for (const item of actor.items) {
                    await checkAndUpdate(item);
                }
            }
            const processCompendiums = game.settings.get("crux", "process-compendium-items") !== false;
            if (processCompendiums) {
                console.log("Crux | Processing compendium items (this may take a moment)");
                for (const pack of game.packs) {
                    if (pack.documentName === "Item" && !pack.locked) {
                        try {
                            const items = await pack.getDocuments();
                            const batchSize = 50;
                            for (let i = 0; i < items.length; i += batchSize) {
                                const batch = items.slice(i, i + batchSize);
                                const promises = batch.map(item => checkAndUpdate(item));
                                await Promise.all(promises);
                                if (i + batchSize < items.length) {
                                    await new Promise(resolve => setTimeout(resolve, 0));
                                }
                            }
                        } catch (error) {
                            console.error(`Crux | Error processing compendium ${pack.metadata.label}:`, error);
                        }
                    }
                }
            }
            if (updateCount > 0) {
                console.log(`Crux | Initialized tray visibility flags on ${updateCount} item(s).`);
            } else if (!needsUpdate) {
                console.log("Crux | All item tray visibility flags are already initialized.");
            }
        });

        Hooks.on("cruxFilterActivities", (activities, item) => {
        });

        Hooks.on("controlToken", (token, isControlled) => {
            if (!game.crux?.app) return;
            game.crux.app.render();
            if (game.crux.app.element && document.body.contains(game.crux.app.element)) {
                const trayMode = game.settings.get("crux", "tray-mode");
                const interfaceEl = document.querySelector("#interface");                
                if (trayMode === "auto") {
                    const hasSelectedTokens = canvas.tokens.controlled.length > 0;                
                    if (hasSelectedTokens) {
                        game.crux.app.element.classList.add("active");
                        if (interfaceEl) interfaceEl.classList.add("crux-active");
                    } else {
                        game.crux.app.element.classList.remove("active");
                        if (interfaceEl) interfaceEl.classList.remove("crux-active");
                    }
                }
                else if (trayMode === "always") {
                    game.crux.app.element.classList.add("active");
                    game.crux.app.element.classList.add("always-on");
                    if (interfaceEl) interfaceEl.classList.add("crux-active");
                }
            }            
            if (isControlled && token.actor) {
                CruxEffectsAppV2.updateInstance(token.actor, token);
            }
        });

        Hooks.on("updateActor", (actor) => {
            if (!game.crux?.app) return;
            if (game.crux.state.isActorActive(actor)) {
                game.crux.app.render();
            }
        });

        const itemHooks = ["updateItem", "deleteItem"];
        itemHooks.forEach(hook => {
            Hooks.on(hook, (item) => {
                if (!game.crux?.app) return;
                if (game.crux.state.isActorActive(item.actor)) {
                    game.crux.app.render();
                }
            });
        });
        Hooks.on("createItem", (item) => {
            this._ensureItemTrayVisibility(item);
            if (!game.crux?.app) return;
            if (game.crux.state.isActorActive(item.actor)) {
                game.crux.app.render();
            }
        });
        if (!CruxCompatibility.isDnDv4()) {
            Hooks.on("createOwnedItem", (actor, itemData) => {
                const item = actor.items.find(i => i.id === itemData._id);
                if (item) this._ensureItemTrayVisibility(item);
            });
        }

        const effectHooks = ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"];
        effectHooks.forEach(hook => {
            Hooks.on(hook, (effect) => this._renderForActiveEffect(effect));
        });

        Hooks.on("updateCombat", () => {
            if (!game.crux?.app) return;
            game.crux.app.render();
        });

        Hooks.on("createCombatant", (combatant) => {
            if (!game.crux?.app) return;
            if (game.crux.state.isActorActive(combatant.actor)) {
                game.crux.app.render();
            }
        });

        Hooks.on("updateCombatant", (combatant) => {
            if (!game.crux?.app) return;
            if (game.crux.state.isActorActive(combatant.actor)) {
                game.crux.app.render();
            }
        });

        Hooks.on("deleteCombat", () => {
            if (!game.crux?.app) return;
            if (!game.combat) {
                game.crux.app.render();
            }
        });

        Hooks.on("dnd5e.preItemUse", (item, config, options) => {
            if (game.crux) {
                game.crux.lastUsedItem = {
                    uuid: item.uuid,
                    name: item.name,
                    hasTemplate: item.hasAreaTarget
                };
            }
        });

        Hooks.on("dnd5e.itemUse", (item, config, options) => {
            if (game.crux?.lastUsedItem?.uuid === item.uuid) {
            }
        });
    }

    /**
     * Register keybindings
     */
    static #registerKeybindings() {
        game.keybindings.register("crux", "toggle-tray", {
            name: "Toggle Tray",
            hint: "Toggle the visibility of the action tray",
            editable: [
                { key: "KeyE", modifiers: ["Shift"]}
            ],
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
            onDown: () => {
                try {
                    if (!game.ready || !game.crux?.app) return;
                    game.crux.app.toggleTray();
                    return true;
                } catch (error) {
                    ui.notifications.error("Error toggling tray");
                    return false;
                }
            }
        });
        game.keybindings.register("crux", "open-actor-panel", {
            name: "Open Actor Panel",
            hint: "Open the Crux tray with the Actor panel visible",
            editable: [
                { key: "KeyC", modifiers: ["Alt"]}
            ],
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
            onDown: () => {
                try {
                    if (!game.ready || !game.crux?.app) return;
                    game.crux.app.showActorTab();
                    return true;
                } catch (error) {
                    ui.notifications.error("Error opening actor panel");
                    return false;
                }
            }
        });
        game.keybindings.register("crux", "toggle-skills", {
            name: "Toggle Skills",
            hint: "Toggle the skills list visibility",
            editable: [
                { key: "KeyK", modifiers: ["Shift"]}
            ],
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
            onDown: () => {
                try {
                    if (!game.ready || !game.crux?.app) return;
                    game.crux.app._onToggleSkills();
                    return true;
                } catch (error) {
                    ui.notifications.error("Error toggling skills");
                    return false;
                }
            }
        });
    }

    /**
     * Resolve an entity from its UUID synchronously
     * @param {string} uuid - The UUID of the entity to retrieve
     * @returns {object|null} The entity if found, null otherwise
     */
    static fromUuid(uuid) {
        if (!uuid) return null;
        return fromUuidSync(uuid);
    }

    /**
     * Get the currently active actor in combat
     * @returns {Actor|null} The active actor if in combat, null otherwise
     */
    static currentlyActiveActor() {
        const combat = game.combat;
        if (!combat) return null;
        const combatant = combat.combatants.get(combat.current.combatantId);
        if (!combatant) return null;
        return this.resolveActor(combatant.token);
    }

    /**
     * Resolve a token, actor, or item into its associated actor
     * @param {object} candidate - The object to resolve into an actor
     * @returns {Actor|null} The resolved actor if successful, null otherwise
     */
    static resolveActor(candidate) {
        if (!candidate) return null;
        if (candidate instanceof CONFIG.Actor.documentClass) {
            return candidate;
        } else if (candidate instanceof CONFIG.Token.documentClass) {
            return candidate.object.actor;
        } else if (candidate.actor instanceof CONFIG.Actor.documentClass) {
            return candidate.actor;
        } else {
            console.warn("Crux | Expected actor-compatible document", candidate);
            return null;
        }
    }

    static _renderForActiveEffect(effect) {
        if (!game.crux?.app) return;
        const actor = this.resolveActor(effect?.parent);
        if (!actor || !game.crux.state.isActorActive(actor)) return;
        setTimeout(() => game.crux.app.render(), 0);
    }

    /**
     * Ensure an item has the tray visibility flag set
     * @param {Item} item - The item to check and update
     * @param {boolean} [noAwait=false]
     * @returns {Promise<boolean>} True if the flag was set, false otherwise.
     * @private
     */
    static async _ensureItemTrayVisibility(item, noAwait = false) {
        if (!item) return false;
        try {
            const visibilitySetting = item.getFlag("crux", "trayVisibility");
            if (visibilitySetting === undefined) {
                if (!game.user.isGM && !item.isOwner) {
                    return false;
                }
                
                if (item._processingTrayVisibility) return false; 
                item._processingTrayVisibility = true;
                const setFlag = async () => {
                    try {
                        await item.setFlag("crux", "trayVisibility", "default");
                        return true;
                    } catch (err) {
                        console.error(`Crux | Error setting tray visibility flag for item ${item.name} (${item.id}):`, err);
                        return false;
                    } finally {
                        delete item._processingTrayVisibility;
                    }
                };
                if (noAwait) {
                    setFlag();
                    return true;
                } else {
                    return await setFlag();
                }
            }
        } catch (error) {
            console.error(`Crux | Error in _ensureItemTrayVisibility for item ${item?.name} (${item?.id}):`, error);
            if (item) delete item._processingTrayVisibility; 
        }
        return false;
    }
}
