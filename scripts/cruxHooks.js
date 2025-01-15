import { updateTray } from "./cruxTrayUI.js";
import { updateTrayState, getActiveActors } from "./cruxTrayState.js";

/**
 * Retrieves an entity from its UUID synchronously
 * @param {string} uuid - The UUID of the entity to retrieve
 * @returns {object|null} The entity if found, null otherwise
 */
export function fromUuid(uuid) {
    if (!uuid) return null;
    return fromUuidSync(uuid);
}

/**
 * Converts an item or actor into an actor
 * @param {object} item - The item or actor to convert
 * @returns {Actor|null} The actor if conversion successful, null otherwise
 */
export function fudgeToActor(item) {
    if (!item) return null;
    if (item instanceof Actor) return item;
    return item.actor;
}

/**
 * Updates the combat status of the tray UI
 * Handles visual states for combat and turn indicators
 */
export function updateCombatStatus() {
    const combat = game.combat;
    const container = $('#crux');

    if (!container.length) {
        ui.notifications.error("Tray container not found");
        return;
    }

    if (!combat) {
        container.removeClass("in-combat");
        container.removeClass("my-turn");
        return;
    }

    container.addClass("in-combat");

    const currentActor = currentlyActiveActor();
    const activeActors = getActiveActors();

    if (currentActor && activeActors.includes(currentActor)) {
        container.addClass("my-turn");
    } else {
        container.removeClass("my-turn");
    }
}

/**
 * Gets the currently active actor in combat
 * @returns {Actor|null} The active actor if in combat, null otherwise
 */
export function currentlyActiveActor() {
    const combat = game.combat;
    if (!combat) return null;

    const combatant = combat.combatants.get(combat.current.combatantId);
    if (!combatant) return null;

    return combatant.actor;
}

// Initialize the tray when Foundry is ready
Hooks.on("ready", () => {
    // Create the tray container if it doesn't exist
    if (!$('#crux').length) {
        const trayHtml = `
            <div id="crux">
                <div class="crux__container">
                    <div class="crux__empty-tray">
                        <i class="fas fa-dice-d20"></i>
                    </div>
                </div>
                <div class="crux__end-turn">
                    <i class="fas fa-hourglass-end"></i> ${game.i18n.localize("COMBAT.EndTurn")}
                </div>
            </div>
        `;
        $('#interface').prepend(trayHtml);

        // Add initial classes based on settings
        const container = $('#crux');
        const iconSize = game.settings.get("crux", "icon-size");
        const traySize = game.settings.get("crux", "tray-size");
        
        if (iconSize) container.find('.crux__container').addClass(`icon-${iconSize}`);
        if (traySize) container.addClass(`tray-${traySize}`);
    }

    // Initial tray state update
    updateTrayState();
});

// Add initialization hook to ensure proper setup
Hooks.once('init', () => {
    console.log("Crux | Initializing Crux hooks");
});

import CruxEffectsApp from "./cruxEffectsApp.js";

// Update on token selection
Hooks.on("controlToken", (token, isControlled) => {
    updateTrayState();
    
    // Update effects window if token is controlled
    if (isControlled && token.actor) {
        CruxEffectsApp.updateInstance(token.actor, token);
    }
});

// Update when actor changes
Hooks.on("updateActor", (actor) => {
    if (getActiveActors().includes(actor)) {
        updateTray();
    }
});

/**
 * Checks if an item update should trigger a tray update
 * @param {Item} item - The item being updated
 */
function checkItemUpdate(item) {
    if (getActiveActors().includes(item.actor)) {
        updateTray();
    }
}

// Item update hooks
Hooks.on("updateItem", (item) => {
    checkItemUpdate(item);
});

Hooks.on("deleteItem", (item) => {
    checkItemUpdate(item);
});

Hooks.on("createItem", (item) => {
    checkItemUpdate(item);
});

// Combat hooks
Hooks.on("updateCombat", () => {
    updateCombatStatus();
});

Hooks.on("createCombatant", (combatant) => {
    if (getActiveActors().includes(combatant.actor)) {
        updateTray();
    }
});

Hooks.on("updateCombatant", (combatant) => {
    if (getActiveActors().includes(combatant.actor)) {
        updateTray();
    }
});

Hooks.on("deleteCombat", () => {
    if (!game.combat) {
        updateCombatStatus();
    }
});
