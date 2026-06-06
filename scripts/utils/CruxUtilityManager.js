export default class CruxUtils {
    /**
     * Check whether a dnd5e skip-dialog keybinding is active.
     * @param {Event} event
     * @returns {boolean}
     */
    static isDnd5eSkipDialogEvent(event) {
        if (!event || game.system.id !== "dnd5e") return false;
        return ["skipDialogNormal", "skipDialogAdvantage", "skipDialogDisadvantage"]
            .some(action => this.isDnd5eKeybindingEvent(event, action));
    }

    /**
     * Check whether a dnd5e keybinding is active for an event.
     * @param {Event} event
     * @param {string} action
     * @returns {boolean}
     */
    static isDnd5eKeybindingEvent(event, action) {
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
        return game.keybindings.get("dnd5e", action)?.some(binding => {
            const modifiers = binding.modifiers ?? [];
            if (isPressed(binding.key) && modifiers.every(isPressed)) return true;
            if (modifiers.length) return false;
            return activeModifiers.has(binding.key);
        }) ?? false;
    }

    /**
     * Get dnd5e advantage options from skip-dialog keybindings.
     * @param {Event} event
     * @returns {Object}
     */
    static getDnd5eRollOptionsFromSkipDialogEvent(event) {
        if (this.isDnd5eKeybindingEvent(event, "skipDialogAdvantage")) return { advantage: true };
        if (this.isDnd5eKeybindingEvent(event, "skipDialogDisadvantage")) return { disadvantage: true };
        return {};
    }

    /**
     * Filter rider activities from an item.
     * @param {Item5e} item
     * @returns {Array}
     */
    static filterActivities(item) {
        if (!item?.system?.activities) return [];
        return Object.values(item.system.activities.contents).filter(
            activity => !item.getFlag("dnd5e", "riders.activity")?.includes(activity.id)
        );
    }

    /**
     * Prepare display data for an activity.
     * @param {Object} activity
     * @returns {Object}
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
     * Activate an item or activity.
     * @param {string} itemUuid
     * @param {string} [activityId]
     * @param {Event} [event]
     * @returns {Promise}
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
                console.warn("Crux | Error finding activity", e);
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
                console.warn("Crux | Activity not found in filtered list");
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
