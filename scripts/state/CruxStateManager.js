export default class CruxStateManager {
    static #instance;
    
    #actorStates = new Map();
    
    #activeActors = new Set();

    static getInstance() {
        if (!this.#instance) this.#instance = new CruxStateManager();
        return this.#instance;
    }

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

    getActorStateByUuid(actorUuid) {
        if (!actorUuid) return null;
        const state = this.#actorStates.get(actorUuid);
        return state ? { ...state } : null;
    }

    resetAllStates() {
        this.#actorStates.clear();
    }

    isActorActive(actor) {
        if (!actor) return false;
        if (this.#activeActors.has(actor)) return true;
        return Array.from(this.#activeActors).some(activeActor =>
            activeActor?.uuid && activeActor.uuid === actor.uuid
        );
    }

    updateActorState(actor, state) {
        if (!actor) return;
        this.updateActorStateByUuid(actor.uuid, state);
    }

    getActorState(actor) {
        if (!actor) return null;
        return this.getActorStateByUuid(actor.uuid);
    }

    updateSectionState(actor, sectionTitle, isCollapsed) {
        if (!actor) return;
        
        const state = this.getActorState(actor) || {};
        const sectionStates = { ...(state.sectionStates || {}) };
        sectionStates[sectionTitle] = !isCollapsed;
        
        this.updateActorState(actor, { sectionStates });
    }

    updateGroupState(actor, groupTitle, isCollapsed) {
        if (!actor) return;
        
        const state = this.getActorState(actor) || {};
        const groupStates = { ...(state.groupStates || {}) };
        groupStates[groupTitle] = !isCollapsed;
        
        this.updateActorState(actor, { groupStates });
    }

    getSectionState(actor, sectionTitle) {
        const state = this.getActorState(actor);
        return state?.sectionStates?.[sectionTitle] ?? true;
    }

    getGroupState(actor, groupTitle) {
        const state = this.getActorState(actor);
        return state?.groupStates?.[groupTitle] ?? true;
    }
    
    /** @deprecated Use updateActorState instead */
    updateScrollPosition(newState) {
        if (newState.uuid) {
            this.updateActorStateByUuid(newState.uuid, newState);
        }
    }

    /** @deprecated Use getActorState instead */
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
