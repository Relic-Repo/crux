import { CRUX_FOUNDRY_PATHS } from "./CruxFoundryPaths.js";

export default class CruxFoundryAccess {
    static getFirst(document, paths, fallback = undefined) {
        for (const path of paths) {
            const value = foundry.utils.getProperty(document, path);
            if (value !== undefined) return value;
        }
        return fallback;
    }

    static supportsSceneLevels(scene = canvas.scene) {
        return !!this.getSceneLevelsCollection(scene);
    }

    static getSceneLevelsCollection(scene = canvas.scene) {
        return this.getFirst(scene, CRUX_FOUNDRY_PATHS.scene.levels, null);
    }

    static getSceneLevels(scene = canvas.scene) {
        const levels = this.getSceneLevelsCollection(scene);
        return levels ? Array.from(levels) : [];
    }

    static getInitialLevel(scene = canvas.scene) {
        return this.getFirst(scene, CRUX_FOUNDRY_PATHS.scene.initialLevel, null);
    }

    static getLevel(scene, levelId) {
        return this.getSceneLevelsCollection(scene)?.get?.(levelId) ?? null;
    }

    static getLevelBase(level) {
        return Number(this.getFirst(level, CRUX_FOUNDRY_PATHS.level.base, 0)) || 0;
    }

    static getLevelTop(level) {
        return this.getFirst(level, CRUX_FOUNDRY_PATHS.level.top, undefined);
    }

    static getLevelBottom(level) {
        return this.getFirst(level, CRUX_FOUNDRY_PATHS.level.bottom, undefined);
    }

    static getTokenElevation(tokenDocument) {
        return Number(this.getFirst(tokenDocument, CRUX_FOUNDRY_PATHS.token.elevation, 0)) || 0;
    }

    static getTokenLevelId(tokenDocument) {
        return this.getFirst(tokenDocument, CRUX_FOUNDRY_PATHS.token.level, null);
    }

    static getTokenMovementAction(tokenDocument) {
        return this.getFirst(tokenDocument, CRUX_FOUNDRY_PATHS.token.movementAction.source, null);
    }

    static getEffectiveTokenMovementAction(tokenDocument) {
        return this.getFirst(
            tokenDocument,
            CRUX_FOUNDRY_PATHS.token.movementAction.effective,
            CONFIG.Token.movement.defaultAction ?? "walk"
        );
    }

    static async updateTokenMovementAction(tokenDocument, action) {
        return tokenDocument?.update?.({ [CRUX_FOUNDRY_PATHS.token.movementAction.update]: action });
    }

    static async updateTokenElevation(tokenDocument, { level = null, elevation } = {}, options = {}) {
        const scene = tokenDocument?.parent;
        if (!tokenDocument || !scene) return null;
        if (this.supportsSceneLevels(scene) && typeof scene.moveTokens === "function") {
            return scene.moveTokens({
                [tokenDocument.id]: {
                    destination: {
                        level,
                        elevation
                    }
                }
            }, { method: "api", animate: false, ...options });
        }
        return tokenDocument.update({ elevation }, { animate: false, ...options });
    }
}
