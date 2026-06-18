export const CRUX_DND5E_PATHS = {
    actor: {
        abilities: [
            "system.abilities",
            "data.data.abilities"
        ],
        attributes: [
            "system.attributes",
            "data.data.attributes"
        ],
        details: [
            "system.details",
            "data.data.details"
        ],
        favorites: [
            "system.favorites",
            "data.data.favorites"
        ],
        hp: {
            value: [
                "system.attributes.hp.value",
                "data.data.attributes.hp.value"
            ],
            max: [
                "system.attributes.hp.max",
                "data.data.attributes.hp.max"
            ],
            temp: [
                "system.attributes.hp.temp",
                "data.data.attributes.hp.temp"
            ],
            updateValue: "system.attributes.hp.value",
            updateTemp: "system.attributes.hp.temp"
        },
        movement: [
            "system.attributes.movement",
            "data.data.attributes.movement"
        ],
        senses: [
            "system.attributes.senses.ranges",
            "system.attributes.senses",
            "data.data.attributes.senses.ranges",
            "data.data.attributes.senses"
        ],
        spells: [
            "system.spells",
            "data.data.spells"
        ]
    },
    item: {
        activities: [
            "system.activities",
            "data.data.activities"
        ],
        description: [
            "system.description.value",
            "system.description",
            "data.data.description.value",
            "data.data.description"
        ],
        quantity: {
            value: [
                "system.quantity",
                "data.data.quantity"
            ],
            update: "system.quantity"
        },
        uses: {
            value: [
                "system.uses.value",
                "data.data.uses.value"
            ],
            max: [
                "system.uses.max",
                "data.data.uses.max"
            ],
            spent: [
                "system.uses.spent",
                "data.data.uses.spent"
            ],
            recovery: [
                "system.uses.recovery",
                "data.data.uses.recovery"
            ],
            updateValue: "system.uses.value",
            updateSpent: "system.uses.spent"
        }
    }
};
