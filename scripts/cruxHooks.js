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
 * Resolves a token, actor, or item into its associated actor
 * @param {object} candidate - The object to resolve into an actor
 * @returns {Actor|null} The resolved actor if successful, null otherwise
 */
export function resolveActor(candidate) {
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
        container.removeClass("is-current-combatant");
        return;
    }

    container.addClass("in-combat");

    const currentActor = currentlyActiveActor();
    const actors = canvas.tokens.controlled.map(t => t.actor);

    if (game.combat && currentActor && actors.some(a => a?.id === currentActor?.id)) {
        container.addClass("is-current-combatant");
    } else {
        container.removeClass("is-current-combatant");
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

    return resolveActor(combatant.token);
}

Hooks.on("ready", () => {
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

        const container = $('#crux');
        const iconSize = game.settings.get("crux", "icon-size");
        const traySize = game.settings.get("crux", "tray-size");
        
        if (iconSize) container.find('.crux__container').addClass(`icon-${iconSize}`);
        if (traySize) container.addClass(`tray-${traySize}`);
    }

    updateTrayState();
});

Hooks.once('init', () => {
    console.log("Crux | Initializing Crux hooks");
});

import CruxEffectsApp from "./cruxEffectsApp.js";

Hooks.on("controlToken", (token, isControlled) => {
    updateTrayState();
    
    if (isControlled && token.actor) {
        CruxEffectsApp.updateInstance(token.actor, token);
    }
});

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

Hooks.on("updateItem", (item) => {
    checkItemUpdate(item);
});

Hooks.on("deleteItem", (item) => {
    checkItemUpdate(item);
});

Hooks.on("createItem", (item) => {
    checkItemUpdate(item);
});

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
