import { createCruxSettingDefinitions } from "./CruxSettingDefinitions.js";
import CRUX_VISUAL_PRESETS from "./CruxVisualPresets.js";
import * as CruxThemeVariables from "./CruxThemeVariables.js";

/**
 * Manages settings registration and access for Crux
 */
export default class CruxSettings {
    static EXTERNAL_THEME_VARIABLES = CruxThemeVariables.EXTERNAL_THEME_VARIABLES;

    static VISUAL_PRESETS = CRUX_VISUAL_PRESETS;

    static _lastSavedVisualPreset = null;

    /**
     * Configuration settings for the module
     */
    static SETTINGS = createCruxSettingDefinitions(this);

    /**
     * Register all module settings
     */
    static registerSettings() {
        for (const [key, setting] of Object.entries(this.SETTINGS)) {
            const originalOnChange = setting.onChange;
            game.settings.register("crux", key, {
                ...setting,
                onChange: async (value) => {
                    await originalOnChange?.(value);
                    if (key === "font-family" || key === "custom-font-family") {
                        this._updateFontFamily();
                    }
                    if (key === "visual-preset") {
                        this._lastSavedVisualPreset = value;
                        await this._applyVisualPreset({ presetKey: value, syncControls: true });
                    }
                    if (key === "panel-opacity") {
                        this._updatePanelOpacity(value);
                    }
                    if (key === "element-opacity") {
                        this._updateElementOpacity(value);
                    }
                    if (key === "panel-blur") {
                        this._updatePanelBlur(value);
                    }
                    if (game.crux?.app) {
                    if (key === "tray-size") {
                        this._updateTraySize(value);
                    }
                    if (key === "tray-mode") {
                        this._handleTrayModeChange(value);
                    }
                    if (key === "content-text-size-multiplier") {
                        this._updateContentTextSizeMultiplier();
                    }
                    if (key === "global-font-size-multiplier") {
                        this._updateGlobalFontSizeMultiplier();
                    }
                    if (key === "character-name-size-multiplier") {
                        this._updateCharacterNameSizeMultiplier();
                    }
                    if (key === "actor-ability-text-size-multiplier") {
                        this._updateActorPanelAppearance();
                    }
                    if (key === "tab-height-multiplier") {
                        this._updateTabHeightMultiplier(value);
                    }
                        game.crux.app.render(true);
                    }
                }
            });
        }
        this._registerLiveSettingsPreviewHooks();
        this._normalizeGlobalFontScale();
        this.applySavedVisualSettings();
    }

    static _registerLiveSettingsPreviewHooks() {
        if (this._liveSettingsPreviewRegistered) return;
        this._liveSettingsPreviewRegistered = true;

        Hooks.on("renderSettingsConfig", (app) => {
            this._activateLiveSettingsPreview(app.element);
        });

        Hooks.on("renderApplication", (app) => {
            this._activateLiveSettingsPreview(app.element);
        });

        Hooks.on("closeSettingsConfig", () => {
            setTimeout(() => this.applySavedVisualSettings(), 0);
        });
    }

    /**
     * Handle changes to the tray-mode setting
     * @param {string} value - The new tray-mode value
     * @private
     */
    static _handleTrayModeChange(value) {
        if (!game.crux?.app?.element || !document.body.contains(game.crux.app.element)) return;

        const interfaceEl = document.querySelector("#interface");
        if (value === "always") {
            game.crux.app.element.classList.add("active");
            game.crux.app.element.classList.add("always-on");
            interfaceEl.classList.add("crux-active");
        }
        else if (value === "auto") {
            const hasSelectedTokens = canvas.tokens.controlled.length > 0;
            game.crux.app.element.classList.remove("always-on");
            if (hasSelectedTokens) {
                game.crux.app.element.classList.add("active");
                interfaceEl.classList.add("crux-active");
            } else {
                game.crux.app.element.classList.remove("active");
                interfaceEl.classList.remove("crux-active");
            }
        }
        else {
            game.crux.app.element.classList.remove("always-on");
        }
    }

