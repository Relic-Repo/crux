const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
import CruxSettings from "../settings/CruxSettings.js";
import CruxDragTargeting from "../utils/CruxDragTargeting.js";
import CruxDropPortal from "../utils/CruxDropPortal.js";
import CruxTemplatePartials from "../utils/CruxTemplatePartials.js";
import CruxPanelRegistry from "../panels/CruxPanelRegistry.js";
import CruxSystemRegistry from "../systems/CruxSystemRegistry.js";
import CruxTrayResolver from "../utils/CruxTrayResolver.js";
import CruxActorInteractionController from "../controllers/CruxActorInteractionController.js";
import CruxCombatController from "../controllers/CruxCombatController.js";
import CruxFlyoutController from "../controllers/CruxFlyoutController.js";
import CruxItemInteractionController from "../controllers/CruxItemInteractionController.js";
import CruxTrayRenderController from "../controllers/CruxTrayRenderController.js";
import CruxTrayStateController from "../controllers/CruxTrayStateController.js";

export default class CruxTrayAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "crux",
        popOut: false,
        classes: ["crux"],
        tag: "div",
        headerButtons: [],
        minimizable: false,
        isSidebar: true,
        hasFrame: false,
        form: {
            closeOnSubmit: false
        },
        window: {
            title: "Crux Tray"
        },
        actions: {
            endTurn: function() { this._combatController.endTurn(); },
            toggleSkills: function(event, target) { this._onToggleSkills(event, target); },
            toggleSection: function(event, target) { this._onToggleSection(event, target); },
            toggleGroup: function(event, target) { this._onToggleGroup(event, target); },
            openSheet: function(event, target) { this._onOpenSheet(event, target); },
            toggleItemSummary: function(event, target) { this._onToggleItemSummary(event, target); },
            activateItem: function(event, target) { this._onActivateItem(event, target); },
            rechargeItem: function(event, target) { this._onRechargeItem(event, target); },
            rollAbility: function(event, target) { this._onRollAbility(event, target); },
            rollSave: function(event, target) { this._onRollSave(event, target); },
            rollSkill: function(event, target) { this._onRollSkill(event, target); },
            toggleTarget: function(event, target) { this._onToggleTarget(event, target); },
            openEffects: function(event, target) { this._onOpenEffects(event, target); },
            expandCollapse: function(event, target) { this._onExpandCollapse(event, target); },
            addToCombat: function(event, target) { this._onAddToCombat(event, target); },
            setElevation: function(event, target) { this._onSetElevation(event, target); },
            openMovement: function(event, target) { this._onOpenMovement(event, target); },
            openToken: function(event, target) { this._onOpenToken(event, target); },
            rollInitiative: function(event, target) { this._onRollInitiative(event, target); },
            shortRest: function(event, target) { this._onShortRest(event, target); },
            longRest: function(event, target) { this._onLongRest(event, target); },
            toggleQSpinner: function(event, target) { this._onToggleQSpinner(event, target); },
            toggleUSpinner: function(event, target) { this._onToggleUSpinner(event, target); },
            toggleTab: function(event, target) { this._onToggleTab(event, target); },
            openIdentityItem: function(event, target) { this._onOpenIdentityItem(event, target); },
            toggleHpEditor: function(event, target) { this._onToggleHpEditor(event, target); }
        }
    };

    _activeTab = "actions";
    _actorController = new CruxActorInteractionController(this);
    _combatController = new CruxCombatController(this);
    _dragTargeting = new CruxDragTargeting(this);
    _dropPortal = new CruxDropPortal(this);
    _flyoutController = new CruxFlyoutController(this);
    _itemController = new CruxItemInteractionController(this);
    _renderController = new CruxTrayRenderController(this);
    _stateController = new CruxTrayStateController(this);

    get activeTab() {
        return this._activeTab;
    }

    get dragTargeting() {
        return this._dragTargeting;
    }

    get dropPortal() {
        return this._dropPortal;
    }

    static PARTS = {
        tray: {
            template: "modules/crux/templates/crux.hbs"
        }
    };

    async _prepareContext(options) {
        await CruxTemplatePartials.load();
        const adapter = CruxSystemRegistry.getAdapter();
        if (!adapter) {
            const activePanel = CruxPanelRegistry.getActivePanel(this._activeTab);
            return {
                actors: [],
                activeTab: this._activeTab,
                activePanel,
                panelContext: await activePanel.prepareContext?.({
                    app: this,
                    actors: [],
                    activeTab: this._activeTab,
                    activePanel,
                    user: game.user,
                    scene: canvas.scene
                }) ?? {},
                tabs: CruxPanelRegistry.getTabs({ app: this, actors: [] }),
                iconSize: this._prefix(game.settings.get("crux", "icon-size"), "icon"),
                settings: {
                    "empty-tray-icon": game.settings.get("crux", "empty-tray-icon")
                }
            };
        }
        return adapter.prepareTrayContext(this, options);
    }

    _getCombatantForActor(actor) {
        return CruxTrayResolver.combatantForActor(actor);
    }

    _getSelectedTokenForActor(actor) {
        return CruxTrayResolver.selectedTokenForActor(actor);
    }

    _getPrimaryTokenForActor(actor) {
        return CruxTrayResolver.primaryTokenForActor(actor);
    }

    _resolveActor(target) {
        return CruxTrayResolver.actor(this.element, target);
    }

    _resolveActorElement(target) {
        return CruxTrayResolver.actorElement(this.element, target);
    }

    async _resolveItem(target) {
        return CruxTrayResolver.item(target);
    }

    _resolveItemElement(target) {
        return CruxTrayResolver.itemElement(target);
    }

    _prefix(tgt, str) {
        return tgt ? [str, tgt].join("-") : tgt;
    }

    _updateTraySize() {
        const traySize = game.settings.get("crux", "tray-size");
        CruxSettings.setCruxGlobalVariable('--crux-width', traySize + 'px');
        if (this.element) {
            this.element.style.width = 'var(--crux-occupied-width)';
            this.element.style.position = 'fixed';
            this.element.style.top = '0px';
            this.element.style.left = '0px';
            this.element.style.bottom = 'var(--crux-tray-bottom-offset)';
            this.element.style.height = 'auto';
        }
    }

    _initializeTraySize() {
        this._updateTraySize();
    }

    async _render(force, options) {
        const html = await super._render(force, options);
        const interfaceEl = document.querySelector("#interface");

        if (this.element && interfaceEl) {
            interfaceEl.insertBefore(this.element, interfaceEl.firstChild);
            this._initializeTraySize();
            await CruxSettings.applySavedVisualSettings();

            const trayMode = game.settings.get("crux", "tray-mode");
            if (trayMode === "always") {
                this.element.classList.add("active");
                this.element.classList.add("always-on");
                interfaceEl.classList.add("crux-active");
            }
            else if (trayMode === "auto") {
                const hasSelectedTokens = canvas.tokens.controlled.length > 0;

                if (hasSelectedTokens) {
                    this.element.classList.add("active");
                    interfaceEl.classList.add("crux-active");
                } else {
                    this.element.classList.remove("active");
                    interfaceEl.classList.remove("crux-active");
                }
            }
        }
        this._setupTaskbarCompatibility();
        this._combatController.syncRenderedControls();

        return html;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this._stateController.restoreScrollPosition();
        this._stateController.bindScroll();
        this._renderController.bindRenderedControls();
        this._actorController.bindRenderedControls();
        this._itemController.bindRenderedControls();
        CruxSystemRegistry.getAdapter()?.bindRenderedControls?.(this, this.element);
        this._stateController.applySavedStates();
    }

    _onScroll(event) {
        this._stateController.onScroll(event);
    }

    _restoreScrollPosition() {
        this._stateController.restoreScrollPosition();
    }

    _onToggleTab(event, target) {
        event.preventDefault();
        const tab = target.dataset.tab;
        this.showTab(tab);
    }

    showTab(tab) {
        if (!tab || !CruxPanelRegistry.getPanel(tab)) return;
        const wasActiveTab = this._activeTab === tab;
        this._activeTab = tab;

        const openTray = () => {
            const interfaceEl = document.querySelector("#interface");
            if (this.element) this.element.classList.add("active");
            if (interfaceEl) interfaceEl.classList.add("crux-active");
        };

        if (!this.element || !document.body.contains(this.element) || !wasActiveTab) {
            this.render(true).then(openTray);
            return;
        }

        openTray();
    }

    showActorTab() {
        this.showTab("actor");
    }

    _onOpenIdentityItem(event, target) {
        return this._itemController.openIdentityItem(event, target);
    }

    setPosition(options={}) {
        let result;
        if (options.scale !== undefined) {
            const { scale, ...otherOptions } = options;
            result = super.setPosition(otherOptions);
        } else {
            result = super.setPosition(options);
        }
        this._updateTraySize();
        return result;
    }

    toggleTray() {
        if (!this.element || !document.body.contains(this.element)) {
            this._activeTab = "actions";
            this.render(true);
            return;
        }

        const trayMode = game.settings.get("crux", "tray-mode");
        const interfaceEl = document.querySelector("#interface");

        if (trayMode === "always") {
            if (!this.element.classList.contains("active")) {
                this.element.classList.add("active");
                this.element.classList.add("always-on");
                if (interfaceEl) interfaceEl.classList.add("crux-active");
            }
            return;
        }
        if (trayMode === "auto") {
            ui.notifications.info("Tray visibility is set to Automatic mode. It will show when tokens are selected.");
            return;
        }
        if (this.element.classList.contains("active") && this._activeTab !== "actions") {
            this._activeTab = "actions";
            this.render(true).then(() => {
                const interfaceEl = document.querySelector("#interface");
                this.element?.classList.add("active");
                if (interfaceEl) interfaceEl.classList.add("crux-active");
            });
            return;
        }
        this.element.classList.toggle("active");
        if (interfaceEl) interfaceEl.classList.toggle("crux-active");
    }

    async close(options={}) {
        if (options?.closeKey) {
            return false;
        }

        document.removeEventListener('keydown', this._onHotkeyDown);
        document.removeEventListener('keyup', this._onHotkeyUp);
        if (this._taskbarObserver) {
            this._taskbarObserver.disconnect();
            this._taskbarObserver = null;
        }

        return super.close(options);
    }

    _setupTaskbarCompatibility() {
        const isTaskbarActive = game.modules.get("foundry-taskbar")?.active;
        const isCompatEnabled = game.settings.get("crux", "taskbar-compatibility");
        const taskbar = document.querySelector("#taskbar");
        const taskbarHeight = taskbar?.getBoundingClientRect().height ?? 0;
        const shouldOffsetTray = isTaskbarActive && isCompatEnabled && taskbarHeight > 0;
        const offset = shouldOffsetTray ? `${taskbarHeight}px` : '0px';
        CruxSettings.setCruxGlobalVariable('--crux-taskbar-height', `${taskbarHeight || 50}px`);
        CruxSettings.setCruxGlobalVariable('--crux-tray-bottom-offset', offset);
        document.body.classList.toggle("crux-taskbar-compat", shouldOffsetTray);
    }

    _onToggleSkills(event, target) {
        this._stateController.toggleSkills(event, target);
    }

    _onToggleSection(event, target) {
        this._stateController.toggleSection(target);
    }

    _onToggleGroup(event, target) {
        this._stateController.toggleGroup(target);
    }

    async _onOpenSheet(event, target) {
        return this._itemController.openSheet(event, target);
    }

    async _onToggleItemSummary(event, target) {
        return this._itemController.toggleItemSummary(event, target);
    }

    async _onActivateItem(event, target) {
        return this._itemController.activateItem(event, target);
    }

    async _onRechargeItem(event, target) {
        return this._itemController.rechargeItem(target);
    }

    _onRollAbility(event, target) {
        this._actorController.rollAbility(event, target);
    }

    _onRollSave(event, target) {
        this._actorController.rollSave(event, target);
    }

    _onRollSkill(event, target) {
        this._actorController.rollSkill(event, target);
    }

    _onToggleTarget(event, target) {
        this._actorController.toggleTarget(target);
    }

    _onOpenEffects(event, target) {
        this._flyoutController.openEffects(event, target);
    }

    _onOpenMovement(event, target) {
        this._flyoutController.openMovement(event, target);
    }

    _onExpandCollapse(event, target) {
        const actorElement = this._resolveActorElement(target);
        if (!actorElement) return;
        this._stateController.expandCollapse(actorElement);
    }

    async _onAddToCombat(event, target) {
        return this._combatController.addToCombat(event, target);
    }

    _onSetElevation(event, target) {
        this._flyoutController.openElevation(event, target);
    }

    _onOpenToken(event, target) {
        this._actorController.openToken(target);
    }

    async _showItemActivitiesMenu(event, item) {
        return this._itemController.showItemActivitiesMenu(event, item);
    }

    async _onRollInitiative(event, target) {
        return this._combatController.rollInitiative(event, target);
    }

    _onShortRest(event, target) {
        this._actorController.shortRest(event, target);
    }

    _onLongRest(event, target) {
        this._actorController.longRest(event, target);
    }

    _onToggleQSpinner(event, target) {
        this._itemController.toggleQuantitySpinner(event, target);
    }

    _onToggleUSpinner(event, target) {
        this._itemController.toggleUsesSpinner(event, target);
    }

    async _saveQSpinnerChanges(spinner) {
        return this._itemController.saveQuantitySpinnerChanges(spinner);
    }

    async _saveUSpinnerChanges(spinner) {
        return this._itemController.saveUsesSpinnerChanges(spinner);
    }

    _onToggleHpEditor(event, target) {
        this._actorController.toggleHpEditor(event, target);
    }

    _openHpEditor(target, actor) {
        this._actorController.openHpEditor(target, actor);
    }

    async _saveHpEditorChanges(target, actor) {
        return this._actorController.saveHpEditorChanges(target, actor);
    }

    async _onItemMouseDown(event) {
        return this._itemController.onItemMouseDown(event);
    }

    async _toggleItemSummary(itemElement, item) {
        return this._itemController.renderItemSummary(itemElement, item);
    }
}
