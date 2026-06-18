import CruxDnd5eSystemAdapter from "./dnd5e/CruxDnd5eSystemAdapter.js";

export default class CruxSystemRegistry {
    static #adapter = null;

    static getAdapter() {
        const systemId = game.system?.id ?? "";
        if (this.#adapter?.systemId === systemId) return this.#adapter;

        switch (systemId) {
            case "dnd5e":
                this.#adapter = new CruxDnd5eSystemAdapter();
                break;
            default:
                this.#adapter = null;
                console.warn(`Crux | No system adapter registered for "${systemId}".`);
                break;
        }

        return this.#adapter;
    }
}
