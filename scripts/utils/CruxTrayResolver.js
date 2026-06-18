import CruxHooksManager from "../hooks/CruxHooksManager.js";

export default class CruxTrayResolver {
    static actorElement(root, target) {
        const actorElement = target?.closest?.(".crux__actor");
        if (actorElement) return actorElement;

        const actors = game.crux?.state?.getActiveActors?.() ?? [];
        if (actors.length !== 1) return null;
        return root?.querySelector?.(".crux__actor") ?? null;
    }

    static actorUuid(root, target) {
        const actorElement = this.actorElement(root, target);
        if (actorElement?.dataset.actorUuid) return actorElement.dataset.actorUuid;

        const actors = game.crux?.state?.getActiveActors?.() ?? [];
        return actors.length === 1 ? actors[0].uuid : null;
    }

    static actor(root, target) {
        const actorUuid = this.actorUuid(root, target);
        if (!actorUuid) return null;
        return CruxHooksManager.resolveActor(CruxHooksManager.fromUuid(actorUuid));
    }

    static itemElement(target) {
        return target?.closest?.(".item") ?? null;
    }

    static itemUuid(target) {
        return target?.dataset?.itemUuid ?? this.itemElement(target)?.dataset.itemUuid ?? null;
    }

    static async item(target) {
        const itemUuid = this.itemUuid(target);
        return itemUuid ? CruxHooksManager.fromUuid(itemUuid) : null;
    }

    static selectedTokenForActor(actor) {
        if (!actor) return null;
        return canvas.tokens?.controlled.find(token =>
            token?.actor === actor || token?.actor?.uuid === actor.uuid
        ) ?? null;
    }

    static primaryTokenForActor(actor) {
        return this.selectedTokenForActor(actor) ?? actor?.getActiveTokens?.()[0] ?? null;
    }

    static combatantForActor(actor) {
        const combat = game.combat;
        if (!combat || !actor) return null;

        const combatants = Array.from(combat.combatants ?? []);
        const tokenDocuments = [];
        const selectedToken = this.selectedTokenForActor(actor);
        if (selectedToken?.document) tokenDocuments.push(selectedToken.document);
        if (actor.isToken && actor.token) tokenDocuments.push(actor.token);
        for (const token of actor.getActiveTokens?.() ?? []) {
            if (token?.document) tokenDocuments.push(token.document);
        }

        for (const tokenDocument of tokenDocuments) {
            const combatant = combatants.find(c =>
                c.tokenId === tokenDocument.id
                && (!c.sceneId || !tokenDocument.parent?.id || c.sceneId === tokenDocument.parent.id)
            );
            if (combatant) return combatant;
        }

        return combatants.find(c => c.actor === actor || c.actor?.uuid === actor.uuid)
            ?? combatants.find(c => c.actorId === actor.id || c.actor?.id === actor.id)
            ?? null;
    }
}
