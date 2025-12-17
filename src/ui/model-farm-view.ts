/**
 * CodeTeam AI Ultra - Model Farm Settings Webview
 * Interactive UI for managing providers and models
 */
import * as vscode from 'vscode';
import { ModelFarmManager, ProviderConfig } from '../config/model-farm';

export class ModelFarmViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'codeteam.modelFarm';
    private _view?: vscode.WebviewView;
    private modelFarm: ModelFarmManager;

    constructor(
        private readonly extensionUri: vscode.Uri,
        modelFarm: ModelFarmManager
    ) {
        this.modelFarm = modelFarm;
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        this.updateContent();

        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'toggleProvider':
                    await this.modelFarm.setProviderEnabled(message.providerId, message.enabled);
                    this.updateContent();
                    break;
                case 'toggleModel':
                    await this.modelFarm.setModelEnabled(message.providerId, message.modelId, message.enabled);
                    this.updateContent();
                    break;
                case 'selectModel':
                    await this.modelFarm.selectModel(message.providerId, message.modelId);
                    this.updateContent();
                    break;
                case 'testProvider':
                    await this.testProviderWithProgress(message.providerId);
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', `codeteam.${message.providerId}`);
                    break;
                case 'refresh':
                    this.modelFarm.reload();
                    this.updateContent();
                    break;
            }
        });
    }

    private async testProviderWithProgress(providerId: string): Promise<void> {
        if (!this._view) return;

        this._view.webview.postMessage({ type: 'testingStart', providerId });

        const result = await this.modelFarm.testProvider(providerId as any);

        this._view.webview.postMessage({
            type: 'testingResult',
            providerId,
            ...result
        });

        this.updateContent();
    }

    private updateContent(): void {
        if (this._view) {
            this._view.webview.html = this.getHtmlContent();
        }
    }

    public refresh(): void {
        this.modelFarm.reload();
        this.updateContent();
    }

    private getHtmlContent(): string {
        const providers = this.modelFarm.getAllProviders();

        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Model Farm</title>
    <style>
        :root {
            --bg-primary: var(--vscode-editor-background);
            --bg-secondary: var(--vscode-sideBar-background);
            --text-primary: var(--vscode-editor-foreground);
            --text-secondary: var(--vscode-descriptionForeground);
            --accent: var(--vscode-button-background);
            --border: var(--vscode-panel-border);
            --success: #4caf50;
            --error: #f44336;
            --warning: #ff9800;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: var(--vscode-font-family);
            font-size: 12px;
            color: var(--text-primary);
            background: var(--bg-primary);
            padding: 12px;
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .header h2 {
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .refresh-btn {
            padding: 4px 8px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            border-radius: 4px;
            cursor: pointer;
        }

        .refresh-btn:hover {
            background: var(--accent);
            color: white;
        }

        .provider-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 12px;
            overflow: hidden;
        }

        .provider-header {
            display: flex;
            align-items: center;
            padding: 10px 12px;
            gap: 10px;
            cursor: pointer;
        }

        .provider-header:hover {
            background: rgba(255,255,255,0.05);
        }

        .provider-toggle {
            position: relative;
            width: 36px;
            height: 20px;
        }

        .provider-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #555;
            transition: .3s;
            border-radius: 20px;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 14px;
            width: 14px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
        }

        input:checked + .toggle-slider {
            background-color: var(--success);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(16px);
        }

        .provider-info {
            flex: 1;
        }

        .provider-name {
            font-weight: 600;
            font-size: 13px;
        }

        .provider-status {
            font-size: 10px;
            color: var(--text-secondary);
        }

        .provider-status.configured { color: var(--success); }
        .provider-status.not-configured { color: var(--error); }

        .status-icon {
            font-size: 16px;
        }

        .test-btn {
            padding: 4px 10px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        }

        .test-btn:hover {
            border-color: var(--accent);
            color: var(--accent);
        }

        .test-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .test-btn.testing {
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .provider-models {
            border-top: 1px solid var(--border);
            padding: 10px 12px;
            display: none;
        }

        .provider-card.expanded .provider-models {
            display: block;
        }

        .model-item {
            display: flex;
            align-items: center;
            padding: 6px 0;
            gap: 10px;
        }

        .model-item:not(:last-child) {
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .model-checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .model-info {
            flex: 1;
        }

        .model-name {
            font-weight: 500;
        }

        .model-desc {
            font-size: 10px;
            color: var(--text-secondary);
        }

        .model-context {
            font-size: 10px;
            color: var(--text-secondary);
            background: rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .select-btn {
            padding: 2px 8px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            border-radius: 4px;
            cursor: pointer;
            font-size: 10px;
        }

        .select-btn.selected {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        .expand-icon {
            transition: transform 0.2s;
        }

        .provider-card.expanded .expand-icon {
            transform: rotate(180deg);
        }

        .summary {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 16px;
        }

        .summary-title {
            font-weight: 600;
            margin-bottom: 8px;
        }

        .summary-stats {
            display: flex;
            gap: 16px;
            font-size: 11px;
        }

        .summary-stat {
            display: flex;
            align-items: center;
            gap: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🏭 Model Farm</h2>
        <button class="refresh-btn" onclick="refresh()">🔄</button>
    </div>

    <div class="summary">
        <div class="summary-title">Übersicht</div>
        <div class="summary-stats">
            <span class="summary-stat">✅ ${providers.filter(p => p.enabled && p.apiKeyConfigured).length} aktiv</span>
            <span class="summary-stat">📦 ${providers.reduce((sum, p) => sum + p.models.filter(m => m.enabled).length, 0)} Modelle</span>
        </div>
    </div>

    ${providers.map(provider => this.renderProvider(provider)).join('')}

    <script>
        const vscode = acquireVsCodeApi();

        function toggleProvider(providerId, enabled) {
            vscode.postMessage({ type: 'toggleProvider', providerId, enabled });
        }

        function toggleModel(providerId, modelId, enabled) {
            vscode.postMessage({ type: 'toggleModel', providerId, modelId, enabled });
        }

        function selectModel(providerId, modelId) {
            vscode.postMessage({ type: 'selectModel', providerId, modelId });
        }

        function testProvider(providerId) {
            const btn = document.getElementById('test-' + providerId);
            btn.classList.add('testing');
            btn.disabled = true;
            btn.textContent = '⏳ Testing...';
            vscode.postMessage({ type: 'testProvider', providerId });
        }

        function openSettings(providerId) {
            vscode.postMessage({ type: 'openSettings', providerId });
        }

        function refresh() {
            vscode.postMessage({ type: 'refresh' });
        }

        function toggleExpand(providerId) {
            const card = document.getElementById('card-' + providerId);
            card.classList.toggle('expanded');
        }

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'testingResult') {
                const btn = document.getElementById('test-' + message.providerId);
                btn.classList.remove('testing');
                btn.disabled = false;
                btn.textContent = message.success ? '✅ OK' : '❌ Fehler';
                setTimeout(() => {
                    btn.textContent = '🔌 Test';
                }, 3000);
            }
        });
    </script>
</body>
</html>`;
    }

    private renderProvider(provider: ProviderConfig): string {
        const statusClass = provider.apiKeyConfigured ? 'configured' : 'not-configured';
        const statusText = provider.apiKeyConfigured ? 'API Key ✓' : 'API Key fehlt';
        const statusIcon = provider.testStatus === 'success' ? '✅' :
            provider.testStatus === 'failed' ? '❌' :
                provider.apiKeyConfigured ? '⚪' : '🔑';

        return `
        <div class="provider-card" id="card-${provider.id}">
            <div class="provider-header" onclick="toggleExpand('${provider.id}')">
                <label class="provider-toggle" onclick="event.stopPropagation()">
                    <input type="checkbox" 
                           ${provider.enabled ? 'checked' : ''} 
                           ${!provider.apiKeyConfigured && provider.id !== 'ollama' ? 'disabled' : ''}
                           onchange="toggleProvider('${provider.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
                <div class="provider-info">
                    <div class="provider-name">${provider.name}</div>
                    <div class="provider-status ${statusClass}">${statusText}</div>
                </div>
                <span class="status-icon">${statusIcon}</span>
                ${provider.apiKeyConfigured || provider.id === 'ollama' ? `
                    <button class="test-btn" id="test-${provider.id}" onclick="event.stopPropagation(); testProvider('${provider.id}')">🔌 Test</button>
                ` : `
                    <button class="test-btn" onclick="event.stopPropagation(); openSettings('${provider.id}')">🔑 Setup</button>
                `}
                <span class="expand-icon">▼</span>
            </div>
            <div class="provider-models">
                ${provider.models.map(model => `
                    <div class="model-item">
                        <input type="checkbox" 
                               class="model-checkbox"
                               ${model.enabled ? 'checked' : ''}
                               onchange="toggleModel('${provider.id}', '${model.id}', this.checked)">
                        <div class="model-info">
                            <div class="model-name">${model.name}</div>
                            <div class="model-desc">${model.description || ''}</div>
                        </div>
                        ${model.contextWindow ? `<span class="model-context">${Math.round(model.contextWindow / 1000)}K</span>` : ''}
                        <button class="select-btn ${provider.selectedModel === model.id ? 'selected' : ''}"
                                onclick="selectModel('${provider.id}', '${model.id}')">
                            ${provider.selectedModel === model.id ? '★ Aktiv' : 'Wählen'}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }
}