    /**
     * Get the Carolingian UI font from CSS variable
     * @returns {string} The Carolingian UI font family
     */
    static getCarolingianUIFont() {
        return getComputedStyle(document.body).getPropertyValue("--crlngn-font-family").trim() || "Work Sans, Arial, sans-serif";
    }

    /**
     * Get the selected font family based on settings
     * @returns {string} The selected font family
     */
    static getSelectedFontFamily() {
        const fontSetting = this.getSetting("font-family");

        if (fontSetting === "carolingian-ui") {
            return this.getCarolingianUIFont();
        }
        let fontFamily;
        switch (fontSetting) {
            case "modesto":
                fontFamily = '"Modesto Condensed", "Palatino Linotype", serif';
                break;
            case "signika":
                fontFamily = '"Signika", sans-serif';
                break;
            case "roboto":
                fontFamily = '"Roboto Slab", Arial, sans-serif';
                break;
            case "custom":
                const customFont = this.getSetting("custom-font-family");
                fontFamily = customFont || '"Modesto Condensed", "Palatino Linotype", serif';
                break;
            default:
                fontFamily = '"Modesto Condensed", "Palatino Linotype", serif';
        }

        return fontFamily;
    }

    static _getCruxAppElement() {
        return CruxThemeVariables.getCruxAppElement();
    }

    static _setCruxAppVariable(name, value) {
        CruxThemeVariables.setCruxAppVariable(name, value);
    }

    static _removeCruxAppVariable(name) {
        CruxThemeVariables.removeCruxAppVariable(name);
    }

    static setCruxGlobalVariable(name, value) {
        CruxThemeVariables.setCruxGlobalVariable(name, value);
    }

    static _setCruxCssVariable(name, value) {
        CruxThemeVariables.setCruxCssVariable(name, value);
    }

    static _clearVisualPresetVariables() {
        CruxThemeVariables.clearVisualPresetVariables(this.VISUAL_PRESETS);
    }

    static _clampOpacity(value) {
        return CruxThemeVariables.clampOpacity(value);
    }

    static _getCruxThemeValue(name) {
        return CruxThemeVariables.getCruxThemeValue(name);
    }

    static _applyCruxAppThemeVariables() {
        CruxThemeVariables.applyCruxAppThemeVariables(key => this.getSetting(key));
    }

    static applyThemeToExternalRoot(root) {
        CruxThemeVariables.applyThemeToExternalRoot(root);
    }

    static _syncExternalThemeRoots() {
        CruxThemeVariables.syncExternalThemeRoots();
    }

    static async applySavedVisualSettings() {
        this._lastSavedVisualPreset = this.getSetting("visual-preset");
        await this._applyVisualPreset();
        this._updateFontFamily();
        this._updateTraySize();
        this._updateContentTextSizeMultiplier();
        this._updateGlobalFontSizeMultiplier();
        this._updateCharacterNameSizeMultiplier();
        this._updateActorPanelAppearance();
        this._updateTabHeightMultiplier();
        this._updatePanelOpacity();
        this._updateElementOpacity();
        this._updatePanelBlur();
    }

    static async _applyVisualPreset({ presetKey = this.getSetting("visual-preset"), syncControls = false } = {}) {
        const preset = this.VISUAL_PRESETS[presetKey] ?? this.VISUAL_PRESETS.foundry;

        this._clearVisualPresetVariables();
        for (const [name, value] of Object.entries(CruxThemeVariables.getVisualPresetVariables(preset))) {
            this._setCruxCssVariable(name, value);
        }
        this._applyCruxAppThemeVariables();

        if (syncControls) {
            this._updatePanelOpacity(preset.opacity);
            this._updateElementOpacity(preset.elementOpacity);
            this._updatePanelBlur(preset.blur);
            this._updateBackdropVisibility(preset.opacity, preset.blur);
            this._syncVisualControlInputsDeferred(preset);
        }

        if (syncControls && Number(this.getSetting("panel-opacity")) !== preset.opacity) {
            await game.settings.set("crux", "panel-opacity", preset.opacity);
        }
        if (syncControls && Number(this.getSetting("element-opacity")) !== preset.elementOpacity) {
            await game.settings.set("crux", "element-opacity", preset.elementOpacity);
        }
        if (syncControls && Number(this.getSetting("panel-blur")) !== preset.blur) {
            await game.settings.set("crux", "panel-blur", preset.blur);
        }

        if (syncControls) {
            this._updatePanelOpacity(preset.opacity);
            this._updateElementOpacity(preset.elementOpacity);
            this._updatePanelBlur(preset.blur);
            this._updateBackdropVisibility(preset.opacity, preset.blur);
            this._syncVisualControlInputsDeferred(preset);
        } else {
            this._updatePanelOpacity();
            this._updateElementOpacity();
            this._updatePanelBlur();
        }
        this._syncExternalThemeRoots();
    }

