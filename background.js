import { createTranslator } from "./background/translator.js";
import { createCache } from "./background/cache.js";
import { loadSettings, saveSettings } from "./background/settings.js";
import { deepAssign } from "./background/utils.js";

const translator = createTranslator();
const cache = createCache(256);

async function cachedTranslate(text, settings) {
    text = text.trim();
    const key = JSON.stringify([
        settings.backend,
        settings[settings.backend],
        settings.language,
        text,
    ]);
    {
        const cached = cache.get(key);
        if (cached) {
            return cached;
        }
    }
    const result = await translator.translate(text, settings);
    cache.set(key, result);
    return result;
}

chrome.runtime.onInstalled.addListener(() => {
    console.log("Service worker installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "translate":
            loadSettings().then((settings) => {
                cachedTranslate(request.text, settings.translator)
                    .then((result) => {
                        sendResponse({ result });
                    })
                    .catch((error) => {
                        console.error("Failed to translate:", error);
                        sendResponse({
                            error: typeof error === "string"
                                ? error
                                : JSON.stringify(error),
                        });
                    });
            });
            return true;
        case "backends":
            sendResponse({ backends: translator.getBackends() });
            return false;
        case "settings":
            const shouldUpdate = typeof request.settings === "object" &&
                Object.keys(request.settings).length > 0;
            loadSettings().then((settings) => {
                if (shouldUpdate) {
                    deepAssign(settings, request.settings);
                    saveSettings(settings);
                }
                sendResponse({ settings });
            });
            return true;
        default:
            return false;
    }
});
