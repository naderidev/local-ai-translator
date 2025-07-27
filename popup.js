function content(data) {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, data, (response) => {
                if (chrome.runtime.lastError) {
                    return;
                }
                resolve(response);
            });
        });
    });
}

function background(request) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(request, (response) => {
            if (chrome.runtime.lastError) {
                return;
            }
            resolve(response);
        });
    });
}

function setupPage1() {
    const elSettingsButton = document.getElementById("settings-btn");
    const elBackendSelect = document.getElementById("backend-select");
    const elSourceText = document.getElementById("source-text");
    const elTranslatedText = document.getElementById("translated-text");

    function updateBackend(backendKey) {
        background({ action: "backends" }).then((response) => {
            const backend = response.backends.find((backend) =>
                backend.key === backendKey
            );
            if (backend.languages) {
                for (
                    const [language, key] of Object.entries(backend.languages)
                ) {
                    const option = document.createElement("option");
                    option.value = key;
                    option.textContent = `${language} "${key}"`;
                }
            }
        });
    }

    elSettingsButton.addEventListener("click", () => {
        document.querySelectorAll(".page").forEach((elPage) => {
            if (elPage.id === "page2") {
                elPage.classList.remove("hidden");
            } else {
                elPage.classList.add("hidden");
            }
        });
    });

    elBackendSelect.addEventListener("change", () => {
        background({
            action: "settings",
            settings: {
                translator: {
                    backend: elBackendSelect.value,
                },
            },
        });
    });

    const translate = function () {
        let translateDelayHandle = null;
        return (delay) => {
            elTranslatedText.classList.remove("error");
            if (translateDelayHandle) {
                clearTimeout(translateDelayHandle);
            }
            translateDelayHandle = setTimeout(() => {
                translateDelayHandle = null;
                const text = elSourceText.value;
                elTranslatedText.textContent = "درحال ترجمه...";
                background({ action: "translate", text })
                    .then((response) => {
                        if (response.error) {
                            elTranslatedText.classList.add("error");
                            elTranslatedText.textContent =
                                "Failed to translate text:\n" +
                                (typeof response.error ===
                                        "string"
                                    ? response.error
                                    : JSON.stringify(response.error));
                            return;
                        }
                        elTranslatedText.textContent = response.result;
                    });
            }, delay);
        };
    }();

    elSourceText.addEventListener("input", () => {
        elTranslatedText.textContent = "درحال نوشتن ...";
        translate(800);
    });

    elBackendSelect.addEventListener("change", () => {
        updateBackend(elBackendSelect.value);
        if (elTranslatedText.classList.contains("error")) {
            elTranslatedText.textContent = "";
        }
        translate(50);
    });

    background({ action: "backends" }).then((response) => {
        elBackendSelect.innerHTML = "";
        for (const backend of response.backends) {
            const option = document.createElement("option");
            option.value = backend.key;
            option.textContent = backend.name;
            elBackendSelect.appendChild(option);
        }
        background({ action: "settings" }).then((response) => {
            elBackendSelect.value = response.settings.translator.backend;
            updateBackend(elBackendSelect.value);
        });
    });

    content({ action: "selection" }).then((response) => {
        if (!response.text) {
            return;
        }
        elSourceText.textContent = response.text;
        translate(0, true);
    });

    return {
        translate,
    };
}

function setupPage2(page1) {
    const elTranslateButton = document.getElementById("translate-btn");
    const elEnableTooltip = document.getElementById("enable-tooltip");

    elTranslateButton.addEventListener("click", () => {
        document.querySelectorAll(".page").forEach((elPage) => {
            if (elPage.id === "page1") {
                elPage.classList.remove("hidden");
            } else {
                elPage.classList.add("hidden");
            }
            // The settings may have changed, so re-translate
            page1.translate(0);
        });
    });

    elEnableTooltip.addEventListener("change", () => {
        background({
            action: "settings",
            settings: { enableTooltip: elEnableTooltip.checked },
        });
        content({
            action: "tooltip",
            enable: elEnableTooltip.checked,
        });
    });

    background({ action: "settings" }).then((response) => {
        elEnableTooltip.checked = response.settings.enableTooltip;
        const settings = response.settings;
        background({ action: "backends" }).then((response) => {
            const elPage2 = document.getElementById("page2");
            for (const backend of response.backends) {
                if (!backend.configurable?.length) {
                    continue;
                }
                elPage2.appendChild(function () {
                    const group = document.createElement("div");
                    group.classList.add("group");
                    group.appendChild(function () {
                        const title = document.createElement("div");
                        title.textContent = backend.name;
                        return title;
                    }());
                    for (const item of backend.configurable) {
                        group.appendChild(function () {
                            const label = document.createElement("label");
                            label.style.fontSize = "12px";
                            label.textContent = item.name;
                            label.htmlFor =
                                `backend-${backend.key}-${item.key}`;
                            return label;
                        }());
                        group.appendChild(function () {
                            const input = document.createElement("input");
                            input.type = item.type;
                            input.id = `backend-${backend.key}-${item.key}`;
                            input.placeholder = `Enter ${item.name}`;
                            input.value = item.value; // default value
                            {
                                const value = settings.translator?.[backend.key]
                                    ?.[item.key];
                                if (
                                    typeof value === "string" &&
                                    value.length > 0
                                ) {
                                    input.value = value;
                                }
                            }
                            input.addEventListener("input", () => {
                                background({
                                    action: "settings",
                                    settings: {
                                        translator: {
                                            [backend.key]: {
                                                [item.key]: input.value,
                                            },
                                        },
                                    },
                                });
                            });
                            return input;
                        }());
                    }
                    return group;
                }());
            }
        });
    });
}

setupPage2(setupPage1());

// Notify content script that popup is opened
content({ action: "popup" });
