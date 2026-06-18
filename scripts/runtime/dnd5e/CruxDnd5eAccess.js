import { CRUX_DND5E_PATHS } from "./CruxDnd5ePaths.js";

export default class CruxDnd5eAccess {
    static getFirst(document, paths, fallback = undefined) {
        for (const path of paths) {
            const value = foundry.utils.getProperty(document, path);
            if (value !== undefined) return value;
        }
        return fallback;
    }

    static getActorAbilities(actorOrData) {
        return this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.abilities, {});
    }

    static getActorAttributes(actorOrData) {
        return this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.attributes, {});
    }

    static getActorDetails(actorOrData) {
        return this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.details, {});
    }

    static getActorFavorites(actorOrData) {
        return this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.favorites, []);
    }

    static getHp(actorOrData) {
        const value = Number(this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.hp.value, 0)) || 0;
        const max = Number(this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.hp.max, 0)) || 0;
        const temp = Number(this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.hp.temp, 0)) || 0;
        return { value, max, temp };
    }

    static getMovement(actorOrData) {
        return this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.movement, {});
    }

    static getSenses(actorOrData) {
        return this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.senses, {});
    }

    static getSenseValue(actorOrData, key) {
        return this.getSenses(actorOrData)?.[key] ?? 0;
    }

    static getSpells(actorOrData) {
        return this.getFirst(actorOrData, CRUX_DND5E_PATHS.actor.spells, {});
    }

    static getSpellGroup(actorOrData, group) {
        return this.getSpells(actorOrData)?.[group] ?? {};
    }

    static isModernDnd5e() {
        if (game.system.id !== "dnd5e") return false;
        const [major] = game.system.version.split(".").map(n => parseInt(n));
        return major >= 4;
    }

    static spellSlotUpdatePath(group) {
        return `system.spells.${group}.value`;
    }

    static hpUpdatePath(field) {
        return field === "temp"
            ? CRUX_DND5E_PATHS.actor.hp.updateTemp
            : CRUX_DND5E_PATHS.actor.hp.updateValue;
    }

    static getActivities(item, applyHook = true) {
        if (!this.isModernDnd5e()) return null;
        const activities = this.getFirst(item, CRUX_DND5E_PATHS.item.activities, null);
        if (!activities) return null;
        if (!applyHook) return activities;
        let copy;
        try {
            if (activities instanceof Map) copy = new Map(activities);
            else if (activities.contents) copy = { ...activities, contents: { ...activities.contents } };
            else copy = { ...activities };
            Hooks.callAll("cruxFilterActivities", copy, item);
            return copy;
        } catch (error) {
            console.warn("Crux | Failed to copy activities:", error);
            return activities;
        }
    }

    static getActivityEntries(item, { applyHook = false } = {}) {
        const activities = this.getActivities(item, applyHook);
        if (!activities) return [];
        if (activities.contents) {
            return Object.values(activities.contents)
                .filter(activity => activity !== undefined)
                .map(activity => [activity.id || activity.type, activity]);
        }
        try {
            return Array.from(activities.entries());
        } catch {
            return [];
        }
    }

    static hasActivities(item, applyHook = false) {
        return this.getActivityEntries(item, { applyHook }).length > 0;
    }

    static getActivity(item, activityId) {
        if (!activityId) return null;
        const activities = this.getActivities(item, false);
        if (!activities) return null;
        if (activities instanceof Map) return activities.get(activityId) ?? null;
        const contents = activities.contents;
        if (!contents) return null;
        return contents[activityId]
            ?? Object.values(contents).find(activity => activity?.id === activityId || activity?._id === activityId)
            ?? null;
    }

    static getDescription(item) {
        const description = this.getFirst(item, CRUX_DND5E_PATHS.item.description, "");
        return typeof description === "string" ? description : "";
    }

    static getUses(item) {
        const value = this.getFirst(item, CRUX_DND5E_PATHS.item.uses.value, undefined);
        const max = this.getFirst(item, CRUX_DND5E_PATHS.item.uses.max, undefined);
        const spent = this.getFirst(item, CRUX_DND5E_PATHS.item.uses.spent, undefined);
        const recovery = this.getFirst(item, CRUX_DND5E_PATHS.item.uses.recovery, undefined);
        return { value, max, spent, recovery };
    }

    static getQuantity(item) {
        return this.getFirst(item, CRUX_DND5E_PATHS.item.quantity.value, undefined);
    }

    static quantityUpdatePath() {
        return CRUX_DND5E_PATHS.item.quantity.update;
    }

    static usesValueUpdatePath() {
        return CRUX_DND5E_PATHS.item.uses.updateValue;
    }

    static usesSpentUpdatePath() {
        return CRUX_DND5E_PATHS.item.uses.updateSpent;
    }
}
