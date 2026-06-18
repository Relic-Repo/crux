export default class CruxInlineEditor {
    static open(target, { onSave, allowKeyboard = true } = {}) {
        if (!target || target.dataset.edit === "true") return false;

        const displayMode = target.querySelector(".display-mode");
        const editMode = target.querySelector(".edit-mode");
        const input = editMode?.querySelector("input");
        if (!displayMode || !editMode || !input) return false;

        target.dataset.edit = "true";
        displayMode.classList.add("hidden");
        editMode.classList.remove("hidden");
        input.dataset.originalValue = input.value;
        input.focus();
        input.select();

        let isClosing = false;
        const close = async (save) => {
            if (isClosing) return;
            isClosing = true;
            input.removeEventListener("blur", onBlur);
            input.removeEventListener("keydown", onKeyDown);
            if (save) await onSave?.(target, input);
            target.dataset.edit = "false";
            displayMode.classList.remove("hidden");
            editMode.classList.add("hidden");
        };
        const onBlur = () => close(true);
        const onKeyDown = (event) => {
            if (!allowKeyboard) return;
            if (event.key === "Enter") {
                event.preventDefault();
                close(true);
            } else if (event.key === "Escape") {
                event.preventDefault();
                input.value = input.dataset.originalValue ?? input.value;
                close(false);
            }
        };

        input.addEventListener("blur", onBlur);
        input.addEventListener("keydown", onKeyDown);
        return true;
    }
}
