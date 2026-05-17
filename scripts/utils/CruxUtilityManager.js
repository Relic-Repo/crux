/**
 * Utility class for Crux module to handle item activities and execution
 */
export default class CruxUtils {
    /**
     * Check whether a dnd5e skip-dialog keybinding is active for this event.
     * @param {Event} event - The triggering event
     * @returns {boolean} True if a dnd5e skip-dialog binding is active
     */
    static isDnd5eSkipDialogEvent(event) {
        if (!event || game.system.id !== "dnd5e") return false;
        const downKeys = game.keyboard?.downKeys ?? new Set();
        const activeModifiers = new Set();
        if (event.altKey) {
            activeModifiers.add("Alt");
            activeModifiers.add("AltLeft");
            activeModifiers.add("AltRight");
        }
        if (event.ctrlKey) {
            activeModifiers.add("Control");
            activeModifiers.add("ControlLeft");
            activeModifiers.add("ControlRight");
        }
        if (event.metaKey) {
            activeModifiers.add("Meta");
            activeModifiers.add("OsLeft");
            activeModifiers.add("OsRight");
        }
        if (event.shiftKey) {
            activeModifiers.add("Shift");
            activeModifiers.add("ShiftLeft");
            activeModifiers.add("ShiftRight");
        }

        const isPressed = key => downKeys.has(key) || activeModifiers.has(key);
        const bindings = ["skipDialogNormal", "skipDialogAdvantage", "skipDialogDisadvantage"];
        return bindings.some(action => game.keybindings.get("dnd5e", action)?.some(binding => {
            const modifiers = binding.modifiers ?? [];
            if (isPressed(binding.key) && modifiers.every(isPressed)) return true;
            if (modifiers.length) return false;
            return activeModifiers.has(binding.key);
        }));
    }

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
        const configure = !CruxUtils.isDnd5eSkipDialogEvent(event);
        if (activityId && item?.system?.activities) {
            let activity = null;
            try {
                if (item.system.activities.contents) {
                    if (item.system.activities.contents[activityId]) {
                        activity = item.system.activities.contents[activityId];
                    } else {
                        const allActivities = Object.values(item.system.activities.contents)
                            .filter(a => a !== undefined);
                        activity = allActivities.find(a => a.id === activityId || a._id === activityId);
                    }
                } else if (item.system.activities instanceof Map) {
                    activity = item.system.activities.get(activityId);
                }
            } catch (e) {
                console.warn("❌ Error finding activity:", e);
            }
            if (activity) {
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
                
                const result = activity.use({ 
                    event,
                    configure,
                    createScrollItem: false 
                });
                return result;
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
            const result = activity.use({ 
                event,
                configure,
                createScrollItem: false 
            });
            return result;
        }        
        if (activities.length > 0 && event?.fromCrux) {
            const autoSelectFirstActivity = game.settings.get("crux", "auto-select-first-activity");
            if (autoSelectFirstActivity) {
                const firstActivity = activities[0];
                const placesTemplate = item.hasAreaTarget || 
                                      (item.system.target?.type === "template") || 
                                      (firstActivity.target?.type === "template");            
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
                const result = firstActivity.use({ 
                    event,
                    configure,
                    createScrollItem: false 
                });
                return result;
            }
        }        
        let useOptions = {
            legacy: false,
            event: event,
            chooseActivity: false,
            configure,
        };
        if (event?.createScrollItem !== undefined) {
            useOptions.createScrollItem = event.createScrollItem;
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
