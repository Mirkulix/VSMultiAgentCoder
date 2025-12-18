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
exports.activate = activate;
exports.deactivate = deactivate;
/**
 * CodeTeam AI Ultra - VS Code Extension Entry Point
 * Enhanced Multi-Agent Coder System
 */
const vscode = __importStar(require("vscode"));
const router_1 = require("./orchestrator/router");
const memory_1 = require("./orchestrator/memory");
const factory_1 = require("./llm/factory");
const panel_1 = require("./ui/panel");
const runner_1 = require("./build/runner");
const model_farm_1 = require("./config/model-farm");
const model_farm_view_1 = require("./ui/model-farm-view");
const settings_panel_1 = require("./ui/settings-panel");
const supervisor_agent_1 = require("./agents/supervisor-agent");
const multi_agent_executor_1 = require("./orchestrator/multi-agent-executor");
let orchestrator;
let memory;
let panelProvider;
let modelFarmManager;
let modelFarmView;
let supervisor;
let multiAgentExecutor;
// Dummy LLM Client when no API key is configured
class DummyLLMClient {
    async chat(messages) {
        return '⚠️ **Kein API Key konfiguriert!**\n\nBitte konfiguriere zuerst einen API Key:\n\n1. Öffne die **🏭 Model Farm** in der Sidebar\n2. Oder drücke `Cmd+,` → suche "codeteam"\n3. Trage einen API Key ein\n\n**Tipp:** Kostenloser API Key bei [console.groq.com](https://console.groq.com)';
    }
    async *stream(messages) {
        yield await this.chat(messages);
    }
}
async function activate(context) {
    console.log('CodeTeam AI is now active!');
    // Initialize Model Farm Manager
    modelFarmManager = new model_farm_1.ModelFarmManager(context);
    // Initialize core components
    const config = vscode.workspace.getConfiguration('codeteam');
    // Try to create LLM client, use dummy if no API key configured
    let llmClient;
    try {
        llmClient = factory_1.LLMClientFactory.create(config);
    }
    catch (error) {
        console.log('No API key configured, using dummy client');
        llmClient = new DummyLLMClient();
        // Show warning but don't fail activation
        vscode.window.showWarningMessage('CodeTeam AI: Kein API Key. Öffne 🏭 Model Farm um Provider zu konfigurieren.', 'Model Farm öffnen').then(selection => {
            if (selection === 'Model Farm öffnen') {
                vscode.commands.executeCommand('codeteam.modelFarm.focus');
            }
        });
    }
    memory = new memory_1.ProjectMemory(context);
    orchestrator = new router_1.Orchestrator(llmClient, memory);
    // Initialize Multi-Agent System
    supervisor = new supervisor_agent_1.SupervisorAgent(llmClient, memory);
    multiAgentExecutor = new multi_agent_executor_1.MultiAgentExecutor(orchestrator, supervisor);
    // Initialize Build Runner
    const buildRunner = new runner_1.BuildRunner();
    // Register Agent Panel Provider
    panelProvider = new panel_1.AgentPanelProvider(context.extensionUri, orchestrator, buildRunner, multiAgentExecutor);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('codeteam.agentPanel', panelProvider));
    // Model Farm View Provider is deprecated - use SettingsPanel instead
    // Keeping the provider registered for backwards compatibility
    modelFarmView = new model_farm_view_1.ModelFarmViewProvider(context.extensionUri, modelFarmManager);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider('codeteam.modelFarm', modelFarmView));
    // Register Commands
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.openPanel', () => {
        vscode.commands.executeCommand('codeteam.agentPanel.focus');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.openSettings', () => {
        settings_panel_1.SettingsPanel.createOrShow(context.extensionUri);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.askCoder', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'What would you like the Coder Agent to do?',
            placeHolder: 'e.g., Create a function that...'
        });
        if (input) {
            await executeAgentTask('coder', input);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.reviewCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }
        const selection = editor.selection;
        const selectedCode = editor.document.getText(selection);
        if (!selectedCode) {
            vscode.window.showWarningMessage('Please select some code to review');
            return;
        }
        await executeAgentTask('reviewer', `Review this code:\n\n${selectedCode}`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.generateTests', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }
        const code = editor.document.getText(editor.selection) || editor.document.getText();
        await executeAgentTask('tester', `Generate tests for:\n\n${code}`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.generateDocs', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor found');
            return;
        }
        const code = editor.document.getText(editor.selection) || editor.document.getText();
        await executeAgentTask('docs', `Generate documentation for:\n\n${code}`);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.planArchitecture', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Describe what you want to build',
            placeHolder: 'e.g., A REST API for user authentication...'
        });
        if (input) {
            await executeAgentTask('architect', input);
        }
    }));
    // NEW MULTI-AGENT COMMANDS
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.specify', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'Describe the feature you want to specify',
            placeHolder: 'e.g., User authentication with JWT...',
            ignoreFocusOut: true
        });
        if (!input)
            return;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'CodeTeam AI - Specification Phase',
            cancellable: false
        }, async () => {
            const context = getEditorContext();
            const response = await orchestrator.routeToAgent('productManager', `Create detailed specifications for: ${input}`, context);
            panelProvider.showResponse(response);
            if (response.success) {
                vscode.window.showInformationMessage('✅ Specification created! Ready to plan?', 'Create Plan').then(selection => {
                    if (selection === 'Create Plan') {
                        vscode.commands.executeCommand('codeteam.plan');
                    }
                });
            }
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.plan', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'What do you want to build?',
            placeHolder: 'e.g., REST API for user management...',
            ignoreFocusOut: true
        });
        if (!input)
            return;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'CodeTeam AI - Creating Execution Plan',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Supervisor analyzing task...' });
            const context = getEditorContext();
            const plan = await supervisor.createExecutionPlan(input, context);
            // Show plan to user
            const planSummary = `
# Execution Plan

**Total Tasks:** ${plan.tasks.length}
**Phases:** ${plan.parallelGroups.length}
**Estimated Time:** ${Math.ceil(plan.estimatedTime / 60)} minutes

## Tasks:
${plan.tasks.map((t, i) => `${i + 1}. [${t.agentType}] ${t.task}`).join('\n')}
                `.trim();
            panelProvider.showResponse({
                agentType: 'orchestrator',
                content: planSummary,
                success: true
            });
            // Ask if user wants to implement
            const choice = await vscode.window.showInformationMessage(`Plan created with ${plan.tasks.length} tasks. Start implementation?`, 'Implement Now', 'Cancel');
            if (choice === 'Implement Now') {
                vscode.commands.executeCommand('codeteam.implement');
            }
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('codeteam.implement', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'What feature should the team implement?',
            placeHolder: 'e.g., User authentication system...',
            ignoreFocusOut: true
        });
        if (!input)
            return;
        // Execute multi-agent workflow
        await executeMultiAgentWorkflow(input);
    }));
    // Watch for configuration changes
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('codeteam')) {
            try {
                const newConfig = vscode.workspace.getConfiguration('codeteam');
                const newClient = factory_1.LLMClientFactory.create(newConfig);
                orchestrator.updateLLMClient(newClient);
                vscode.window.showInformationMessage('✅ CodeTeam AI: API Key konfiguriert! Agenten sind jetzt bereit.');
            }
            catch (error) {
                // Still no valid API key
                console.log('Configuration changed but still no valid API key');
            }
        }
    }));
}
async function executeAgentTask(agentType, input) {
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `CodeTeam AI - ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
            cancellable: true
        }, async (progress, token) => {
            progress.report({ message: 'Processing...' });
            const context = getEditorContext();
            const response = await orchestrator.routeToAgent(agentType, input, context);
            if (response.success) {
                // Send result to panel
                panelProvider.showResponse(response);
                // If there are code blocks, offer to insert them
                if (response.codeBlocks && response.codeBlocks.length > 0) {
                    const insert = await vscode.window.showInformationMessage('Code generated! Would you like to insert it?', 'Insert at cursor', 'Copy to clipboard', 'View in panel');
                    if (insert === 'Insert at cursor') {
                        const editor = vscode.window.activeTextEditor;
                        if (editor) {
                            await editor.edit(editBuilder => {
                                editBuilder.insert(editor.selection.active, response.codeBlocks[0].code);
                            });
                        }
                    }
                    else if (insert === 'Copy to clipboard') {
                        await vscode.env.clipboard.writeText(response.codeBlocks[0].code);
                        vscode.window.showInformationMessage('Code copied to clipboard');
                    }
                }
            }
            else {
                vscode.window.showErrorMessage(`Agent error: ${response.content}`);
            }
        });
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
    }
}
async function executeMultiAgentWorkflow(userRequest) {
    const outputChannel = vscode.window.createOutputChannel('CodeTeam AI - Multi-Agent');
    outputChannel.show();
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'CodeTeam AI - Multi-Agent Execution',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Initializing multi-agent system...' });
            // Setup progress callback
            multiAgentExecutor.onProgress((execProgress) => {
                const percent = (execProgress.currentPhase / execProgress.totalPhases) * 100;
                progress.report({
                    message: `Phase ${execProgress.currentPhase}/${execProgress.totalPhases} - ${execProgress.currentTasks.length} agent(s) working`,
                    increment: percent / execProgress.totalPhases
                });
                // Log to output channel
                execProgress.logs.slice(-1).forEach(log => {
                    const emoji = log.level === 'success' ? '✅' :
                        log.level === 'error' ? '❌' :
                            log.level === 'warning' ? '⚠️' : 'ℹ️';
                    const agentStr = log.agent ? `[${log.agent}]` : '';
                    outputChannel.appendLine(`${emoji} ${agentStr} ${log.message}`);
                });
                // Show in panel
                panelProvider.showMultiAgentProgress(execProgress);
            });
            const context = getEditorContext();
            const result = await multiAgentExecutor.execute(userRequest, context);
            // Show final result
            outputChannel.appendLine('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            outputChannel.appendLine('FINAL RESULT');
            outputChannel.appendLine('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            outputChannel.appendLine(result.finalOutput);
            panelProvider.showResponse({
                agentType: 'orchestrator',
                content: result.finalOutput,
                success: result.success
            });
            if (result.success) {
                vscode.window.showInformationMessage(`✅ Multi-Agent workflow completed! ${result.tasks.length} tasks in ${(result.duration / 1000).toFixed(1)}s`, 'View Output').then(selection => {
                    if (selection === 'View Output') {
                        outputChannel.show();
                    }
                });
            }
            else {
                vscode.window.showWarningMessage(`⚠️ Workflow completed with some failures. Check output for details.`, 'View Output').then(selection => {
                    if (selection === 'View Output') {
                        outputChannel.show();
                    }
                });
            }
        });
    }
    catch (error) {
        outputChannel.appendLine(`\n❌ FATAL ERROR: ${error}`);
        vscode.window.showErrorMessage(`Multi-Agent execution failed: ${error}`);
    }
}
function getEditorContext() {
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
function deactivate() {
    console.log('CodeTeam AI deactivated');
}
//# sourceMappingURL=extension.js.map