import { updateTrayState } from "./cruxTrayState.js";
import { updateTray } from "./cruxTrayUI.js";

/**
 * Configuration settings for the CRUX module
 */
export const SETTINGS = {
    "show-favorites-section": {
        name: "Show Favorites Section",
        hint: "Display the Favorites section in the tray.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => updateTray()
    },
    "show-equipped-section": {
        name: "Show Equipped Section",
        hint: "Display the Equipped section in the tray.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => updateTray()
    },
    "show-features-section": {
        name: "Show Features Section",
        hint: "Display the Features section in the tray.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => updateTray()
    },
    "show-spells-section": {
        name: "Show Spells Section",
        hint: "Display the Spells section in the tray.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => updateTray()
    },
    "show-inventory-section": {
        name: "Show Inventory Section",
        hint: "Display the Inventory section in the tray.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => updateTray()
    },
    "assume-default-character": {
        name: "Assume Default Character",
        hint: "When no other token is selected, show the tray for the user's default character (usually only set for players). This can help with scenes with no tokens (or a generic party token) visible.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => updateTrayState()
    },
    "show-no-uses": {
        name: "Show Items With No Uses Left",
        hint: "Display items in the tray even when they have no remaining uses.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => updateTray()
    },
    "show-unprepared-cantrips": {
        name: "Show Unprepared Cantrips",
        hint: "Show cantrips in the tray even if they are not prepared.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => updateTray()
    },
    "show-spell-dots": {
        name: "Show Spell Slot Dots",
        hint: "Display dots indicating available spell slots.",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => updateTray()
    },
    "show-spell-fractions": {
        name: "Show Spell Slot Numbers",
        hint: "Display numerical fractions showing available/maximum spell slots.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => updateTray()
    },
    "sort-alphabetic": {
        name: "Sort Items Alphabetically",
        hint: "Sort items in alphabetical order rather than by their default sorting.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => updateTray()
    },
    "use-tidy5e-sections": {
        name: "Use Tidy 5e Sheet Sections",
        hint: "When enabled, recognizes and uses Tidy 5e Sheet sections instead of standard Crux sections.",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => updateTray()
    },
    "skills-expanded": {
        name: "Skills Section Default State",
        hint: "Choose whether the Skills section starts expanded or collapsed by default",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "open": "Open",
            "collapsed": "Collapsed"
        },
        default: "collapsed",
        onChange: () => updateTray()
    },
    "main-sections-expanded": {
        name: "Main Sections Default State",
        hint: "Choose whether the main sections (like Features, Spells, etc.) start expanded or collapsed by default",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "open": "Open",
            "collapsed": "Collapsed"
        },
        default: "open",
        onChange: () => updateTray()
    },
    "sub-sections-expanded": {
        name: "Sub-Sections Default State",
        hint: "Choose whether sub-sections (like spell levels) start expanded or collapsed by default",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "open": "Open",
            "collapsed": "Collapsed"
        },
        default: "collapsed",
        onChange: () => updateTray()
    },
    "skill-mode": {
        name: "Skill List Location",
        hint: "If 'Collapsible at the top' is selected, the skill toggle hot key (in control settings) can be used to toggle the skill list open and closed, opening the panel if needed. If skills are at the bottom of the panel, the hotkey automatically scrolls to reveal them.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "none": "None",
            "dropdown": "Collapsible at the top",
            "append": "At the bottom of the panel"
        },
        default: "dropdown",
        onChange: () => updateTray()
    },
    "icon-size": {
        name: "Icon Size",
        hint: "Set the size of icons in the tray.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "small": "Small",
            "medium": "Medium",
            "large": "Large"
        },
        default: "small",
        onChange: () => updateTray()
    },
    "tray-size": {
        name: "Tray Size",
        hint: "Set the overall size of the tray interface.",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "small": "Small",
            "large": "Large"
        },
        default: "small",
        onChange: () => updateTray()
    },
    "health-overlay-enabled": {
        name: "Enable Health Overlay",
        hint: "Show a dynamic health overlay on character portraits",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: () => updateTray()
    },
    "health-overlay-direction": {
        name: "Health Overlay Direction",
        hint: "Choose whether the health overlay fills up or down",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "up": "Fill Up",
            "down": "Fill Down"
        },
        default: "up",
        onChange: () => updateTray()
    },
    "tray-mode": {
        name: "Tray Display Mode",
        hint: "Toggle - only hide tray when toggled (using hot key) / When token selected - Hide the tray if no tokens are selected, show otherwise / Automatic - Toggle for players, When token selected for the GM",
        scope: "client",
        config: true,
        type: String,
        choices: {
            "auto": "Automatic",
            "always": "Always Show",
            "manual": "Toggle"
        },
        default: "manual",
        onChange: () => updateTrayState()
    },
    "enable-drag-targeting": {
        name: "Enable Drag Targeting",
        hint: "Enable drag targeting functionality (requires Midi-QoL with drag targeting enabled)",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            if (value) {
                if (!game?.modules?.get("midi-qol")?.active) {
                    game.settings.set("crux", "enable-drag-targeting", false);
                    ui.notifications.warn("Cannot enable drag targeting - Midi-QoL module not active");
                    return;
                }
                if (!game.settings.get("midi-qol", "DragDropTarget")) {
                    ui.notifications.warn("Cannot enable drag targeting - Midi-QoL drag targeting is disabled");
                    game.settings.set("crux", "enable-drag-targeting", false);
                    return;
                }
            }
            updateTray();
        }
    },
    "toggle-target-mode": {
        name: "Toggle Target Mode",
        hint: "When enabled, the target button becomes a toggle for drag & target mode",
        scope: "client",
        config: true,
        type: Boolean,
        default: false,
        onChange: () => {
            const isEnabled = game.settings.get("crux", "toggle-target-mode");
            const containers = document.querySelectorAll('.crux__toggle-target');
            containers.forEach(container => {
                container.classList.toggle('toggled-off', isEnabled);
                container.classList.remove('toggled-on');
            });
            updateTray();
        }
    },
    "drag-target-state": {
        name: "Drag Target State",
        hint: "Stores whether drag targeting is enabled",
        scope: "client",
        config: false,
        type: Boolean,
        default: false,
        onChange: () => updateTray()
    },
};

