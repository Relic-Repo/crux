import CruxSettings from "../settings/CruxSettings.js";
import CruxSystemRegistry from "../systems/CruxSystemRegistry.js";
import CruxDnd5eAccess from "../runtime/dnd5e/CruxDnd5eAccess.js";
import CruxInlineEditor from "../utils/CruxInlineEditor.js";
import CruxTrayResolver from "../utils/CruxTrayResolver.js";
import CruxUtils from "../utils/CruxUtilityManager.js";

export default class CruxItemInteractionController {
    constructor(app) {
        this.app = app;
    }

    get root() {
        return this.app.element;
    }

    bindRenderedControls() {
        this.root?.querySelectorAll(".rollable.item-name").forEach(item => {
            item.addEventListener("mouseenter", event => this._onItemHoverIn(event));
            item.addEventListener("mouseleave", event => this._onItemHoverOut(event));
        });

        this.root?.querySelectorAll(".rollable .item-image, .rollable.item-name").forEach(element => {
            element.addEventListener("mousedown", this.onItemMouseDown.bind(this));
        });
    }

    async openIdentityItem(event, target) {
        event.preventDefault();
        const item = await CruxTrayResolver.item(target);
        if (item?.sheet) item.sheet.render(true);
    }

    async openSheet(event, target) {
        const item = await CruxTrayResolver.item(target);
        if (item) item.sheet.render(true);
    }

