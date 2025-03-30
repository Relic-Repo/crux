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
                    app: new CruxTrayAppV2(),
                    state: CruxStateManager.getInstance(),
                    lastSelectedTokens: [],
                    cruxItemActive: false,
                    lastUsedItem: null
                };
            } else {
                if (!game.crux.lastSelectedTokens) game.crux.lastSelectedTokens = [];
                if (game.crux.cruxItemActive === undefined) game.crux.cruxItemActive = false;
                if (game.crux.lastUsedItem === undefined) game.crux.lastUsedItem = null;
            }
            
            await game.crux.app.render(true);
            game.crux.app._initializeTraySize();
            if (game.crux.app.element && document.body.contains(game.crux.app.element)) {
                const trayMode = game.settings.get("crux", "tray-mode");
                if (trayMode === "always") {
                    game.crux.app.element.classList.add("active");
                    game.crux.app.element.classList.add("always-on");
                    document.querySelector("#interface").classList.add("crux-active");
                } else if (trayMode === "auto") {
                    const hasSelectedTokens = canvas.tokens.controlled.length > 0;                    
                    if (hasSelectedTokens) {
                        game.crux.app.element.classList.add("active");
                        document.querySelector("#interface").classList.add("crux-active");
                    } else {
                        game.crux.app.element.classList.remove("active");
                        document.querySelector("#interface").classList.remove("crux-active");
                    }
                }
            }
            
            game.settings.settings.get("crux.tray-mode").onChange = (value) => {
                if (game.crux?.app) {
                    CruxSettings._handleTrayModeChange(value);
                }
            };
            
            if (game.modules.get("foundry-taskbar")?.active) {
                const isCompatEnabled = game.settings.get("crux", "taskbar-compatibility");
                document.body.classList.toggle("crux-taskbar-compat", isCompatEnabled);
            }
            console.log("Crux | Initializing tray visibility flags for all items");
            for (const item of game.items) {
                this._ensureItemTrayVisibility(item, true);
            }
            for (const actor of game.actors) {
                for (const item of actor.items) {
                    this._ensureItemTrayVisibility(item, true);
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
                                for (const item of batch) {
                                    this._ensureItemTrayVisibility(item, true);
                                }
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
                { key: "KeyE", modifiers: []}
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
        game.keybindings.register("crux", "toggle-skills", {
            name: "Toggle Skills",
            hint: "Toggle the skills list visibility",
            editable: [
                { key: "KeyK", modifiers: []}
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
     * Ensure an item has the tray visibility flag set
     * @param {Item} item - The item to check and update
     * @param {boolean} [noAwait=false] - Whether to await the flag setting
     * @private
     */
    static _ensureItemTrayVisibility(item, noAwait = false) {
        if (!item) return;
        
        try {
            const visibilitySetting = item.getFlag("crux", "trayVisibility");
            if (visibilitySetting === undefined) {
                if (item._processingTrayVisibility) return;
                item._processingTrayVisibility = true;
                const flagPromise = item.setFlag("crux", "trayVisibility", "default");
                if (noAwait) {
                    flagPromise.catch(err => {
                        console.error("Crux | Error setting tray visibility flag:", err);
                    }).finally(() => {
                        delete item._processingTrayVisibility;
                    });
                    return;
                } else {
                    return flagPromise.finally(() => {
                        delete item._processingTrayVisibility;
                    });
                }
            }
        } catch (error) {
            console.error("Crux | Error in _ensureItemTrayVisibility:", error);
            if (item) delete item._processingTrayVisibility;
        }
    }
}
