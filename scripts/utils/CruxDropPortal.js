import CruxDragDropUtils from "./CruxDragDropUtils.js";

export default class CruxDropPortal {
    constructor(app) {
        this.app = app;
        this._dragDepth = 0;
        this._root = null;
    }

    activate(root) {
        if (!root) return;
        if (this._root === root) return;
        this._root = root;
        root.addEventListener("dragenter", this._onDragEnter);
        root.addEventListener("dragover", this._onDragOver);
        root.addEventListener("dragleave", this._onDragLeave);
        root.addEventListener("drop", this._onDrop);
    }

    _onDragEnter = event => {
        if (!this._couldBeItemDrop(event)) return;
        this._dragDepth += 1;
        this._setPortalActive(true);
    };

    _onDragOver = event => {
        if (!this._couldBeItemDrop(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        this._setPortalActive(true);
    };

    _onDragLeave = event => {
        if (!this.app.element?.contains(event.relatedTarget)) {
            this._dragDepth = 0;
            this._setPortalActive(false);
            return;
        }
        this._dragDepth = Math.max(0, this._dragDepth - 1);
        if (!this._dragDepth) this._setPortalActive(false);
    };

    _onDrop = async event => {
        const data = CruxDragDropUtils.getDropData(event);
        if (!CruxDragDropUtils.isItemDropData(data)) return;
        event.preventDefault();
        event.stopPropagation();
        this._dragDepth = 0;
        this._setPortalActive(false);

        const actor = this._getTargetActor();
        if (!actor) return;
        if (!actor.isOwner) {
            ui.notifications.warn(game.i18n.format("crux.warning.drop-no-permission", {name: actor.name}));
            return;
        }

        const item = await CruxDragDropUtils.resolveDroppedItem(data);
        if (!item) {
            ui.notifications.warn(game.i18n.localize("crux.warning.drop-item-unresolved"));
            return;
        }

        const itemData = CruxDragDropUtils.toActorItemData(item);
        if (!itemData) return;
        await actor.createEmbeddedDocuments("Item", [itemData]);
        this.app.render();
    };

    _getTargetActor() {
        const actors = game.crux?.state?.getActiveActors?.() ?? [];
        if (actors.length === 1) return actors[0];
        if (actors.length > 1) {
            ui.notifications.warn(game.i18n.localize("crux.warning.drop-select-one-actor"));
            return null;
        }
        ui.notifications.warn(game.i18n.localize("crux.warning.drop-no-active-actor"));
        return null;
    }

    _setPortalActive(active) {
        this.app.element?.classList.toggle("crux-drop-portal-active", active);
    }

    _couldBeItemDrop(event) {
        const types = Array.from(event?.dataTransfer?.types ?? []);
        return types.includes("application/json") || types.includes("text/plain");
    }
}
