/**
 * Manages state for the Crux module
 */
export default class CruxStateManager {
    static #instance;
    
    /** @type {Map<string, Object>} Stores UI state per actor */
    #actorStates = new Map();
    
    /** @type {Set<Actor>} Set of currently active actors */
    #activeActors = new Set();

    /**
     * Get the singleton instance
     */
    static getInstance() {
        if (!this.#instance) this.#instance = new CruxStateManager();
        return this.#instance;
    }

    /**
     * Get currently active actors based on token selection or user's default character
     * @returns {Actor[]} Array of active actors
     */
    getActiveActors() {
        const controlled = canvas.tokens.controlled.filter(t => 
            ["character", "npc"].includes(t.actor?.type)
        );
        
        if (controlled.length) {
            this.#activeActors = new Set(controlled.map(token => token.actor));
            return Array.from(this.#activeActors);
        }
        
        if (game.user.character && game.settings.get("crux", "assume-default-character")) {
            this.#activeActors = new Set([game.user.character]);
            return [game.user.character];
        }
        
        this.#activeActors.clear();
        return [];
    }

    /**
     * Update the state for a specific actor UUID
     * @param {string} actorUuid The actor UUID
     * @param {Object} newState New state to merge with existing state
     */
    updateActorStateByUuid(actorUuid, newState) {
        if (!actorUuid) return;
        
        const currentState = this.#actorStates.get(actorUuid) || {};
        const updatedState = { ...currentState, ...newState };
        if (newState.sectionStates) {
            updatedState.sectionStates = { 
                ...(currentState.sectionStates || {}), 
                ...newState.sectionStates 
            };
        }
        
        if (newState.groupStates) {
            updatedState.groupStates = { 
                ...(currentState.groupStates || {}), 
                ...newState.groupStates 
            };
        }
        
        this.#actorStates.set(actorUuid, updatedState);
    }

    /**
     * Get the state for a specific actor UUID
     * @param {string} actorUuid The actor UUID
     * @returns {Object|null} Actor's state or null if not found
     */
    getActorStateByUuid(actorUuid) {
        if (!actorUuid) return null;
        const state = this.#actorStates.get(actorUuid);
        return state ? { ...state } : null;
    }

    /**
     * Reset all stored states
     */
    resetAllStates() {
        this.#actorStates.clear();
    }

    /**
     * Check if an actor is currently active
     * @param {Actor} actor Actor to check
     * @returns {boolean} True if actor is active
     */
    isActorActive(actor) {
        return this.#activeActors.has(actor);
    }

    /**
     * Update UI state for a specific actor
     * @param {Actor} actor The actor to update state for
     * @param {Object} state State object containing scroll, skills, sections, etc.
     */
    updateActorState(actor, state) {
        if (!actor) return;
        this.updateActorStateByUuid(actor.uuid, state);
    }

    /**
     * Get UI state for a specific actor
     * @param {Actor} actor The actor to get state for
     * @returns {Object|null} Actor's UI state or null if not found
     */
    getActorState(actor) {
        if (!actor) return null;
        return this.getActorStateByUuid(actor.uuid);
    }

    /**
     * Update section collapsed state for the current actor
     * @param {Actor} actor The actor to update state for
     * @param {string} sectionTitle Section title
     * @param {boolean} isCollapsed Whether section is collapsed
     */
    updateSectionState(actor, sectionTitle, isCollapsed) {
        if (!actor) return;
        
        const state = this.getActorState(actor) || {};
        const sectionStates = { ...(state.sectionStates || {}) };
        sectionStates[sectionTitle] = !isCollapsed;
        
        this.updateActorState(actor, { sectionStates });
    }

    /**
     * Update group collapsed state for the current actor
     * @param {Actor} actor The actor to update state for
     * @param {string} groupTitle Group title
     * @param {boolean} isCollapsed Whether group is collapsed
     */
    updateGroupState(actor, groupTitle, isCollapsed) {
        if (!actor) return;
        
        const state = this.getActorState(actor) || {};
        const groupStates = { ...(state.groupStates || {}) };
        groupStates[groupTitle] = !isCollapsed;
        
        this.updateActorState(actor, { groupStates });
    }

    /**
     * Get section collapsed state for the current actor
     * @param {Actor} actor The actor to get state for
     * @param {string} sectionTitle Section title
     * @returns {boolean} Whether section is expanded
     */
    getSectionState(actor, sectionTitle) {
        const state = this.getActorState(actor);
        return state?.sectionStates?.[sectionTitle] ?? true;
    }

    /**
     * Get group collapsed state for the current actor
     * @param {Actor} actor The actor to get state for
     * @param {string} groupTitle Group title
     * @returns {boolean} Whether group is expanded
     */
    getGroupState(actor, groupTitle) {
        const state = this.getActorState(actor);
        return state?.groupStates?.[groupTitle] ?? true;
    }
    
    /**
     * For backward compatibility
     * @param {Object} newState New state to merge with existing scroll position
     * @deprecated Use updateActorState instead
     */
    updateScrollPosition(newState) {
        if (newState.uuid) {
            this.updateActorStateByUuid(newState.uuid, newState);
        }
    }

    /**
     * For backward compatibility
     * @returns {Object} Current scroll position state for the last actor
     * @deprecated Use getActorState instead
     */
    getScrollPosition() {
        for (const state of this.#actorStates.values()) {
            return { ...state };
        }
        return {};
    }

    /**
     * For backward compatibility
     * @deprecated Use resetAllStates instead
     */
    resetScrollPosition() {
        this.resetAllStates();
    }
}
