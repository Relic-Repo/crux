export default class CruxItemFormInjector {
    static init() {
        Hooks.on("renderItemSheet5e", (app, options) => {
            const html = app.element;
            if (!html) return;
            this._onRenderItemSheet(app, html);
        });

        Hooks.on("renderActivitySheet", (app, options) => {
            const html = app.element;
            if (!html) return;
            this._onRenderActivitySheet(app, html);
        });
        Hooks.on("renderApplication", (app, options) => {
            const html = app.element;
            if (!html) return;
            if (html.classList?.contains("activity") ||
                html.querySelector?.(".activity")) {
                this._onRenderActivitySheet(app, html);
            }
        });
    }

    static _onRenderActivitySheet(app, html) {
        let behaviorFieldset = null;
        const fieldsets = html.querySelectorAll('fieldset');
        for (const fieldset of fieldsets) {
            const legend = fieldset.querySelector('legend');
            if (legend && legend.textContent.trim().toLowerCase() === "behavior") {
                behaviorFieldset = fieldset;
                break;
            }
        }
        
        if (!behaviorFieldset) {
            return;
        }
        if (behaviorFieldset.querySelector('.rider-activity-toggle')) {
            return;
        }

        let activityId = null;
        try {
            if (app.activity && app.activity.id) {
                activityId = app.activity.id;
            } else if (app.document && app.document.id) {
                activityId = app.document.id;
            } else if (app.id) {
                activityId = app.id;
            }
        } catch (error) {
            console.error("Error getting activity ID", error);
        }
        
        if (!activityId) {
            return;
        }

        const parentItem = app.item || app.object;
        if (!parentItem) {
            return;
        }

        const riderActivities = parentItem.flags?.dnd5e?.riders?.activity || [];
        const isRider = Array.isArray(riderActivities) && riderActivities.includes(activityId);
        const checkedAttr = isRider ? "checked" : "";

        const checkboxHtml = `
            <div class="form-group rider-activity-toggle">
                <label>Rider Activity</label>
                <div class="form-fields">
                    <dnd5e-checkbox name="flags.dnd5e.riders.activity" ${checkedAttr} tabindex="0"></dnd5e-checkbox>
                </div>
                <p class="hint">Mark this activity as a "rider" that should not appear in the item use menu.</p>
            </div>`;

        behaviorFieldset.insertAdjacentHTML('beforeend', checkboxHtml);

        const checkbox = behaviorFieldset.querySelector('.rider-activity-toggle dnd5e-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', async function(event) {
                const checked = event.target.checked;
                const currentRiders = foundry.utils.deepClone(parentItem.flags?.dnd5e?.riders?.activity || []);

                if (checked && !currentRiders.includes(activityId)) {
                    currentRiders.push(activityId);
                } else if (!checked && currentRiders.includes(activityId)) {
                    const index = currentRiders.indexOf(activityId);
                    if (index > -1) currentRiders.splice(index, 1);
                }
                await parentItem.update({
                    "flags.dnd5e.riders.activity": currentRiders
                });
            });
        }
    }

    static _onRenderItemSheet(app, html) {
        const detailsTab = html.querySelector('section.tab[data-tab="details"]')
                        || html.querySelector('.tab.details')
                        || html.querySelector('[data-tab="details"]');

        if (!detailsTab) {
            return;
        }

        if (detailsTab.querySelector('.crux-tray-visibility')) {
            return;
        }

        const item = app.document || app.object;
        if (!item) {
            return;
        }

        const validTypes = ["weapon", "equipment", "consumable", "feat", "spell", "tool", "backpack", "loot"];
        if (!validTypes.includes(item.type)) {
            return;
        }

        let visibilitySetting = item.getFlag("crux", "trayVisibility");
        if (visibilitySetting === undefined) {
            visibilitySetting = "default";
        }

        const fieldsetHtml = `
            <fieldset>
                <legend>Crux Tray Settings</legend>
                <div class="form-group crux-tray-visibility">
                    <label>Tray Visibility</label>
                    <div class="form-fields">
                        <select name="flags.crux.trayVisibility">
                            <option value="default" ${visibilitySetting === "default" ? "selected" : ""}>System Default</option>
                            <option value="show" ${visibilitySetting === "show" ? "selected" : ""}>Force Show</option>
                            <option value="hide" ${visibilitySetting === "hide" ? "selected" : ""}>Force Hidden</option>
                        </select>
                    </div>
                    <p class="hint">Control how this item appears in the Crux tray.</p>
                </div>
            </fieldset>`;

        const allFieldsets = detailsTab.querySelectorAll('fieldset');
        let tidy5eFieldset = null;
        for (const fs of allFieldsets) {
            const legend = fs.querySelector('legend');
            if (legend && legend.textContent.includes("Tidy 5e")) {
                tidy5eFieldset = fs;
                break;
            }
        }

        if (tidy5eFieldset) {
            tidy5eFieldset.insertAdjacentHTML('afterend', fieldsetHtml);
        } else {
            detailsTab.insertAdjacentHTML('beforeend', fieldsetHtml);
        }
    }
}
