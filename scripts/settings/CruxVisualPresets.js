const VISUAL_PRESETS = {
    foundry: {
        opacity: 0.5,
        elementOpacity: 0.7,
        blur: 0.5,
        palette: {
            panel: "11, 10, 19",
            element: "11, 10, 19",
            accent: "201, 89, 63",
            border: "231, 209, 177",
            text: "231, 209, 177",
            textLight: "209, 200, 195"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(201, 89, 63, 0.62)",
            "--crux-scrollbar-thumb-hover": "rgb(201, 89, 63)",
            "--crux-empty-icon-color": "var(--color-warm-1)"
        }
    },
    "foundry-light": {
        opacity: 0.9,
        elementOpacity: 0.15,
        blur: 0,
        solidHighlight: true,
        palette: {
            panel: "219, 219, 208",
            element: "0, 0, 0",
            accent: "201, 89, 63",
            border: "17, 17, 17",
            text: "17, 17, 17",
            textLight: "68, 68, 68",
            textStrong: "34, 34, 34"
        },
        variables: {
            "--crux-border-width": "1.5px",
            "--crux-border-color": "rgba(17, 17, 17, 0.38)",
            "--crux-border-color-light": "rgba(17, 17, 17, 0.30)",
            "--crux-border-color-strong": "rgba(17, 17, 17, 0.55)",
            "--crux-actor-name-text": "rgba(201, 89, 63, 0.96)",
            "--crux-actor-ability-text": "rgba(201, 89, 63, 0.94)",
            "--crux-hover-text": "rgba(245, 242, 232, 0.96)",
            "--crux-element-hover-text": "rgba(245, 242, 232, 0.96)",
            "--crux-element-bg": "rgba(0, 0, 0, 0.15)",
            "--crux-scrollbar-thumb": "rgba(201, 89, 63, 0.80)",
            "--crux-empty-icon-color": "rgb(201, 89, 63)",
            "--crux-panel-texture-image": "url('/ui/parchment.jpg')",
            "--crux-panel-texture-size": "auto",
            "--crux-panel-texture-opacity": "0.76",
            "--crux-panel-texture-blend-mode": "multiply",
            "--crux-actor-ac-bg-rgb": "17, 17, 17",
            "--crux-actor-ac-text": "rgba(201, 89, 63, 0.96)",
            "--crux-actor-ac-border-rgb": "17, 17, 17",
            "--crux-actor-ac-border-opacity": "0.5",
            "--crux-actor-ac-border-width": "0.5px"
        }
    },
    "black-glass": {
        opacity: 0.05,
        elementOpacity: 0.75,
        blur: 0,
        palette: {
            panel: "0, 0, 0",
            element: "5, 6, 8",
            accent: "190, 196, 208",
            border: "224, 229, 238",
            text: "220, 220, 220",
            textLight: "168, 168, 168",
            textStrong: "255, 255, 255"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(224, 229, 238, 0.42)",
            "--crux-scrollbar-thumb-hover": "rgba(224, 229, 238, 0.7)",
            "--crux-empty-icon-color": "rgba(5, 6, 8, 1)",
            "--crux-element-hover-text": "rgba(5, 6, 8, 0.92)"
        }
    },
    "crimson-knight": {
        opacity: 0.55,
        elementOpacity: 0.9,
        blur: 12,
        palette: {
            panel: "38, 3, 12",
            element: "7, 7, 9",
            accent: "178, 18, 55",
            border: "218, 52, 82",
            text: "231, 84, 111",
            textLight: "231, 84, 111",
            textStrong: "166, 64, 87"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(218, 52, 82, 0.45)",
            "--crux-scrollbar-thumb-hover": "rgba(218, 52, 82, 0.82)",
            "--crux-empty-icon-color": "rgb(218, 52, 82)",
            "--crux-panel-texture-image": "url('../img/textures/Leather009.webp')",
            "--crux-panel-texture-size": "256px 256px",
            "--crux-panel-texture-opacity": "0.5",
            "--crux-panel-texture-blend-mode": "overlay",
            "--crux-actor-ac-bg-rgb": "7, 7, 9",
            "--crux-actor-ac-bg": "rgba(7, 7, 9, 0.75)",
            "--crux-actor-ac-border-rgb": "178, 18, 55",
            "--crux-actor-ac-border-color": "rgba(178, 18, 55, 0.75)",
            "--crux-element-hover-text": "rgba(180, 138, 154, 0.92)"

        }
    },
    "low-lantern": {
        opacity: 0.34,
        elementOpacity: 0.6,
        blur: 4,
        palette: {
            panel: "26, 18, 10",
            element: "17, 12, 8",
            accent: "220, 143, 48",
            border: "196, 137, 78",
            text: "245, 228, 198",
            textLight: "245, 228, 198",
            textStrong: "245, 228, 198"
        },
        variables: {
            "--crux-actor-ac-bg": "rgb(17, 12, 8)",
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(220, 143, 48, 0.48)",
            "--crux-scrollbar-thumb-hover": "rgba(220, 143, 48, 0.82)",
            "--crux-empty-icon-color": "rgb(220, 143, 48)",
            "--crux-actor-ac-bg-rgb": "17, 12, 8",
            "--crux-actor-ac-bg": "rgba(17, 12, 8, 0.75)",
            "--crux-actor-ac-border-rgb": "220, 143, 48",
            "--crux-actor-ac-border-color": "rgba(220, 143, 48, 0.75)"
        }
    },
    "arcane-glass": {
        opacity: 0.22,
        elementOpacity: 0.78,
        blur: 2,
        palette: {
            panel: "5, 9, 24",
            element: "8, 10, 22",
            accent: "95, 205, 231",
            border: "122, 176, 220",
            text: "189, 205, 222",
            textLight: "189, 205, 222",
            textStrong: "95, 205, 231"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(95, 205, 231, 0.44)",
            "--crux-scrollbar-thumb-hover": "rgba(95, 205, 231, 0.78)",
            "--crux-empty-icon-color": "rgb(95, 205, 231)",
            "--crux-actor-ac-bg-rgb": "8, 10, 22",
            "--crux-actor-ac-bg": "rgba(8, 10, 22, 0.75)",
            "--crux-actor-ac-border-rgb": "95, 205, 231",
            "--crux-actor-ac-border-color": "rgba(95, 205, 231, 0.75)"
        }
    },
    "silver-steel": {
        opacity: 0.28,
        elementOpacity: 0.86,
        blur: 8,
        palette: {
            panel: "17, 18, 20",
            element: "20, 22, 25",
            accent: "191, 201, 211",
            border: "170, 181, 193",
            text: "191, 201, 211",
            textLight: "205, 211, 218",
            textStrong: "191, 201, 211"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(191, 201, 211, 0.46)",
            "--crux-scrollbar-thumb-hover": "rgba(191, 201, 211, 0.76)",
            "--crux-empty-icon-color": "rgb(191, 201, 211)",
            "--crux-panel-texture-image": "url('../img/textures/Metal011.webp')",
            "--crux-panel-texture-size": "512px 512px",
            "--crux-panel-texture-opacity": "0.5",
            "--crux-panel-texture-blend-mode": "overlay",
            "--crux-actor-ac-bg-rgb": "20, 22, 25",
            "--crux-actor-ac-bg": "rgba(20, 22, 25, 0.75)",
            "--crux-actor-ac-border-rgb": "191, 201, 211",
            "--crux-actor-ac-border-color": "rgba(191, 201, 211, 0.75)",
            "--crux-element-hover-text": "rgba(20, 22, 25, 0.92)"
        }
    },
    "emerald-ward": {
        opacity: 0.3,
        elementOpacity: 0.82,
        blur: 5,
        palette: {
            panel: "4, 21, 16",
            element: "6, 16, 13",
            accent: "66, 205, 139",
            border: "91, 165, 123",
            text: "183, 214, 195",
            textLight: "183, 214, 195",
            textStrong: "66, 205, 139"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(66, 205, 139, 0.42)",
            "--crux-scrollbar-thumb-hover": "rgba(66, 205, 139, 0.76)",
            "--crux-empty-icon-color": "rgb(66, 205, 139)",
            "--crux-actor-ac-bg-rgb": "6, 16, 13",
            "--crux-actor-ac-bg": "rgba(6, 16, 13, 0.75)",
            "--crux-actor-ac-border-rgb": "66, 205, 139",
            "--crux-actor-ac-border-color": "rgba(66, 205, 139, 0.75)",
            "--crux-element-hover-text": "rgba(6, 16, 13, 0.92)"
        }
    },
    "paper-lantern": {
        opacity: 0.9,
        elementOpacity: 1,
        blur: 12,
        palette: {
            panel: "175, 136, 39",
            element: "62, 49, 35",
            accent: "161, 83, 0",
            border: "178, 132, 79",
            text: "227, 205, 169",
            textLight: "227, 205, 169",
            textStrong: "161, 83, 0"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(161, 83, 0, 0.48)",
            "--crux-scrollbar-thumb-hover": "rgba(161, 83, 0, 0.82)",
            "--crux-empty-icon-color": "rgb(62, 49, 35)",
            "--crux-panel-texture-image": "url('../img/textures/Paper001.webp')",
            "--crux-panel-texture-size": "512px 512px",
            "--crux-panel-texture-opacity": "0.18",
            "--crux-panel-texture-blend-mode": "overlay",
            "--crux-actor-ac-bg-rgb": "62, 49, 35",
            "--crux-actor-ac-bg": "rgba(62, 49, 35, 0.75)",
            "--crux-actor-ac-border-rgb": "161, 83, 0",
            "--crux-actor-ac-border-color": "rgba(161, 83, 0, 0.75)",
            "--crux-element-hover-text": "rgba(62, 49, 35, 0.92)",
            "--crux-action-name-text": "rgba(62, 49, 35, 0.98)",
        }
    },
    "sherbet": {
        opacity: 0.5,
        elementOpacity: 0.86,
        blur: 8,
        palette: {
            panel: "247, 193, 205",
            element: "255,51,102",
            accent: "255,157,104",
            border: "243,255,149",
            text: "119, 76, 158",
            textLight: "119, 76, 158",
            textStrong: "240, 240, 26"
        },
        variables: {
            "--crux-text": "rgba(240, 240, 26, 0.92)",
            "--crux-actor-header-text": "rgba(119, 76, 158, 0.92)",
            "--crux-action-name-text": "rgba(255,157,104, 0.92)",
            "--crux-actor-name-text": "rgba(119, 76, 158, 0.92)",
            "--crux-item-description-text": "rgba(119, 76, 158, 0.76)",
            "--crux-action-header-text": "rgba(240, 240, 26, 0.92)",
            "--crux-subheader-text": "rgba(119, 76, 158, 0.99)",
            "--crux-item-text": "rgba(119, 76, 158, 0.99)",
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(255,157,104, 0.46)",
            "--crux-scrollbar-thumb-hover": "rgba(255,157,104, 0.76)",
            "--crux-empty-icon-color": "rgb(255,51,102)",
            "--crux-actor-ac-bg-rgb": "255, 51, 102",
            "--crux-actor-ac-text": "var(--crux-text)"
        }
    },
    "carolingian-teal": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "68, 147, 173",
            border: "32, 37, 43",
            text: "230, 235, 235",
            textLight: "190, 198, 214",
            textStrong: "68, 147, 173"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(68, 147, 173, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(68, 147, 173, 0.8)",
            "--crux-empty-icon-color": "rgb(68, 147, 173)",
            "--crux-actor-ac-bg-rgb": "38, 42, 58",
            "--crux-actor-ac-bg": "rgba(38, 42, 58, 0.75)",
            "--crux-actor-ac-border-rgb": "68, 147, 173",
            "--crux-actor-ac-border-color": "rgba(68, 147, 173, 0.75)",
            "--crux-element-hover-text": "rgba(230, 235, 235, 0.92)",
            "--crux-actor-name-text": "rgba(68, 147, 173, 1)"
        }
    },
    "royal-blood": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "159, 35, 49",
            border: "32, 37, 43",
            text: "230, 235, 235",
            textLight: "207, 196, 211",
            textStrong: "183, 118, 132"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(159, 35, 49, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(159, 35, 49, 0.82)",
            "--crux-empty-icon-color": "rgb(159, 35, 49)",
            "--crux-actor-ac-bg-rgb": "28, 22, 34",
            "--crux-actor-ac-bg": "rgba(28, 22, 34, 0.75)",
            "--crux-actor-ac-border-rgb": "159, 35, 49",
            "--crux-actor-ac-border-color": "rgba(159, 35, 49, 0.75)",
            "--crux-element-hover-text": "rgba(28, 22, 34, 0.92)",
            "--crux-actor-name-text": "rgba(28, 22, 34, 0.98)",
            "--crux-actor-name-text": "rgba(159, 35, 49, 1)"
        }
    },
    "dark-sorcery": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "126, 88, 182",
            border: "32, 37, 43",
            text: "230, 235, 235",
            textLight: "198, 211, 216",
            textStrong: "126, 88, 182"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(126, 88, 182, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(126, 88, 182, 0.82)",
            "--crux-empty-icon-color": "rgb(126, 88, 182)",
            "--crux-actor-ac-bg-rgb": "22, 32, 36",
            "--crux-actor-ac-bg": "rgba(22, 32, 36, 0.75)",
            "--crux-actor-ac-border-rgb": "126, 88, 182",
            "--crux-actor-ac-border-color": "rgba(126, 88, 182, 0.75)",
            "--crux-element-hover-text": "rgba(198, 211, 216, 0.92)",
            "--crux-actor-name-text": "rgba(22, 32, 36, 0.98)",
            "--crux-actor-name-text": "rgba(126, 88, 182, 1)"
        }
    },
    "grass-and-stone": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "121, 163, 62",
            border: "32, 37, 43",
            text: "230, 235, 235",
            textLight: "198, 210, 204",
            textStrong: "121, 163, 62"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(121, 163, 62, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(121, 163, 62, 0.8)",
            "--crux-empty-icon-color": "rgb(121, 163, 62)",
            "--crux-actor-ac-bg-rgb": "32, 37, 43",
            "--crux-actor-ac-bg": "rgba(32, 37, 43, 0.75)",
            "--crux-actor-ac-border-rgb": "121, 163, 62",
            "--crux-actor-ac-border-color": "rgba(121, 163, 62, 0.75)",
            "--crux-element-hover-text": "rgba(230, 235, 235, 0.92)",
            "--crux-actor-name-text": "rgba(121, 163, 62, 1)"
        }
    },
    "gold-and-chocolate": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "164, 138, 51",
            border: "32, 37, 43",
            text: "230, 235, 235",
            textLight: "211, 198, 178",
            textStrong: "164, 138, 51"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(164, 138, 51, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(164, 138, 51, 0.82)",
            "--crux-empty-icon-color": "rgb(164, 138, 51)",
            "--crux-actor-ac-bg-rgb": "32, 37, 43",
            "--crux-actor-ac-bg": "rgba(32, 37, 43, 0.75)",
            "--crux-actor-ac-border-rgb": "164, 138, 51",
            "--crux-actor-ac-border-color": "rgba(164, 138, 51, 0.75)",
            "--crux-element-hover-text": "rgba(230, 235, 235, 0.92)",
            "--crux-actor-name-text": "rgba(164, 138, 51, 1)",
            "--crux-divider-color": "rgba(164, 138, 51, 0.75)",
            "--crux-divider-color-strong": "rgba(164, 138, 51, 0.75)",
            "--crux-active-border": "rgba(24, 18, 17, 0.75)"
        }
    },
    "pumpkin-patch": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "220, 120, 43",
            border: "32, 37, 43",
            text: "230, 235, 235",
            textLight: "215, 198, 190",
            textStrong: "220, 120, 43"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(220, 120, 43, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(220, 120, 43, 0.82)",
            "--crux-empty-icon-color": "rgb(220, 120, 43)",
            "--crux-actor-ac-bg-rgb": "32, 37, 43",
            "--crux-actor-ac-bg": "rgba(32, 37, 43, 0.75)",
            "--crux-actor-ac-border-rgb": "220, 120, 43",
            "--crux-actor-ac-border-color": "rgba(220, 120, 43, 0.75)",
            "--crux-element-hover-text": "rgba(230, 235, 235, 0.92)",
            "--crux-actor-name-text": "rgba(220, 120, 43, 1)",
            "--crux-divider-color": "rgba(220, 120, 43, 0.75)"
        }
    },
    "plum-purple": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "146, 42, 96",
            border: "32, 37, 43",
            text: "230, 235, 235",
            textLight: "198, 203, 211",
            textStrong: "146, 42, 96"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(146, 42, 96, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(146, 42, 96, 0.82)",
            "--crux-empty-icon-color": "rgb(146, 42, 96)",
            "--crux-actor-ac-bg-rgb": "32, 37, 43",
            "--crux-actor-ac-bg": "rgba(32, 37, 43, 0.75)",
            "--crux-actor-ac-border-rgb": "146, 42, 96",
            "--crux-actor-ac-border-color": "rgba(146, 42, 96, 0.75)",
            "--crux-element-hover-text": "rgba(230, 235, 235, 0.92)",
            "--crux-actor-name-text": "rgba(146, 42, 96, 1)",
            "--crux-divider-color": "rgba(146, 42, 96, 0.75)"
        }
    },
    "gambits-blue": {
        opacity: 1,
        elementOpacity: 1,
        blur: 12,
        solidHighlight: true,
        palette: {
            panel: "11, 10, 19",
            element: "32, 37, 43",
            accent: "45, 126, 207",
            border: "32, 37, 43",
            text: "78, 125, 167",
            textLight: "195, 198, 218",
            textStrong: "83, 148, 198"
        },
        variables: {
            "--crux-scrollbar-track": "transparent",
            "--crux-scrollbar-thumb": "rgba(45, 126, 207, 0.6)",
            "--crux-scrollbar-thumb-hover": "rgba(45, 126, 207, 0.82)",
            "--crux-empty-icon-color": "rgb(45, 126, 207)",
            "--crux-actor-ac-border-color": "rgba(45, 126, 207, 0.98)",
            "--crux-actor-ac-bg": "rgba(32, 37, 43, 0.68)",
            "--crux-actor-ac-border-rgb": "45, 126, 207",
            "--crux-actor-ac-bg-rgb": "32, 37, 43",
            "--crux-actor-ac-text": "rgba(45, 126, 207, 0.6)",
            "--crux-element-hover-text": "rgba(230, 235, 235, 0.92)",
            "--crux-actor-name-text": "rgba(45, 126, 207, 1)",
            "--crux-divider-color": "rgba(45, 126, 207, 0.75)"
        }
    }
};

export default VISUAL_PRESETS;
