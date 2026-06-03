export const EXTERNAL_THEME_VARIABLES = [
    "--crux-element-bg-rgb",
    "--crux-element-bg",
    "--crux-element-bg-strong",
    "--crux-border-color-light",
    "--crux-border-color-strong",
    "--crux-border-width-light",
    "--crux-border-width-strong",
    "--crux-text",
    "--crux-text-light",
    "--crux-active-bg",
    "--crux-element-hover-bg",
    "--crux-element-hover-border",
    "--crux-element-hover-text",
    "--crux-hover-text",
    "--crux-font-family",
    "--crux-global-font-size-multiplier"
];

export const PALETTE_VARIABLE_MAP = {
    panel: "--crux-panel-bg-rgb",
    element: "--crux-element-bg-rgb",
    accent: "--crux-accent-rgb",
    border: "--crux-border-rgb",
    text: "--crux-text-rgb",
    textLight: "--crux-text-light-rgb",
    textStrong: "--crux-text-strong-rgb"
};

const ELEMENT_SLOT_PROPERTIES = [
    "bg",
    "bg-light",
    "bg-strong",
    "border-color",
    "border-color-light",
    "border-color-strong",
    "border-width",
    "border-width-light",
    "border-width-strong",
    "text",
    "text-light",
    "text-strong",
    "hover-bg",
    "hover-border",
    "hover-text"
];

const ALWAYS_CLEAR_PRESET_VARIABLES = [
    "--crux-border-color",
    "--crux-border-color-light",
    "--crux-border-color-strong",
    "--crux-border-width",
    "--crux-border-width-light",
    "--crux-border-width-strong",
    "--crux-input-border",
    "--crux-divider-color",
    "--crux-divider-color-light",
    "--crux-divider-color-strong",
    "--crux-text",
    "--crux-text-strong",
    "--crux-text-light",
    "--crux-character-name-text",
    "--crux-action-name-text",
    "--crux-actor-name-text",
    "--crux-action-header-text",
    "--crux-actor-header-text",
    "--crux-actor-ability-text",
    "--crux-subheader-text",
    "--crux-item-text",
    "--crux-item-description-text",
    "--crux-element-hover-bg",
    "--crux-element-hover-border",
    "--crux-element-hover-text",
    "--crux-highlight-solid",
    "--crux-active-bg",
    "--crux-active-border",
    "--crux-active-glow",
    "--crux-actor-ac-bg",
    "--crux-actor-ac-bg-rgb",
    "--crux-actor-ac-text",
    "--crux-actor-ac-border-rgb",
    "--crux-actor-ac-border-opacity",
    "--crux-actor-ac-border-color",
    "--crux-actor-ac-border-width"
];

function getElementSlotVariableNames() {
    const names = [];
    for (let slot = 1; slot <= 10; slot += 1) {
        for (const property of ELEMENT_SLOT_PROPERTIES) {
            names.push(`--crux-element-${slot}-${property}`);
        }
    }
    return names;
}

export function getCruxAppElement() {
    return game.crux?.app?.element ?? document.getElementById("crux");
}

export function setCruxAppVariable(name, value) {
    document.documentElement.style.removeProperty(name);
    document.body?.style.removeProperty(name);
    getCruxAppElement()?.style.setProperty(name, value);
}

export function removeCruxAppVariable(name) {
    document.documentElement.style.removeProperty(name);
    document.body?.style.removeProperty(name);
    getCruxAppElement()?.style.removeProperty(name);
}

export function setCruxGlobalVariable(name, value) {
    document.documentElement.style.setProperty(name, value);
    document.body?.style.setProperty(name, value);
}

export function setCruxCssVariable(name, value) {
    setCruxAppVariable(name, value);
}

export function getVisualPresetVariables(preset) {
    const paletteVariables = {};
    for (const [key, variableName] of Object.entries(PALETTE_VARIABLE_MAP)) {
        const value = preset.palette?.[key];
        if (value !== undefined) paletteVariables[variableName] = value;
    }

    if (paletteVariables["--crux-text-light-rgb"] && !paletteVariables["--crux-muted-text-rgb"]) {
        paletteVariables["--crux-muted-text-rgb"] = paletteVariables["--crux-text-light-rgb"];
    }
    if (preset.solidHighlight !== undefined) {
        paletteVariables["--crux-highlight-solid"] = String(Boolean(preset.solidHighlight));
    }

    return {
        ...paletteVariables,
        ...(preset.variables ?? {})
    };
}

export function getVisualPresetVariableNames(visualPresets) {
    return new Set([
        ...ALWAYS_CLEAR_PRESET_VARIABLES,
        ...getElementSlotVariableNames(),
        ...Object.values(visualPresets).flatMap(preset => Object.keys(getVisualPresetVariables(preset)))
    ]);
}

