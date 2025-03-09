export default class CruxCompatibility {
    /**
     * Check if DnD5e system version is 4.0 or higher
     * @returns {boolean} True if system version is 4.0+
     */
    static isDnDv4() {
        const system = game.system;
        if (system.id !== "dnd5e") return false;
        const [major] = system.version.split('.').map(n => parseInt(n));
        return major >= 4;
    }

    /**
     * Get item description handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {string} The item description
     */
    static getDescription(item) {
        if (!item?.system) return "";
        if (this.isDnDv4()) {
            return item.system.description?.value || "";
        }
        const desc = item.system.description;
        return (desc?.value !== undefined) ? desc.value : desc || "";
    }

    /**
     * Get activities for an item with hook for modification
     * @param {Item} item - The item to check
     * @param {boolean} [applyHook=true] - Whether to apply the cruxFilterActivities hook
     * @returns {Map|Object} The activities collection
     */
    static getActivities(item, applyHook = true) {
        if (!this.isDnDv4() || !item?.system?.activities) return null;
        if (!applyHook) return item.system.activities;
        let activities;
        
        try {
            if (item.system.activities instanceof Map) {
                activities = new Map(item.system.activities);
            } else if (item.system.activities.contents) {
                activities = { ...item.system.activities };
                activities.contents = { ...item.system.activities.contents };
            } else {
                activities = { ...item.system.activities };
            }

            Hooks.callAll("cruxFilterActivities", activities, item);
            
            return activities;
        } catch (e) {
            console.warn("Crux | Failed to copy activities:", e);
            return item.system.activities;
        }
    }

    /**
     * Check if an item has activities in DnD v4
     * @param {Item} item - The item to check
     * @param {boolean} [applyHook=false] - Whether to apply the cruxFilterActivities hook
     * @returns {boolean} True if the item has activities
     */
    static hasActivities(item, applyHook = false) {
        if (!this.isDnDv4() || !item?.system?.activities) return false;
        const activities = applyHook ? this.getActivities(item, true) : item.system.activities;
        if (!activities) return false;
        if (activities.contents && Object.keys(activities.contents).length > 0) {
            return true;
        }
        
        if (typeof activities.size === 'number' && activities.size > 0) {
            return true;
        }
        
        try {
            return Array.from(activities.entries()).length > 0;
        } catch (e) {
            console.warn("Crux | Failed to check activities using entries method:", e);
            return false;
        }
    }

    /**
     * Get item activation type handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {string|null} The activation type
     */
    static getActivationType(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            if (!item.system.activities) return null;
            const activities = item.system.activities;
            if (!activities) return null;
            if (activities.contents && Object.keys(activities.contents).length > 0) {
                const firstKey = Object.keys(activities.contents)[0];
                return activities.contents[firstKey]?.activation?.type || null;
            }
            
            try {
                const entries = Array.from(activities.entries());
                if (entries.length === 0) return null;
                return entries[0]?.[1]?.activation?.type || null;
            } catch (e) {
                console.warn("Crux | Failed to get activation type using entries method:", e);
                return null;
            }
        }
        return item.system.actionType || null;
    }

    /**
     * Get item duration data handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {Object|null} The duration data
     */
    static getDuration(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            return item.system.duration || null;
        }
        return {
            value: item.system.duration?.value || null,
            units: item.system.duration?.units || null
        };
    }

    /**
     * Get item target data handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {Object|null} The target data
     */
    static getTarget(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            return item.system.target || null;
        }
        return {
            value: item.system.target?.value || null,
            units: item.system.target?.units || null,
            type: item.system.target?.type || null
        };
    }

    /**
     * Get item components handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {Set<string>} The components
     */
    static getComponents(item) {
        if (!item?.system) return new Set();
        if (this.isDnDv4()) {
            return item.system.properties || new Set();
        }
        const components = new Set();
        const oldComponents = item.system.components || {};
        if (oldComponents.vocal) components.add("vocal");
        if (oldComponents.somatic) components.add("somatic");
        if (oldComponents.material) components.add("material");
        return components;
    }

    /**
     * Check if item has recharge recovery handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {boolean} True if item has recharge recovery
     */
    static hasRechargeRecovery(item) {
        if (!item?.system) return false;
        if (this.isDnDv4()) {
            return item.system.uses?.recovery?.period === 'recharge';
        }
        return item.system.recharge?.value > 0;
    }

    /**
     * Check if item has remaining uses handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {boolean} True if item has remaining uses
     */
    static hasRemainingUses(item) {
        if (!item?.system) return false;
        if (this.isDnDv4()) {
            return item.system.uses?.value > 0;
        }
        return item.system.recharge?.charged;
    }

    /**
     * Get item recharge formula handling both pre-v4 and v4+ property paths
     * @param {Item} item - The item to check
     * @returns {string|number|null} The recharge formula
     */
    static getRechargeFormula(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            return item.system.uses?.recovery?.formula;
        }
        return item.system.recharge?.value;
    }

    /**
     * Check if item uses can be modified
     * @param {Item} item - The item to check
     * @returns {boolean} True if item uses can be modified
     */
    static canModifyUses(item) {
        if (!item?.system) return false;
        if (this.isDnDv4()) {
            return item.system.uses?.max > 0;
        }
        return item.system.uses?.max > 0;
    }

    /**
     * Get current and maximum uses for an item
     * @param {Item} item - The item to check
     * @returns {Object|null} Object containing current and max uses
     */
    static getUses(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            const uses = item.system.uses;
            return uses ? { value: uses.value, max: uses.max } : null;
        }
        const uses = item.system.uses;
        return uses ? { value: uses.value, max: uses.max } : null;
    }

    /**
     * Update item uses
     * @param {Item} item - The item to update
     * @param {number} newValue - The new uses value
     * @returns {Promise} Promise that resolves when update is complete
     */
    static async updateUses(item, newValue) {
        if (!this.canModifyUses(item)) return;
        
        const uses = this.getUses(item);
        if (!uses) return;

        const clampedValue = Math.max(0, Math.min(newValue, uses.max));
        await item.update({"system.uses.value": clampedValue});
    }
}
