/**
 * CodeTeam AI - Settings Panel
 * Separate settings page for API keys and model selection
 */
import * as vscode from 'vscode';

interface ProviderSettings {
    id: string;
    name: string;
    apiKey: string;
    selectedModel: string;
    models: Array<{ id: string; name: string }>;
    isLoading: boolean;
}

export class SettingsPanel {
    public static currentPanel: SettingsPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private providers: ProviderSettings[] = [
        { id: 'openai', name: 'OpenAI', apiKey: '', selectedModel: '', models: [], isLoading: false },
        { id: 'anthropic', name: 'Anthropic (Claude)', apiKey: '', selectedModel: '', models: [], isLoading: false },
        { id: 'gemini', name: 'Google Gemini', apiKey: '', selectedModel: '', models: [], isLoading: false },
        { id: 'groq', name: 'Groq', apiKey: '', selectedModel: '', models: [], isLoading: false },
        { id: 'deepseek', name: 'DeepSeek', apiKey: '', selectedModel: '', models: [], isLoading: false },
    ];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (SettingsPanel.currentPanel) {
            SettingsPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'codeteamSettings',
            '⚙️ CodeTeam AI Settings',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        SettingsPanel.currentPanel = new SettingsPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._loadCurrentSettings();
        this._update();

        // Auto-fetch models for providers with API keys
        this._autoFetchAllModels();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'saveApiKey':
                        await this._saveApiKey(message.providerId, message.apiKey);
                        break;
                    case 'fetchModels':
                        await this._fetchModels(message.providerId);
                        break;
                    case 'selectModel':
                        await this._selectModel(message.providerId, message.modelId);
                        break;
                    case 'testConnection':
                        await this._testConnection(message.providerId);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _autoFetchAllModels() {
        for (const provider of this.providers) {
            if (provider.apiKey) {
                await this._fetchModels(provider.id);
            }
        }
    }

    private _loadCurrentSettings() {
        const config = vscode.workspace.getConfiguration('codeteam');

        const keyMap: Record<string, string> = {
            openai: 'openaiApiKey',
            anthropic: 'anthropicApiKey',
            gemini: 'geminiApiKey',
            groq: 'groqApiKey',
            deepseek: 'deepseekApiKey',
        };

        const modelMap: Record<string, string> = {
            openai: 'openaiModel',
            anthropic: 'anthropicModel',
            gemini: 'geminiModel',
            groq: 'groqModel',
            deepseek: 'deepseekModel',
        };

        for (const provider of this.providers) {
            provider.apiKey = config.get<string>(keyMap[provider.id], '');
            provider.selectedModel = config.get<string>(modelMap[provider.id], '');
        }
    }

    private async _saveApiKey(providerId: string, apiKey: string) {
        const keyMap: Record<string, string> = {
            openai: 'openaiApiKey',
            anthropic: 'anthropicApiKey',
            gemini: 'geminiApiKey',
            groq: 'groqApiKey',
            deepseek: 'deepseekApiKey',
        };

        try {
            await vscode.workspace.getConfiguration('codeteam').update(
                keyMap[providerId],
                apiKey,
                vscode.ConfigurationTarget.Global
            );

            const provider = this.providers.find(p => p.id === providerId);
            if (provider) {
                provider.apiKey = apiKey;
            }

            this._panel.webview.postMessage({
                type: 'keySaved',
                providerId,
                success: true
            });

            // Auto-fetch models after saving key
            if (apiKey) {
                await this._fetchModels(providerId);
            }

        } catch (error) {
            this._panel.webview.postMessage({
                type: 'keySaved',
                providerId,
                success: false,
                error: String(error)
            });
        }
    }

    private async _fetchModels(providerId: string) {
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider || !provider.apiKey) return;

        provider.isLoading = true;
        this._update();

        try {
            let models: Array<{ id: string; name: string }> = [];

            switch (providerId) {
                case 'openai':
                    models = await this._fetchOpenAIModels(provider.apiKey);
                    break;
                case 'groq':
                    models = await this._fetchGroqModels(provider.apiKey);
                    break;
                case 'anthropic':
                    models = await this._fetchAnthropicModels(provider.apiKey);
                    break;
                case 'gemini':
                    models = await this._fetchGeminiModels(provider.apiKey);
                    break;
                case 'deepseek':
                    models = await this._fetchDeepSeekModels(provider.apiKey);
                    break;
            }

            provider.models = models;
            provider.isLoading = false;

            // Auto-select first model if none selected
            if (!provider.selectedModel && models.length > 0) {
                provider.selectedModel = models[0].id;
                await this._selectModel(providerId, models[0].id);
            }

            this._update();

        } catch (error) {
            provider.isLoading = false;
            provider.models = [];
            this._update();

            vscode.window.showErrorMessage(`Fehler beim Laden der Modelle: ${error}`);
        }
    }

