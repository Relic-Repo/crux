export function createCruxSettingDefinitions(CruxSettings) {
    return {
        "tray-mode": {
            name: "Tray Display Mode",
            hint: "Toggle - only hide tray when toggled (using hot key) / When token selected - Hide the tray if no tokens are selected, show otherwise / Automatic - Toggle for players, When token selected for the GM",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "auto": "Automatic",
                "always": "Always Show",
                "manual": "Toggle"
            },
            default: "manual"
        },
        "assume-default-character": {
            name: "Assume Default Character",
            hint: "When no other token is selected, show the tray for the user's default character (usually only set for players). This can help with scenes with no tokens (or a generic party token) visible.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "allow-player-scene-elevation": {
            name: "Allow Players Scene Elevation",
            hint: "Allow players to use the Scene elevation mode in the Crux elevation flyout. Players never see the scene level selection list.",
            scope: "world",
            config: true,
            restricted: true,
            type: Boolean,
            default: false,
            onChange: () => {
                game.crux?.CruxElevationAppV2?.activeInstance?.render();
            }
        },
        "show-favorites-section": {
            name: "Show Favorites Section",
            hint: "Display the Favorites section in the tray.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "show-equipped-section": {
            name: "Show Equipped Section",
            hint: "Display the Equipped section in the tray.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "show-features-section": {
            name: "Show Features Section",
            hint: "Display the Features section in the tray.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "show-spells-section": {
            name: "Show Spells Section",
            hint: "Display the Spells section in the tray.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "show-inventory-section": {
            name: "Show Inventory Section",
            hint: "Display the Inventory section in the tray.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "use-tidy5e-sections": {
            name: "Use Tidy 5e Sheet Sections",
            hint: "When enabled, recognizes and uses Tidy 5e Sheet sections instead of standard Crux sections.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "show-quantity": {
            name: "Show Quantity (Q)",
            hint: "Display the quantity indicator for items in the tray.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "show-uses": {
            name: "Show Uses (U)",
            hint: "Display the uses indicator for items in the tray.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "show-no-uses": {
            name: "Show Items With No Uses Left",
            hint: "Display items in the tray even when they have no remaining uses.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "show-unprepared-cantrips": {
            name: "Show Unprepared Cantrips",
            hint: "Show cantrips in the tray even if they are not prepared.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "show-all-npc-items": {
            name: "Show All NPC Items",
            hint: "Display all items for NPCs in the tray, not just passive ones.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "show-spell-dots": {
            name: "Show Spell Slot Dots",
            hint: "Display dots indicating available spell slots.",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "show-spell-fractions": {
            name: "Show Spell Slot Numbers",
            hint: "Display numerical fractions showing available/maximum spell slots.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "sort-alphabetic": {
            name: "Sort Items Alphabetically",
            hint: "Sort items in alphabetical order rather than by their default sorting.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "exclude-container-items": {
            name: "crux.settings.exclude-container-items.name",
            hint: "crux.settings.exclude-container-items.hint",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "skill-mode": {
            name: "Skill List Location",
            hint: "If 'Collapsible at the top' is selected, the skill toggle hot key (in control settings) can be used to toggle the skill list open and closed, opening the panel if needed. If skills are at the bottom of the panel, the hotkey automatically scrolls to reveal them.",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "none": "None",
                "dropdown": "Collapsible at the top",
                "append": "At the bottom of the panel"
            },
            default: "dropdown"
        },
        "skills-expanded": {
            name: "Skills Section Default State",
            hint: "Choose whether the Skills section starts expanded or collapsed by default",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "open": "Open",
                "collapsed": "Collapsed"
            },
            default: "collapsed"
        },
        "main-sections-expanded": {
            name: "Main Sections Default State",
            hint: "Choose whether the main sections (like Features, Spells, etc.) start expanded or collapsed by default",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "open": "Open",
                "collapsed": "Collapsed"
            },
            default: "open"
        },
        "sub-sections-expanded": {
            name: "Sub-Sections Default State",
            hint: "Choose whether sub-sections (like spell levels) start expanded or collapsed by default",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "open": "Open",
                "collapsed": "Collapsed"
            },
            default: "collapsed"
        },
        "icon-size": {
            name: "Icon Size",
            hint: "Set the size of icons in the tray.",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "small": "Small",
                "medium": "Medium",
                "large": "Large"
            },
            default: "small"
        },
        "tray-size": {
            name: "Tray Size",
            hint: "Set the overall size of the tray interface.",
            scope: "client",
            config: true,
            type: Number,
            range: {
                min: 200,
                max: 300,
                step: 1
            },
            default: 230
        },
        "tab-height-multiplier": {
            name: "Tab Height Multiplier",
            hint: "Adjust the vertical height of Crux tab buttons.",
            scope: "client",
            config: true,
            type: Number,
            range: {
                min: 0.5,
                max: 1.5,
                step: 0.05
            },
            default: 1.0,
            onChange: value => {
                CruxSettings._updateTabHeightMultiplier(value);
            }
        },
        "health-overlay-enabled": {
            name: "Enable Health Overlay",
            hint: "Show a dynamic health overlay on character portraits",
            scope: "client",
            config: true,
            type: Boolean,
            default: true
        },
        "health-overlay-direction": {
            name: "Health Overlay Direction",
            hint: "Choose whether the health overlay fills up or down",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "up": "Fill Up",
                "down": "Fill Down"
            },
            default: "up"
        },
        "font-family": {
            name: "Font Family",
            hint: "Choose the font family used throughout the interface",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "modesto": "Modesto Condensed (Default)",
                "signika": "Signika",
                "roboto": "Roboto Slab",
                "carolingian-ui": "Carolingian UI",
                "custom": "Custom Font"
            },
            default: "modesto"
        },
        "custom-font-family": {
            name: "Custom Font Family",
            hint: "Specify a custom font family (only used when Font Family is set to 'Custom Font')",
            scope: "client",
            config: true,
            type: String,
            default: ""
        },
