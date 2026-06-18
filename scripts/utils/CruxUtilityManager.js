import CruxDragDropUtils from "./CruxDragDropUtils.js";
import CruxDnd5eAccess from "../runtime/dnd5e/CruxDnd5eAccess.js";

export default class CruxUtils {
    static isDnd5eSkipDialogEvent(event) {
        if (!event || game.system.id !== "dnd5e") return false;
        return ["skipDialogNormal", "skipDialogAdvantage", "skipDialogDisadvantage"]
            .some(action => this.isDnd5eKeybindingEvent(event, action));
    }

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

    static getDnd5eRollOptionsFromSkipDialogEvent(event) {
        if (this.isDnd5eKeybindingEvent(event, "skipDialogAdvantage")) return { advantage: true };
        if (this.isDnd5eKeybindingEvent(event, "skipDialogDisadvantage")) return { disadvantage: true };
        return {};
    }

    static filterActivities(item) {
        return CruxDnd5eAccess.getActivityEntries(item).map(([, activity]) => activity).filter(
            activity => !item.getFlag("dnd5e", "riders.activity")?.includes(activity.id)
        );
    }

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

    static _finishItemActivation(render = false) {
        if (!game.crux) return;
        game.crux.cruxItemActive = false;
        game.crux.cruxTemplateRestoreActive = false;
        if (render) game.crux.app?.render();
    }

    static _restoreLastSelectedTokens() {
        const savedTokens = game.crux?.lastSelectedTokens ?? [];
        let hasControlled = false;
        for (const saved of savedTokens) {
            if (saved.sceneId && canvas.scene?.id !== saved.sceneId) continue;
            let token = canvas.tokens.placeables.find(t => t.id === saved.tokenId);
            if (!token && saved.actorId) {
                token = canvas.tokens.placeables.find(t => t.actor?.id === saved.actorId);
            }
            if (!token) continue;
            token.control({ releaseOthers: !hasControlled });
            hasControlled = true;
        }
    }

    static _watchTemplatePlacement() {
        if (!game.crux) return;
        game.crux.cruxTemplateRestoreActive = true;

        let done = false;
        let createHook;
        let updateHook;
        let createRegionHook;
        let updateRegionHook;
        let timeoutId;

        const cleanup = render => {
            if (done) return;
            done = true;
            if (createHook !== undefined) Hooks.off("createMeasuredTemplate", createHook);
            if (updateHook !== undefined) Hooks.off("updateMeasuredTemplate", updateHook);
            if (createRegionHook !== undefined) Hooks.off("createRegion", createRegionHook);
            if (updateRegionHook !== undefined) Hooks.off("updateRegion", updateRegionHook);
            if (timeoutId) clearTimeout(timeoutId);
            CruxUtils._finishItemActivation(render);
        };

        const restore = () => {
            ui.controls.initialize({ tool: "select", control: "token" });
            CruxUtils._restoreLastSelectedTokens();
            cleanup(true);
        };

        const onTemplatePlaced = (...args) => {
            const userId = args.at(-1);
            if (userId && userId !== game.user.id) return;
            setTimeout(restore, 0);
        };

        const onRegionTemplatePlaced = (region, ...args) => {
            const isTemplateRegion = foundry.utils.getProperty(region, "flags.core.MeasuredTemplate")
                || region?.getFlag?.("core", "MeasuredTemplate");
            if (!isTemplateRegion) return;
            onTemplatePlaced(region, ...args);
        };

        createHook = Hooks.on("createMeasuredTemplate", onTemplatePlaced);
        updateHook = Hooks.on("updateMeasuredTemplate", onTemplatePlaced);
        createRegionHook = Hooks.on("createRegion", onRegionTemplatePlaced);
        updateRegionHook = Hooks.on("updateRegion", onRegionTemplatePlaced);
        timeoutId = setTimeout(() => cleanup(true), 15000);
    }

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
                    sceneId: t.scene?.id,
                    name: t.name || t.document.name
                }));
            }
        }
        const configure = !CruxUtils.isDnd5eSkipDialogEvent(event);
        if (activityId && CruxDnd5eAccess.hasActivities(item)) {
            const activity = CruxDnd5eAccess.getActivity(item, activityId);
            if (activity) {
                const placesTemplate = CruxDragDropUtils.itemPlacesTemplate(item, activityId);
                if (placesTemplate) CruxUtils._watchTemplatePlacement();
                else setTimeout(() => CruxUtils._finishItemActivation(), 500);
                
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
                CruxUtils._finishItemActivation();
                return;
            }
            const placesTemplate = CruxDragDropUtils.itemPlacesTemplate(item, activityId);
            if (placesTemplate) CruxUtils._watchTemplatePlacement();
            else setTimeout(() => CruxUtils._finishItemActivation(), 500);
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
                const placesTemplate = CruxDragDropUtils.itemPlacesTemplate(item, firstActivity.id);
                if (placesTemplate) CruxUtils._watchTemplatePlacement();
                else setTimeout(() => CruxUtils._finishItemActivation(), 500);
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
        const placesTemplate = CruxDragDropUtils.itemPlacesTemplate(item);
        if (placesTemplate) CruxUtils._watchTemplatePlacement();
        else setTimeout(() => CruxUtils._finishItemActivation(), 500);
        const result = item.use(useOptions);
        return result;
    }
}