    private async _fetchOpenAIModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            throw new Error(`API Fehler: ${response.status} - Prüfe deinen API Key`);
        }

        const data = await response.json() as { data: Array<{ id: string; created: number; owned_by: string }> };

        // Nur Modelle die für Code-Agenten geeignet sind
        const codeModels = [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4-turbo-preview',
            'o1',
            'o1-preview',
            'o1-mini',
            'o3',
            'o3-mini'
        ];

        const chatModels = data.data
            .filter(m => codeModels.some(code => m.id.startsWith(code) || m.id === code))
            .sort((a, b) => b.created - a.created);

        return chatModels.map(m => {
            let label = m.id;
            // Füge hilfreiche Labels hinzu
            if (m.id.includes('o1') || m.id.includes('o3')) {
                label += ' 🧠 Reasoning';
            } else if (m.id.includes('gpt-4o-mini')) {
                label += ' ⚡ Schnell';
            } else if (m.id.includes('gpt-4o')) {
                label += ' 🌟 Empfohlen';
            } else if (m.id.includes('gpt-4-turbo')) {
                label += ' 💪 Stark';
            }
            return { id: m.id, name: label };
        });
    }

    private async _fetchGroqModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            throw new Error(`API Fehler: ${response.status} - Prüfe deinen API Key`);
        }

        const data = await response.json() as { data: Array<{ id: string; context_window?: number; owned_by?: string }> };

        // Nur Code-relevante Modelle (keine Whisper, TTS, etc.)
        const codeRelevant = data.data
            .filter(m =>
                m.id.includes('llama') ||
                m.id.includes('mixtral') ||
                m.id.includes('gemma') ||
                m.id.includes('qwen')
            )
            .filter(m => !m.id.includes('whisper') && !m.id.includes('guard'))
            .sort((a, b) => (b.context_window || 0) - (a.context_window || 0));

        return codeRelevant.map(m => {
            let label = m.id;
            const ctx = m.context_window ? `${Math.round(m.context_window / 1000)}K` : '';

            if (m.id.includes('llama-3.3-70b')) {
                label = `${m.id} 🌟 Empfohlen (${ctx})`;
            } else if (m.id.includes('llama-3.1-70b')) {
                label = `${m.id} 💪 Stark (${ctx})`;
            } else if (m.id.includes('8b')) {
                label = `${m.id} ⚡ Schnell (${ctx})`;
            } else if (ctx) {
                label = `${m.id} (${ctx})`;
            }

            return { id: m.id, name: label };
        });
    }

    private async _fetchAnthropicModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
        // Anthropic Models API
        try {
            const response = await fetch('https://api.anthropic.com/v1/models', {
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            if (response.ok) {
                const data = await response.json() as { data: Array<{ id: string; display_name?: string }> };
                // Filter nur für Code geeignete Modelle
                return data.data
                    .filter(m =>
                        m.id.includes('claude-3') ||
                        m.id.includes('claude-sonnet') ||
                        m.id.includes('claude-opus')
                    )
                    .map(m => {
                        let label = m.display_name || m.id;
                        if (m.id.includes('sonnet-4') || m.id.includes('3-5-sonnet')) {
                            label += ' 🌟 Empfohlen für Code';
                        } else if (m.id.includes('haiku')) {
                            label += ' ⚡ Schnell';
                        } else if (m.id.includes('opus')) {
                            label += ' 🧠 Komplex';
                        }
                        return { id: m.id, name: label };
                    });
            }
        } catch (e) {
            // Fallback
        }

        // Fallback: Beste Code-Modelle
        return [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 🌟 Empfohlen für Code' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet 🌟 Empfohlen für Code' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku ⚡ Schnell' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus 🧠 Komplex' },
        ];
    }

    private async _fetchGeminiModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);

            if (response.ok) {
                const data = await response.json() as { models: Array<{ name: string; displayName: string; description?: string }> };
                // Nur generative Modelle, keine Embedding-Modelle
                return data.models
                    .filter(m =>
                        m.name.includes('gemini') &&
                        !m.name.includes('embedding') &&
                        !m.name.includes('aqa')
                    )
                    .map(m => {
                        const id = m.name.replace('models/', '');
                        let label = m.displayName;
                        if (id.includes('1.5-pro') || id.includes('2.0-flash')) {
                            label += ' 🌟 Empfohlen';
                        } else if (id.includes('flash')) {
                            label += ' ⚡ Schnell';
                        }
                        return { id, name: label };
                    });
            }
        } catch (e) {
            // Fallback
        }

        return [
            { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash 🌟 Empfohlen' },
            { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro 💪 Stark' },
            { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash ⚡ Schnell' },
        ];
    }

    private async _fetchDeepSeekModels(apiKey: string): Promise<Array<{ id: string; name: string }>> {
        try {
            const response = await fetch('https://api.deepseek.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (response.ok) {
                const data = await response.json() as { data: Array<{ id: string }> };
                return data.data
                    .filter(m => m.id.includes('chat') || m.id.includes('coder') || m.id.includes('reasoner'))
                    .map(m => {
                        let label = m.id;
                        if (m.id.includes('coder')) {
                            label += ' 🌟 Für Code optimiert';
                        } else if (m.id.includes('reasoner')) {
                            label += ' 🧠 Reasoning (R1)';
                        }
                        return { id: m.id, name: label };
                    });
            }
        } catch (e) {
            // Fallback
        }

        return [
            { id: 'deepseek-coder', name: 'DeepSeek Coder 🌟 Für Code optimiert' },
            { id: 'deepseek-chat', name: 'DeepSeek Chat' },
            { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner 🧠 Reasoning (R1)' },
        ];
    }

    private async _selectModel(providerId: string, modelId: string) {
        const modelMap: Record<string, string> = {
            openai: 'openaiModel',
            anthropic: 'anthropicModel',
            gemini: 'geminiModel',
            groq: 'groqModel',
            deepseek: 'deepseekModel',
        };

        try {
            await vscode.workspace.getConfiguration('codeteam').update(
                modelMap[providerId],
                modelId,
                vscode.ConfigurationTarget.Global
            );

            const provider = this.providers.find(p => p.id === providerId);
            if (provider) {
                provider.selectedModel = modelId;
            }

            this._update();

            vscode.window.showInformationMessage(`✅ Modell ${modelId} ausgewählt`);

        } catch (error) {
            vscode.window.showErrorMessage(`Fehler: ${error}`);
        }
    }

    private async _testConnection(providerId: string) {
        const provider = this.providers.find(p => p.id === providerId);
        if (!provider || !provider.apiKey) {
            vscode.window.showWarningMessage('Bitte erst API Key eingeben');
            return;
        }

        this._panel.webview.postMessage({ type: 'testing', providerId });

        try {
            let testUrl = '';
            let headers: Record<string, string> = {};

            switch (providerId) {
                case 'openai':
                    testUrl = 'https://api.openai.com/v1/models';
                    headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                    break;
                case 'groq':
                    testUrl = 'https://api.groq.com/openai/v1/models';
                    headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                    break;
                default:
                    this._panel.webview.postMessage({
                        type: 'testResult',
                        providerId,
                        success: true,
                        message: 'Key gespeichert (Test nicht verfügbar)'
                    });
                    return;
            }

            const start = Date.now();
            const response = await fetch(testUrl, { headers });
            const latency = Date.now() - start;

            this._panel.webview.postMessage({
                type: 'testResult',
                providerId,
                success: response.ok,
                message: response.ok ? `✅ Verbindung OK (${latency}ms)` : `❌ Fehler: ${response.status}`
            });

        } catch (error) {
            this._panel.webview.postMessage({
                type: 'testResult',
                providerId,
                success: false,
                message: `❌ ${error}`
            });
        }
    }

    private _update() {
        this._panel.webview.html = this._getHtmlContent();
    }

    public dispose() {
        SettingsPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }

    private _getHtmlContent(): string {
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeTeam AI Settings</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: var(--vscode-font-family);
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            font-size: 24px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .subtitle {
            color: var(--vscode-descriptionForeground);
            margin-bottom: 32px;
        }

        .provider-card {
            background: var(--vscode-sideBar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
        }

        .provider-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .provider-name {
            font-size: 18px;
            font-weight: 600;
        }

        .provider-status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
        }

        .provider-status.connected {
            background: rgba(76, 175, 80, 0.2);
            color: #4caf50;
        }

        .provider-status.disconnected {
            background: rgba(255, 152, 0, 0.2);
            color: #ff9800;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-label {
            display: block;
            margin-bottom: 6px;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }

        .input-row {
            display: flex;
            gap: 8px;
        }

        input[type="password"],
        input[type="text"] {
            flex: 1;
            padding: 10px 14px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-input-foreground);
            border-radius: 6px;
            font-size: 14px;
            font-family: monospace;
        }

        input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        select {
            flex: 1;
            padding: 10px 14px;
            background: var(--vscode-dropdown-background);
            border: 1px solid var(--vscode-dropdown-border);
            color: var(--vscode-dropdown-foreground);
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
        }

        select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        button:hover {
            opacity: 0.9;
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .btn-secondary {
            background: transparent;
            border: 1px solid var(--vscode-button-border, var(--vscode-panel-border));
            color: var(--vscode-foreground);
        }

        .btn-test {
            background: transparent;
            border: 1px solid var(--vscode-panel-border);
            color: var(--vscode-descriptionForeground);
        }

        .model-select-row {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .loading {
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }

        .test-result {
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
        }

        .test-result.success {
            background: rgba(76, 175, 80, 0.1);
            color: #4caf50;
        }

        .test-result.error {
            background: rgba(244, 67, 54, 0.1);
            color: #f44336;
        }

        .divider {
            height: 1px;
            background: var(--vscode-panel-border);
            margin: 16px 0;
        }

        .hint {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }

        .hint.warning {
            color: #ff9800;
        }

        .model-count {
            font-size: 11px;
            color: #4caf50;
            margin-left: 8px;
            font-weight: normal;
        }

        .loading {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 10px 0;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <h1>⚙️ CodeTeam AI Settings</h1>
    <p class="subtitle">Konfiguriere deine KI-Provider und Modelle</p>

    ${this.providers.map(provider => this._renderProvider(provider)).join('')}

    <script>
        const vscode = acquireVsCodeApi();

        function saveKey(providerId) {
            const input = document.getElementById('key-' + providerId);
            const key = input.value.trim();
            if (!key) {
                input.focus();
                return;
            }

            const btn = document.getElementById('save-btn-' + providerId);
            btn.disabled = true;
            btn.textContent = 'Speichern...';

            vscode.postMessage({ type: 'saveApiKey', providerId, apiKey: key });
        }

        function selectModel(providerId) {
            const select = document.getElementById('model-' + providerId);
            const modelId = select.value;
            vscode.postMessage({ type: 'selectModel', providerId, modelId });
        }

        function refreshModels(providerId) {
            vscode.postMessage({ type: 'fetchModels', providerId });
        }

        function testConnection(providerId) {
            const btn = document.getElementById('test-btn-' + providerId);
            btn.disabled = true;
            btn.textContent = 'Teste...';
            vscode.postMessage({ type: 'testConnection', providerId });
        }

        window.addEventListener('message', (event) => {
            const msg = event.data;

            if (msg.type === 'keySaved') {
                const btn = document.getElementById('save-btn-' + msg.providerId);
                btn.disabled = false;
                btn.textContent = msg.success ? '✅ Gespeichert' : '❌ Fehler';
                setTimeout(() => { btn.textContent = 'Speichern'; }, 2000);
            }

            if (msg.type === 'testResult') {
                const btn = document.getElementById('test-btn-' + msg.providerId);
                btn.disabled = false;
                btn.textContent = 'Testen';

                let resultDiv = document.getElementById('result-' + msg.providerId);
                if (!resultDiv) {
                    resultDiv = document.createElement('div');
                    resultDiv.id = 'result-' + msg.providerId;
                    btn.parentNode.appendChild(resultDiv);
                }
                resultDiv.className = 'test-result ' + (msg.success ? 'success' : 'error');
                resultDiv.textContent = msg.message;
            }
        });
    </script>
</body>
</html>`;
    }

    private _renderProvider(provider: ProviderSettings): string {
        const hasKey = provider.apiKey && provider.apiKey.length > 0;
        const maskedKey = hasKey
            ? provider.apiKey.substring(0, 7) + '•••' + provider.apiKey.substring(provider.apiKey.length - 4)
            : '';

        return `
        <div class="provider-card">
            <div class="provider-header">
                <span class="provider-name">${provider.name}</span>
                <span class="provider-status ${hasKey ? 'connected' : 'disconnected'}">
                    ${hasKey ? '✓ Konfiguriert' : '○ Nicht konfiguriert'}
                </span>
            </div>

            <div class="form-group">
                <label class="form-label">API Key ${hasKey ? `(${maskedKey})` : ''}</label>
                <div class="input-row">
                    <input type="password"
                           id="key-${provider.id}"
                           placeholder="${hasKey ? 'Neuen Key eingeben um zu ersetzen...' : 'API Key hier eingeben...'}"
                           onkeypress="if(event.key==='Enter') saveKey('${provider.id}')">
                    <button class="btn-primary" id="save-btn-${provider.id}" onclick="saveKey('${provider.id}')">
                        Speichern
                    </button>
                    <button class="btn-test" id="test-btn-${provider.id}" onclick="testConnection('${provider.id}')" ${!hasKey ? 'disabled' : ''}>
                        Testen
                    </button>
                </div>
            </div>

            ${hasKey ? `
            <div class="divider"></div>

            <div class="form-group">
                <label class="form-label">
                    Modell auswählen
                    ${provider.models.length > 0 ? `<span class="model-count">${provider.models.length} Modelle verfügbar</span>` : ''}
                </label>
                <div class="model-select-row">
                    ${provider.isLoading ? `
                        <span class="loading">⏳ Lade Modelle von API...</span>
                    ` : `
                        <select id="model-${provider.id}" onchange="selectModel('${provider.id}')">
                            ${provider.models.length === 0 ? `
                                <option value="">-- Klicke "🔄 Aktualisieren" --</option>
                            ` : provider.models.map(m => `
                                <option value="${m.id}" ${provider.selectedModel === m.id ? 'selected' : ''}>
                                    ${m.name}
                                </option>
                            `).join('')}
                        </select>
                        <button class="btn-secondary" onclick="refreshModels('${provider.id}')" title="Modelle live von API laden">
                            🔄 Aktualisieren
                        </button>
                    `}
                </div>
                ${provider.selectedModel ? `
                    <p class="hint">✅ Aktiv: <strong>${provider.selectedModel}</strong></p>
                ` : `
                    <p class="hint warning">⚠️ Kein Modell ausgewählt</p>
                `}
            </div>
            ` : `
            <p class="hint">💡 Gib einen API Key ein um die verfügbaren Modelle live abzurufen</p>
            `}
        </div>`;
    }
}
