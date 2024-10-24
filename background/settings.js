import { deepAssign } from "./utils.js";

const defaultSettings = {
    translator: {
        backend: "google",
        language: "zh-hant", // supported by all backends
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
