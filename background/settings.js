import { deepAssign } from "./utils.js";

const defaultSettings = {
    translator: {
        backend: "ollama",
        language: "fa-IR",
    },
    enableTooltip: true,
};

export function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get("settings", (data) => {
            resolve(deepAssign({}, defaultSettings, data.settings || {}));
        });
    });
}

export function saveSettings(settings) {
    chrome.storage.sync.set({ settings });
}