    static _previewVisualPreset(presetKey, root = document) {
        const preset = this.VISUAL_PRESETS[presetKey] ?? this.VISUAL_PRESETS.foundry;

        this._clearVisualPresetVariables();
        for (const [name, value] of Object.entries(CruxThemeVariables.getVisualPresetVariables(preset))) {
            this._setCruxCssVariable(name, value);
        }
        this._applyCruxAppThemeVariables();

        this._updatePanelOpacity(preset.opacity);
        this._updateElementOpacity(preset.elementOpacity);
        this._updatePanelBlur(preset.blur);
        this._updateBackdropVisibility(preset.opacity, preset.blur);
        this._syncVisualControlInputs(preset, root);
        this._syncExternalThemeRoots();
    }

    /**
     * Update the font family CSS variable based on settings
     * @private
     */
    static _updateFontFamily() {
        const fontFamily = this.getSelectedFontFamily();
        this._setCruxAppVariable('--crux-font-family', fontFamily);
        this._syncExternalThemeRoots();
    }

    static _updateTraySize(value = this.getSetting("tray-size")) {
        const traySize = Number(value) || 230;
        this.setCruxGlobalVariable('--crux-width', `${traySize}px`);

        const appElement = this._getCruxAppElement();
        if (!appElement) return;
        appElement.style.width = 'var(--crux-occupied-width)';
        appElement.style.position = 'fixed';
        appElement.style.top = '0px';
        appElement.style.left = '0px';
        appElement.style.bottom = 'var(--crux-tray-bottom-offset)';
        appElement.style.height = 'auto';
    }

    /**
     * Update the global font size multiplier CSS variable based on settings
     * @private
     */
    static _updateGlobalFontSizeMultiplier() {
        const rawMultiplier = this.getSetting("global-font-size-multiplier");
        const globalFontSizeMultiplier = rawMultiplier;
        this._setCruxAppVariable('--crux-global-font-size-multiplier', globalFontSizeMultiplier);
        this._syncExternalThemeRoots();
    }

    static _normalizeGlobalFontScale() {
        if (this.getSetting("global-font-scale-rebased")) return;

        const currentMultiplier = this.getSetting("global-font-size-multiplier");
        if (Math.abs(currentMultiplier - 0.7) < 0.001) {
            game.settings.set("crux", "global-font-size-multiplier", 1.0);
        }
        game.settings.set("crux", "global-font-scale-rebased", true);
    }

    /**
     * Update the content text size multiplier CSS variable based on settings
     * @private
     */
    static _updateContentTextSizeMultiplier() {
        const contentTextSizeMultiplier = this.getSetting("content-text-size-multiplier");
        this._setCruxAppVariable('--crux-content-text-size-multiplier', contentTextSizeMultiplier);
    }

    static _updateCharacterNameSizeMultiplier() {
        const characterNameSizeMultiplier = this.getSetting("character-name-size-multiplier");
        this._setCruxAppVariable('--crux-character-name-size-multiplier', characterNameSizeMultiplier);
    }

    static _updateActorPanelAppearance() {
        this._setCruxAppVariable('--crux-actor-ability-text-size-multiplier', this.getSetting("actor-ability-text-size-multiplier"));
    }

