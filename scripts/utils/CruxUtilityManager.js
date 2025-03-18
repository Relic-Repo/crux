/**
 * Utility class for Crux module to handle item activities and execution
 */
export default class CruxUtils {
    /**
     * Filters activities for an item, ensuring only valid ones are considered.
     * @param {Item5e} item - The item to filter activities from.
     * @returns {Array} - Filtered list of activities.
     */
    static filterActivities(item) {
        if (!item?.system?.activities) return [];

        return Object.values(item.system.activities.contents).filter(
            activity => !item.getFlag("dnd5e", "riders.activity")?.includes(activity.id)
        );
    }

    /**
     * Prepares execution context for an activity before use.
     * @param {Object} activity - The activity to prepare execution for.
     * @returns {Object} - Execution context.
     */
    static prepareExecution(activity) {
        const hasRecharge = activity.uses?.max && activity.uses.recovery?.[0]?.period === "recharge";
        const isOnCooldown = hasRecharge && activity.uses.value < 1;

        return {
            id: activity.id,
            activity,
            hasRecharge,
            isOnCooldown,
            activation: activity.activation?.type
                ? `${activity.activation.value ?? ""} ${game.i18n.localize("DND5E." + activity.activation.type + "Abbr")}`
                : activity.labels.activation,
            save: activity.save 
                ? { ability: activity.save.ability?.size 
                    ? (activity.save.ability.size === 1 
                        ? CONFIG.DND5E.abilities[activity.save.ability.first()]?.abbreviation 
                        : game.i18n.localize("DND5E.AbbreviationDC"))
                    : null }
                : null,
            toHit: isNaN(parseInt(activity.labels.toHit)) ? null : parseInt(activity.labels.toHit)
        };
    }

    /**
     * Activates an item or activity, ensuring correct filtering and execution.
     * @param {string} itemUuid - The UUID of the item to activate.
     * @param {string} [activityId] - Optional activity ID to execute.
     * @param {Event} [event] - Optional event that triggered the activation.
     * @returns {Promise} - Promise that resolves when the item is used.
     */
    static activateItem(itemUuid, activityId = null, event = null) {
        if (!itemUuid) return;
        const item = fromUuidSync(itemUuid);
        if (!item) return;
        if (game.crux) {
            game.crux.cruxItemActive = true;
            if (canvas.tokens.controlled.length > 0) {
                game.crux.lastSelectedTokens = canvas.tokens.controlled.map(t => ({
                    tokenId: t.id,
                    actorId: t.actor?.id,
                    name: t.name || t.document.name
                }));
            }
        }
        const activities = CruxUtils.filterActivities(item);
        if (activityId) {
            const activity = activities.find(a => a.id === activityId);
            if (!activity) {
                console.warn("❌ Activity not found in filtered list.");
                if (game.crux) game.crux.cruxItemActive = false;
                return;
            }
            const placesTemplate = item.hasAreaTarget || 
                                  (item.system.target?.type === "template") || 
                                  (activity.target?.type === "template");
            
            if (placesTemplate) {
                Hooks.once("updateMeasuredTemplate", (template, updates, options, userId) => {
                    if (userId !== game.user.id) return;
                    ui.controls.initialize({ tool: "select", control: "token" });
                    if (game.crux?.lastSelectedTokens?.length > 0) {
                        const tokenId = game.crux.lastSelectedTokens[0].tokenId;
                        const actorId = game.crux.lastSelectedTokens[0].actorId;
                        let token = canvas.tokens.placeables.find(t => t.id === tokenId);
                        if (!token && actorId) {
                            token = canvas.tokens.placeables.find(t => t.actor?.id === actorId);
                        }
                        
                        if (token) {
                            token.control();
                        }
                    }
                    
                    if (game.crux) {
                        game.crux.cruxItemActive = false;
                    }
                });
            } else {
                setTimeout(() => {
                    if (game.crux) {
                        game.crux.cruxItemActive = false;
                    }
                }, 500);
            }
            if (event?.targetToken) {
                const result = activity.use({
                    event: event,
                    targets: [event.targetToken],
                    configure: true,
                    createScrollItem: false
                });
                return result;
            } else {
                const result = activity.use({ 
                    event,
                    configure: true,
                    createScrollItem: false 
                });
                return result;
            }
        }
        let useOptions = {
            legacy: false,
            event: event,
            chooseActivity: false,
            configure: true,
        };
        if (event?.fromCrux && item.type === "spell") {
            useOptions.createScrollItem = false;
        } else if (event?.createScrollItem !== undefined) {
            useOptions.createScrollItem = event.createScrollItem;
        }
        
        if (event?.targetToken) {
            useOptions.targets = [event.targetToken];
        }
        
        const result = item.use(useOptions);
        const placesTemplate = item.hasAreaTarget || (item.system.target?.type === "template");
        
        if (placesTemplate) {
            Hooks.once("updateMeasuredTemplate", (template, updates, options, userId) => {
                if (userId !== game.user.id) return;
                ui.controls.initialize({ tool: "select", control: "token" });
                if (game.crux?.lastSelectedTokens?.length > 0) {
                    const tokenId = game.crux.lastSelectedTokens[0].tokenId;
                    const actorId = game.crux.lastSelectedTokens[0].actorId;
                    let token = canvas.tokens.placeables.find(t => t.id === tokenId);
                    if (!token && actorId) {
                        token = canvas.tokens.placeables.find(t => t.actor?.id === actorId);
                    }
                    
                    if (token) {
                        token.control();
                    }
                }
                if (game.crux) {
                    game.crux.cruxItemActive = false;
                }
            });
        } else {
            setTimeout(() => {
                if (game.crux) {
                    game.crux.cruxItemActive = false;
                }
            }, 500);
        }
        
        return result;
    }
}
