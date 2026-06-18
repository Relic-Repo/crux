const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

import CruxTrayAppV2 from "./apps/CruxTrayAppV2.js";
import CruxElevationAppV2 from "./apps/CruxElevationAppV2.js";
import CruxEffectsAppV2 from "./apps/CruxEffectsAppV2.js";
import CruxMovementAppV2 from "./apps/CruxMovementAppV2.js";
import CruxStateManager from "./state/CruxStateManager.js";
import CruxHooksManager from "./hooks/CruxHooksManager.js";
import CruxSettings from "./settings/CruxSettings.js";
import CruxCompatibility from "./utils/CruxCompatibility.js";
import CruxDomUtils from "./utils/CruxDomUtils.js";
import CruxUtils from "./utils/CruxUtilityManager.js";
import CruxItemFormInjector from "./utils/CruxItemFormInjector.js";
import CruxDragDropUtils from "./utils/CruxDragDropUtils.js";
import CruxDragTargeting from "./utils/CruxDragTargeting.js";
import CruxDropPortal from "./utils/CruxDropPortal.js";
import CruxTemplatePartials from "./utils/CruxTemplatePartials.js";
import CruxWorkspaceApi from "./api/CruxWorkspaceApi.js";
import CruxBubbleRegistry from "./bubbles/CruxBubbleRegistry.js";
import CruxPanelRegistry from "./panels/CruxPanelRegistry.js";
import CruxSystemRegistry from "./systems/CruxSystemRegistry.js";

Handlebars.registerHelper({
    getActivationType: (item) => CruxCompatibility.getActivationType(item),
    hasRechargeRecovery: (item) => CruxCompatibility.hasRechargeRecovery(item),
    hasRemainingUses: (item) => CruxCompatibility.hasRemainingUses(item),
    getRechargeFormula: (item) => CruxCompatibility.getRechargeFormula(item),
    getSpellMethod: (item) => CruxCompatibility.getSpellMethod(item),
    getSpellPrepared: (item) => CruxCompatibility.getSpellPrepared(item),
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

Hooks.once('init', () => {
    console.log("Crux | Initializing Crux module");
    CruxSettings.registerSettings();
    CruxHooksManager.init();
    CruxItemFormInjector.init();
    game.crux = {
        CruxTrayAppV2,
        CruxElevationAppV2,
        CruxEffectsAppV2,
        CruxMovementAppV2,
        state: CruxStateManager.getInstance(),
        utils: {
            compatibility: CruxCompatibility,
            dom: CruxDomUtils,
            cruxUtils: CruxUtils,
            itemFormInjector: CruxItemFormInjector,
            dragDrop: CruxDragDropUtils,
            dragTargeting: CruxDragTargeting,
            dropPortal: CruxDropPortal,
            templatePartials: CruxTemplatePartials
        },
        systems: {
            registry: CruxSystemRegistry,
            getAdapter: () => CruxSystemRegistry.getAdapter()
        },
        api: CruxWorkspaceApi,
        panels: {
            registry: CruxPanelRegistry,
            getTabs: context => CruxWorkspaceApi.getTabs(context),
            getPanels: context => CruxWorkspaceApi.getPanels(context),
            getPanel: id => CruxWorkspaceApi.getPanel(id)
        },
        bubbles: {
            registry: CruxBubbleRegistry,
            getBubbles: context => CruxWorkspaceApi.getBubbles(context),
            getBubble: id => CruxWorkspaceApi.getBubble(id)
        }
    };
    CruxTemplatePartials.load().catch(error => console.error("Crux | Failed to load template partials", error));
});

export {
    CruxTrayAppV2,
    CruxElevationAppV2,
    CruxEffectsAppV2,
    CruxMovementAppV2,
    CruxStateManager,
    CruxHooksManager,
    CruxSettings,
    CruxCompatibility,
    CruxDomUtils,
    CruxUtils,
    CruxItemFormInjector,
    CruxDragDropUtils,
    CruxDragTargeting,
    CruxDropPortal,
    CruxTemplatePartials,
    CruxWorkspaceApi,
    CruxBubbleRegistry,
    CruxPanelRegistry,
    CruxSystemRegistry
};
