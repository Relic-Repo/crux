export default class CruxDomUtils {
    /**
     * Check if drag targeting is enabled
     * @returns {boolean} True if drag targeting is enabled
     */
    static isDragTargetingEnabled() {
        if (!game?.settings?.get("crux", "enable-drag-targeting")) return false;
        if (!game?.modules?.get("midi-qol")?.active) return false;
        return game.settings.get("midi-qol", "DragDropTarget") ?? false;
    }

    /**
     * Create a drag image element
     * @param {string} imgSrc - Source URL for the drag image
     * @returns {HTMLElement} The created drag image element
     */
    static createDragImage(imgSrc) {
        const dragImage = document.createElement('img');
        dragImage.src = imgSrc;
        dragImage.style.width = '32px';
        dragImage.style.height = '32px';
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1000px';
        dragImage.style.left = '-1000px';
        document.body.appendChild(dragImage);
        return dragImage;
    }

    /**
     * Clean up a drag image element
     * @param {HTMLElement} dragImage - The drag image to clean up
     */
    static cleanupDragImage(dragImage) {
        if (dragImage && document.body.contains(dragImage)) {
            document.body.removeChild(dragImage);
        }
    }

    /**
     * Setup drag-and-drop for an element
     * @param {HTMLElement} element - Element to make draggable
     * @param {Object} options - Configuration options
     */
    static setupDraggable(element, { onDragStart, onDragEnd } = {}) {
        element.draggable = true;
        
        element.addEventListener('dragstart', async (event) => {
            event.stopPropagation();
            if (onDragStart) await onDragStart(event);
        });

        element.addEventListener('dragend', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (onDragEnd) onDragEnd(event);
        });
    }

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
     * Update drag mode for elements
     * @param {HTMLElement} container - Container element
     * @param {NodeList} elements - Elements to update
     * @param {boolean} enabled - Whether drag mode is enabled
     */
    static updateDragMode(container, elements, enabled) {
        if (enabled) {
            container.classList.add('crux-targeting');
            const targetCursorSetting = game.settings.get("crux", "target-cursor");
            if (targetCursorSetting === "crosshair") {
                container.classList.add('custom-target-cursor');
                container.classList.remove('arrow-target-cursor');
            } else if (targetCursorSetting === "arrow") {
                container.classList.add('arrow-target-cursor');
                container.classList.remove('custom-target-cursor');
            }
            
            elements.forEach(el => {
                el.draggable = true;
                el.setAttribute('draggable', 'true');
            });
        } else {
            container.classList.remove('crux-targeting');
            container.classList.remove('custom-target-cursor');
            container.classList.remove('arrow-target-cursor');
            
            elements.forEach(el => {
                el.draggable = false;
                el.removeAttribute('draggable');
            });
        }
    }

    /**
     * Setup canvas drop handling
     * @param {Function} onDrop - Callback for drop events
     */
    static setupCanvasDropHandler(onDrop) {
        const view = canvas.app.view;
        
        view.addEventListener('dragover', (event) => {
            event.preventDefault();
            const dragKey = game.keybindings.get("crux", "item-drag")[0];
            const isToggleMode = game.settings.get("crux", "toggle-target-mode");
            
            if (this.isDragTargetingEnabled() || 
                game.keyboard.downKeys.has(dragKey.key) || 
                isToggleMode) {
                event.dataTransfer.dropEffect = 'copy';
            }
        });

        if (onDrop) {
            view.addEventListener('drop', onDrop);
        }
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
