import { DnDv4 } from "./cruxUtils.js";

/**
 * Calculates the number of available uses for a given item based on its type and configuration
 * @param {Item} item - The Foundry VTT Item instance to calculate uses for
 * @returns {Object|null} An object containing available uses and maximum uses, or null if not applicable
 * @property {number} available - The number of uses currently available
 * @property {number|null} maximum - The maximum number of uses possible, if applicable
 */
export const calculateUsesForItem = (item) => {
    const itemData = item.system;
    if (!DnDv4()) {
        const consume = itemData.consume;
        if (consume && consume.target) {
            return calculateConsumeUses(item.actor, consume);
        }
    }
    const uses = itemData.uses;
    if (uses && (uses.max > 0 || uses.value > 0)) {
        return calculateLimitedUses(itemData);
    }

    const itemType = item.type;
    if (itemType === 'feat') {
        return calculateFeatUses(itemData);
    } else if (itemType === 'consumable') {
        return {
            available: itemData.quantity,
        };
    } else if (itemType === 'weapon') {
        return calculateWeaponUses(itemData);
    } else if (itemType === 'spell') {
        return calculateSpellUses(item);
    }
    return null;
};

/**
 * Calculates uses based on a consumption target
 * @param {Actor} actor - The actor that owns the consuming item
 * @param {Object} consume - The consumption configuration object
 * @param {string} consume.type - The type of consumption ('attribute', 'ammo', 'material', or 'charges')
 * @param {string} consume.target - The target resource/item to consume
 * @param {number} consume.amount - The amount consumed per use
 * @returns {Object|null} An object containing available and maximum uses, or null if not applicable
 * @property {number} available - The number of uses currently available
 * @property {number|null} maximum - The maximum number of uses possible, if applicable
 */
function calculateConsumeUses(actor, consume) {
    let available = null;
    let maximum = null;
    if (consume.type === 'attribute') {
        const value = foundry.utils.getProperty(actor.system, consume.target);
        if (typeof value === 'number') {
            available = value;
        } else {
            available = 0;
        }
    } else if (consume.type === 'ammo' || consume.type === 'material') {
        const targetItem = actor.items.get(consume.target);
        if (targetItem) {
            available = targetItem.system.quantity;
        } else {
            available = 0;
        }
    } else if (consume.type === 'charges') {
        const targetItem = actor.items.get(consume.target);
        if (targetItem) {
            ({ available, maximum } = calculateLimitedUses(targetItem.system));
        } else {
            available = 0;
        }
    }
    if (available !== null) {
        if (consume.amount > 1) {
            available = Math.floor(available / consume.amount);
            if (maximum !== null) {
                maximum = Math.floor(maximum / consume.amount);
            }
        }
        return { available, maximum };
    }
    return null;
}

/**
 * Calculates uses for items with limited use tracking
 * @param {Object} itemData - The item's system data
 * @param {Object} itemData.uses - The uses configuration
 * @param {number} itemData.uses.value - Current number of uses
 * @param {number} itemData.uses.max - Maximum number of uses
 * @param {number} itemData.quantity - Item quantity
 * @returns {Object} An object containing available and maximum uses
 * @property {number} available - The number of uses currently available
 * @property {number} maximum - The maximum number of uses possible
 */
function calculateLimitedUses(itemData) {
    let available = itemData.uses.value;
    let maximum = itemData.uses.max;
    const quantity = itemData.quantity;
    if (quantity) {
        available = available + (quantity - 1) * maximum;
        maximum = maximum * quantity;
    }
    return { available, maximum };
}

/**
 * Calculates uses for feat-type items
 * @param {Object} itemData - The feat's system data
 * @returns {null} Currently returns null as feat uses are not implemented
 */
function calculateFeatUses(itemData) {
    return null;
}

/**
 * Calculates spell uses based on spell level and preparation mode
 * @param {Item} item - The spell item
 * @returns {Object|null} An object containing available and maximum uses, or null if not applicable
 * @property {number} available - The number of spell slots available
 * @property {number} maximum - The maximum number of spell slots
 */
function calculateSpellUses(item) {
    const itemData = item.system;
    
    // Check for v4+ uses
    if (DnDv4() && itemData.uses?.max > 0) {
        return {
            available: itemData.uses.value - (itemData.uses.spent || 0),
            maximum: itemData.uses.max
        };
    }
    
    // Check for pre-v4 uses
    if (!DnDv4() && itemData.uses && (itemData.uses.max > 0 || itemData.uses.value > 0)) {
        return calculateLimitedUses(itemData);
    }
    
    return null;
}

/**
 * Calculates uses for weapon-type items
 * @param {Object} itemData - The weapon's system data
 * @param {Object} itemData.properties - The weapon's properties
 * @param {boolean} itemData.properties.thr - Whether the weapon has the thrown property
 * @param {boolean} itemData.properties.ret - Whether the weapon has the returning property
 * @param {number} itemData.quantity - The quantity of the weapon
 * @returns {Object|null} An object containing available uses for thrown weapons, or null for other weapons
 * @property {number} available - The number of uses (quantity) for thrown weapons
 * @property {null} maximum - Always null for weapons
 */
function calculateWeaponUses(itemData) {
    if (itemData.properties.thr && !itemData.properties.ret) {
        return { available: itemData.quantity, maximum: null };
    }

    if (DnDv4() && itemData.uses?.max > 0) {
        return calculateLimitedUses(itemData);
    }
    
    return null;
}
