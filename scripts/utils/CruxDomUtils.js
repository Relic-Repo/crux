export default class CruxDomUtils {
    static calculateHealthOverlay(currentHP, maxHP) {
        const percentage = ((maxHP - currentHP) / maxHP) * 100;
        if (percentage > 50) {
            return Math.round(percentage / 10) * 10;
        } else if (percentage > 10) {
            return Math.round(percentage / 5) * 5;
        }
        return Math.round(percentage);
    }
    
    static getElementText(element) {
        return Array.from(element.childNodes)
            .map(node => node.nodeType === 3 ? node.textContent.trim() : 
                 node.nodeType === 1 ? this.getElementText(node) : '')
            .filter(text => text)
            .join(' ');
    }

    static findParent(element, selector) {
        let parent = element.parentElement;
        while (parent) {
            if (parent.matches(selector)) return parent;
            parent = parent.parentElement;
        }
        return null;
    }

    static toggleClasses(element, classes) {
        Object.entries(classes).forEach(([className, state]) => {
            element.classList.toggle(className, state);
        });
    }

    static createSlotElement(filled) {
        const slot = document.createElement('span');
        slot.classList.add('slot');
        if (filled) slot.classList.add('filled');
        return slot;
    }

    static createSlots(available, maximum) {
        return Array(maximum).fill(null)
            .map((_, i) => this.createSlotElement(i < available));
    }
}
