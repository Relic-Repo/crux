export default class CruxDomUtils {

    /**
     * Calculate health overlay height percentage
     * @param {number} currentHP - Current hit points
     * @param {number} maxHP - Maximum hit points
     * @returns {number} Calculated height percentage
     */
    static calculateHealthOverlay(currentHP, maxHP) {
        const percentage = ((maxHP - currentHP) / maxHP) * 100;
        if (percentage > 50) {
            return Math.round(percentage / 10) * 10;
        } else if (percentage > 10) {
            return Math.round(percentage / 5) * 5;
        }
        return Math.round(percentage);
    }
    
    /**
     * Get the text content of an element, including any nested elements
     * @param {HTMLElement} element - Element to get text from
     * @returns {string} Combined text content
     */
    static getElementText(element) {
        return Array.from(element.childNodes)
            .map(node => node.nodeType === 3 ? node.textContent.trim() : 
                 node.nodeType === 1 ? this.getElementText(node) : '')
            .filter(text => text)
            .join(' ');
    }

    /**
     * Find the closest parent element matching a selector
     * @param {HTMLElement} element - Starting element
     * @param {string} selector - CSS selector to match
     * @returns {HTMLElement|null} Matching parent or null
     */
    static findParent(element, selector) {
        let parent = element.parentElement;
        while (parent) {
            if (parent.matches(selector)) return parent;
            parent = parent.parentElement;
        }
        return null;
    }

    /**
     * Toggle classes on an element
     * @param {HTMLElement} element - Element to modify
     * @param {Object} classes - Map of class names to boolean states
     */
    static toggleClasses(element, classes) {
        Object.entries(classes).forEach(([className, state]) => {
            element.classList.toggle(className, state);
        });
    }

    /**
     * Create a slot indicator element
     * @param {boolean} filled - Whether the slot is filled
     * @returns {HTMLElement} Created slot element
     */
    static createSlotElement(filled) {
        const slot = document.createElement('span');
        slot.classList.add('slot');
        if (filled) slot.classList.add('filled');
        return slot;
    }

    /**
     * Create slot indicators
     * @param {number} available - Number of available slots
     * @param {number} maximum - Maximum number of slots
     * @returns {HTMLElement[]} Array of slot elements
     */
    static createSlots(available, maximum) {
        return Array(maximum).fill(null)
            .map((_, i) => this.createSlotElement(i < available));
    }
}
