export default class CruxStateManager {
    static #instance;
    
    /** @type {Map<string, Object>} */
    #actorStates = new Map();
    
    /** @type {Set<Actor>} */
    #activeActors = new Set();

    static getInstance() {
        if (!this.#instance) this.#instance = new CruxStateManager();
        return this.#instance;
    }

    /**
     * Get currently active actors.
     * @returns {Actor[]}
     */
    getActiveActors() {
        const controlled = canvas.tokens.controlled.filter(t => 
            ["character", "npc"].includes(t.actor?.type)
        );
        
        if (controlled.length) {
            if (controlled.length > 1) {
                this.#activeActors = new Set([controlled[0].actor]);
                return [controlled[0].actor];
            }
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
     * Update state for an actor UUID.
     * @param {string} actorUuid
     * @param {Object} newState
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
     * Get state for an actor UUID.
     * @param {string} actorUuid
     * @returns {Object|null}
     */
    getActorStateByUuid(actorUuid) {
        if (!actorUuid) return null;
        const state = this.#actorStates.get(actorUuid);
        return state ? { ...state } : null;
    }

    resetAllStates() {
        this.#actorStates.clear();
    }

    /**
     * Check whether an actor is active.
     * @param {Actor} actor
     * @returns {boolean}
     */
    isActorActive(actor) {
        if (!actor) return false;
        if (this.#activeActors.has(actor)) return true;
        return Array.from(this.#activeActors).some(activeActor =>
            activeActor?.uuid && activeActor.uuid === actor.uuid
        );
    }

    /**
     * Update UI state for an actor.
     * @param {Actor} actor
     * @param {Object} state
     */
    updateActorState(actor, state) {
        if (!actor) return;
        this.updateActorStateByUuid(actor.uuid, state);
    }

    /**
     * Get UI state for an actor.
     * @param {Actor} actor
     * @returns {Object|null}
     */
    getActorState(actor) {
        if (!actor) return null;
        return this.getActorStateByUuid(actor.uuid);
    }

    /**
     * Update section state.
     * @param {Actor} actor
     * @param {string} sectionTitle
     * @param {boolean} isCollapsed
     */
    updateSectionState(actor, sectionTitle, isCollapsed) {
        if (!actor) return;
        
        const state = this.getActorState(actor) || {};
        const sectionStates = { ...(state.sectionStates || {}) };
        sectionStates[sectionTitle] = !isCollapsed;
        
        this.updateActorState(actor, { sectionStates });
    }

    /**
     * Update group state.
     * @param {Actor} actor
     * @param {string} groupTitle
     * @param {boolean} isCollapsed
     */
    updateGroupState(actor, groupTitle, isCollapsed) {
        if (!actor) return;
        
        const state = this.getActorState(actor) || {};
        const groupStates = { ...(state.groupStates || {}) };
        groupStates[groupTitle] = !isCollapsed;
        
        this.updateActorState(actor, { groupStates });
    }

    /**
     * Get section state.
     * @param {Actor} actor
     * @param {string} sectionTitle
     * @returns {boolean}
     */
    getSectionState(actor, sectionTitle) {
        const state = this.getActorState(actor);
        return state?.sectionStates?.[sectionTitle] ?? true;
    }

    /**
     * Get group state.
     * @param {Actor} actor
     * @param {string} groupTitle
     * @returns {boolean}
     */
    getGroupState(actor, groupTitle) {
        const state = this.getActorState(actor);
        return state?.groupStates?.[groupTitle] ?? true;
    }
    
    /**
     * @param {Object} newState
     * @deprecated Use updateActorState instead
     */
    updateScrollPosition(newState) {
        if (newState.uuid) {
            this.updateActorStateByUuid(newState.uuid, newState);
        }
    }

    /**
     * @returns {Object}
     * @deprecated Use getActorState instead
     */
    getScrollPosition() {
        for (const state of this.#actorStates.values()) {
            return { ...state };
        }
        return {};
    }

    /** @deprecated Use resetAllStates instead */
    resetScrollPosition() {
        this.resetAllStates();
    }
}
