function getTextSelection() {
    // Current page scroll offset
    const offset = {
        x: window.scrollX,
        y: window.scrollY,
    };

    // Check if user is selecting text in an input field
    const activeElement = document.activeElement;
    if (
        (activeElement.tagName === "TEXTAREA") ||
        (activeElement.tagName === "INPUT" &&
            /^(text|password|search|tel|url|email)$/.test(
                activeElement.type,
            )) ||
        (activeElement.hasAttribute("contenteditable") &&
            activeElement.getAttribute("contenteditable") === "true")
    ) {
        return {
            text: activeElement.value.substring(
                activeElement.selectionStart,
                activeElement.selectionEnd,
            ),
            rect: activeElement.getBoundingClientRect(),
            offset,
        };
    }

    // User is selecting text in the page
    const selection = window.getSelection();
    return {
        text: selection.toString().trim(),
        rect: selection.rangeCount > 0
            ? selection.getRangeAt(0).getBoundingClientRect()
            : null,
        offset,
    };
}

function setupTooltip(translateFn) {

    // States
    let currentButton = null;
    let currentSelection = null;
    let currentTooltip = null;

    // Create a shadow DOM container to isolate page styles
    const container = function () {
        const container = document.createElement("div");
        container.style.width = "0";
        container.style.height = "0";
        container.style.visibility = "hidden";
        return container;
    }();
    const shadow = container.attachShadow({ mode: "open" });
    document.body.appendChild(container);
    appendStylesFiles();


    function showButton(placement) {
        removeButton();

        const { x, y, upwards } = placement;
        const buttonX = x + 15 ;
        const buttonY = upwards ? y - 30 : y;

        currentButton = document.createElement("button");
        currentButton.type = "button";
        currentButton.innerText = "ترجمه";
        currentButton.style.left = `${buttonX}px`;
        currentButton.style.top = `${buttonY}px`;
        currentButton.id = "tooltip-btn";

        currentButton.addEventListener("click", (e) => {
            handleButtonClick(currentButton, e);
        });

        shadow.appendChild(currentButton);
    }

    function removeButton() {
        if (!currentButton) {
            return;
        }
        currentButton.remove();
        currentButton = null;
    }

    async function handleButtonClick(button, e) {
        setButtonLoading(button);
        try {
            const result = await translateFn(currentSelection.text);
            let tooltipX = e.pageX,
                tooltipY = e.pageY,
                tooltipUpwards = false;
            if (currentSelection.rect !== null) {
                const s = currentSelection;
                tooltipUpwards = Math.abs(e.pageY - (s.rect.top + s.offset.y)) <
                    Math.abs(e.pageY - (s.rect.bottom + s.offset.y));
                tooltipX = (s.rect.left + s.rect.right) / 2 + s.offset.x;
                tooltipY = (tooltipUpwards ? s.rect.top : s.rect.bottom) +
                    s.offset.y;
            }
            showTooltip({
                x: tooltipX,
                y: tooltipY,
                upwards: tooltipUpwards,
            }, result);
        } catch (error) {
            alert("Failed to translate the selected text.\n" + error);
        } finally {
            removeButton();
        }
    }

    function setButtonLoading(button) {
        button.innerHTML = "درحال ترجمه...";
        button.setAttribute("disabled", "disabled");
    }

    function appendStylesFiles(){
        const stylesDir = "assets/css/";

        const files = [
            ["tooltip.css", shadow],
            ["font.css", document.body]
        ];

        files.forEach((f, e) => {
            el = document.createElement("link");
            el.rel = "stylesheet";
            el.href = chrome.runtime.getURL(stylesDir + f[0]);
            el.id = f[0];
            f[1].appendChild(el);
        });
        
    }

    function showTooltip(placement, result) {
        removeTooltip();
        const { x, y, upwards } = placement;
        currentTooltip = document.createElement("div");
        currentTooltip.id = "tooltip-body";
        currentTooltip.appendChild(function () {
            let div = document.createElement("div");
            div.style.fontSize = "12px";
            div.style.color = "#888";
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.userSelect = "none";
            div.style.marginBottom = "8px";
            const textDiv = document.createElement("div");
            textDiv.innerText = "ترجمه";
            textDiv.id = "tooltip-title";
            div.appendChild(textDiv);
            const closeDiv = document.createElement("div");
            closeDiv.innerHTML = "&times;";
            closeDiv.id = "tooltip-close";
            closeDiv.addEventListener("click", () => {
                removeTooltip();
            });
            div.appendChild(closeDiv);
            return div;
        }());
        currentTooltip.appendChild(function () {
            let div = document.createElement("div");
            div.id = "tooltip-result-text";
            div.innerText = result;
            return div;
        }());
        // Calculate page dimensions to place the tooltip within the page
        const maxLeft = 0 + 4,
            maxRight = document.documentElement.scrollWidth - 4,
            maxTop = 0 + 4,
            maxBottom = document.documentElement.scrollHeight - 4;
        // Add the tooltip to the page, this may change page dimensions
        shadow.appendChild(currentTooltip);
        // Adjust the tooltip aspect ratio
        {
            const rect = currentTooltip.getBoundingClientRect();
            const aspectRatio = 2;
            const newWidth = Math.sqrt(rect.width * rect.height / aspectRatio) *
                aspectRatio;
            currentTooltip.style.maxWidth = `${newWidth}px`;
        }
        // Calculate the tooltip position and avoid overflowing the page
        {
            const rect = currentTooltip.getBoundingClientRect();
            let tooltipX = x - rect.width / 2;
            let tooltipY = upwards ? y - rect.height - 2 : y + 2;
            tooltipX = Math.max(maxLeft, tooltipX);
            tooltipX = Math.min(maxRight - rect.width, tooltipX);
            tooltipY = Math.max(maxTop, tooltipY);
            tooltipY = Math.min(maxBottom - rect.height, tooltipY);
            currentTooltip.style.left = `${tooltipX}px`;
            currentTooltip.style.top = `${tooltipY}px`;
        }
        // Show the tooltip
        currentTooltip.style.opacity = "1";
    }

    function removeTooltip() {
        if (!currentTooltip) {
            return;
        }
        currentTooltip.remove();
        currentTooltip = null;
    }

    function isInsideShadow(e) {
        return e.composedPath().some((node) => node.shadowRoot === shadow);
    }

    let lastShowButtonTime = 0;

    async function documentMouseUpHandler(e) {
        if (isInsideShadow(e)) {
            return;
        }
        if (Date.now() - lastShowButtonTime < 100) {
            return;
        }
        if (currentButton) {
            if (currentButton.contains(e.target)) {
                return;
            }
            removeButton();
        }
        if (currentTooltip) {
            if (currentTooltip.contains(e.target)) {
                return;
            }
            removeTooltip();
        }

        // Wait for the selection to be updated
        await new Promise((resolve) => setTimeout(resolve, 1));

        currentSelection = getTextSelection();
        if (currentSelection.text.length === 0) {
            return;
        }

        let buttonY = e.pageY,
            buttonUpwards = false;
        if (currentSelection.rect !== null) {
            const s = currentSelection;
            buttonUpwards = Math.abs(e.pageY - s.rect.top - s.offset.y) <
                Math.abs(e.pageY - s.rect.bottom - s.offset.y);
            buttonY = buttonUpwards ? s.rect.top - 1 : s.rect.bottom + 1;
        }
        showButton({
            x: e.pageX,
            y: buttonY,
            upwards: buttonUpwards,
        });

        lastShowButtonTime = Date.now();
    }

    function documentMouseDownHandler(e) {
        if (isInsideShadow(e)) {
            return;
        }
        if (currentButton && !currentButton.contains(e.target)) {
            currentButton.remove();
            currentButton = null;
        }
    }

    document.addEventListener("mouseup", documentMouseUpHandler);
    document.addEventListener("mousedown", documentMouseDownHandler);

    function hide() {
        removeButton();
        removeTooltip();
    }

    function cleanup() {
        document.removeEventListener("mouseup", documentMouseUpHandler);
        document.removeEventListener("mousedown", documentMouseDownHandler);
        removeButton();
        removeTooltip();
        container.remove();
    }

    return { hide, cleanup };
}

function background(request) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(request, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
                return;
            }
            resolve(response);
        });
    });
}

const translate = async (text) => {
    const response = await background({ action: "translate", text });
    if (response.error) {
        throw response.error;
    }
    return response.result;
};

let tooltip = null;

function enableTooltip() {
    if (!tooltip) {
        tooltip = setupTooltip(translate);
    }
}

function disableTooltip() {
    if (tooltip) {
        tooltip.cleanup();
        tooltip = null;
    }
}

function hideTooltip() {
    if (tooltip) {
        tooltip.hide();
    }
}

background({ action: "settings" }).then((response) => {
    if (response.settings.enableTooltip) {
        enableTooltip();
    }
});

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        switch (request.action) {
            case "selection":
                const text = window.getSelection().toString().trim();
                sendResponse({ text });
                return true;
            case "tooltip":
                if (request.enable) {
                    enableTooltip();
                } else {
                    disableTooltip();
                }
                return false;
            case "popup":
                hideTooltip();
                return false;
            default:
                return false;
        }
    },
);
