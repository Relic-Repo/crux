import CruxDnd5eAccess from "../runtime/dnd5e/CruxDnd5eAccess.js";

export default class CruxDragDropUtils {
    static POINTER_DRAG_THRESHOLD = 6;

    static isPastDragThreshold(start, event, threshold = this.POINTER_DRAG_THRESHOLD) {
        if (!start || !event) return false;
        const dx = (event.clientX ?? 0) - start.x;
        const dy = (event.clientY ?? 0) - start.y;
        return Math.hypot(dx, dy) >= threshold;
    }

    static createActivationEvent(sourceEvent, options = {}) {
        const target = options.target ?? sourceEvent?.target ?? null;
        const currentTarget = options.currentTarget ?? sourceEvent?.currentTarget ?? target;
        const event = {
            fromCrux: true,
            shiftKey: !!sourceEvent?.shiftKey,
            altKey: !!sourceEvent?.altKey,
            ctrlKey: !!sourceEvent?.ctrlKey,
            metaKey: !!sourceEvent?.metaKey,
            clientX: sourceEvent?.clientX,
            clientY: sourceEvent?.clientY,
            target,
            currentTarget,
            composedPath: () => {
                if (typeof sourceEvent?.composedPath === "function") return sourceEvent.composedPath();
                return [target, currentTarget].filter(Boolean);
            },
            preventDefault: () => {},
            stopPropagation: () => {}
        };
        return Object.assign(event, options);
    }

    static getActivity(item, activityId) {
        return CruxDnd5eAccess.getActivity(item, activityId);
    }

    static itemPlacesTemplate(item, activityId = null) {
        const activity = this.getActivity(item, activityId);
        return !!(
            item?.hasAreaTarget ||
            item?.system?.target?.type === "template" ||
            item?.system?.target?.template?.type ||
            activity?.target?.type === "template" ||
            activity?.target?.template?.type
        );
    }

    static getCanvasTokenAtClientPoint(event) {
        if (!canvas?.ready || !canvas.tokens?.placeables?.length || !canvas.canvasCoordinatesFromClient) return null;
        const point = canvas.canvasCoordinatesFromClient({ x: event.clientX, y: event.clientY });
        const candidates = canvas.tokens.placeables
            .filter(token => token.visible !== false && token.renderable !== false)
            .filter(token => token.hitArea?.contains(point.x - token.x, point.y - token.y))
            .sort((a, b) => (b._lastSortedIndex ?? 0) - (a._lastSortedIndex ?? 0));
        return candidates[0] ?? null;
    }

    static getDropData(event) {
        const transfer = event?.dataTransfer;
        if (!transfer) return null;
        const raw = transfer.getData("application/json") || transfer.getData("text/plain");
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    static isItemDropData(data) {
        return data?.type === "Item" || data?.documentName === "Item" || !!data?.uuid?.startsWith?.("Item.");
    }

    static async resolveDroppedItem(data) {
        if (!this.isItemDropData(data)) return null;
        return Item.implementation.fromDropData(data);
    }

    static toActorItemData(item) {
        if (!item) return null;
        const data = item.toObject();
        delete data._id;
        delete data.folder;
        delete data.sort;
        delete data.ownership;
        return data;
    }
}
