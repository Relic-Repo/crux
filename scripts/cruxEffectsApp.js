class CruxEffectsApp extends Application {
    static activeInstance = null;

    constructor(actor, token, anchor) {
        super();
        this.actor = actor;
        this.token = token;
        this.anchor = anchor;
        CruxEffectsApp.activeInstance = this;
    }

    static updateInstance(actor, token) {
        if (CruxEffectsApp.activeInstance && CruxEffectsApp.activeInstance.rendered) {
            CruxEffectsApp.activeInstance.actor = actor;
            CruxEffectsApp.activeInstance.token = token;
            CruxEffectsApp.activeInstance.render();
        }
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "crux-effects",
            template: "modules/crux/templates/effects-window.hbs",
            popOut: true,
            minimizable: false,
            resizable: false,
            width: 300,
            height: "auto"
        });
    }

    getData(options={}) {
        // Get all available status effects
        const choices = {};
        for (const status of CONFIG.statusEffects) {
            if ((status.hud === false) || ((foundry.utils.getType(status.hud) === "Object")
                && (status.hud.actorTypes?.includes(this.actor.type) === false))) {
                continue;
            }
            // Skip effects without images
            if (!status.img && !status.icon) continue;
            choices[status.id] = {
                _id: status._id,
                id: status.id,
                title: game.i18n.localize(status.name ?? status.label),
                src: status.img ?? status.icon,
                isActive: false,
                isOverlay: false
            };
        }

        // Update the status of effects which are active for the token actor
        const activeEffects = this.actor?.effects || [];
        for (const effect of activeEffects) {
            for (const statusId of effect.statuses) {
                const status = choices[statusId];
                if (!status) continue;
                if (status._id) {
                    if (status._id !== effect.id) continue;
                } else {
                    if (effect.statuses.size !== 1) continue;
                }
                status.isActive = true;
                if (effect.getFlag("core", "overlay")) status.isOverlay = true;
                break;
            }
        }

        // Flag status CSS class
        for (const status of Object.values(choices)) {
            status.cssClass = [
                status.isActive ? "active" : null,
                status.isOverlay ? "overlay" : null
            ].filterJoin(" ");
        }

        return {
            effects: Object.values(choices)
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Handle effect toggling
        html.find('.effect-control').click(this._onToggleEffect.bind(this));
        html.find('.effect-control').contextmenu(event => this._onToggleEffect(event, {overlay: true}));
    }

    async _onToggleEffect(event, {overlay=false}={}) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.actor) return ui.notifications.warn("No actor available");
        const statusId = event.currentTarget.dataset.statusId;
        await this.actor.toggleStatusEffect(statusId, {overlay});
        this.render();
    }

    setPosition({left, top} = {}) {
        const position = this.anchor.getBoundingClientRect();
        return super.setPosition({
            left: left ?? position.right + 5,
            top: top ?? position.top
        });
    }
}

export default CruxEffectsApp;