/**
 * Checks if the tray should automatically hide based on settings
 * @returns {boolean} True if auto-hide is enabled
 */
export function isTrayAutoHide() {
    return game.settings.get("crux", "tray-mode") === "auto";
}

/**
 * Checks if the tray should always be visible
 * @returns {boolean} True if always-on mode is enabled
 */
export function isTrayAlwaysOn() {
    return game.settings.get("crux", "tray-mode") === "always";
}

/**
 * Toggles the visibility of the tray UI
 */
function toggleTray() {
    const container = $('#crux');
    if (!container.length) {
        ui.notifications.error("Tray container not found");
        return;
    }

    if (!isTrayAlwaysOn()) {
        container.toggleClass("is-open");
        container.find('.crux__skill-container').removeClass("is-open");
    }
}

/**
 * Toggles the visibility of the skills section
 * Handles both dropdown and append modes according to settings
 */
function toggleSkills() {
    const container = $('#crux');
    if (!container.length) {
        ui.notifications.error("Tray container not found");
        return;
    }

    const skillMode = game.settings.get("crux", "skill-mode");
    const skillContainer = container.find('.crux__skill-container');

    if (skillMode === "dropdown") {
        const wasSkillsOpen = skillContainer.hasClass("is-open");
        const wasTrayOpen = container.hasClass("is-open");
        
        if (wasTrayOpen) {
            skillContainer.toggleClass("is-open");
        } else {
            container.addClass("is-open");
            skillContainer.addClass("is-open");
        }

        if (!wasSkillsOpen) {
            const mainContainer = container.find('.crux__container');
            if (mainContainer.length) {
                mainContainer[0].scrollTop = 0;
            }
        }
    } else if (skillMode === "append") {
        if (!container.hasClass("is-open")) {
            container.addClass("is-open");
        }
        const mainContainer = container.find('.crux__container');
        if (mainContainer.length && skillContainer.length) {
            mainContainer[0].scrollTop = skillContainer.offset().top;
        }
    }
}

Hooks.once('init', () => {
    for (const [key, setting] of Object.entries(SETTINGS)) {
        game.settings.register("crux", key, setting);
    }

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
                if (!game.ready) return;
                toggleTray();
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
                if (!game.ready) return;
                toggleSkills();
                return true;
            } catch (error) {
                ui.notifications.error("Error toggling skills");
                return false;
            }
        }
    });
});

Hooks.once('ready', () => {
    if (game.settings.get("crux", "enable-drag-targeting")) {
        if (!game?.modules?.get("midi-qol")?.active || 
            !game.settings.get("midi-qol", "DragDropTarget")) {
            game.settings.set("crux", "enable-drag-targeting", false);
        }
    }
});
