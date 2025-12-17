"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPanelProvider = void 0;
/**
 * CodeTeam AI - Agent Panel Provider
 * WebView Panel for interacting with the agent team
 */
const vscode = __importStar(require("vscode"));
class AgentPanelProvider {
    extensionUri;
    _view;
    orchestrator;
    buildRunner;
    constructor(extensionUri, orchestrator, buildRunner) {
        this.extensionUri = extensionUri;
        this.orchestrator = orchestrator;
        this.buildRunner = buildRunner;
    }
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtmlContent();
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'chat':
                    await this.handleChatMessage(message.text, message.agent);
                    break;
                case 'build':
                    await this.handleBuildRequest();
                    break;
                case 'test':
                    await this.handleTestRequest();
                    break;
                case 'workflow':
                    await this.handleWorkflowRequest(message.description);
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('workbench.action.openSettings', 'codeteam');
                    break;
            }
        });
    }
    async handleChatMessage(text, agent) {
        if (!this._view)
            return;
        // Show typing indicator
        this._view.webview.postMessage({
            type: 'typing',
            agent: agent || 'orchestrator'
        });
        try {
            const context = this.getEditorContext();
            let response;
            if (agent) {
                response = await this.orchestrator.routeToAgent(agent, text, context);
            }
            else {
                response = await this.orchestrator.smartRoute(text, context);
            }
            this._view.webview.postMessage({
                type: 'response',
                response
            });
        }
        catch (error) {
            this._view.webview.postMessage({
                type: 'error',
                message: String(error)
            });
        }
    }
    async handleBuildRequest() {
        if (!this._view)
            return;
        this._view.webview.postMessage({
            type: 'buildStart'
        });
        const result = await this.buildRunner.runBuild();
        this._view.webview.postMessage({
            type: 'buildResult',
            result
        });
    }
    async handleTestRequest() {
        if (!this._view)
            return;
        this._view.webview.postMessage({
            type: 'testStart'
        });
        const result = await this.buildRunner.runTests();
        this._view.webview.postMessage({
            type: 'testResult',
            result
        });
    }
    async handleWorkflowRequest(description) {
        if (!this._view)
            return;
        this._view.webview.postMessage({
            type: 'workflowStart'
        });
        const workflow = this.orchestrator.createFeatureWorkflow(description);
        const context = this.getEditorContext();
        const result = await this.orchestrator.orchestrateWorkflow(description, workflow, context);
        this._view.webview.postMessage({
            type: 'workflowResult',
            result
        });
    }
    getEditorContext() {
        const editor = vscode.window.activeTextEditor;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return {
            currentFile: editor?.document.fileName,
            selectedCode: editor?.document.getText(editor.selection),
            openFiles: vscode.window.visibleTextEditors.map(e => e.document.fileName),
            projectRoot: workspaceFolders?.[0]?.uri.fsPath,
            language: editor?.document.languageId
        };
    }
    showResponse(response) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'response',
                response
            });
        }
    }
    getHtmlContent() {
        return `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeTeam AI</title>
    <style>
        :root {
            --bg-primary: var(--vscode-editor-background);
            --bg-secondary: var(--vscode-sideBar-background);
            --text-primary: var(--vscode-editor-foreground);
            --text-secondary: var(--vscode-descriptionForeground);
            --accent: var(--vscode-button-background);
            --accent-hover: var(--vscode-button-hoverBackground);
            --border: var(--vscode-panel-border);
            --input-bg: var(--vscode-input-background);
            --input-border: var(--vscode-input-border);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--text-primary);
            background: var(--bg-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            padding: 12px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .header h2 {
            font-size: 14px;
            font-weight: 600;
        }

        .agent-selector {
            display: flex;
            gap: 4px;
            padding: 8px;
            border-bottom: 1px solid var(--border);
            flex-wrap: wrap;
        }

        .agent-btn {
            padding: 4px 8px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .agent-btn:hover, .agent-btn.active {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .message {
            padding: 10px 12px;
            border-radius: 8px;
            max-width: 90%;
        }

        .message.user {
            background: var(--accent);
            color: white;
            align-self: flex-end;
        }

        .message.agent {
            background: var(--bg-secondary);
            align-self: flex-start;
            border: 1px solid var(--border);
        }

        .message-header {
            font-size: 10px;
            color: var(--text-secondary);
            margin-bottom: 4px;
            text-transform: uppercase;
            font-weight: 600;
        }

        .message.user .message-header {
            color: rgba(255,255,255,0.7);
        }

        .message-content {
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
        }

        .message-content code {
            background: rgba(0,0,0,0.2);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
            font-size: 12px;
        }

        .message-content pre {
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
        }

        .message-content pre code {
            background: none;
            padding: 0;
        }

        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 10px;
        }

        .typing-indicator span {
            width: 8px;
            height: 8px;
            background: var(--text-secondary);
            border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        .input-container {
            padding: 12px;
            border-top: 1px solid var(--border);
        }

        .input-wrapper {
            display: flex;
            gap: 8px;
        }

        .chat-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid var(--input-border);
            background: var(--input-bg);
            color: var(--text-primary);
            border-radius: 6px;
            font-size: 13px;
            resize: none;
            font-family: inherit;
        }

        .chat-input:focus {
            outline: none;
            border-color: var(--accent);
        }

        .send-btn {
            padding: 10px 16px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s;
        }

        .send-btn:hover {
            background: var(--accent-hover);
        }

        .action-buttons {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }

        .action-btn {
            flex: 1;
            padding: 6px 10px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }

        .result-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            margin: 8px 0;
        }

        .result-card.success {
            border-left: 3px solid #4caf50;
        }

        .result-card.error {
            border-left: 3px solid #f44336;
        }

        .result-title {
            font-weight: 600;
            margin-bottom: 8px;
        }

        .result-stats {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: var(--text-secondary);
        }

        .stat {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .stat.passed { color: #4caf50; }
        .stat.failed { color: #f44336; }
        .stat.skipped { color: #ff9800; }

        .settings-btn {
            margin-left: auto;
            padding: 4px 8px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .settings-btn:hover {
            background: var(--accent);
            color: white;
        }

        .setup-btn {
            display: block;
            margin-top: 12px;
            padding: 10px 16px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            width: 100%;
        }

        .setup-btn:hover {
            background: var(--accent-hover);
        }
    </style>
</head>
<body>
    <div class="header">
        <span>🤖</span>
        <h2>CodeTeam AI</h2>
        <button class="settings-btn" id="settingsBtn" title="API Keys konfigurieren">⚙️</button>
    </div>

    <div class="agent-selector">
        <button class="agent-btn active" data-agent="">Auto</button>
        <button class="agent-btn" data-agent="coder">👨‍💻 Coder</button>
        <button class="agent-btn" data-agent="reviewer">🔍 Reviewer</button>
        <button class="agent-btn" data-agent="tester">🧪 Tester</button>
        <button class="agent-btn" data-agent="docs">📝 Docs</button>
        <button class="agent-btn" data-agent="architect">🏗️ Architect</button>
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="message agent">
            <div class="message-header">System</div>
            <div class="message-content">
                Willkommen bei CodeTeam AI! 👋

<strong>⚠️ Wichtig: API Key konfigurieren</strong>
Klicke auf ⚙️ oben rechts oder nutze den Button unten, um deine API Keys einzustellen.

Unterstützte Provider:
• OpenAI (GPT-4)
• Anthropic (Claude)
• Google (Gemini)
• Groq (kostenlos!)
• DeepSeek, Kimi, Minimax
• Ollama (lokal)

<button class="setup-btn" onclick="openSettings()">🔑 API Keys konfigurieren</button>
            </div>
        </div>
    </div>

    <div class="input-container">
        <div class="input-wrapper">
            <textarea 
                class="chat-input" 
                id="chatInput" 
                placeholder="Beschreibe was du brauchst..."
                rows="2"
            ></textarea>
            <button class="send-btn" id="sendBtn">Senden</button>
        </div>
        <div class="action-buttons">
            <button class="action-btn" id="settingsBtn2">⚙️ Settings</button>
            <button class="action-btn" id="buildBtn">🔨 Build</button>
            <button class="action-btn" id="testBtn">🧪 Tests</button>
            <button class="action-btn" id="workflowBtn">⚡ Workflow</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const chatInput = document.getElementById('chatInput');
        const sendBtn = document.getElementById('sendBtn');
        const buildBtn = document.getElementById('buildBtn');
        const testBtn = document.getElementById('testBtn');
        const workflowBtn = document.getElementById('workflowBtn');
        const agentBtns = document.querySelectorAll('.agent-btn');

        let selectedAgent = '';

        // Open Settings function (global for onclick)
        function openSettings() {
            vscode.postMessage({ type: 'openSettings' });
        }
        window.openSettings = openSettings;

        // Settings buttons
        document.getElementById('settingsBtn').addEventListener('click', openSettings);
        document.getElementById('settingsBtn2').addEventListener('click', openSettings);

        // Agent selection
        agentBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                agentBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedAgent = btn.dataset.agent;
            });
        });

        // Send message
        function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage('user', 'Du', text);
            chatInput.value = '';

            vscode.postMessage({
                type: 'chat',
                text,
                agent: selectedAgent || undefined
            });
        }

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Build button
        buildBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'build' });
        });

        // Test button
        testBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'test' });
        });

        // Workflow button
        workflowBtn.addEventListener('click', () => {
            const description = chatInput.value.trim();
            if (!description) {
                addMessage('agent', 'System', 'Bitte beschreibe das Feature im Eingabefeld.');
                return;
            }
            chatInput.value = '';
            addMessage('user', 'Du', 'Feature Workflow: ' + description);
            vscode.postMessage({ type: 'workflow', description });
        });

        // Add message to chat
        function addMessage(type, sender, content) {
            const msg = document.createElement('div');
            msg.className = 'message ' + type;
            msg.innerHTML = \`
                <div class="message-header">\${sender}</div>
                <div class="message-content">\${formatContent(content)}</div>
            \`;
            chatContainer.appendChild(msg);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Add typing indicator
        function addTypingIndicator(agent) {
            const existing = document.querySelector('.typing-indicator');
            if (existing) existing.remove();

            const indicator = document.createElement('div');
            indicator.className = 'message agent';
            indicator.innerHTML = \`
                <div class="message-header">\${getAgentLabel(agent)}</div>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            \`;
            chatContainer.appendChild(indicator);
            chatContainer.scrollTop = chatContainer.scrollHeight;
            return indicator;
        }

        function getAgentLabel(agent) {
            const labels = {
                'coder': '👨‍💻 Coder Agent',
                'reviewer': '🔍 Reviewer Agent',
                'tester': '🧪 Tester Agent',
                'docs': '📝 Docs Agent',
                'architect': '🏗️ Architect Agent',
                'orchestrator': '🎯 Orchestrator'
            };
            return labels[agent] || '🤖 Agent';
        }

        // Format content with code blocks
        function formatContent(content) {
            // Escape HTML
            content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            // Code blocks
            content = content.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>');
            
            // Inline code
            content = content.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
            
            // Bold
            content = content.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
            
            return content;
        }

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;

            switch (message.type) {
                case 'typing':
                    addTypingIndicator(message.agent);
                    break;

                case 'response':
                    document.querySelector('.typing-indicator')?.parentElement?.remove();
                    const resp = message.response;
                    addMessage('agent', getAgentLabel(resp.agentType), resp.content);
                    break;

                case 'error':
                    document.querySelector('.typing-indicator')?.parentElement?.remove();
                    addMessage('agent', '❌ Error', message.message);
                    break;

                case 'buildStart':
                    addMessage('agent', '🔨 Build', 'Build wird ausgeführt...');
                    break;

                case 'buildResult':
                    const br = message.result;
                    const buildCard = \`
                        <div class="result-card \${br.success ? 'success' : 'error'}">
                            <div class="result-title">\${br.success ? '✅ Build erfolgreich' : '❌ Build fehlgeschlagen'}</div>
                            <div class="result-stats">
                                <span class="stat">⏱️ \${br.duration}ms</span>
                                <span class="stat failed">⚠️ \${br.errors.length} Fehler</span>
                                <span class="stat skipped">⚡ \${br.warnings.length} Warnungen</span>
                            </div>
                        </div>
                    \`;
                    chatContainer.insertAdjacentHTML('beforeend', buildCard);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    break;

                case 'testStart':
                    addMessage('agent', '🧪 Tests', 'Tests werden ausgeführt...');
                    break;

                case 'testResult':
                    const tr = message.result;
                    const testCard = \`
                        <div class="result-card \${tr.success ? 'success' : 'error'}">
                            <div class="result-title">\${tr.success ? '✅ Tests bestanden' : '❌ Tests fehlgeschlagen'}</div>
                            <div class="result-stats">
                                <span class="stat passed">✓ \${tr.passed} passed</span>
                                <span class="stat failed">✗ \${tr.failed} failed</span>
                                <span class="stat skipped">○ \${tr.skipped} skipped</span>
                                <span class="stat">⏱️ \${tr.duration}ms</span>
                            </div>
                        </div>
                    \`;
                    chatContainer.insertAdjacentHTML('beforeend', testCard);
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    break;

                case 'workflowStart':
                    addMessage('agent', '⚡ Workflow', 'Multi-Agent Workflow wird gestartet...');
                    break;

                case 'workflowResult':
                    const wr = message.result;
                    let workflowSummary = '**Workflow ' + (wr.success ? 'abgeschlossen' : 'fehlgeschlagen') + '** (' + wr.duration + 'ms)\\n\\n';
                    wr.steps.forEach(step => {
                        const emoji = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
                        workflowSummary += emoji + ' ' + step.agentType + ': ' + step.action.slice(0, 50) + '...\\n';
                    });
                    addMessage('agent', '⚡ Workflow', workflowSummary);
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}
exports.AgentPanelProvider = AgentPanelProvider;
//# sourceMappingURL=panel.js.map