/**
 * Checks if the DnD5e system version is 4.0 or higher
 * @returns {boolean} True if system version is 4.0+, false otherwise
 */
export function DnDv4() {
    const system = game.system;
    if (system.id !== "dnd5e") return false;
    const version = system.version;
    const [major] = version.split('.').map(n => parseInt(n));
    return major >= 4;
}

/**
 * Gets the description of an item, handling both pre-v4 and v4+ property paths
 * @param {Item} item - The item to check
 * @returns {string} The item description
 */
export function getDescription(item) {
    if (!item?.system) return "";
    if (DnDv4()) {
        return item.system.description?.value || "";
    }
    const desc = item.system.description;
    return (desc?.value !== undefined) ? desc.value : desc || "";
}

/**
 * Gets the activation type of an item, handling both pre-v4 and v4+ property paths
 * @param {Item} item - The item to check
 * @returns {string|null} The activation type or null if not found
 */
export function getActivationType(item) {
    if (!item?.system) return null;
    if (DnDv4()) {
        if (!item.system.activities) return null;
        const entries = Array.from(item.system.activities.entries());
        const type = entries[0]?.[1]?.activation?.type || null;
        return type;
    }
    return item.system.actionType || null;
}

/**
 * Gets the duration data of an item
 * @param {Item} item - The item to check
 * @returns {Object|null} The duration data or null if not found
 */
export function getDuration(item) {
    if (!item?.system) return null;
    if (DnDv4()) {
        return item.system.duration || null;
    }
    return {
        value: item.system.duration?.value || null,
        units: item.system.duration?.units || null
    };
}

/**
 * Gets the target data of an item
 * @param {Item} item - The item to check
 * @returns {Object|null} The target data or null if not found
 */
export function getTarget(item) {
    if (!item?.system) return null;
    if (DnDv4()) {
        return item.system.target || null;
    }
    return {
        value: item.system.target?.value || null,
        units: item.system.target?.units || null,
        type: item.system.target?.type || null
    };
}

/**
 * Gets the components of an item
 * @param {Item} item - The item to check
 * @returns {Set<string>} The components as a Set
 */
export function getComponents(item) {
    if (!item?.system) return new Set();
    if (DnDv4()) {
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
 * Checks if an item has recharge recovery
 * @param {Item} item - The item to check
 * @returns {boolean} True if the item has recharge recovery
 */
export function hasRechargeRecovery(item) {
    if (!item?.system) return false;
    if (DnDv4()) {
        return item.system.uses?.recovery?.period === 'recharge';
    }
    return item.system.recharge?.value > 0;
}

/**
 * Checks if an item has remaining uses
 * @param {Item} item - The item to check
 * @returns {boolean} True if the item has remaining uses
 */
export function hasRemainingUses(item) {
    if (!item?.system) return false;
    if (DnDv4()) {
        return item.system.uses?.value > 0;
    }
    return item.system.recharge?.charged;
}

/**
 * Gets the recharge formula for an item
 * @param {Item} item - The item to check
 * @returns {number|null} The recharge formula or null
 */
export function getRechargeFormula(item) {
    if (!item?.system) return null;
    if (DnDv4()) {
        return item.system.uses?.recovery?.formula;
    }
    return item.system.recharge?.value;
}

export function isDragTargetingEnabled() {
    if (!game?.settings?.get("crux", "enable-drag-targeting")) return false;
    if (!game?.modules?.get("midi-qol")?.active) return false;
    
    return game.settings.get("midi-qol", "DragDropTarget") ?? false;
}
