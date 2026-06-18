export const CRUX_FOUNDRY_PATHS = {
    token: {
        elevation: [
            "_source.elevation",
            "elevation"
        ],
        level: [
            "_source.level",
            "level"
        ],
        movementAction: {
            source: [
                "_source.movementAction"
            ],
            effective: [
                "movementAction"
            ],
            update: "movementAction"
        }
    },
    scene: {
        levels: [
            "levels"
        ],
        initialLevel: [
            "initialLevel"
        ]
    },
    level: {
        base: [
            "elevation.base",
            "elevation.bottom"
        ],
        top: [
            "elevation.top"
        ],
        bottom: [
            "elevation.bottom"
        ]
    }
};
