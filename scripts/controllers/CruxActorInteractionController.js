import CruxSystemRegistry from "../systems/CruxSystemRegistry.js";
import CruxInlineEditor from "../utils/CruxInlineEditor.js";
import CruxTrayResolver from "../utils/CruxTrayResolver.js";

export default class CruxActorInteractionController {
    constructor(app) {
        this.app = app;
    }

    get root() {
        return this.app.element;
    }

    bindRenderedControls() {
        this.root?.querySelectorAll(".crux__portrait").forEach(portrait => {
            portrait.addEventListener("click", event => this.onPortraitClick(event));
        });

        this.root?.querySelectorAll(".crux__actor-name").forEach(name => {
            name.addEventListener("click", event => this.onActorNameClick(event));
        });
    }

    onPortraitClick(event) {
        const actor = CruxTrayResolver.actor(this.root, event.currentTarget);
        if (actor?.system?.attributes?.hp?.value <= 0 && typeof actor.rollDeathSave === "function") {
            actor.rollDeathSave({ event, legacy: false }, {}, {});
            return;
        }
        event.currentTarget.classList.toggle("flipped");
    }

    onActorNameClick(event) {
        const actor = CruxTrayResolver.actor(this.root, event.currentTarget);
        if (!actor) return;
        if (!actor.sheet.rendered) actor.sheet.render(true);
        else actor.sheet.close();
    }

    rollAbility(event, target) {
        const abl = target.dataset.ability;
        if (!abl) return;
        const actor = CruxTrayResolver.actor(this.root, target);
        if (actor) CruxSystemRegistry.getAdapter()?.rollAbility?.(actor, abl, event);
    }

    rollSave(event, target) {
        const abl = target.dataset.ability;
        if (!abl) return;
        const actor = CruxTrayResolver.actor(this.root, target);
        if (actor) CruxSystemRegistry.getAdapter()?.rollSavingThrow?.(actor, abl, event);
    }

    rollSkill(event, target) {
        const skill = target.dataset.skill;
        if (!skill) return;
        const actor = CruxTrayResolver.actor(this.root, target);
        if (actor) CruxSystemRegistry.getAdapter()?.rollSkill?.(actor, skill, event);
    }

    toggleTarget(target) {
        const actor = CruxTrayResolver.actor(this.root, target);
        if (!actor) return;
        const token = CruxTrayResolver.primaryTokenForActor(actor);
        if (token) token.setTarget(!token.isTargeted, { releaseOthers: false });
    }

    openToken(target) {
        const actor = CruxTrayResolver.actor(this.root, target);
        if (!actor) return;
        const token = CruxTrayResolver.primaryTokenForActor(actor);
        if (token) token.sheet.render(true);
    }

    shortRest(event, target) {
        event.stopPropagation();
        const actor = CruxTrayResolver.actor(this.root, target);
        if (actor) CruxSystemRegistry.getAdapter()?.shortRest?.(actor);
    }

    longRest(event, target) {
        event.stopPropagation();
        const actor = CruxTrayResolver.actor(this.root, target);
        if (actor) CruxSystemRegistry.getAdapter()?.longRest?.(actor);
    }

    toggleHpEditor(event, target) {
        event.stopPropagation();
        event.preventDefault();
        if (!event.shiftKey) return;

        const actor = CruxTrayResolver.actor(this.root, target);
        if (!actor?.isOwner) return;
        this.openHpEditor(target, actor);
    }

    openHpEditor(target, actor) {
        CruxInlineEditor.open(target, {
            onSave: () => this.saveHpEditorChanges(target, actor)
        });
    }

    async saveHpEditorChanges(target, actor) {
        const input = target.querySelector(".edit-mode input");
        if (!input || !actor?.isOwner) return;

        const field = target.dataset.hpField;
        const rawValue = parseInt(input.value);
        await CruxSystemRegistry.getAdapter()?.saveHpField?.(actor, field, rawValue);
    }
}