"global-font-size-multiplier": {
    name: "Global Font Size Multiplier",
    hint: "Adjust the size of all text in the interface. 1.0 is the recommended default scale.",
    scope: "client",
    config: true,
    type: Number,
    range: {
        min: 0.1,
        max: 2,
        step: 0.1
    },
    default: 1.0,
    onChange: value => {
        if (game.crux?.app) {
            CruxSettings._updateGlobalFontSizeMultiplier();
        }
    }
},
"global-font-scale-rebased": {
    name: "Global Font Scale Rebased",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
},
"content-text-size-multiplier": {
    name: "Content Text Size Multiplier",
    hint: "Adjust the size of content text elements like item descriptions, abilities, and skills while maintaining proportions (0.5 = half size, 1.0 = default, 1.5 = 50% larger)",
    scope: "client",
    config: true,
    type: Number,
    range: {
        min: 0.5,
        max: 1.5,
        step: 0.1
    },
    default: 1.0
},
"character-name-size-multiplier": {
    name: "Character Name Size Multiplier",
    hint: "Adjust the size of character names in the interface (0.5 = half size, 1.0 = default, 1.5 = 50% larger). This setting is independent of other font size settings.",
    scope: "client",
    config: true,
    type: Number,
    range: {
        min: 0.5,
        max: 1.5,
        step: 0.1
    },
    default: 1.0,
    onChange: value => {
        if (game.crux?.app) {
            CruxSettings._updateCharacterNameSizeMultiplier();
        }
    }
},
"actor-ability-text-size-multiplier": {
    name: "Actor Ability Text Size Multiplier",
    hint: "Adjust only the Actor Panel ability button text size. Use this if ability buttons overflow the portrait area.",
    scope: "client",
    config: true,
    type: Number,
    range: {
        min: 0.5,
        max: 1.5,
        step: 0.05
    },
    default: 1.0
},
"visual-preset": {
    name: "Visual Preset",
    hint: "Choose a visual style for Crux. Changing this also moves Panel Opacity to the preset default.",
    scope: "client",
    config: true,
    type: String,
    choices: {
        foundry: "Foundry Dark",
        "foundry-light": "Foundry Light",
        "black-glass": "Black Glass",
        "crimson-knight": "Crimson Knight",
        "low-lantern": "Low Lantern",
        "arcane-glass": "Arcane Glass",
        "silver-steel": "Silver Steel",
        "emerald-ward": "Emerald Ward",
        "paper-lantern": "Paper Lantern",
        "sherbet": "Sherbet",
        "carolingian-teal": "Carolingian Teal",
        "royal-blood": "Royal Blood",
        "dark-sorcery": "Dark Sorcery",
        "grass-and-stone": "Grass and Stone",
        "gold-and-chocolate": "Gold and Chocolate",
        "pumpkin-patch": "Pumpkin Patch",
        "plum-purple": "Plum Purple",
        "gambits-blue": "Gambit's Blue"
    },
    default: "foundry"
},
"panel-opacity": {
    name: "Panel Opacity",
    hint: "Adjust the background opacity of the Crux panel backdrop.",
    scope: "client",
    config: true,
    type: Number,
    range: {
        min: 0,
        max: 1,
        step: 0.05
    },
    default: 0.5
},
"element-opacity": {
    name: "Element Opacity",
    hint: "Adjust the background opacity of Crux cards, buttons, tabs, and boxed controls.",
    scope: "client",
    config: true,
    type: Number,
    range: {
        min: 0,
        max: 1,
        step: 0.05
    },
    default: 0.7
},
"panel-blur": {
    name: "Panel Blur",
    hint: "Adjust the glass blur behind the Crux panel. 0 disables blur.",
    scope: "client",
    config: true,
    type: Number,
    range: {
        min: 0,
        max: 12,
        step: 0.5
    },
    default: 0.5
},
        "taskbar-compatibility": {
            name: "Taskbar Compatibility",
            hint: "Enable compatibility with the Taskbar module (Requires Refresh)",
            scope: "client",
            config: true,
            type: Boolean,
            default: true,
            onChange: value => {
                const isTaskbarActive = game.modules.get("foundry-taskbar")?.active;
                const taskbar = document.querySelector("#taskbar");
                const taskbarHeight = taskbar?.getBoundingClientRect().height ?? 0;
                const shouldOffsetTray = isTaskbarActive && value && taskbarHeight > 0;
                const offset = shouldOffsetTray ? `${taskbarHeight}px` : '0px';
                CruxSettings.setCruxGlobalVariable('--crux-taskbar-height', `${taskbarHeight || 50}px`);
                CruxSettings.setCruxGlobalVariable('--crux-tray-bottom-offset', offset);
                document.body.classList.toggle("crux-taskbar-compat", shouldOffsetTray);
            }
        },
        "empty-tray-icon": {
            name: "Empty Tray Icon",
            hint: "Choose the icon to display when the tray is empty",
            scope: "client",
            config: true,
            type: String,
            choices: {
                "fa-thin fa-dragon": "Dragon",
                "fa-brands fa-d-and-d": "D&D",
                "fa-thin fa-helmet-battle": "Helm",
                "fa-thin fa-swords": "Swords",
                "fa-thin fa-staff": "Staff",
                "fa-thin fa-wand": "Wand",
                "fa-thin fa-paw-claws": "Paw",
                "fa-thin fa-mandolin": "Mandolin",
                "fa-thin fa-bow-arrow": "Bow",
                "fa-thin fa-axe-battle": "Battle-Axe",
                "fa-thin fa-mace": "Mace",
                "fa-thin fa-hammer-war": "Warhammer",
                "fa-thin fa-dagger": "Dagger",
                "fa-thin fa-hand-fist": "Fist",
                "fa-thin fa-fire-flame": "Pyro",
                "fa-thin fa-flask-round-potion": "Potion",
                "fa-thin fa-scroll-old": "Scroll",
                "fa-thin fa-dungeon": "Dungeon",
                "fa-thin fa-eye-evil": "The-Eye",
                "fa-thin fa-dice-d20": "D20"
            },
            default: "fa-thin fa-dragon"
        },
        "auto-select-first-activity": {
            name: "Auto-select First Activity",
            hint: "When enabled, Crux will automatically use the first activity without showing the activity selection dialog. When disabled, the system will handle activity selection according to its own rules.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        },
        "process-compendium-items": {
            name: "Process Compendium Items",
            hint: "When enabled, Crux will process items in unlocked compendiums to set tray visibility flags. Disable this if you experience performance issues during startup.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        }
    };
}
