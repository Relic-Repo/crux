/**
 * Handles injection of UI elements into DnD5e activity sheets and item sheets
 */
export default class CruxItemFormInjector {
    /**
     * Initialize the injector
     */
    static init() {
        Hooks.on("renderActivitySheet", (app, html, data) => {
            const $html = html instanceof jQuery ? html : $(html);
            this._onRenderActivitySheet(app, $html, data);
        });
        Hooks.on("renderApplication", (app, html, data) => {
            if (app.element && 
                ((app.element.hasClass && app.element.hasClass("activity")) || 
                 (app.element.attr && app.element.attr("id") === "app-3"))) {
                const $html = html instanceof jQuery ? html : $(html);
                this._onRenderActivitySheet(app, $html, data);
            }
        });
        Hooks.on("renderItemSheet5e", (app, html, data) => {
            const $html = html instanceof jQuery ? html : $(html);
            this._onRenderItemSheet(app, $html, data);
        });
    }

    /**
     * Handle rendering of an activity sheet
     * @param {Application} app - The application being rendered
     * @param {jQuery} html - The rendered HTML as a jQuery object
     * @param {Object} data - The data used to render the sheet
     * @private
     */
    static _onRenderActivitySheet(app, html, data) {
        let behaviorFieldset = null;
        html.find('fieldset').each(function() {
            const legend = $(this).find('legend').text().trim();
            if (legend.toLowerCase() === "behavior") {
                behaviorFieldset = $(this);
                return false;
            }
        });
        
        if (!behaviorFieldset) {
            return;
        }
        if (behaviorFieldset.find('.rider-activity-toggle').length) {
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
        behaviorFieldset.append(checkboxHtml);
        behaviorFieldset.find('.rider-activity-toggle dnd5e-checkbox').on('change', async function(event) {
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

    /**
     * Handle rendering of an item sheet
     * @param {Application} app - The application being rendered
     * @param {jQuery} html - The rendered HTML as a jQuery object
     * @param {Object} data - The data used to render the sheet
     * @private
     */
    static _onRenderItemSheet(app, html, data) {
        const detailsTab = html.find('.tab.details');
        if (detailsTab.length === 0) {
            return;
        }
        if (detailsTab.find('.crux-tray-visibility').length) {
            return;
        }
        const item = app.object;
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
        const tidy5eFieldset = detailsTab.find('fieldset:contains("Tidy 5e Sheets Settings")');
        if (tidy5eFieldset.length > 0) {
            tidy5eFieldset.after(fieldsetHtml);
        } else {
            detailsTab.append(fieldsetHtml);
        }
    }
}
