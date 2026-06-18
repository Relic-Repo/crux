import CruxElevationAppV2 from "../apps/CruxElevationAppV2.js";
import CruxEffectsAppV2 from "../apps/CruxEffectsAppV2.js";
import CruxMovementAppV2 from "../apps/CruxMovementAppV2.js";
import CruxSystemRegistry from "../systems/CruxSystemRegistry.js";
import CruxTrayResolver from "../utils/CruxTrayResolver.js";

export default class CruxFlyoutController {
    constructor(app) {
        this.app = app;
    }

    get root() {
        return this.app.element;
    }

    openEffects(event, target) {
        const { actor, token } = this._resolveActorToken(target);
        if (!actor || !token) return;

        if (CruxEffectsAppV2.activeInstance?.rendered &&
            CruxEffectsAppV2.activeInstance.actor.id === actor.id) {
            CruxEffectsAppV2.activeInstance.close();
            return;
        }

        const app = new CruxEffectsAppV2(actor, token, event);
        app.render(true);
    }

    openMovement(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const { actor, token } = this._resolveActorToken(target);
        if (!actor) return;
        if (!token?.document) {
            ui.notifications.warn("No token available for movement selection");
            return;
        }

        if (this._isSameActorTokenFlyout(CruxMovementAppV2.activeInstance, actor, token)) {
            CruxMovementAppV2.activeInstance.close();
            return;
        }

        const movementDisplay = CruxSystemRegistry.getAdapter()?.getMovementDisplay?.(actor, token) ?? {};
        const app = new CruxMovementAppV2(actor, token, event, { movementDisplay });
        app.render(true);
    }

    openElevation(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const { actor, token } = this._resolveActorToken(target);
        if (!actor) return;
        if (!token?.document) {
            ui.notifications.warn("No token available for elevation selection");
            return;
        }

        if (this._isSameActorTokenFlyout(CruxElevationAppV2.activeInstance, actor, token)) {
            CruxElevationAppV2.activeInstance.close();
            return;
        }

        const app = new CruxElevationAppV2(actor, token, event);
        app.render(true);
    }

    _resolveActorToken(target) {
        const actor = CruxTrayResolver.actor(this.root, target);
        return {
            actor,
            token: CruxTrayResolver.primaryTokenForActor(actor)
        };
    }

    _isSameActorTokenFlyout(instance, actor, token) {
        return instance?.rendered &&
            instance.actor?.id === actor.id &&
            instance.token?.document?.id === token.document.id;
    }
}
