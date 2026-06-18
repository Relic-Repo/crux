const TEMPLATE_ROOT = "modules/crux/templates";

const CRUX_PARTIALS = {
    "crux-empty-tray": `${TEMPLATE_ROOT}/partials/core/crux-empty-tray.hbs`,
    "crux-tab-rail": `${TEMPLATE_ROOT}/partials/core/crux-tab-rail.hbs`,
    "crux-bubble-shell": `${TEMPLATE_ROOT}/partials/core/crux-bubble-shell.hbs`,

    "crux-token-controls": `${TEMPLATE_ROOT}/partials/controls/crux-token-controls.hbs`,
    "crux-utility-controls": `${TEMPLATE_ROOT}/partials/controls/crux-utility-controls.hbs`,
    "crux-token-utility-controls-bubble": `${TEMPLATE_ROOT}/partials/controls/crux-token-utility-controls-bubble.hbs`,
    "crux-combat-controls": `${TEMPLATE_ROOT}/partials/controls/crux-combat-controls.hbs`,

    "crux-dnd5e-action-panel": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-action-panel.hbs`,
    "crux-dnd5e-action-actor": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-action-actor.hbs`,
    "crux-dnd5e-action-actor-card-bubble": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-action-actor-card-bubble.hbs`,
    "crux-dnd5e-action-actor-card": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-action-actor-card.hbs`,
    "crux-dnd5e-action-portrait-card": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-action-portrait-card.hbs`,
    "crux-dnd5e-ability-stack": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-ability-stack.hbs`,
    "crux-dnd5e-bonus-column": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-bonus-column.hbs`,
    "crux-dnd5e-basic-action-controls": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-basic-action-controls.hbs`,
    "crux-dnd5e-basic-action-controls-bubble": `${TEMPLATE_ROOT}/partials/dnd5e/action/crux-dnd5e-basic-action-controls-bubble.hbs`,

    "crux-dnd5e-action-item-sections": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-action-item-sections.hbs`,
    "crux-dnd5e-action-section-favorites": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-action-section-favorites.hbs`,
    "crux-dnd5e-action-section-equipped": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-action-section-equipped.hbs`,
    "crux-dnd5e-action-section-features": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-action-section-features.hbs`,
    "crux-dnd5e-action-section-spells": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-action-section-spells.hbs`,
    "crux-dnd5e-action-section-inventory": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-action-section-inventory.hbs`,
    "crux-dnd5e-action-section-passive": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-action-section-passive.hbs`,
    "crux-dnd5e-section-shell": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-section-shell.hbs`,
    "crux-dnd5e-item-group": `${TEMPLATE_ROOT}/partials/dnd5e/sections/crux-dnd5e-item-group.hbs`,

    "crux-dnd5e-item-list": `${TEMPLATE_ROOT}/partials/dnd5e/items/crux-dnd5e-item-list.hbs`,
    "crux-dnd5e-item-row": `${TEMPLATE_ROOT}/partials/dnd5e/items/crux-dnd5e-item-row.hbs`,
    "crux-dnd5e-item-flags": `${TEMPLATE_ROOT}/partials/dnd5e/items/crux-dnd5e-item-flags.hbs`,
    "crux-dnd5e-item-quantity-spinner": `${TEMPLATE_ROOT}/partials/dnd5e/items/crux-dnd5e-item-quantity-spinner.hbs`,
    "crux-dnd5e-item-uses-spinner": `${TEMPLATE_ROOT}/partials/dnd5e/items/crux-dnd5e-item-uses-spinner.hbs`,

    "crux-dnd5e-skill-section": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-skill-section.hbs`,
    "crux-dnd5e-actor-panel": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-panel.hbs`,
    "crux-dnd5e-actor-summary-bubble": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-summary-bubble.hbs`,
    "crux-dnd5e-actor-summary": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-summary.hbs`,
    "crux-dnd5e-actor-hero": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-hero.hbs`,
    "crux-dnd5e-actor-stat-row": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-stat-row.hbs`,
    "crux-dnd5e-actor-vitals": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-vitals.hbs`,
    "crux-dnd5e-actor-saves": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-saves.hbs`,
    "crux-dnd5e-actor-identity-cards": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-identity-cards.hbs`,
    "crux-dnd5e-actor-identity-card": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-identity-card.hbs`,
    "crux-dnd5e-actor-traits": `${TEMPLATE_ROOT}/partials/dnd5e/actor/crux-dnd5e-actor-traits.hbs`
};

export default class CruxTemplatePartials {
    static #loaded = false;

    static async load() {
        if (this.#loaded) return;
        await foundry.applications.handlebars.loadTemplates(CRUX_PARTIALS);
        this.#loaded = true;
    }
}
