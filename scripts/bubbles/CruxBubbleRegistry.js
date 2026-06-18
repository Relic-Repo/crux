export default class CruxBubbleRegistry {
    static #bubbles = new Map();

    static initCoreBubbles() {
        if (this.#bubbles.size) return;
        this.#setBubble({
            id: "dnd5e.action.actor-card",
            type: "actor-card",
            title: "Actor Card",
            panel: "actions",
            system: "dnd5e",
            partial: "crux-dnd5e-action-actor-card-bubble",
            order: 100,
            collapsible: false,
            movable: true,
            core: true
        }, { moduleId: "crux" });
        this.#setBubble({
            id: "dnd5e.actor.summary",
            type: "actor-summary",
            title: "Actor Summary",
            panel: "actor",
            system: "dnd5e",
            partial: "crux-dnd5e-actor-summary-bubble",
            order: 100,
            collapsible: false,
            movable: true,
            core: true
        }, { moduleId: "crux" });
        this.#setBubble({
            id: "dnd5e.action.basic-actions",
            type: "basic-actions",
            title: "Basic Actions",
            panel: "actions",
            system: "dnd5e",
            partial: "crux-dnd5e-basic-action-controls-bubble",
            order: 200,
            collapsible: false,
            movable: true,
            core: true
        }, { moduleId: "crux" });
        this.#setBubble({
            id: "core.action.token-utility",
            type: "token-utility",
            title: "Token Utility",
            panel: "actions",
            system: "core",
            partial: "crux-token-utility-controls-bubble",
            order: 300,
            collapsible: false,
            movable: true,
            core: true
        }, { moduleId: "crux" });
    }

    static registerBubble(definition, { moduleId = "crux", replace = false, allowCore = false } = {}) {
        this.initCoreBubbles();
        this.#validateBubble(definition);
        const existing = this.#bubbles.get(definition.id);
        if (existing?.core && !allowCore) {
            throw new Error(`Crux core bubble "${definition.id}" cannot be replaced.`);
        }
        if (existing && !replace) {
            throw new Error(`Crux bubble "${definition.id}" is already registered.`);
        }
        this.#setBubble(definition, { moduleId });
        return this.getBubble(definition.id);
    }

    static unregisterBubble(id, { force = false } = {}) {
        this.initCoreBubbles();
        const bubble = this.#bubbles.get(id);
        if (!bubble) return false;
        if (bubble.core && !force) throw new Error(`Crux core bubble "${id}" cannot be unregistered.`);
        return this.#bubbles.delete(id);
    }

    static #setBubble(definition, { moduleId = "crux" } = {}) {
        this.#bubbles.set(definition.id, {
            order: 1000,
            collapsible: false,
            movable: false,
            visible: () => true,
            moduleId,
            core: false,
            ...definition
        });
    }

    static getBubble(id) {
        this.initCoreBubbles();
        return this.#cloneBubble(this.#bubbles.get(id)) ?? null;
    }

    static getBubbles(context = {}) {
        this.initCoreBubbles();
        return Array.from(this.#bubbles.values())
            .filter(bubble => bubble.visible?.(context) !== false)
            .filter(bubble => !context.panel || bubble.panel === context.panel)
            .filter(bubble => !context.system || bubble.system === context.system)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map(bubble => this.#cloneBubble(bubble));
    }

    static #validateBubble(definition) {
        if (!definition || typeof definition !== "object") throw new Error("Crux bubble definition must be an object.");
        if (!definition.id || typeof definition.id !== "string") throw new Error("Crux bubble definitions require a string id.");
        if (!definition.type || typeof definition.type !== "string") throw new Error(`Crux bubble "${definition.id}" requires a string type.`);
        if (!definition.title || typeof definition.title !== "string") throw new Error(`Crux bubble "${definition.id}" requires a string title.`);
        if (definition.partial !== null && definition.partial !== undefined && typeof definition.partial !== "string") {
            throw new Error(`Crux bubble "${definition.id}" partial must be a string when provided.`);
        }
        if (definition.visible !== undefined && typeof definition.visible !== "function") {
            throw new Error(`Crux bubble "${definition.id}" visible must be a function when provided.`);
        }
        if (definition.prepareContext !== undefined && typeof definition.prepareContext !== "function") {
            throw new Error(`Crux bubble "${definition.id}" prepareContext must be a function when provided.`);
        }
    }

    static #cloneBubble(bubble) {
        return bubble ? { ...bubble } : null;
    }
}