    static _updateTabHeightMultiplier(value = this.getSetting("tab-height-multiplier")) {
        const multiplier = Number(value) || 1;
        this._setCruxAppVariable('--crux-tab-height-multiplier', multiplier);
    }

    static _updatePanelOpacity(value = this.getSetting("panel-opacity")) {
        const panelOpacity = value;
        this._setCruxAppVariable('--crux-bg-opacity', panelOpacity);
        this._applyCruxAppThemeVariables();
        this._updateBackdropVisibility(panelOpacity);
    }

    static _updateElementOpacity(value = this.getSetting("element-opacity")) {
        const elementOpacity = value;
        this._setCruxAppVariable('--crux-element-bg-opacity', elementOpacity);
        this._applyCruxAppThemeVariables();
    }

    static _updatePanelBlur(value = this.getSetting("panel-blur")) {
        const panelBlur = value;
        const blurDisabled = Number(panelBlur) <= 0;
        const blurValue = blurDisabled ? "none" : `blur(${panelBlur}px)`;
        document.documentElement.style.removeProperty("--crux-blur");
        document.body?.style.removeProperty("--crux-blur");
        const appElement = this._getCruxAppElement();
        appElement?.style.setProperty('--crux-blur', blurValue);
        appElement?.classList.toggle("crux-blur-disabled", blurDisabled);
        this._updateBackdropVisibility(undefined, panelBlur);
    }

    static _updateBackdropVisibility(panelOpacity = this.getSetting("panel-opacity"), panelBlur = this.getSetting("panel-blur")) {
        const resolvedPanelOpacity = Number(panelOpacity ?? this.getSetting("panel-opacity"));
        const resolvedPanelBlur = Number(panelBlur ?? this.getSetting("panel-blur"));
        const backdropDisabled = resolvedPanelOpacity <= 0 && resolvedPanelBlur <= 0;
        this._getCruxAppElement()?.classList.toggle("crux-backdrop-disabled", backdropDisabled);
    }

    static _syncVisualControlInputs(preset, root = document) {
        const values = {
            "panel-opacity": preset.opacity,
            "element-opacity": preset.elementOpacity,
            "panel-blur": preset.blur
        };

        for (const [key, value] of Object.entries(values)) {
            const selectors = [
                `[name="crux.${key}"]`,
                `[name="${key}"]`,
                `[data-setting-id="crux.${key}"]`,
                `[data-setting-id="${key}"]`
            ];
            for (const input of root.querySelectorAll(selectors.join(","))) {
                if (!("value" in input)) continue;
                input.value = value;
                input.setAttribute("value", value);
                const rangeValue = input.nextElementSibling;
                this._syncRangeValue(rangeValue, value);
                input.dispatchEvent(new Event("input", { bubbles: true }));
            }
        }
    }

    static _syncVisualControlInputsDeferred(preset) {
        this._syncVisualControlInputs(preset);
        requestAnimationFrame(() => this._syncVisualControlInputs(preset));
        setTimeout(() => this._syncVisualControlInputs(preset), 50);
    }

    static _syncRangeValue(rangeValue, value) {
        if (!rangeValue?.classList?.contains("range-value")) return;
        if ("value" in rangeValue) rangeValue.value = value;
        rangeValue.textContent = value;
    }

