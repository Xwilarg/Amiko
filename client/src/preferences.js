function updateStyle(newVal) {
    document.getElementById("user-style").setAttribute("href", `./css/options/${newVal}.css`);
}

export async function initPreferencesAsync() {
    document.getElementById("style-selection-select").addEventListener("change", async e => {
        const newVal = e.target.value;
        updateStyle(newVal);
        await filesystem.writePrefAsync("style", newVal);
    });
    const style = await filesystem.readPrefAsync("style", "regular");
    document.getElementById("style-selection-select").value = style;
    updateStyle(style);
}