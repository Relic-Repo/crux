import CruxSettings from "../settings/CruxSettings.js";

/**
 * Shared positioning and theme bridge for Crux flyouts.
 */
export default class CruxAnchoredFlyout {
    static DEFAULT_OFFSET = -3;
    static DEFAULT_MARGIN = 6;

    static getTrayElement() {
        return game.crux?.app?.element ?? document.getElementById("crux");
    }

    static getClickY(event) {
        return Number.isFinite(event?.clientY) ? event.clientY : window.innerHeight / 2;
    }

    static getPosition(app, event, {left, top, width, height, offset = this.DEFAULT_OFFSET, margin = this.DEFAULT_MARGIN} = {}) {
        const tray = this.getTrayElement();
        const trayRect = tray?.getBoundingClientRect();
        const preferredLeft = left ?? ((trayRect?.right ?? 0) + offset);
        let preferredTop = top ?? this.getClickY(event);
        const appHeight = Number.isFinite(height) ? height : app.element?.getBoundingClientRect?.().height;
        if (Number.isFinite(appHeight) && appHeight > 0) {
            preferredTop = Math.min(preferredTop, window.innerHeight - appHeight - margin);
        }
        preferredTop = Math.max(margin, preferredTop);

        const position = {
            left: Math.max(margin, preferredLeft),
            top: preferredTop
        };
        if (width !== undefined) position.width = width;
        if (height !== undefined) position.height = height;
        return position;
    }

    static applyTheme(root) {
        if (!root) return;
        root.classList.add("crux-flyout");
        CruxSettings.applyThemeToExternalRoot(root);
        root.classList.add("crux-flyout--ready");
    }

    static registerCloseOnBlur(app, root, anchorTarget) {
        if (!app || !root) return;
        this.unregisterCloseOnBlur(app);
        const isInside = target => {
            return root.contains(target) || anchorTarget?.contains?.(target);
        };
        const closeIfOutside = event => {
            if (isInside(event.target)) return;
            app.close();
        };
        document.addEventListener("pointerdown", closeIfOutside, true);
        document.addEventListener("focusin", closeIfOutside, true);
        app._cruxFlyoutCloseHandlers = { closeIfOutside };
    }

    static unregisterCloseOnBlur(app) {
        const handlers = app?._cruxFlyoutCloseHandlers;
        if (!handlers) return;
        document.removeEventListener("pointerdown", handlers.closeIfOutside, true);
        document.removeEventListener("focusin", handlers.closeIfOutside, true);
        delete app._cruxFlyoutCloseHandlers;
    }
}
