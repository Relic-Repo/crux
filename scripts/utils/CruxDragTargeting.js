import CruxHooksManager from "../hooks/CruxHooksManager.js";
import CruxDragDropUtils from "./CruxDragDropUtils.js";
import CruxUtils from "./CruxUtilityManager.js";

export default class CruxDragTargeting {
    constructor(app) {
        this.app = app;
        this._dragState = null;
        this._suppressNextClick = false;
        this._ghost = null;
    }

    activate(root) {
        if (!root) return;
        root.querySelectorAll(".crux__item .item-image").forEach(el => {
            if (el.dataset.cruxDragTargetingBound === "true") return;
            el.dataset.cruxDragTargetingBound = "true";
            el.addEventListener("pointerdown", this._onPointerDown);
            el.addEventListener("click", this._onClickCapture, true);
        });
    }

    _onPointerDown = async event => {
        if (event.button !== 0 || event.target.closest("[data-crux-context-menu='true']")) return;
        const itemElement = event.currentTarget.closest(".crux__item");
        const itemUuid = itemElement?.dataset.itemUuid;
        if (!itemUuid) return;
        const item = await CruxHooksManager.fromUuid(itemUuid);
        if (!item) return;

        this._dragState = {
            pointerId: event.pointerId,
            started: false,
            start: { x: event.clientX, y: event.clientY },
            item,
            itemUuid,
            activityId: itemElement.dataset.activityId || null,
            sourceElement: event.currentTarget,
            sourceEvent: event,
            hoveredToken: null
        };

        event.currentTarget.setPointerCapture?.(event.pointerId);
        window.addEventListener("pointermove", this._onPointerMove, true);
        window.addEventListener("pointerup", this._onPointerUp, true);
        window.addEventListener("pointercancel", this._onPointerCancel, true);
    };

    _onPointerMove = event => {
        const state = this._dragState;
        if (!state || event.pointerId !== state.pointerId) return;

        if (!state.started) {
            if (!CruxDragDropUtils.isPastDragThreshold(state.start, event)) return;
            state.started = true;
            this._createGhost(state, event);
            document.body.classList.add("crux-drag-targeting-active");
        }

        event.preventDefault();
        event.stopPropagation();

        this._positionGhost(event);
        state.hoveredToken = CruxDragDropUtils.getCanvasTokenAtClientPoint(event);
    };

    _onPointerUp = async event => {
        const state = this._dragState;
        if (!state || event.pointerId !== state.pointerId) return;
        this._clearWindowListeners();

        if (!state.started) {
            this._dragState = null;
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this._suppressNextClick = true;
        setTimeout(() => { this._suppressNextClick = false; }, 0);

        const releasedOnCanvas = this._isReleasedOnCanvas(event);
        const placesTemplate = CruxDragDropUtils.itemPlacesTemplate(state.item, state.activityId);
        const hoveredToken = releasedOnCanvas
            ? (CruxDragDropUtils.getCanvasTokenAtClientPoint(event) ?? state.hoveredToken)
            : null;
        this._dragState = null;
        this._removeGhost();
        document.body.classList.remove("crux-drag-targeting-active");

        if (!releasedOnCanvas) return;

        const activationEvent = CruxDragDropUtils.createActivationEvent(event, {
            createScrollItem: false,
            target: state.sourceElement,
            currentTarget: state.sourceElement,
            fromCruxDragTargeting: true
        });

        if (placesTemplate) {
            setTimeout(() => CruxUtils.activateItem(state.itemUuid, state.activityId, activationEvent), 0);
            return;
        }

        if (!hoveredToken) return;
        const releaseOthers = game.settings.get("crux", "clear-targets-on-drag-target");
        hoveredToken.setTarget(true, { releaseOthers });
        setTimeout(() => CruxUtils.activateItem(state.itemUuid, state.activityId, activationEvent), 0);
    };

    _onPointerCancel = event => {
        const state = this._dragState;
        if (!state || event.pointerId !== state.pointerId) return;
        this._clearWindowListeners();
        this._dragState = null;
        this._removeGhost();
        document.body.classList.remove("crux-drag-targeting-active");
    };

    _onClickCapture = event => {
        if (!this._suppressNextClick) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this._suppressNextClick = false;
    };

    _clearWindowListeners() {
        window.removeEventListener("pointermove", this._onPointerMove, true);
        window.removeEventListener("pointerup", this._onPointerUp, true);
        window.removeEventListener("pointercancel", this._onPointerCancel, true);
    }

    _createGhost(state, event) {
        this._removeGhost();
        const ghost = document.createElement("div");
        ghost.className = "crux-drag-ghost";
        ghost.style.backgroundImage = state.sourceElement?.style?.backgroundImage ?? "";
        document.body.appendChild(ghost);
        this._ghost = ghost;
        this._positionGhost(event);
    }

    _positionGhost(event) {
        if (!this._ghost) return;
        this._ghost.style.left = `${event.clientX}px`;
        this._ghost.style.top = `${event.clientY}px`;
    }

    _removeGhost() {
        this._ghost?.remove();
        this._ghost = null;
    }

    _isReleasedOnCanvas(event) {
        if (!canvas?.ready || !canvas.canvasCoordinatesFromClient) return false;
        const trayRect = this.app.element?.getBoundingClientRect();
        if (trayRect &&
            event.clientX >= trayRect.left &&
            event.clientX <= trayRect.right &&
            event.clientY >= trayRect.top &&
            event.clientY <= trayRect.bottom) {
            return false;
        }
        const point = canvas.canvasCoordinatesFromClient({ x: event.clientX, y: event.clientY });
        return canvas.dimensions?.rect?.contains(point.x, point.y) ?? false;
    }
}
