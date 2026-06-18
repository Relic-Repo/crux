import CruxSystemRegistry from "../systems/CruxSystemRegistry.js";
import CruxTrayResolver from "../utils/CruxTrayResolver.js";
import CruxUtils from "../utils/CruxUtilityManager.js";

export default class CruxCombatController {
    constructor(app) {
        this.app = app;
    }

    get root() {
        return this.app.element;
    }

    syncRenderedControls() {
        if (!this.root) return;
        const activeActors = game.crux.state.getActiveActors();
        const currentCombatant = game.combat?.combatant;
        const isCurrentCombatant = activeActors.some(actor =>
            CruxTrayResolver.combatantForActor(actor)?.id === currentCombatant?.id
        );
        this.root.classList.toggle("is-current-combatant", isCurrentCombatant);

        activeActors.forEach(actor => this.syncActorControls(actor));
    }

    syncActorControls(actor) {
        const actorElement = this.root.querySelector(`.crux__actor[data-actor-uuid="${actor.uuid}"]`);
        if (!actorElement) return;

        const combatant = CruxTrayResolver.combatantForActor(actor);
        if (!combatant) return;

        const combatActionsContainer = this._ensureCombatActionsContainer(actorElement);
        if (!combatActionsContainer) return;

        const needsInitiative = combatant.initiative === null;
        const isCurrentTurn = game.combat?.current?.combatantId === combatant.id;
        this._syncInitiativeButton(combatActionsContainer, needsInitiative);
        this._syncEndTurnButton(combatActionsContainer, isCurrentTurn);
    }

    async addToCombat(event) {
        const rollImmediately = event.shiftKey;
        const rollOptions = CruxUtils.getDnd5eRollOptionsFromSkipDialogEvent(event);
        const actors = game.crux.state.getActiveActors();
        if (!actors.length) return;

        const combat = game.combat;
        const isGM = game.user.isGM;
        if (!combat && isGM) {
            await Combat.create();
        } else if (!combat) {
            ui.notifications.warn("No Active Combat Encounter. Please wait for creation and try again.");
            return;
        }

        const newActors = actors.filter(actor => {
            const token = CruxTrayResolver.primaryTokenForActor(actor);
            if (!token) return false;
            const alreadyInCombat = game.combat.combatants.some(c =>
                c.actorId === actor.id && c.tokenId === token.id
            );
            if (alreadyInCombat) {
                ui.notifications.warn(`${actor.name} is already in combat.`);
                return false;
            }
            return true;
        });

        if (!newActors.length) return;
        const combatants = newActors.map(actor => {
            const token = CruxTrayResolver.primaryTokenForActor(actor);
            return {
                actorId: actor.id,
                tokenId: token.id,
                hidden: false
            };
        });
        if (!combatants.length) return;

        this.app.suppressCombatRender = rollImmediately;
        try {
            const createdCombatants = await game.combat.createEmbeddedDocuments("Combatant", combatants);
            if (rollImmediately) {
                await CruxSystemRegistry.getAdapter()?.rollCombatantsInitiative?.(createdCombatants, rollOptions);
            }
        } finally {
            this.app.suppressCombatRender = false;
        }
        this.app.render();
    }

    async rollInitiative(event, target) {
        event.preventDefault();
        event.stopPropagation();

        const actor = CruxTrayResolver.actor(this.root, target);
        if (!actor) return;
        const rollOptions = CruxUtils.getDnd5eRollOptionsFromSkipDialogEvent(event);
        const combatant = CruxTrayResolver.combatantForActor(actor);
        await CruxSystemRegistry.getAdapter()?.rollInitiative?.(actor, combatant, rollOptions);
        this.app.render();
    }

    endTurn() {
        return game.combat?.nextTurn();
    }

    _ensureCombatActionsContainer(actorElement) {
        let combatActions = actorElement.querySelector(".crux__combat-actions");
        if (combatActions) return combatActions;

        combatActions = document.createElement("div");
        combatActions.className = "crux__combat-actions";
        const topSection = actorElement.querySelector(".crux__top-section");
        if (topSection && topSection.nextSibling) {
            actorElement.insertBefore(combatActions, topSection.nextSibling);
        } else {
            actorElement.appendChild(combatActions);
        }
        return combatActions;
    }

    _syncInitiativeButton(combatActionsContainer, needsInitiative) {
        const initiativeButton = combatActionsContainer.querySelector(".crux__initiative");
        if (!needsInitiative) {
            initiativeButton?.remove();
            return;
        }
        if (initiativeButton) return;

        const initiativeHtml = `
            <a class="crux__initiative flexrow" data-action="rollInitiative">
                <i class="flex0 fas fa-swords crux__initiative-icon"></i>
                <div>${game.i18n.localize("crux.roll-initiative")}</div>
            </a>
        `;
        combatActionsContainer.insertAdjacentHTML("afterbegin", initiativeHtml);
        combatActionsContainer.querySelector(".crux__initiative")?.addEventListener("click", event => {
            this.rollInitiative(event, event.currentTarget);
        });
    }

    _syncEndTurnButton(combatActionsContainer, isCurrentTurn) {
        const endTurnButton = combatActionsContainer.querySelector(".crux__end-turn-button");
        if (!isCurrentTurn) {
            endTurnButton?.remove();
            return;
        }
        if (endTurnButton) return;

        const endTurnHtml = `
            <a class="crux__end-turn-button flexrow" data-action="endTurn">
                <i class="flex0 fas fa-hourglass-end"></i>
                <div>${game.i18n.localize("crux.end-turn")}</div>
            </a>
        `;
        combatActionsContainer.insertAdjacentHTML("beforeend", endTurnHtml);
        combatActionsContainer.querySelector(".crux__end-turn-button")?.addEventListener("click", () => {
            this.endTurn();
        });
    }
}
