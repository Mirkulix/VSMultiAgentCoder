/**
 * CodeTeam AI - Agent Panel Provider
 * WebView Panel for interacting with the agent team
 * With integrated code workflow
 */
import * as vscode from 'vscode';
import { Orchestrator } from '../orchestrator/router';
import { BuildRunner } from '../build/runner';
import { AgentResponse, AgentType } from '../types';
import { MultiAgentExecutor, ExecutionProgress } from '../orchestrator/multi-agent-executor';

export class AgentPanelProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private orchestrator: Orchestrator;
    private buildRunner: BuildRunner;
    private multiAgentExecutor?: MultiAgentExecutor;
    private lastGeneratedCode: string = '';

    constructor(
        private readonly extensionUri: vscode.Uri,
        orchestrator: Orchestrator,
        buildRunner: BuildRunner,
        multiAgentExecutor?: MultiAgentExecutor
    ) {
        this.orchestrator = orchestrator;
        this.buildRunner = buildRunner;
        this.multiAgentExecutor = multiAgentExecutor;
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

        webviewView.webview.html = this.getHtmlContent();

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'chat':
                    await this.handleChatMessage(message.text, message.agent);
                    break;
                case 'generateCode':
                    await this.handleGenerateCode(message.description);
                    break;
                case 'reviewCode':
                    await this.handleReviewCode(message.code);
                    break;
                case 'generateTests':
                    await this.handleGenerateTests(message.code);
                    break;
                case 'generateDocs':
                    await this.handleGenerateDocs(message.code);
                    break;
                case 'insertCode':
                    await this.insertCodeToEditor(message.code);
                    break;
                case 'createFile':
                    await this.createNewFile(message.code, message.filename);
                    break;
                case 'runFullWorkflow':
                    await this.runFullWorkflow(message.description);
                    break;
                case 'openSettings':
                    vscode.commands.executeCommand('codeteam.openSettings');
                    break;
                case 'build':
                    await this.handleBuildRequest();
                    break;
                case 'test':
                    await this.handleTestRequest();
                    break;
            }
        });
    }

    private async handleChatMessage(text: string, agent?: AgentType): Promise<void> {
        if (!this._view) return;

        // Slash Command Handling
        if (text.startsWith('/')) {
            await this.handleSlashCommand(text);
            return;
        }

        this._view.webview.postMessage({
            type: 'typing',
            agent: agent || 'orchestrator'
        });

        try {
            const context = this.getEditorContext();
            let response: AgentResponse;

            if (agent) {
                response = await this.orchestrator.routeToAgent(agent, text, context);
            } else {
                response = await this.orchestrator.smartRoute(text, context);
            }

            // Speichere generierten Code
            if (response.codeBlocks && response.codeBlocks.length > 0) {
                this.lastGeneratedCode = response.codeBlocks[0].code;
            }

            this._view.webview.postMessage({
                type: 'response',
                response,
                hasCode: response.codeBlocks && response.codeBlocks.length > 0
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'error',
                message: String(error)
            });
        }
    }

    private async handleSlashCommand(text: string): Promise<void> {
        if (!this._view) return;
        const [cmd, ...args] = text.trim().split(' ');
        const input = args.join(' ');

        switch (cmd) {
            case '/plan':
                vscode.commands.executeCommand('codeteam.plan', input);
                break;
            case '/implement':
                vscode.commands.executeCommand('codeteam.implement', input);
                break;
            case '/review':
                await this.handleReviewCode(input);
                break;
            case '/test':
                await this.handleGenerateTests(input);
                break;
            case '/fix':
                this._view.webview.postMessage({ type: 'typing', agent: 'developer' });
                const context = this.getEditorContext();
                const response = await this.orchestrator.routeToAgent('developer', `Fix this issue: ${input}`, context);
                this.showResponse(response);
                break;
            case '/explain':
                this._view.webview.postMessage({ type: 'typing', agent: 'docs' });
                const ctx = this.getEditorContext();
                const resp = await this.orchestrator.routeToAgent('docs', `Explain: ${input}`, ctx);
                this.showResponse(resp);
                break;
            default:
                this._view.webview.postMessage({
                    type: 'error',
                    message: `Unknown command: ${cmd}. Try /plan, /implement, /review, /test, /fix, /explain`
                });
        }
    }

    private async handleGenerateCode(description: string): Promise<void> {
        if (!this._view) return;

        this._view.webview.postMessage({ type: 'typing', agent: 'coder' });

        try {
            const context = this.getEditorContext();
            const response = await this.orchestrator.routeToAgent('coder',
                `Generiere Code für: ${description}\n\nAktueller Kontext:\n- Sprache: ${context.language || 'TypeScript'}\n- Datei: ${context.currentFile || 'Neue Datei'}`,
                context
            );

            if (response.codeBlocks && response.codeBlocks.length > 0) {
                this.lastGeneratedCode = response.codeBlocks[0].code;
            }

            this._view.webview.postMessage({
                type: 'codeGenerated',
                response,
                code: this.lastGeneratedCode
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'error',
                message: String(error)
            });
        }
    }

    private async handleReviewCode(code: string): Promise<void> {
        if (!this._view) return;

        const codeToReview = code || this.lastGeneratedCode || this.getEditorContext().selectedCode;
        if (!codeToReview) {
            this._view.webview.postMessage({
                type: 'error',
                message: 'Kein Code zum Reviewen. Bitte Code generieren oder im Editor auswählen.'
            });
            return;
        }

        this._view.webview.postMessage({ type: 'typing', agent: 'reviewer' });

        try {
            const response = await this.orchestrator.routeToAgent('reviewer',
                `Review diesen Code und gib Verbesserungsvorschläge:\n\n\`\`\`\n${codeToReview}\n\`\`\``,
                this.getEditorContext()
            );

            this._view.webview.postMessage({
                type: 'reviewComplete',
                response
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'error',
                message: String(error)
            });
        }
    }

    private async handleGenerateTests(code: string): Promise<void> {
        if (!this._view) return;

        const codeToTest = code || this.lastGeneratedCode || this.getEditorContext().selectedCode;
        if (!codeToTest) {
            this._view.webview.postMessage({
                type: 'error',
                message: 'Kein Code für Tests. Bitte Code generieren oder im Editor auswählen.'
            });
            return;
        }

        this._view.webview.postMessage({ type: 'typing', agent: 'tester' });

        try {
            const response = await this.orchestrator.routeToAgent('tester',
                `Generiere umfassende Unit-Tests für diesen Code:\n\n\`\`\`\n${codeToTest}\n\`\`\``,
                this.getEditorContext()
            );

            this._view.webview.postMessage({
                type: 'testsGenerated',
                response,
                hasCode: response.codeBlocks && response.codeBlocks.length > 0
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'error',
                message: String(error)
            });
        }
    }

    private async handleGenerateDocs(code: string): Promise<void> {
        if (!this._view) return;

        const codeToDoc = code || this.lastGeneratedCode || this.getEditorContext().selectedCode;
        if (!codeToDoc) {
            this._view.webview.postMessage({
                type: 'error',
                message: 'Kein Code für Dokumentation. Bitte Code generieren oder im Editor auswählen.'
            });
            return;
        }

        this._view.webview.postMessage({ type: 'typing', agent: 'docs' });

        try {
            const response = await this.orchestrator.routeToAgent('docs',
                `Generiere JSDoc/TSDoc Dokumentation für diesen Code:\n\n\`\`\`\n${codeToDoc}\n\`\`\``,
                this.getEditorContext()
            );

            this._view.webview.postMessage({
                type: 'docsGenerated',
                response
            });
        } catch (error) {
            this._view.webview.postMessage({
                type: 'error',
                message: String(error)
            });
        }
    }

    private async insertCodeToEditor(code: string): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        const codeToInsert = code || this.lastGeneratedCode;

        if (!codeToInsert) {
            vscode.window.showWarningMessage('Kein Code zum Einfügen vorhanden');
            return;
        }

        if (editor) {
            await editor.edit(editBuilder => {
                if (editor.selection.isEmpty) {
                    editBuilder.insert(editor.selection.active, codeToInsert);
                } else {
                    editBuilder.replace(editor.selection, codeToInsert);
                }
            });
            vscode.window.showInformationMessage('✅ Code eingefügt!');
        } else {
            // Kein Editor offen - neues Dokument erstellen
            const doc = await vscode.workspace.openTextDocument({
                content: codeToInsert,
                language: this.detectLanguage(codeToInsert)
            });
            await vscode.window.showTextDocument(doc);
        }

        this._view?.webview.postMessage({ type: 'codeInserted' });
    }

    private async createNewFile(code: string, filename?: string): Promise<void> {
        const codeToWrite = code || this.lastGeneratedCode;
        if (!codeToWrite) {
            vscode.window.showWarningMessage('Kein Code zum Erstellen vorhanden');
            return;
        }

        const language = this.detectLanguage(codeToWrite);
        const defaultName = filename || `new-file.${this.getExtension(language)}`;

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultName),
            filters: {
                'All Files': ['*']
            }
        });

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(codeToWrite, 'utf-8'));
            const doc = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage(`✅ Datei erstellt: ${uri.fsPath}`);
        }
    }

    private async runFullWorkflow(description: string): Promise<void> {
        if (!this._view) return;

        this._view.webview.postMessage({
            type: 'workflowStart',
            steps: ['generate', 'review', 'tests', 'docs']
        });

        try {
            // Step 1: Generate Code
            this._view.webview.postMessage({ type: 'workflowStep', step: 'generate', status: 'running' });
            await this.handleGenerateCode(description);
            this._view.webview.postMessage({ type: 'workflowStep', step: 'generate', status: 'complete' });

            if (!this.lastGeneratedCode) {
                throw new Error('Keine Code-Generierung möglich');
            }

            // Step 2: Review
            this._view.webview.postMessage({ type: 'workflowStep', step: 'review', status: 'running' });
            await this.handleReviewCode(this.lastGeneratedCode);
            this._view.webview.postMessage({ type: 'workflowStep', step: 'review', status: 'complete' });

            // Step 3: Tests
            this._view.webview.postMessage({ type: 'workflowStep', step: 'tests', status: 'running' });
            await this.handleGenerateTests(this.lastGeneratedCode);
            this._view.webview.postMessage({ type: 'workflowStep', step: 'tests', status: 'complete' });

            // Step 4: Docs
            this._view.webview.postMessage({ type: 'workflowStep', step: 'docs', status: 'running' });
            await this.handleGenerateDocs(this.lastGeneratedCode);
            this._view.webview.postMessage({ type: 'workflowStep', step: 'docs', status: 'complete' });

            this._view.webview.postMessage({ type: 'workflowComplete' });

        } catch (error) {
            this._view.webview.postMessage({
                type: 'workflowError',
                error: String(error)
            });
        }
    }

    private detectLanguage(code: string): string {
        if (code.includes('import React') || code.includes('tsx')) return 'typescriptreact';
        if (code.includes('interface ') || code.includes(': string') || code.includes(': number')) return 'typescript';
        if (code.includes('function') || code.includes('const ') || code.includes('let ')) return 'javascript';
        if (code.includes('def ') || code.includes('import ')) return 'python';
        if (code.includes('public class') || code.includes('private void')) return 'java';
        if (code.includes('func ') || code.includes('package main')) return 'go';
        if (code.includes('fn ') || code.includes('let mut')) return 'rust';
        return 'typescript';
    }

    private getExtension(language: string): string {
        const map: Record<string, string> = {
            'typescript': 'ts',
            'typescriptreact': 'tsx',
            'javascript': 'js',
            'python': 'py',
            'java': 'java',
            'go': 'go',
            'rust': 'rs'
        };
        return map[language] || 'txt';
    }

    private async handleBuildRequest(): Promise<void> {
        if (!this._view) return;

        this._view.webview.postMessage({ type: 'buildStart' });
        const result = await this.buildRunner.runBuild();
        this._view.webview.postMessage({ type: 'buildResult', result });
    }

    private async handleTestRequest(): Promise<void> {
        if (!this._view) return;

        this._view.webview.postMessage({ type: 'testStart' });
        const result = await this.buildRunner.runTests();
        this._view.webview.postMessage({ type: 'testResult', result });
    }

    private getEditorContext() {
        const editor = vscode.window.activeTextEditor;
        const workspaceFolders = vscode.workspace.workspaceFolders;

        return {
            currentFile: editor?.document.fileName,
            selectedCode: editor?.document.getText(editor.selection),
            fullFileContent: editor?.document.getText(),
            openFiles: vscode.window.visibleTextEditors.map(e => e.document.fileName),
            projectRoot: workspaceFolders?.[0]?.uri.fsPath,
            language: editor?.document.languageId
        };
    }

    showResponse(response: AgentResponse): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'response',
                response
            });
        }
    }

    showMultiAgentProgress(progress: ExecutionProgress): void {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'multiAgentProgress',
                progress
            });
        }
    }

    private getHtmlContent(): string {
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
            --bg-tertiary: var(--vscode-input-background);
            --text-primary: var(--vscode-editor-foreground);
            --text-secondary: var(--vscode-descriptionForeground);
            --accent: var(--vscode-button-background);
            --accent-hover: var(--vscode-button-hoverBackground);
            --border: var(--vscode-panel-border);
            --success: #4caf50;
            --warning: #ff9800;
            --error: #f44336;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: var(--vscode-font-family);
            font-size: 12px;
            color: var(--text-primary);
            background: var(--bg-primary);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Header */
        .header {
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-secondary);
        }

        .header h2 {
            font-size: 13px;
            font-weight: 600;
            flex: 1;
        }

        .settings-btn {
            padding: 4px 8px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .settings-btn:hover {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        /* Workflow Buttons */
        .workflow-bar {
            padding: 8px;
            border-bottom: 1px solid var(--border);
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
            background: var(--bg-secondary);
        }

        .workflow-btn {
            padding: 6px 10px;
            border: 1px solid var(--border);
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: all 0.2s;
        }

        .workflow-btn:hover {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        .workflow-btn.primary {
            background: var(--accent);
            color: white;
            border-color: var(--accent);
        }

        .workflow-btn.primary:hover {
            opacity: 0.9;
        }

        .workflow-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Chat Container */
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        /* Messages */
        .message {
            padding: 10px 12px;
            border-radius: 8px;
            max-width: 95%;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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
            margin-bottom: 6px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .message.user .message-header {
            color: rgba(255,255,255,0.8);
        }

        .agent-badge {
            padding: 2px 6px;
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
            font-size: 9px;
        }

        .message-content {
            font-size: 12px;
            line-height: 1.5;
        }

        /* Code Blocks */
        .code-block {
            background: #1e1e1e;
            border-radius: 6px;
            margin: 8px 0;
            overflow: hidden;
        }

        .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            background: #2d2d2d;
            font-size: 10px;
            color: #888;
        }

        .code-actions {
            display: flex;
            gap: 4px;
        }

        .code-action-btn {
            padding: 3px 8px;
            background: transparent;
            border: 1px solid #555;
            color: #ccc;
            border-radius: 3px;
            font-size: 10px;
            cursor: pointer;
        }

        .code-action-btn:hover {
            background: var(--accent);
            border-color: var(--accent);
            color: white;
        }

        .code-content {
            padding: 10px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 11px;
            line-height: 1.4;
            overflow-x: auto;
            white-space: pre;
            color: #d4d4d4;
        }

        /* Typing Indicator */
        .typing-indicator {
            display: flex;
            gap: 4px;
            padding: 8px;
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

        /* Workflow Progress */
        .workflow-progress {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            margin: 8px 0;
        }

        .workflow-progress h4 {
            font-size: 12px;
            margin-bottom: 10px;
        }

        .workflow-steps {
            display: flex;
            gap: 8px;
        }

        .workflow-step {
            flex: 1;
            text-align: center;
            padding: 8px;
            background: var(--bg-tertiary);
            border-radius: 4px;
            font-size: 10px;
        }

        .workflow-step.running {
            background: var(--accent);
            color: white;
            animation: pulse 1s infinite;
        }

        .workflow-step.complete {
            background: var(--success);
            color: white;
        }

        .workflow-step.error {
            background: var(--error);
            color: white;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        /* Input Area */
        .input-container {
            padding: 10px;
            border-top: 1px solid var(--border);
            background: var(--bg-secondary);
        }

        .input-wrapper {
            display: flex;
            gap: 6px;
        }

        .chat-input {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--border);
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border-radius: 6px;
            font-size: 12px;
            resize: none;
            font-family: inherit;
            min-height: 38px;
            max-height: 120px;
        }

        .chat-input:focus {
            outline: none;
            border-color: var(--accent);
        }

        .send-btn {
            padding: 10px 14px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
        }

        .send-btn:hover {
            background: var(--accent-hover);
        }

        /* Quick Actions */
        .quick-actions {
            display: flex;
            gap: 4px;
            margin-top: 6px;
            flex-wrap: wrap;
        }

        .quick-btn {
            padding: 4px 8px;
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            border-radius: 4px;
            font-size: 10px;
            cursor: pointer;
        }

        .quick-btn:hover {
            background: var(--bg-tertiary);
            color: var(--text-primary);
        }

        /* Result Cards */
        .result-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 10px;
            margin: 8px 0;
        }

        .result-card.success { border-left: 3px solid var(--success); }
        .result-card.error { border-left: 3px solid var(--error); }
        .result-card.warning { border-left: 3px solid var(--warning); }

        .result-title {
            font-weight: 600;
            margin-bottom: 6px;
            font-size: 12px;
        }

        .result-stats {
            display: flex;
            gap: 12px;
            font-size: 11px;
            color: var(--text-secondary);
        }
    </style>
</head>
<body>
    <div class="header">
        <span>🤖</span>
        <h2>CodeTeam AI</h2>
        <button class="settings-btn" onclick="openSettings()" title="Settings">⚙️</button>
    </div>

    <div class="workflow-bar">
        <button class="workflow-btn primary" onclick="showGenerateDialog()">
            ✨ Code generieren
        </button>
        <button class="workflow-btn" onclick="reviewCurrentCode()">
            🔍 Review
        </button>
        <button class="workflow-btn" onclick="generateTests()">
            🧪 Tests
        </button>
        <button class="workflow-btn" onclick="generateDocs()">
            📝 Docs
        </button>
        <button class="workflow-btn" onclick="runFullWorkflow()" title="Kompletter Workflow">
            ⚡ Full
        </button>
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="message agent">
            <div class="message-header">
                <span>🤖</span> System
            </div>
            <div class="message-content">
                <strong>Willkommen bei CodeTeam AI!</strong>

Deine Code-Agenten sind bereit:

<strong>✨ Code generieren</strong> - Beschreibe was du brauchst
<strong>🔍 Review</strong> - Code analysieren & verbessern
<strong>🧪 Tests</strong> - Unit Tests generieren
<strong>📝 Docs</strong> - Dokumentation erstellen
<strong>⚡ Full</strong> - Kompletter Workflow

<em>Tipp: Markiere Code im Editor für kontextbezogene Aktionen!</em>
            </div>
        </div>
    </div>

    <div class="input-container">
        <div class="input-wrapper">
            <textarea
                class="chat-input"
                id="chatInput"
                placeholder="Beschreibe was du brauchst oder stelle eine Frage..."
                rows="2"
            ></textarea>
            <button class="send-btn" onclick="sendMessage()">Senden</button>
        </div>
        <div class="quick-actions">
            <button class="quick-btn" onclick="insertTemplate('function')">+ Function</button>
            <button class="quick-btn" onclick="insertTemplate('class')">+ Class</button>
            <button class="quick-btn" onclick="insertTemplate('api')">+ API</button>
            <button class="quick-btn" onclick="insertTemplate('component')">+ Component</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const chatInput = document.getElementById('chatInput');

        let currentCode = '';

        // Templates
        const templates = {
            function: 'Erstelle eine Funktion die ',
            class: 'Erstelle eine Klasse für ',
            api: 'Erstelle einen API Endpoint für ',
            component: 'Erstelle eine React Component für '
        };

        function insertTemplate(type) {
            chatInput.value = templates[type];
            chatInput.focus();
        }

        function openSettings() {
            vscode.postMessage({ type: 'openSettings' });
        }

        function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;

            addMessage('user', 'Du', text);
            chatInput.value = '';

            vscode.postMessage({ type: 'chat', text });
        }

        function showGenerateDialog() {
            const description = chatInput.value.trim() || prompt('Was soll generiert werden?');
            if (!description) return;

            chatInput.value = '';
            addMessage('user', 'Du', '✨ Generiere: ' + description);
            vscode.postMessage({ type: 'generateCode', description });
        }

        function reviewCurrentCode() {
            addMessage('user', 'Du', '🔍 Review Code');
            vscode.postMessage({ type: 'reviewCode', code: currentCode });
        }

        function generateTests() {
            addMessage('user', 'Du', '🧪 Generiere Tests');
            vscode.postMessage({ type: 'generateTests', code: currentCode });
        }

        function generateDocs() {
            addMessage('user', 'Du', '📝 Generiere Dokumentation');
            vscode.postMessage({ type: 'generateDocs', code: currentCode });
        }

        function runFullWorkflow() {
            const description = chatInput.value.trim() || prompt('Beschreibe das Feature:');
            if (!description) return;

            chatInput.value = '';
            addMessage('user', 'Du', '⚡ Full Workflow: ' + description);
            vscode.postMessage({ type: 'runFullWorkflow', description });
        }

        function insertCode(code) {
            vscode.postMessage({ type: 'insertCode', code });
        }

        function createFile(code) {
            vscode.postMessage({ type: 'createFile', code });
        }

        function copyCode(code) {
            navigator.clipboard.writeText(code);
            showToast('Code kopiert!');
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:8px 16px;border-radius:4px;z-index:1000;';
            toast.textContent = message;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }

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

        function addCodeMessage(agent, text, code, language) {
            currentCode = code;

            const msg = document.createElement('div');
            msg.className = 'message agent';
            msg.innerHTML = \`
                <div class="message-header">
                    <span>\${getAgentEmoji(agent)}</span>
                    \${getAgentLabel(agent)}
                    <span class="agent-badge">\${agent}</span>
                </div>
                <div class="message-content">\${formatContent(text)}</div>
                <div class="code-block">
                    <div class="code-header">
                        <span>\${language || 'code'}</span>
                        <div class="code-actions">
                            <button class="code-action-btn" onclick="insertCode(\\\`\${escapeCode(code)}\\\`)">📥 Einfügen</button>
                            <button class="code-action-btn" onclick="createFile(\\\`\${escapeCode(code)}\\\`)">📄 Neue Datei</button>
                            <button class="code-action-btn" onclick="copyCode(\\\`\${escapeCode(code)}\\\`)">📋 Kopieren</button>
                        </div>
                    </div>
                    <div class="code-content">\${escapeHtml(code)}</div>
                </div>
                <div class="quick-actions" style="margin-top:8px;">
                    <button class="quick-btn" onclick="reviewCurrentCode()">🔍 Review</button>
                    <button class="quick-btn" onclick="generateTests()">🧪 Tests</button>
                    <button class="quick-btn" onclick="generateDocs()">📝 Docs</button>
                </div>
            \`;
            chatContainer.appendChild(msg);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function addTypingIndicator(agent) {
            removeTypingIndicator();
            const indicator = document.createElement('div');
            indicator.className = 'message agent';
            indicator.id = 'typingIndicator';
            indicator.innerHTML = \`
                <div class="message-header">\${getAgentEmoji(agent)} \${getAgentLabel(agent)}</div>
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            \`;
            chatContainer.appendChild(indicator);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function removeTypingIndicator() {
            document.getElementById('typingIndicator')?.remove();
        }

        function addWorkflowProgress() {
            const progress = document.createElement('div');
            progress.className = 'workflow-progress';
            progress.id = 'workflowProgress';
            progress.innerHTML = \`
                <h4>⚡ Workflow läuft...</h4>
                <div class="workflow-steps">
                    <div class="workflow-step" id="step-generate">✨ Generate</div>
                    <div class="workflow-step" id="step-review">🔍 Review</div>
                    <div class="workflow-step" id="step-tests">🧪 Tests</div>
                    <div class="workflow-step" id="step-docs">📝 Docs</div>
                </div>
            \`;
            chatContainer.appendChild(progress);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function updateWorkflowStep(step, status) {
            const stepEl = document.getElementById('step-' + step);
            if (stepEl) {
                stepEl.className = 'workflow-step ' + status;
            }
        }

        function getAgentEmoji(agent) {
            const emojis = {
                'coder': '👨‍💻',
                'reviewer': '🔍',
                'tester': '🧪',
                'docs': '📝',
                'architect': '🏗️',
                'orchestrator': '🎯'
            };
            return emojis[agent] || '🤖';
        }

        function getAgentLabel(agent) {
            const labels = {
                'coder': 'Coder Agent',
                'reviewer': 'Reviewer Agent',
                'tester': 'Tester Agent',
                'docs': 'Docs Agent',
                'architect': 'Architect Agent',
                'orchestrator': 'Orchestrator'
            };
            return labels[agent] || 'Agent';
        }

        function formatContent(content) {
            let formatted = escapeHtml(content);
            formatted = formatted.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
            formatted = formatted.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
            formatted = formatted.replace(/\`([^\`]+)\`/g, '<code style="background:rgba(0,0,0,0.2);padding:2px 4px;border-radius:3px;">$1</code>');
            return formatted;
        }

        function escapeHtml(text) {
            return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function escapeCode(code) {
            return code.replace(/\\\\/g, '\\\\\\\\').replace(/\`/g, '\\\\\`').replace(/\\$/g, '\\\\$');
        }

        // Enter to send
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const msg = event.data;

            switch (msg.type) {
                case 'typing':
                    addTypingIndicator(msg.agent);
                    break;

                case 'response':
                case 'codeGenerated':
                case 'testsGenerated':
                    removeTypingIndicator();
                    const resp = msg.response;
                    if (resp.codeBlocks && resp.codeBlocks.length > 0) {
                        addCodeMessage(resp.agentType, resp.content, resp.codeBlocks[0].code, resp.codeBlocks[0].language);
                    } else {
                        addMessage('agent', getAgentEmoji(resp.agentType) + ' ' + getAgentLabel(resp.agentType), resp.content);
                    }
                    break;

                case 'reviewComplete':
                case 'docsGenerated':
                    removeTypingIndicator();
                    const r = msg.response;
                    addMessage('agent', getAgentEmoji(r.agentType) + ' ' + getAgentLabel(r.agentType), r.content);
                    break;

                case 'error':
                    removeTypingIndicator();
                    addMessage('agent', '❌ Error', msg.message);
                    break;

                case 'codeInserted':
                    showToast('✅ Code eingefügt!');
                    break;

                case 'workflowStart':
                    addWorkflowProgress();
                    break;

                case 'workflowStep':
                    updateWorkflowStep(msg.step, msg.status);
                    break;

                case 'workflowComplete':
                    document.getElementById('workflowProgress')?.remove();
                    addMessage('agent', '✅ Workflow', 'Workflow abgeschlossen! Alle Schritte erfolgreich.');
                    break;

                case 'workflowError':
                    document.getElementById('workflowProgress')?.remove();
                    addMessage('agent', '❌ Workflow Error', msg.error);
                    break;
            }
        });
    </script>
</body>
</html>`;
    }
}
