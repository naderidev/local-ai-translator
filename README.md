# Translate Extension

A Chrome extension that provides an alternative to the official Google Translate extension.

<img width="1040" alt="screenshot" src="https://github.com/user-attachments/assets/fdb7ead8-1663-43c8-ac3e-ecd9a7dc14ca">

## Features

- **In-page Translation**
  - Select text and click the floating icon to translate directly within the page.

- **Pop-up Window Translation**
  - Click the extension icon to open a translation window:
    - Automatically translates selected text.
    - Provides real-time translation as you type.

- **Stable Styling with Shadow DOM**
  - Utilizes Shadow DOM to isolate styles, ensuring compatibility with various websites.
  - Unlike Google Translate, this version remains stable on websites like example.com.

- **Customizable Translation Backends**
  - Supports multiple translation services: Google, OpenAI, DeepL, and Ollama.
  - Modular design allows for easy integration and customization of translation backends.

## Installation Instructions

1. Clone or download this repository.
2. Go to `chrome://extensions` in your Chromium-based browser (e.g., Chrome, Edge, Brave).
3. Enable “Developer mode.”
4. Click on “Load unpacked” and select the directory of this repository.
5. The extension will now appear in your list of installed extensions.

## How to Configure Backends

### Google

If the built-in key still works, you can skip this section.

1. Retrieve the API key from the [Google Translate](https://chrome.google.com/webstore/detail/google-translate/aapbdbdomjkkjkaonfhkkikfgjllcleb?hl=zh-TW) extension.
2. Click the extension icon to open the pop-up window.
3. Go to “Settings,” find the “Google” section, and paste the key.

### OpenAI

1. Get an API key. Refer to [this guide](https://platform.openai.com/docs/quickstart/create-and-export-an-api-key).
2. Go to “Settings,” find the “OpenAI” section, and paste the API key.

### DeepL

1. Get an API key. Refer to [this page](https://www.deepl.com/en/your-account/keys).
2. Go to “Settings,” find the “DeepL” section, and paste the API key.

### Ollama

Example steps:

1. **Install Ollama:**
   - Download and install [Ollama](https://ollama.com/) locally.

2. **Download `gemma2`:**
   - Run `ollama pull gemma2` to download the `gemma2` model.
   - If you're working with limited memory, try using `gemma2:2b` instead.

3. **Set Web Origins:**
   - To allow requests with `Origin: chrome-extension://*`, set the `OLLAMA_ORIGINS` environment variable to `*`.
   - For more details, refer to this [FAQ](https://github.com/ollama/ollama/blob/0ccc732/docs/faq.md#how-can-i-allow-additional-web-origins-to-access-ollama).

## How to Add a New Translation Backend

1. In `background/backends`, add a new JS script following the structure of the existing scripts.
2. Import and register your new backend in `background/translator.js`:

    ```js 
    import example from "./backends/example.js";
    const backends = new Map([
        // ...
        ["example", example],
    ]);
    ```
