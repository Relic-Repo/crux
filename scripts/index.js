const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Main entry point for the Crux module
 */
import CruxTrayAppV2 from "./apps/CruxTrayAppV2.js";
import CruxEffectsAppV2 from "./apps/CruxEffectsAppV2.js";
import CruxStateManager from "./state/CruxStateManager.js";
import CruxHooksManager from "./hooks/CruxHooksManager.js";
import CruxSettings from "./settings/CruxSettings.js";
import CruxCompatibility from "./utils/CruxCompatibility.js";
import CruxDomUtils from "./utils/CruxDomUtils.js";

// Initialize Handlebars helpers
Handlebars.registerHelper({
    getActivationType: (item) => CruxCompatibility.getActivationType(item),
    hasRechargeRecovery: (item) => CruxCompatibility.hasRechargeRecovery(item),
    hasRemainingUses: (item) => CruxCompatibility.hasRemainingUses(item),
    getRechargeFormula: (item) => CruxCompatibility.getRechargeFormula(item),
    calculateHealthOverlay: (currentHP, maxHP) => CruxDomUtils.calculateHealthOverlay(currentHP, maxHP),
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

// Initialize module
Hooks.once('init', () => {
    console.log("Crux | Initializing Crux module");
    CruxSettings.registerSettings();
    CruxHooksManager.init();
    game.crux = {
        CruxTrayAppV2,
        CruxEffectsAppV2,
        state: CruxStateManager.getInstance(),
        utils: {
            compatibility: CruxCompatibility,
            dom: CruxDomUtils
        }
    };
});

// Export classes for external use
export {
    CruxTrayAppV2,
    CruxEffectsAppV2,
    CruxStateManager,
    CruxHooksManager,
    CruxSettings,
    CruxCompatibility,
    CruxDomUtils
};
