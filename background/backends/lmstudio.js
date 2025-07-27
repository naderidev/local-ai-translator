const metadata = {
    name: "LM Studio",
    configurable: [
        {
            name: "API URL",
            type: "text",
            key: "url",
            value: "http://localhost:1234/api/v0/completions",
        },
        {
            name: "Model",
            type: "text",
            key: "model",
            value: "gemma2",
        },
        {
            name: "Prompt",
            type: "text",
            key: "prompt",
            value: "You are a professional translator. " +
                "No comments. " +
                "Just translate the following text to LANGUAGE: ",
        },
    ],
};

async function translate(text, targetLanguage, settings) {
    // On macOS, you can set the environment variable with:
    //  launchctl setenv OLLAMA_ORIGINS '*'
    // to allow connections from any origin.
    // By default, the server rejects "Origin: chrome-extension://xxx".
    const future = fetch(settings.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: settings.model,
            prompt: settings.prompt.replace("LANGUAGE", targetLanguage) +
                "\n" + text,
            stream: false,
            temperature: 0.8,
        }),
    });
    let response;
    try {
        response = await future;
    } catch (error) {
        throw `Failed to connect to Ollama: ${error}`;
    }
    if (!response.ok) {
        throw await response.text();
    }
    return response.json().then(r => r.choices[0].text);
    
}

export default {
    metadata,
    translate,
};
