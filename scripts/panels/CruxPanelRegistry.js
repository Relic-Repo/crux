export default class CruxPanelRegistry {
    static #panels = new Map();

    static initCorePanels() {
        if (this.#panels.size) return;
        this.#setPanel({
            id: "actions",
            label: "Actions",
            order: 100,
            partial: "crux-dnd5e-action-panel",
            core: true
        }, { moduleId: "crux" });
        this.#setPanel({
            id: "actor",
            label: "Actor",
            order: 200,
            partial: "crux-dnd5e-actor-panel",
            core: true
        }, { moduleId: "crux" });
    }

    static registerPanel(definition, { moduleId = "crux", replace = false, allowCore = false } = {}) {
        this.initCorePanels();
        this.#validatePanel(definition);
        const existing = this.#panels.get(definition.id);
        if (existing?.core && !allowCore) {
            throw new Error(`Crux core panel "${definition.id}" cannot be replaced.`);
        }
        if (existing && !replace) {
            throw new Error(`Crux panel "${definition.id}" is already registered.`);
        }
        this.#setPanel(definition, { moduleId });
        return this.getPanel(definition.id);
    }

    static #setPanel(definition, { moduleId = "crux" } = {}) {
        this.#panels.set(definition.id, {
            order: 1000,
            visible: () => true,
            moduleId,
            core: false,
            ...definition
        });
    }

    static unregisterPanel(id, { force = false } = {}) {
        this.initCorePanels();
        const panel = this.#panels.get(id);
        if (!panel) return false;
        if (panel.core && !force) throw new Error(`Crux core panel "${id}" cannot be unregistered.`);
        return this.#panels.delete(id);
    }

    static getPanel(id) {
        this.initCorePanels();
        return this.#clonePanel(this.#panels.get(id)) ?? null;
    }

    static getActivePanel(id) {
        return this.getPanel(id) ?? {
            id,
            label: id,
            order: 9999,
            partial: null,
            core: false
        };
    }

    static getTabs(context = {}) {
        this.initCorePanels();
        return Array.from(this.#panels.values())
            .filter(panel => panel.visible?.(context) !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(panel => ({
                id: panel.id,
                label: panel.label,
                order: panel.order,
                core: panel.core === true
            }));
    }

    static getPanels(context = {}) {
        this.initCorePanels();
        return Array.from(this.#panels.values())
            .filter(panel => panel.visible?.(context) !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(panel => this.#clonePanel(panel));
    }

    static #validatePanel(definition) {
        if (!definition || typeof definition !== "object") throw new Error("Crux panel definition must be an object.");
        if (!definition.id || typeof definition.id !== "string") throw new Error("Crux panel definitions require a string id.");
        if (!definition.label || typeof definition.label !== "string") throw new Error(`Crux panel "${definition.id}" requires a string label.`);
        if (definition.partial !== null && definition.partial !== undefined && typeof definition.partial !== "string") {
            throw new Error(`Crux panel "${definition.id}" partial must be a string when provided.`);
        }
        if (definition.visible !== undefined && typeof definition.visible !== "function") {
            throw new Error(`Crux panel "${definition.id}" visible must be a function when provided.`);
        }
        if (definition.prepareContext !== undefined && typeof definition.prepareContext !== "function") {
            throw new Error(`Crux panel "${definition.id}" prepareContext must be a function when provided.`);
        }
    }

    static #clonePanel(panel) {
        return panel ? { ...panel } : null;
    }
}
