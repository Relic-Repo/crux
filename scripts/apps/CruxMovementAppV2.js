const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import CruxAnchoredFlyout from "../utils/CruxAnchoredFlyout.js";

/**
 * Application for selecting the token movement action used by Foundry movement and regions.
 */
export default class CruxMovementAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    static activeInstance = null;

    constructor(actor, token, event, {movementDisplay} = {}) {
        super();
        this.actor = actor;
        this.token = token;
        this.anchorEvent = event;
        this.anchorTarget = event?.currentTarget;
        this.movementDisplay = movementDisplay;
        CruxMovementAppV2.activeInstance = this;
    }

    static updateInstance(actor, token) {
        if (!CruxMovementAppV2.activeInstance?.rendered) return;
        CruxMovementAppV2.activeInstance.actor = actor;
        CruxMovementAppV2.activeInstance.token = token;
        CruxMovementAppV2.activeInstance.render();
    }

    static DEFAULT_OPTIONS = {
        id: "crux-movement",
        classes: ["crux-movement", "crux-flyout"],
        popOut: false,
        minimizable: false,
        resizable: false,
        headerButtons: [],
        position: {
            width: 200,
            height: "auto"
        },
        form: {
            closeOnSubmit: false
        },
        window: {
            title: "Movement Type"
        }
    };

    static PARTS = {
        movement: {
            template: "modules/crux/templates/movement-window.hbs"
        }
    };

    async _prepareContext(options) {
        const currentAction = this.token?.document?._source?.movementAction ?? null;
        const effectiveAction = this.token?.document?.movementAction ?? CONFIG.Token.movement.defaultAction;
        const choices = [
            {
                id: "",
                action: null,
                label: "Speed",
                title: game.i18n.localize("HUD.SelectMovementAction") || "Default Movement",
                amount: this._formatAmount(this._getMovementAmount(null)),
                icon: "fa-solid fa-angles-right",
                img: null,
                active: currentAction === null,
                isDefault: true
            }
        ];

        for (const [action, config] of Object.entries(CONFIG.Token.movement.actions ?? {})) {
            if (!config.canSelect(this.token?.document) && (action !== currentAction)) continue;
            if (action === "displace") continue;
            choices.push({
                id: action,
                action,
                label: this._getMovementLabel(action),
                title: game.i18n.localize(config.label),
                amount: this._formatAmount(this._getMovementAmount(action)),
                icon: config.icon,
                img: config.img,
                active: currentAction === action
            });
        }

        choices.sort((a, b) => {
            if (a.isDefault) return -1;
            if (b.isDefault) return 1;
            const aOrder = CONFIG.Token.movement.actions[a.action]?.order ?? 0;
            const bOrder = CONFIG.Token.movement.actions[b.action]?.order ?? 0;
            return aOrder - bOrder;
        });

        return { choices };
    }

    _getMovementLabel(action) {
        return {
            walk: "Walk",
            burrow: "Burrow",
            fly: "Fly",
            swim: "Swim",
            climb: "Climb",
            crawl: "Crawl",
            jump: "Jump",
            blink: "Blink"
        }[action] ?? String(action ?? "SPD").toUpperCase();
    }

    _getMovementAmount(action) {
        const movement = this.actor?.system?.attributes?.movement ?? {};
        const walk = Number(movement.walk ?? movement.speed ?? 0) || 0;
        const halfWalk = walk ? Math.floor(walk / 2) : undefined;
        switch (action) {
            case null:
            case undefined:
            case "":
                return movement.speed ?? movement.walk;
            case "walk":
                return movement.walk;
            case "burrow":
                return movement.burrow;
            case "fly":
                return movement.fly;
            case "swim":
                return movement.swim || halfWalk;
            case "climb":
                return movement.climb || halfWalk;
            case "crawl":
                return halfWalk;
            case "jump":
                return movement.jump;
            case "blink":
                return Infinity;
            default:
                return movement[action];
        }
    }

    _formatAmount(value) {
        if (value === Infinity) return "\u221E";
        if (!Number.isFinite(Number(value))) return "--";
        return String(Number(value));
    }

    async _onSelectMovement(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!this.token?.document) return;
        const action = event.currentTarget.dataset.movementAction || null;
        await this.token.document.update({ movementAction: action });
        game.crux?.app?.render();
        await this.close();
    }

    _onMovementKeydown(event) {
        if (!["Enter", " "].includes(event.key)) return;
        this._onSelectMovement(event);
    }

    async close(options = {}) {
        if (options?.closeKey) return false;
        CruxAnchoredFlyout.unregisterCloseOnBlur(this);
        this.anchorTarget?.blur?.();
        return super.close(options);
    }

    setPosition(options = {}) {
        return super.setPosition(CruxAnchoredFlyout.getPosition(this, this.anchorEvent, options));
    }

    _onRender(context, options) {
        super._onRender(context, options);
        CruxAnchoredFlyout.applyTheme(this.element);
        this.setPosition();
        this.anchorTarget?.blur?.();
        CruxAnchoredFlyout.registerCloseOnBlur(this, this.element, this.anchorTarget);
        this.element.querySelectorAll("[data-action='selectMovement']").forEach(el => {
            el.addEventListener("click", this._onSelectMovement.bind(this));
            el.addEventListener("keydown", this._onMovementKeydown.bind(this));
        });
    }
}
