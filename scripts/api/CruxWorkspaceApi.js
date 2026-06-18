import CruxBubbleRegistry from "../bubbles/CruxBubbleRegistry.js";
import CruxPanelRegistry from "../panels/CruxPanelRegistry.js";

export default class CruxWorkspaceApi {
    static registerPanel(definition, options = {}) {
        const panel = CruxPanelRegistry.registerPanel(definition, options);
        this.render();
        return panel;
    }

    static unregisterPanel(id, options = {}) {
        const removed = CruxPanelRegistry.unregisterPanel(id, options);
        if (removed) {
            const app = game.crux?.app;
            if (app?.activeTab === id) app.showTab("actions");
            else this.render();
        }
        return removed;
    }

    static registerBubble(definition, options = {}) {
        const bubble = CruxBubbleRegistry.registerBubble(definition, options);
        this.render();
        return bubble;
    }

    static unregisterBubble(id, options = {}) {
        const removed = CruxBubbleRegistry.unregisterBubble(id, options);
        if (removed) this.render();
        return removed;
    }

    static getPanels(context = {}) {
        return CruxPanelRegistry.getPanels(context);
    }

    static getPanel(id) {
        return CruxPanelRegistry.getPanel(id);
    }

    static getTabs(context = {}) {
        return CruxPanelRegistry.getTabs(context);
    }

    static getBubbles(context = {}) {
        return CruxBubbleRegistry.getBubbles(context);
    }

    static getBubble(id) {
        return CruxBubbleRegistry.getBubble(id);
    }

    static showPanel(id) {
        const app = game.crux?.app;
        if (!app) return false;
        app.showTab(id);
        return true;
    }

    static render(force = true) {
        const app = game.crux?.app;
        if (!app) return false;
        app.render(force);
        return true;
    }
}
