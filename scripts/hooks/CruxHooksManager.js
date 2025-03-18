import CruxTrayAppV2 from "../apps/CruxTrayAppV2.js";
import CruxStateManager from "../state/CruxStateManager.js";
import CruxEffectsAppV2 from "../apps/CruxEffectsAppV2.js";
import CruxSettings from "../settings/CruxSettings.js";

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

        const itemHooks = ["updateItem", "deleteItem", "createItem"];
        itemHooks.forEach(hook => {
            Hooks.on(hook, (item) => {
                if (!game.crux?.app) return;
                if (game.crux.state.isActorActive(item.actor)) {
                    game.crux.app.render();
                }
            });
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
        Hooks.once('ready', () => {
            const originalCreateScrollFromSpell = CONFIG.Item.documentClass.createScrollFromSpell;
            CONFIG.Item.documentClass.createScrollFromSpell = function(itemData, options={}) {
                if (game.crux?.cruxDraggedItem === itemData.uuid) {
                    return null;
                }
                return originalCreateScrollFromSpell.call(this, itemData, options);
            };
            
            console.log("Crux | Monkey patched createScrollFromSpell method");
        });
        Hooks.on("dropCanvasData", async (canvas, data) => {
            if (data.type === "Item") {
                const item = await fromUuid(data.uuid);
                if (!item) return;
                if (game.crux?.cruxDraggedItem === item.uuid) {
                }
            }
        });
        Hooks.once('ready', () => {
            if (!game.modules.get("item-piles")?.active) return;
            
            console.log("Crux | Setting up Item Piles compatibility");
            
            Hooks.on(game.itempiles.hooks.ITEM.PRE_DROP_DETERMINED, (source, target, item) => {
                if (game.crux?.cruxDraggedItem && item?.uuid === game.crux.cruxDraggedItem) {
                    return false;
                }
                return true;
            });
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

        game.keybindings.register("crux", "item-drag", {
            name: "Item Drag Key",
            hint: "Hold this key to drag items onto target tokens",
            editable: [
                { key: "KeyX", modifiers: []}
            ],
            restricted: false,
            precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
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
        } else {
            console.warn('Expected', candidate, 'to be actor');
            return null;
        }
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
}
