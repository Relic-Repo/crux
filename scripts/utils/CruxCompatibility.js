import CruxFoundryAccess from "../runtime/CruxFoundryAccess.js";
import CruxDnd5eAccess from "../runtime/dnd5e/CruxDnd5eAccess.js";

export default class CruxCompatibility {
    static supportsSceneLevels(scene = canvas.scene) {
        return CruxFoundryAccess.supportsSceneLevels(scene);
    }

    static getTokenElevation(tokenDocument) {
        return CruxFoundryAccess.getTokenElevation(tokenDocument);
    }

    static async updateTokenElevation(tokenDocument, {level = null, elevation} = {}, options = {}) {
        return CruxFoundryAccess.updateTokenElevation(tokenDocument, { level, elevation }, options);
    }

    static isDnDv4() {
        const system = game.system;
        if (system.id !== "dnd5e") return false;
        const [major] = system.version.split('.').map(n => parseInt(n));
        return major >= 4;
    }

    static isDnDv5_1() {
        const system = game.system;
        if (system.id !== "dnd5e") return false;
        const [major, minor] = system.version.split('.').map(n => parseInt(n));
        return major > 5 || (major === 5 && minor >= 1);
    }

    static getSensesRanges(senses) {
        return senses?.ranges ?? senses ?? {};
    }

    static getSenseValue(senses, key) {
        return this.getSensesRanges(senses)?.[key] ?? 0;
    }

    static METHOD_TO_LEGACY = {
        "spell": "prepared",
        "always": "always",
        "atwill": "atwill",
        "innate": "innate",
        "pact": "pact",
        "apothecary": "apothecary"
    };

    static getSpellMethod(item) {
        if (!item?.system) return null;
        if (this.isDnDv5_1()) {
            const method = item.system.method;
            if (method !== undefined && method !== null) {
                return this.METHOD_TO_LEGACY[method] ?? method;
            }
            return item.system.preparation?.mode ?? null;
        }
        return item.system.preparation?.mode ?? null;
    }

    static getSpellPrepared(item) {
        if (!item?.system) return false;
        if (this.isDnDv5_1()) {
            const prepared = item.system.prepared;
            if (prepared !== undefined && prepared !== null) {
                return prepared >= 1;
            }
            return item.system.preparation?.prepared ?? false;
        }
        return item.system.preparation?.prepared ?? false;
    }

    static getDescription(item) {
        return CruxDnd5eAccess.getDescription(item);
    }

    static getActivities(item, applyHook = true) {
        return CruxDnd5eAccess.getActivities(item, applyHook);
    }

    static hasActivities(item, applyHook = false) {
        return CruxDnd5eAccess.hasActivities(item, applyHook);
    }

    static getActivationType(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            const firstActivity = CruxDnd5eAccess.getActivityEntries(item)[0]?.[1];
            return firstActivity?.activation?.type || null;
        }
        return item.system.actionType || null;
    }

    static getDuration(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            return item.system.duration || null;
        }
        return {
            value: item.system.duration?.value || null,
            units: item.system.duration?.units || null
        };
    }

    static getTarget(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            return item.system.target || null;
        }
        return {
            value: item.system.target?.value || null,
            units: item.system.target?.units || null,
            type: item.system.target?.type || null
        };
    }

    static getComponents(item) {
        if (!item?.system) return new Set();
        if (this.isDnDv4()) {
            return item.system.properties || new Set();
        }
        const components = new Set();
        const oldComponents = item.system.components || {};
        if (oldComponents.vocal) components.add("vocal");
        if (oldComponents.somatic) components.add("somatic");
        if (oldComponents.material) components.add("material");
        return components;
    }

    static hasRechargeRecovery(item) {
        if (!item?.system) return false;
        if (this.isDnDv4()) {
            const recovery = CruxDnd5eAccess.getUses(item).recovery;
            return recovery?.period === "recharge" || recovery?.[0]?.period === "recharge";
        }
        return item.system.recharge?.value > 0;
    }

    static hasRemainingUses(item) {
        if (!item?.system) return false;
        if (this.isDnDv4()) {
            return CruxDnd5eAccess.getUses(item).value > 0;
        }
        return item.system.recharge?.charged;
    }

    static getRechargeFormula(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            const recovery = CruxDnd5eAccess.getUses(item).recovery;
            return recovery?.formula ?? recovery?.[0]?.formula;
        }
        return item.system.recharge?.value;
    }

    static canModifyUses(item) {
        if (!item?.system) return false;
        if (this.isDnDv4()) {
            return CruxDnd5eAccess.getUses(item).max > 0;
        }
        return item.system.uses?.max > 0;
    }

    static getUses(item) {
        if (!item?.system) return null;
        if (this.isDnDv4()) {
            const uses = CruxDnd5eAccess.getUses(item);
            return uses.max !== undefined ? { value: uses.value, max: uses.max } : null;
        }
        const uses = item.system.uses;
        return uses ? { value: uses.value, max: uses.max } : null;
    }

    static async updateUses(item, newValue) {
        if (!this.canModifyUses(item)) return;
        
        const uses = this.getUses(item);
        if (!uses) return;

        const clampedValue = Math.max(0, Math.min(newValue, uses.max));
        await item.update({ [CruxDnd5eAccess.usesValueUpdatePath()]: clampedValue });
    }
}
