const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import CruxAnchoredFlyout from "../utils/CruxAnchoredFlyout.js";
import CruxCompatibility from "../utils/CruxCompatibility.js";

/**
 * Application for setting token elevation and, for GMs, token scene level.
 */
export default class CruxElevationAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    static activeInstance = null;

    constructor(actor, token, event) {
        super();
        this.actor = actor;
        this.token = token;
        this.anchorEvent = event;
        this.anchorTarget = event?.currentTarget;
        this.mode = "level";
        this._resetPendingState();
        CruxElevationAppV2.activeInstance = this;
    }

    static updateInstance(actor, token, {reset = true} = {}) {
        if (!CruxElevationAppV2.activeInstance?.rendered) return;
        CruxElevationAppV2.activeInstance.actor = actor;
        CruxElevationAppV2.activeInstance.token = token;
        if (reset) CruxElevationAppV2.activeInstance._resetPendingState();
        CruxElevationAppV2.activeInstance.render();
    }

    static DEFAULT_OPTIONS = {
        id: "crux-elevation",
        classes: ["crux-elevation", "crux-flyout"],
        popOut: false,
        minimizable: false,
        resizable: false,
        headerButtons: [],
        position: {
            width: 200,
            height: "auto"
        },
        form: {
            closeOnSubmit: false
        },
        window: {
            title: "Elevation"
        }
    };

    static PARTS = {
        elevation: {
            template: "modules/crux/templates/elevation-window.hbs"
        }
    };

    _resetPendingState() {
        const tokenDocument = this.token?.document;
        const level = this._getTokenLevel();
        const base = this._getLevelBase(level);
        this.pendingLevelId = tokenDocument?._source?.level ?? level?.id ?? null;
        this.pendingSceneElevation = CruxCompatibility.getTokenElevation(tokenDocument);
        this.pendingLevelElevation = this.pendingSceneElevation - base;
    }

    async _prepareContext(options) {
        const supportsSceneLevels = this._supportsSceneLevels();
        const showSceneMode = this._canUseSceneMode();
        if (!showSceneMode && this.mode === "scene") this.mode = "level";
        const activeValue = this._getActiveValue();
        return {
            mode: this.mode,
            value: this._formatEditableValue(activeValue),
            sign: activeValue > 0 ? "positive" : activeValue < 0 ? "negative" : "zero",
            levelLabel: supportsSceneLevels ? "level" : "Elevation",
            showSceneMode,
            showLevels: supportsSceneLevels && game.user.isGM && this._getSceneLevels().length > 1,
            levels: this._getLevelChoices()
        };
    }

    _supportsSceneLevels() {
        return CruxCompatibility.supportsSceneLevels(this._getScene());
    }

    _canUseSceneMode() {
        if (!this._supportsSceneLevels()) return false;
        if (game.user.isGM) return true;
        return game.settings.get("crux", "allow-player-scene-elevation") === true;
    }

    _getScene() {
        return this.token?.document?.parent ?? canvas.scene;
    }

    _getSceneLevels() {
        if (!this._supportsSceneLevels()) return [];
        const levels = Array.from(this._getScene()?.levels ?? []);
        return levels.sort((a, b) => {
            return this._getLevelBase(b) - this._getLevelBase(a)
                || (a.sort - b.sort)
                || a.name.localeCompare(b.name, game.i18n.lang);
        });
    }

    _getTokenLevel() {
        if (!this._supportsSceneLevels()) return null;
        const scene = this._getScene();
        const levelId = this.pendingLevelId ?? this.token?.document?._source?.level;
        return scene?.levels?.get(levelId) ?? scene?.initialLevel ?? canvas.level ?? null;
    }

    _getLevelBase(level) {
        return Number(level?.elevation?.base ?? level?.elevation?.bottom ?? 0) || 0;
    }

    _getLevelChoices() {
        if (!this._supportsSceneLevels()) return [];
        const levels = this._getSceneLevels();
        return levels.map(level => ({
            id: level.id,
            name: level.name,
            top: this._formatRangeValue(level.elevation?.top),
            bottom: this._formatRangeValue(level.elevation?.bottom),
            active: level.id === this.pendingLevelId
        }));
    }

    _formatRangeValue(value) {
        if (value === null) return "\u221E";
        if (value === Infinity) return "\u221E";
        if (value === -Infinity) return "-\u221E";
        return this._formatDisplayValue(value);
    }

    _formatDisplayValue(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return "--";
        return String(number);
    }

    _formatEditableValue(value) {
        return this._formatDisplayValue(value);
    }

    _parseValue(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    _syncFromActiveInput() {
        const input = this.element?.querySelector("[data-elevation-value]");
        if (!input) return;
        const value = this._parseValue(input.value);
        this._setActiveValue(value);
    }

    _getActiveValue() {
        if (!this._supportsSceneLevels()) return this.pendingSceneElevation;
        return this.mode === "scene" ? this.pendingSceneElevation : this.pendingLevelElevation;
    }

    _setActiveValue(value) {
        if (!this._supportsSceneLevels()) {
            this.pendingSceneElevation = value;
            this.pendingLevelElevation = value;
            return;
        }
        const level = this._getTokenLevel();
        const base = this._getLevelBase(level);
        if (this.mode === "scene") {
            this.pendingSceneElevation = value;
            this.pendingLevelElevation = value - base;
        } else {
            this.pendingLevelElevation = value;
            this.pendingSceneElevation = base + value;
        }
    }

    async _onSetElevation(event) {
        event.preventDefault();
        event.stopPropagation();
        this._syncFromActiveInput();
        const tokenDocument = this.token?.document;
        const scene = this._getScene();
        if (!tokenDocument || !scene) return;
        await CruxCompatibility.updateTokenElevation(tokenDocument, {
            level: this.pendingLevelId,
            elevation: this.pendingSceneElevation
        });
        game.crux?.app?.render();
        await this.close();
    }

    async _onCancel(event) {
        event.preventDefault();
        event.stopPropagation();
        await this.close();
    }

    _onMode(event) {
        event.preventDefault();
        event.stopPropagation();
        this._syncFromActiveInput();
        const mode = event.currentTarget.dataset.mode;
        if (!["level", "scene"].includes(mode)) return;
        if (mode === "scene" && !this._canUseSceneMode()) return;
        this.mode = mode;
        this.render();
    }

    _onInput(event) {
        this._setActiveValue(this._parseValue(event.currentTarget.value));
        this._refreshSignState();
    }

    _onStep(event) {
        event.preventDefault();
        event.stopPropagation();
        this._syncFromActiveInput();
        const direction = event.currentTarget.dataset.direction === "down" ? -1 : 1;
        const amount = event.shiftKey && event.altKey ? 10 : event.shiftKey ? 5 : 1;
        const value = this._getActiveValue() + (direction * amount);
        this._setActiveValue(value);
        this.render();
    }

    _onSelectLevel(event) {
        event.preventDefault();
        event.stopPropagation();
        if (!game.user.isGM) return;
        this._syncFromActiveInput();
        const level = this._getScene()?.levels?.get(event.currentTarget.dataset.levelId);
        if (!level) return;
        this.pendingLevelId = level.id;
        this.pendingSceneElevation = this._getLevelBase(level) + this.pendingLevelElevation;
        this.render();
    }

    _onKeydown(event) {
        if (!["Enter", " "].includes(event.key)) return;
        event.currentTarget.click();
    }

    _refreshSignState() {
        const value = this._getActiveValue();
        this.element?.classList.toggle("crux-elevation--positive", value > 0);
        this.element?.classList.toggle("crux-elevation--negative", value < 0);
    }

    _centerActiveLevel() {
        const levels = this.element?.querySelector(".crux-elevation__levels");
        const active = levels?.querySelector(".crux-elevation__level.active");
        if (!levels || !active) return;
        levels.scrollTop = active.offsetTop - ((levels.clientHeight - active.offsetHeight) / 2);
    }

    async close(options = {}) {
        if (options?.closeKey) return false;
        CruxAnchoredFlyout.unregisterCloseOnBlur(this);
        this.anchorTarget?.blur?.();
        return super.close(options);
    }

    setPosition(options = {}) {
        return super.setPosition(CruxAnchoredFlyout.getPosition(this, this.anchorEvent, options));
    }

    _onRender(context, options) {
        super._onRender(context, options);
        CruxAnchoredFlyout.applyTheme(this.element);
        this.setPosition();
        this.anchorTarget?.blur?.();
        this._refreshSignState();
        this._centerActiveLevel();
        CruxAnchoredFlyout.registerCloseOnBlur(this, this.element, this.anchorTarget);
        this.element.querySelectorAll("[data-action='setElevation']").forEach(el =>
            el.addEventListener("click", this._onSetElevation.bind(this)));
        this.element.querySelectorAll("[data-action='cancelElevation']").forEach(el =>
            el.addEventListener("click", this._onCancel.bind(this)));
        this.element.querySelectorAll("[data-action='setElevationMode']").forEach(el =>
            el.addEventListener("click", this._onMode.bind(this)));
        this.element.querySelectorAll("[data-action='stepElevation']").forEach(el =>
            el.addEventListener("click", this._onStep.bind(this)));
        this.element.querySelectorAll("[data-action='selectLevel']").forEach(el => {
            el.addEventListener("click", this._onSelectLevel.bind(this));
            el.addEventListener("keydown", this._onKeydown.bind(this));
        });
        this.element.querySelector("[data-elevation-value]")?.addEventListener("input", this._onInput.bind(this));
    }
}