    static _activateLiveSettingsPreview(root) {
        if (!root || root.dataset?.cruxLiveSettingsPreview === "true") return;
        if (!root.querySelector?.('[name="crux.visual-preset"], [name="crux.panel-opacity"], [name="crux.element-opacity"], [name="crux.panel-blur"], [name="crux.tray-size"], [name="crux.global-font-size-multiplier"], [name="crux.content-text-size-multiplier"], [name="crux.character-name-size-multiplier"], [name="crux.actor-ability-text-size-multiplier"], [name="crux.tab-height-multiplier"]')) return;

        root.dataset.cruxLiveSettingsPreview = "true";

        const getInput = key => root.querySelector(`[name="crux.${key}"], [name="${key}"]`);
        const updateRangeDisplay = input => this._syncRangeValue(input?.nextElementSibling, input?.value);

        const panelOpacity = getInput("panel-opacity");
        const elementOpacity = getInput("element-opacity");
        const panelBlur = getInput("panel-blur");
        const traySize = getInput("tray-size");
        const globalFontSizeMultiplier = getInput("global-font-size-multiplier");
        const contentTextSizeMultiplier = getInput("content-text-size-multiplier");
        const characterNameSizeMultiplier = getInput("character-name-size-multiplier");
        const actorAbilityTextSizeMultiplier = getInput("actor-ability-text-size-multiplier");
        const tabHeightMultiplier = getInput("tab-height-multiplier");
        const visualPreset = getInput("visual-preset");
        if (visualPreset) {
            visualPreset.value = this._lastSavedVisualPreset ?? this.getSetting("visual-preset");
        }

        const form = root.closest?.("form") ?? root.querySelector?.("form");
        form?.addEventListener("submit", () => {
            this._lastSavedVisualPreset = visualPreset?.value ?? this.getSetting("visual-preset");
        }, { capture: true });

        panelOpacity?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._updatePanelOpacity(value);
            updateRangeDisplay(event.currentTarget);
        });

        elementOpacity?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._updateElementOpacity(value);
            updateRangeDisplay(event.currentTarget);
        });

        panelBlur?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._updatePanelBlur(value);
            updateRangeDisplay(event.currentTarget);
        });

        traySize?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._updateTraySize(value);
            updateRangeDisplay(event.currentTarget);
        });

        globalFontSizeMultiplier?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._setCruxAppVariable('--crux-global-font-size-multiplier', value);
            this._syncExternalThemeRoots();
            updateRangeDisplay(event.currentTarget);
        });

        contentTextSizeMultiplier?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._setCruxAppVariable('--crux-content-text-size-multiplier', value);
            updateRangeDisplay(event.currentTarget);
        });

        characterNameSizeMultiplier?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._setCruxAppVariable('--crux-character-name-size-multiplier', value);
            updateRangeDisplay(event.currentTarget);
        });

        actorAbilityTextSizeMultiplier?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._setCruxAppVariable('--crux-actor-ability-text-size-multiplier', value);
            updateRangeDisplay(event.currentTarget);
        });

        tabHeightMultiplier?.addEventListener("input", event => {
            const value = Number(event.currentTarget.value);
            this._updateTabHeightMultiplier(value);
            updateRangeDisplay(event.currentTarget);
        });

        visualPreset?.addEventListener("change", event => {
            this._previewVisualPreset(event.currentTarget.value, root);
        });
    }

    /**
     * Check if tray should auto-hide
     * @returns {boolean} True if auto-hide is enabled
     */
    static isTrayAutoHide() {
        return game.settings.get("crux", "tray-mode") === "auto";
    }

    /**
     * Check if tray should always be visible
     * @returns {boolean} True if always-on mode is enabled
     */
    static isTrayAlwaysOn() {
        return game.settings.get("crux", "tray-mode") === "always";
    }

    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @returns {any} Setting value
     */
    static getSetting(key) {
        return game.settings.get("crux", key);
    }

    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {any} value - New value
     * @returns {Promise} Promise that resolves when setting is updated
     */
    static async setSetting(key, value) {
        return game.settings.set("crux", key, value);
    }

    /**
     * Get all section visibility settings
     * @returns {Object} Map of section keys to visibility states
     */
    static getSectionVisibility() {
        return {
            favorites: this.getSetting("show-favorites-section"),
            equipped: this.getSetting("show-equipped-section"),
            features: this.getSetting("show-features-section"),
            spells: this.getSetting("show-spells-section"),
            inventory: this.getSetting("show-inventory-section")
        };
    }

    /**
     * Get all expansion states
     * @returns {Object} Map of expansion settings
     */
    static getExpansionStates() {
        return {
            skills: this.getSetting("skills-expanded") === "open",
            mainSections: this.getSetting("main-sections-expanded") === "open",
            subSections: this.getSetting("sub-sections-expanded") === "open"
        };
    }
}