export function clearVisualPresetVariables(visualPresets) {
    const variableNames = getVisualPresetVariableNames(visualPresets);
    for (const name of variableNames) {
        removeCruxAppVariable(name);
    }
}

export function clampOpacity(value) {
    return Math.min(Math.max(Number(value) || 0, 0), 1);
}

export function getCruxThemeValue(name) {
    const appElement = getCruxAppElement();
    const appValue = appElement?.style?.getPropertyValue(name)?.trim();
    if (appValue) return appValue;
    const source = appElement ? getComputedStyle(appElement) : getComputedStyle(document.documentElement);
    return source.getPropertyValue(name).trim();
}

function getCruxAppVariableValue(name) {
    return getCruxAppElement()?.style?.getPropertyValue(name)?.trim() || "";
}

function resolveRgbValue(name, fallback) {
    const value = getCruxThemeValue(name);
    return value && !value.includes("var(") ? value : fallback;
}

export function applyCruxAppThemeVariables(getSetting) {
    const appElement = getCruxAppElement();
    if (!appElement) return;

    const panelBgRgb = getCruxThemeValue("--crux-panel-bg-rgb") || "0, 0, 0";
    const elementBgRgb = getCruxThemeValue("--crux-element-bg-rgb") || "0, 0, 0";
    const accentRgb = getCruxThemeValue("--crux-accent-rgb") || "153, 25, 79";
    const legacyTextRgb = getCruxThemeValue("--crux-text-rgb") || "220, 222, 226";
    const legacyMutedTextRgb = getCruxThemeValue("--crux-muted-text-rgb") || "190, 194, 202";
    const textRgb = resolveRgbValue("--crux-text-rgb", legacyTextRgb);
    const textStrongRgb = resolveRgbValue("--crux-text-strong-rgb", textRgb);
    const textLightRgb = resolveRgbValue("--crux-text-light-rgb", legacyMutedTextRgb);
    const text = getCruxAppVariableValue("--crux-text") || `rgba(${textRgb}, 0.92)`;
    const textStrong = getCruxAppVariableValue("--crux-text-strong") || `rgba(${textStrongRgb}, 0.96)`;
    const textLight = getCruxAppVariableValue("--crux-text-light") || `rgba(${textLightRgb}, 0.76)`;
    const characterNameText = getCruxAppVariableValue("--crux-character-name-text") || textStrong;
    const actionNameText = getCruxAppVariableValue("--crux-action-name-text") || characterNameText;
    const actorNameText = getCruxAppVariableValue("--crux-actor-name-text") || characterNameText;
    const actionHeaderText = getCruxAppVariableValue("--crux-action-header-text") || textStrong;
    const actorHeaderText = getCruxAppVariableValue("--crux-actor-header-text") || textStrong;
    const actorAbilityText = getCruxAppVariableValue("--crux-actor-ability-text") || textStrong;
    const subheaderText = getCruxAppVariableValue("--crux-subheader-text") || text;
    const itemText = getCruxAppVariableValue("--crux-item-text") || text;
    const itemDescriptionText = getCruxAppVariableValue("--crux-item-description-text") || textLight;
    const borderRgb = getCruxThemeValue("--crux-border-rgb") || "255, 255, 255";
    const actorAcBgRgb = getCruxThemeValue("--crux-actor-ac-bg-rgb") || panelBgRgb;
    const actorAcText = getCruxAppVariableValue("--crux-actor-ac-text") || textStrong;
    const panelOpacity = clampOpacity(getCruxThemeValue("--crux-bg-opacity") || getSetting("panel-opacity"));
    const elementOpacity = clampOpacity(getCruxThemeValue("--crux-element-bg-opacity") || getSetting("element-opacity"));
    const elementBg = `rgba(${elementBgRgb}, ${elementOpacity})`;
    const elementBgStrong = `rgba(${elementBgRgb}, ${clampOpacity(elementOpacity + 0.08)})`;
    const borderColor = getCruxAppVariableValue("--crux-border-color") || `rgba(${borderRgb}, 0.20)`;
    const borderColorLight = getCruxAppVariableValue("--crux-border-color-light") || `rgba(${borderRgb}, 0.18)`;
    const borderColorStrong = getCruxAppVariableValue("--crux-border-color-strong") || `rgba(${borderRgb}, 0.45)`;
    const borderWidth = getCruxAppVariableValue("--crux-border-width") || getCruxThemeValue("--crux-border-width") || "1px";
    const widthLight = getCruxAppVariableValue("--crux-border-width-light") || borderWidth;
    const borderWidthStrong = getCruxAppVariableValue("--crux-border-width-strong") || borderWidth;
    const actorAcBorderRgb = getCruxAppVariableValue("--crux-actor-ac-border-rgb") || resolveRgbValue("--crux-actor-ac-border-rgb", borderRgb);
    const actorAcBorderOpacity = clampOpacity(getCruxAppVariableValue("--crux-actor-ac-border-opacity") || getCruxThemeValue("--crux-actor-ac-border-opacity") || 0.55);
    const actorAcBorderWidth = getCruxAppVariableValue("--crux-actor-ac-border-width") || getCruxThemeValue("--crux-actor-ac-border-width") || borderWidth;
    const solidHighlight = getCruxThemeValue("--crux-highlight-solid") === "true";
    const activeBg = `rgba(${accentRgb}, ${solidHighlight ? 0.82 : 0.25})`;
    const activeBorder = `rgb(${accentRgb})`;
    const activeGlow = `rgba(${accentRgb}, ${solidHighlight ? 0.35 : 0.8})`;
    const hoverText = getCruxAppVariableValue("--crux-hover-text") || textStrong;
    const elementHoverBg = getCruxAppVariableValue("--crux-element-hover-bg") || activeBg;
    const elementHoverBorder = getCruxAppVariableValue("--crux-element-hover-border") || activeBorder;
    const elementHoverText = getCruxAppVariableValue("--crux-element-hover-text") || hoverText;

    const variables = {
        "--crux-panel-bg": `rgba(${panelBgRgb}, ${panelOpacity})`,
        "--crux-element-bg": elementBg,
        "--crux-element-bg-light": `rgba(${elementBgRgb}, ${clampOpacity(elementOpacity * 0.7)})`,
        "--crux-element-bg-strong": elementBgStrong,
        "--crux-border-color": borderColor,
        "--crux-border-color-light": borderColorLight,
        "--crux-border-color-strong": borderColorStrong,
        "--crux-border-width": borderWidth,
        "--crux-border-width-light": widthLight,
        "--crux-border-width-strong": borderWidthStrong,
        "--crux-text-rgb": textRgb,
        "--crux-muted-text-rgb": textLightRgb,
        "--crux-text-strong-rgb": textStrongRgb,
        "--crux-text-light-rgb": textLightRgb,
        "--crux-text": text,
        "--crux-text-strong": textStrong,
        "--crux-text-light": textLight,
        "--crux-character-name-text": characterNameText,
        "--crux-action-name-text": actionNameText,
        "--crux-actor-name-text": actorNameText,
        "--crux-action-header-text": actionHeaderText,
        "--crux-actor-header-text": actorHeaderText,
        "--crux-actor-ability-text": actorAbilityText,
        "--crux-subheader-text": subheaderText,
        "--crux-item-text": itemText,
        "--crux-item-description-text": itemDescriptionText,
        "--crux-highlight-solid": String(solidHighlight),
        "--crux-active-bg": activeBg,
        "--crux-active-border": activeBorder,
        "--crux-active-glow": activeGlow,
        "--crux-hover-text": hoverText,
        "--crux-element-hover-bg": elementHoverBg,
        "--crux-element-hover-border": elementHoverBorder,
        "--crux-element-hover-text": elementHoverText,
        "--crux-badge-bg": `rgba(${borderRgb}, 0.8)`,
        "--crux-badge-text": `rgb(${panelBgRgb})`,
        "--crux-actor-ac-bg-rgb": actorAcBgRgb,
        "--crux-actor-ac-bg": `rgba(${actorAcBgRgb}, ${elementOpacity})`,
        "--crux-actor-ac-text": actorAcText,
        "--crux-actor-ac-border-rgb": actorAcBorderRgb,
        "--crux-actor-ac-border-opacity": actorAcBorderOpacity,
        "--crux-actor-ac-border-color": `rgba(${actorAcBorderRgb}, ${actorAcBorderOpacity})`,
        "--crux-actor-ac-border-width": actorAcBorderWidth,
        "--crux-input-bg": `rgba(${panelBgRgb}, ${clampOpacity(elementOpacity + 0.32)})`,
        "--crux-input-border": `rgba(${borderRgb}, 0.45)`,
        "--crux-divider-color": `rgba(${textLightRgb}, 0.28)`,
        "--crux-divider-color-light": `rgba(${textLightRgb}, 0.32)`,
        "--crux-divider-color-strong": `rgba(${textLightRgb}, 0.45)`
    };

    for (const [name, value] of Object.entries(variables)) {
        setCruxAppVariable(name, value);
    }
    syncExternalThemeRoots();
}

export function applyThemeToExternalRoot(root) {
    if (!root) return;
    const appElement = getCruxAppElement();
    const sourceStyles = appElement ? getComputedStyle(appElement) : getComputedStyle(document.documentElement);

    for (const name of [...EXTERNAL_THEME_VARIABLES, ...getElementSlotVariableNames()]) {
        const value = sourceStyles.getPropertyValue(name).trim();
        if (value) root.style.setProperty(name, value);
    }
}

export function syncExternalThemeRoots() {
    for (const root of document.querySelectorAll(".crux__activities-menu")) {
        applyThemeToExternalRoot(root);
    }
}
