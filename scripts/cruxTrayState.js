import { updateCombatStatus } from "./cruxHooks.js";
import { isTrayAutoHide, isTrayAlwaysOn } from "./cruxSettings.js";
import { updateTray } from "./cruxTrayUI.js";

/** @type {Object} Stores scroll position and UI state for the tray */
export let scrollPosition = {};

/**
 * Gets the currently active actors based on token selection or user's default character
 * @returns {Actor[]} Array of active actors
 */
export function getActiveActors() {
    const controlled = canvas.tokens.controlled.filter(t => ["character", "npc"].includes(t.actor?.type))
    if (controlled.length) {
        return controlled.map(token => token.actor);
    }
    if (game.user.character && game.settings.get("crux", "assume-default-character")) {
        return [game.user.character];
    }
    return [];
}

/**
 * Updates the tray's visibility state based on current settings and active actors
 */
export function updateTrayState() {
    const container = $('#crux');
    
    if (!container.length) {
        ui.notifications.error("Tray container not found");
        return;
    }

    try {
        const wasOpen = container.hasClass("is-open");
        const wasAlwaysOn = container.hasClass("always-on");
        
        const shouldBeOpen = isTrayAutoHide() ? getActiveActors().length > 0 : wasOpen;
        const shouldBeAlwaysOn = isTrayAlwaysOn();

        if (shouldBeOpen) {
            container.addClass("is-open");
        } else {
            container.removeClass("is-open");
        }

        if (shouldBeAlwaysOn) {
            container.addClass("is-open always-on");
        } else {
            container.removeClass("always-on");
        }

        updateCombatStatus();
        
        updateTray();

    } catch (error) {
        ui.notifications.error("Error updating tray state");
    }
}

/**
 * Updates the scroll position state
 * @param {Object} newState - The new state to merge with existing scroll position
 */
export function updateScrollPosition(newState) {
    scrollPosition = { ...scrollPosition, ...newState };
}

/**
 * Resets the scroll position state
 */
export function resetScrollPosition() {
    scrollPosition = {};
}
