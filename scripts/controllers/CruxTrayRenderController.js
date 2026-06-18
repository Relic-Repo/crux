export default class CruxTrayRenderController {
    constructor(app) {
        this.app = app;
    }

    get root() {
        return this.app.element;
    }

    bindRenderedControls() {
        this.applyNameLengthClasses();
        this.app.dragTargeting?.activate(this.root);
        this.app.dropPortal?.activate(this.root);
    }

    applyNameLengthClasses() {
        this.root?.querySelectorAll(".crux__info-section h1, .crux__action-actor-name").forEach(nameElement => {
            const nameLength = nameElement.textContent.trim().length;
            const isActionHeader = nameElement.classList.contains("crux__action-actor-name");
            const longThreshold = isActionHeader ? 24 : 20;
            const veryLongThreshold = isActionHeader ? 36 : 30;
            nameElement.classList.remove("long-name", "very-long-name");
            if (nameLength > veryLongThreshold) {
                nameElement.classList.add("very-long-name");
            } else if (nameLength > longThreshold) {
                nameElement.classList.add("long-name");
            }
        });
    }
}