    async toggleItemSummary(event, target) {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) return;
        const itemElement = CruxTrayResolver.itemElement(target);
        const item = await CruxTrayResolver.item(target);
        if (!item) return;
        await this.renderItemSummary(itemElement, item);
    }

    async activateItem(event, target) {
        let actionId = target.dataset.actionId;
        let actionButton = target;
        if (!actionId && target.tagName.toLowerCase() === "img") {
            actionButton = target.closest(".crux__action-button");
            if (actionButton) actionId = actionButton.dataset.actionId;
        }

        if (actionId) {
            const actor = CruxTrayResolver.actor(this.root, actionButton);
            if (!actor) return;

            const actionName = game.i18n.localize(`crux.action.${actionId}`);
            const matchingItem = actor.items.find(item => {
                const name = item.name.toLowerCase();
                return name === actionId.toLowerCase() || name === actionName.toLowerCase();
            });

            if (matchingItem) {
                event.fromCrux = true;
                await CruxUtils.activateItem(matchingItem.uuid, null, event);
            } else {
                await ChatMessage.create({
                    user: game.user.id,
                    speaker: ChatMessage.getSpeaker({ actor }),
                    content: `<p>${actor.name} uses ${actionName}</p>`
                });
            }
            return;
        }

        const item = await CruxTrayResolver.item(target);
        if (!item) return;

        const isItemNameH4 = target.tagName === "H4" || target.closest("h4");
        if (isItemNameH4 && event.which === 1 && !event.shiftKey) {
            const li = target.closest(".item");
            await this.renderItemSummary(li, item);
            return;
        }

        const adapter = CruxSystemRegistry.getAdapter();
        if (event.shiftKey && adapter?.canModifyUses?.(item)) {
            const changed = await this.updateUsesFromClick(item, event);
            if (changed) this.app.render();
            return;
        }

        event.fromCrux = true;
        const itemEntry = target.closest(".crux__item");
        const activityId = itemEntry?.dataset?.activityId;
        return CruxUtils.activateItem(item.uuid, activityId, event);
    }

    async rechargeItem(target) {
        const item = await CruxTrayResolver.item(target);
        if (!item) return;
        try {
            await CruxSystemRegistry.getAdapter()?.rechargeItem?.(item);
            this.app.render();
        } catch (error) {
            ui.notifications.error(`Failed to recharge ${item.name}: ${error.message}`);
        }
    }

    toggleQuantitySpinner(event, target) {
        this._toggleSpinner(event, target, () => this.saveQuantitySpinnerChanges(target));
    }

    toggleUsesSpinner(event, target) {
        this._toggleSpinner(event, target, () => this.saveUsesSpinnerChanges(target));
    }

    async saveQuantitySpinnerChanges(spinner) {
        const item = await CruxTrayResolver.item(spinner);
        if (!item || !item.isOwner || !item.parent) return;
        const input = spinner.querySelector("input");
        const value = Math.max(0, parseInt(input.value) || 0);
        await item.parent.updateEmbeddedDocuments("Item", [{
            _id: item.id,
            [CruxDnd5eAccess.quantityUpdatePath()]: value
        }]);
        spinner.querySelector(".value").textContent = value;
        input.value = value;
        if (item.sheet?.rendered) item.sheet.render(false);
    }

    async saveUsesSpinnerChanges(spinner) {
        const item = await CruxTrayResolver.item(spinner);
        if (!item || !item.isOwner || !item.parent) return;
        const input = spinner.querySelector("input");
        const max = parseInt(input.max) || 0;
        const rawValue = parseInt(input.value);
        const value = Math.min(max, Math.max(0, isNaN(rawValue) ? 0 : rawValue));
        const spent = max - value;
        await item.parent.updateEmbeddedDocuments("Item", [{
            _id: item.id,
            [CruxDnd5eAccess.usesSpentUpdatePath()]: spent
        }]);
        spinner.querySelector(".value").textContent = `${value}/${max}`;
        input.value = value;
        if (item.sheet?.rendered) item.sheet.render(false);
    }

    async onItemMouseDown(event) {
        if (event.target.closest("[data-crux-context-menu=\"true\"]")) return false;
        const itemElement = CruxTrayResolver.itemElement(event.currentTarget);
        if (!itemElement) return false;
        const item = await CruxTrayResolver.item(event.currentTarget);
        if (!item) return false;

        if (event.which === 2) {
            event.preventDefault();
            event.stopPropagation();
            const itemEntry = itemElement.closest(".crux__item");
            const activityId = itemEntry?.dataset?.activityId;
            const adapter = CruxSystemRegistry.getAdapter();
            if (adapter?.isModernDnd5e?.() && (activityId || adapter.hasActivities(item))) {
                return this.showItemActivitiesMenu(event, item);
            }
            return this.openSheet(event, event.currentTarget);
        }

        if (event.currentTarget.classList.contains("item-image")) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

        if (event.currentTarget.classList.contains("item-name")) {
            const adapter = CruxSystemRegistry.getAdapter();
            if (event.shiftKey && adapter?.canModifyUses?.(item)) {
                event.preventDefault();
                event.stopPropagation();
                const changed = await this.updateUsesFromClick(item, event);
                if (changed) this.app.render();
                return false;
            }

            if (event.which === 3 && !event.shiftKey) {
                event.preventDefault();
                event.stopPropagation();
                return this.openSheet(event, event.currentTarget);
            }
        }

        return false;
    }

    async _onItemHoverIn(event) {
        const item = await CruxTrayResolver.item(event.currentTarget);
        if (item) Hooks.callAll("actorItemHoverIn", item, event.currentTarget);
    }

    async _onItemHoverOut(event) {
        const item = await CruxTrayResolver.item(event.currentTarget);
        if (item) Hooks.callAll("actorItemHoverOut", item, event.currentTarget);
    }

    async updateUsesFromClick(item, event) {
        const adapter = CruxSystemRegistry.getAdapter();
        const uses = adapter?.getUses?.(item);
        if (!uses) return false;
        let newValue;
        if (event.which === 1) {
            newValue = Math.min(uses.value + 1, uses.max);
        } else if (event.which === 3) {
            newValue = Math.max(uses.value - 1, 0);
        }
        if (newValue === undefined || newValue === uses.value) return false;
        await adapter.updateUses(item, newValue);
        return true;
    }

    async renderItemSummary(itemElement, item) {
        if (!itemElement || !item) return;

        if (itemElement.classList.contains("expanded")) {
            const summary = itemElement.querySelector(".item-summary");
            if (summary) {
                if (window.jQuery) {
                    window.jQuery(summary).slideUp(200, () => summary.remove());
                } else {
                    summary.remove();
                }
            }
            itemElement.classList.toggle("expanded");
            return;
        }

        const description = await CruxSystemRegistry.getAdapter()?.getDescription?.(item) ?? "";
        let enrichedDescription = description;
        try {
            const textEditor = foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;
            enrichedDescription = await textEditor.enrichHTML(description, {
                secrets: item.actor?.isOwner ?? false,
                rollData: item.getRollData ? item.getRollData() : {},
                relativeTo: item
            });
        } catch (error) {
            console.warn("Crux | Item description enrichment failed", item, error);
        }

        const div = document.createElement("div");
        div.className = "item-summary";
        div.innerHTML = enrichedDescription;

        const chatData = await item.getChatData({ secrets: item.actor?.isOwner });
        if (chatData?.properties?.length) {
            const props = document.createElement("div");
            props.className = "item-properties";
            chatData.properties.forEach(p => {
                const span = document.createElement("span");
                span.className = "tag";
                span.textContent = p;
                props.appendChild(span);
            });
            const quantity = CruxSystemRegistry.getAdapter()?.getItemQuantity?.(item);
            if (quantity !== null && quantity !== undefined) {
                const qtySpan = document.createElement("span");
                qtySpan.className = "tag";
                qtySpan.textContent = `Qty: ${quantity}`;
                props.appendChild(qtySpan);
            }
            div.appendChild(props);
        }

        itemElement.appendChild(div);
        if (window.jQuery) window.jQuery(div).hide().slideDown(200);
        itemElement.classList.toggle("expanded");
    }

    async showItemActivitiesMenu(event, item) {
        const adapter = CruxSystemRegistry.getAdapter();
        if (!adapter?.isModernDnd5e?.() || !item) return false;

        const menu = document.createElement("div");
        menu.classList.add("crux__activities-menu");
        CruxSettings.applyThemeToExternalRoot(menu);
        menu.dataset.cruxContextMenu = "true";
        menu.style.position = "absolute";
        menu.style.zIndex = "1000";

        const onClickOutside = (e) => {
            if (!menu.contains(e.target)) {
                document.body.removeChild(menu);
                document.removeEventListener("click", onClickOutside);
            }
        };

        const header = document.createElement("div");
        header.classList.add("crux__activities-header");
        header.textContent = item.name;
        header.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            document.body.removeChild(menu);
            document.removeEventListener("click", onClickOutside);
        });
        menu.appendChild(header);

        const activityList = document.createElement("ul");
        activityList.classList.add("crux__activities-list");
        const activityEntries = adapter.getActivityEntries(item);
        for (const [id, activity] of activityEntries) {
            if (!activity || !activity.name) continue;
            const li = document.createElement("li");
            li.classList.add("crux__activity-item");
            li.dataset.activityId = id;

            const nameSpan = document.createElement("span");
            nameSpan.classList.add("crux__activity-name");
            nameSpan.textContent = activity.name;
            li.appendChild(nameSpan);

            if (activity.activation?.type) {
                const typeSpan = document.createElement("span");
                typeSpan.classList.add("crux__activity-type");
                typeSpan.textContent = activity.activation.type;
                li.appendChild(typeSpan);
            }

            li.addEventListener("click", async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (document.body.contains(menu)) document.body.removeChild(menu);
                document.removeEventListener("click", onClickOutside);
                try {
                    await CruxUtils.activateItem(item.uuid, id, event);
                } catch (error) {
                    ui.notifications.error(`Failed to use ${activity.name}: ${error.message}`);
                }
            });
            activityList.appendChild(li);
        }
        menu.appendChild(activityList);

        const x = event.clientX;
        const y = event.clientY;
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        document.body.appendChild(menu);

        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        if (menuRect.right > viewportWidth) menu.style.left = `${x - menuRect.width}px`;
        if (menuRect.bottom > viewportHeight) menu.style.top = `${y - menuRect.height}px`;

        setTimeout(() => document.addEventListener("click", onClickOutside), 100);
        return true;
    }

    _toggleSpinner(event, target, save) {
        event.stopPropagation();
        event.preventDefault();
        CruxInlineEditor.open(target, {
            allowKeyboard: false,
            onSave: save
        });
    }
}
