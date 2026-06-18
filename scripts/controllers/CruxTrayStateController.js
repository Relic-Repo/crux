import CruxTrayResolver from "../utils/CruxTrayResolver.js";

export default class CruxTrayStateController {
    constructor(app) {
        this.app = app;
    }

    get root() {
        return this.app.element;
    }

    bindScroll() {
        const container = this.root?.querySelector(".crux__container");
        container?.addEventListener("scroll", this.onScroll.bind(this));
    }

    onScroll(event) {
        const actors = game.crux.state.getActiveActors();
        if (actors.length === 1) {
            game.crux.state.updateActorState(actors[0], {
                scroll: event.currentTarget.scrollTop,
                showSkills: this.root?.querySelector(".crux__skill-container")?.classList.contains("is-open")
            });
        } else {
            game.crux.state.resetScrollPosition();
        }
    }

    restoreScrollPosition() {
        const actor = this._singleActiveActor();
        if (!actor) return;
        const state = game.crux.state.getActorState(actor);
        if (state?.scroll === undefined) return;
        const container = this.root?.querySelector(".crux__container");
        if (container) container.scrollTop = state.scroll;
    }

    applySavedStates() {
        const root = this.root;
        if (!root) return;

        const settingMainSectionsExpanded = game.settings.get("crux", "main-sections-expanded") === "open";
        const settingSubSectionsExpanded = game.settings.get("crux", "sub-sections-expanded") === "open";
        const settingSkillsExpanded = game.settings.get("crux", "skills-expanded") === "open";

        if (!settingMainSectionsExpanded) {
            root.querySelectorAll(".crux__section").forEach(section => {
                section.classList.add("is-collapsed");
            });
        }
        if (!settingSubSectionsExpanded) {
            root.querySelectorAll(".crux__group").forEach(group => {
                group.classList.add("is-collapsed");
            });
        }
        if (settingSkillsExpanded) {
            root.querySelectorAll(".crux__skill-container").forEach(container => {
                container.classList.add("is-open");
            });
        }

        const actor = this._singleActiveActor();
        if (!actor) return;

        const state = game.crux.state.getActorState(actor);
        if (!state) return;

        if (state.sectionStates) {
            root.querySelectorAll(".crux__section").forEach(section => {
                const title = section.querySelector(".crux__section-header span")?.textContent;
                if (title && state.sectionStates[title] !== undefined) {
                    section.classList.toggle("is-collapsed", !state.sectionStates[title]);
                }
            });
        }

        if (state.groupStates) {
            root.querySelectorAll(".crux__group").forEach(group => {
                const title = group.querySelector(".crux__group-header h3 span")?.textContent;
                if (title && state.groupStates[title] !== undefined) {
                    group.classList.toggle("is-collapsed", !state.groupStates[title]);
                }
            });
        }

        if (state.showSkills !== undefined) {
            root.querySelectorAll(".crux__skill-container").forEach(container => {
                container.classList.toggle("is-open", state.showSkills);
            });
        }
    }

    toggleSkills(event, target) {
        if (!event && !target) {
            const skillContainers = this.root?.querySelectorAll(".crux__skill-container") ?? [];
            if (!skillContainers.length) return;

            skillContainers.forEach(container => {
                container.classList.toggle("is-open");
                this._saveActorState({
                    scroll: this._scrollTop(),
                    showSkills: container.classList.contains("is-open")
                });
            });
            return;
        }

        const skillContainer = target?.closest?.(".crux__skill-container");
        if (!skillContainer) return;
        skillContainer.classList.toggle("is-open");
        this._saveActorState({
            scroll: this._scrollTop(),
            showSkills: skillContainer.classList.contains("is-open")
        });
    }

    toggleSection(target) {
        const section = target?.closest?.(".crux__section");
        if (!section) return;
        section.classList.toggle("is-collapsed");

        const actor = this._singleActiveActor();
        if (!actor) return;
        const title = section.querySelector(".crux__section-header span")?.textContent;
        if (!title) return;
        game.crux.state.updateSectionState(actor, title, section.classList.contains("is-collapsed"));
        this._saveActorState({ scroll: this._scrollTop() });
    }

    toggleGroup(target) {
        const group = target?.closest?.(".crux__group");
        if (!group) return;
        group.classList.toggle("is-collapsed");

        const actor = this._singleActiveActor();
        if (!actor) return;
        const title = group.querySelector(".crux__group-header h3 span")?.textContent;
        if (!title) return;
        game.crux.state.updateGroupState(actor, title, group.classList.contains("is-collapsed"));
        this._saveActorState({ scroll: this._scrollTop() });
    }

    expandCollapse(actorElement) {
        if (!actorElement) return;

        const sections = actorElement.querySelectorAll(".crux__section");
        const groups = actorElement.querySelectorAll(".crux__group");
        const isAnySectionCollapsed = Array.from(sections).some(section => section.classList.contains("is-collapsed"));
        const isAnyGroupCollapsed = Array.from(groups).some(group => group.classList.contains("is-collapsed"));
        const newSectionState = isAnySectionCollapsed;
        const newGroupState = isAnyGroupCollapsed;

        sections.forEach(section => {
            section.classList.toggle("is-collapsed", !newSectionState);
        });
        groups.forEach(group => {
            group.classList.toggle("is-collapsed", !newGroupState);
        });

        const actor = CruxTrayResolver.actor(this.root, actorElement);
        if (!actor) return;

        sections.forEach(section => {
            const title = section.querySelector(".crux__section-header span")?.textContent;
            if (title) game.crux.state.updateSectionState(actor, title, !newSectionState);
        });
        groups.forEach(group => {
            const title = group.querySelector(".crux__group-header h3 span")?.textContent;
            if (title) game.crux.state.updateGroupState(actor, title, !newGroupState);
        });
        game.crux.state.updateActorState(actor, { scroll: this._scrollTop() });
    }

    _singleActiveActor() {
        const actors = game.crux.state.getActiveActors();
        return actors.length === 1 ? actors[0] : null;
    }

    _saveActorState(state) {
        const actor = this._singleActiveActor();
        if (actor) game.crux.state.updateActorState(actor, state);
    }

    _scrollTop() {
        return this.root?.querySelector(".crux__container")?.scrollTop;
    }
}
