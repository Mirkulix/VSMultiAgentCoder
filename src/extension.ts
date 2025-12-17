/**
 * CodeTeam AI Ultra - VS Code Extension Entry Point
 */
import * as vscode from 'vscode';
import { Orchestrator } from './orchestrator/router';
import { ProjectMemory } from './orchestrator/memory';
import { LLMClientFactory } from './llm/factory';
import { AgentPanelProvider } from './ui/panel';
import { BuildRunner } from './build/runner';
import { LLMClient, Message } from './types';
import { ModelFarmManager } from './config/model-farm';
import { ModelFarmViewProvider } from './ui/model-farm-view';

let orchestrator: Orchestrator;
let memory: ProjectMemory;
let panelProvider: AgentPanelProvider;
let modelFarmManager: ModelFarmManager;
let modelFarmView: ModelFarmViewProvider;

// Dummy LLM Client when no API key is configured
class DummyLLMClient implements LLMClient {
    async chat(messages: Message[]): Promise<string> {
        return '⚠️ **Kein API Key konfiguriert!**\n\nBitte konfiguriere zuerst einen API Key:\n\n1. Öffne die **🏭 Model Farm** in der Sidebar\n2. Oder drücke `Cmd+,` → suche "codeteam"\n3. Trage einen API Key ein\n\n**Tipp:** Kostenloser API Key bei [console.groq.com](https://console.groq.com)';
    }

    async *stream(messages: Message[]): AsyncIterable<string> {
        yield await this.chat(messages);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('CodeTeam AI is now active!');

    // Initialize Model Farm Manager
    modelFarmManager = new ModelFarmManager(context);

    // Initialize core components
    const config = vscode.workspace.getConfiguration('codeteam');

    // Try to create LLM client, use dummy if no API key configured
    let llmClient: LLMClient;

    try {
        llmClient = LLMClientFactory.create(config);
    } catch (error) {
        console.log('No API key configured, using dummy client');
        llmClient = new DummyLLMClient();

        // Show warning but don't fail activation
        vscode.window.showWarningMessage(
            'CodeTeam AI: Kein API Key. Öffne 🏭 Model Farm um Provider zu konfigurieren.',
            'Model Farm öffnen'
        ).then(selection => {
            if (selection === 'Model Farm öffnen') {
                vscode.commands.executeCommand('codeteam.modelFarm.focus');
            }
        });
    }

    memory = new ProjectMemory(context);
    orchestrator = new Orchestrator(llmClient, memory);

    // Initialize Build Runner
    const buildRunner = new BuildRunner();

    // Register Agent Panel Provider
    panelProvider = new AgentPanelProvider(
        context.extensionUri,
        orchestrator,
        buildRunner
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'codeteam.agentPanel',
            panelProvider
        )
    );

    // Register Model Farm View Provider
    modelFarmView = new ModelFarmViewProvider(
        context.extensionUri,
        modelFarmManager
    );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'codeteam.modelFarm',
            modelFarmView
        )
    );

    // Register Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('codeteam.openPanel', () => {
            vscode.commands.executeCommand('codeteam.agentPanel.focus');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('codeteam.openSettings', () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'codeteam');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('codeteam.askCoder', async () => {
            const input = await vscode.window.showInputBox({
                prompt: 'What would you like the Coder Agent to do?',
                placeHolder: 'e.g., Create a function that...'
            });
            if (input) {
                await executeAgentTask('coder', input);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('codeteam.reviewCode', async () => {
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
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('codeteam.generateTests', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor found');
                return;
            }

            const code = editor.document.getText(editor.selection) || editor.document.getText();
            await executeAgentTask('tester', `Generate tests for:\n\n${code}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('codeteam.generateDocs', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor found');
                return;
            }

            const code = editor.document.getText(editor.selection) || editor.document.getText();
            await executeAgentTask('docs', `Generate documentation for:\n\n${code}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('codeteam.planArchitecture', async () => {
            const input = await vscode.window.showInputBox({
                prompt: 'Describe what you want to build',
                placeHolder: 'e.g., A REST API for user authentication...'
            });
            if (input) {
                await executeAgentTask('architect', input);
            }
        })
    );

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('codeteam')) {
                try {
                    const newConfig = vscode.workspace.getConfiguration('codeteam');
                    const newClient = LLMClientFactory.create(newConfig);
                    orchestrator.updateLLMClient(newClient);
                    vscode.window.showInformationMessage('✅ CodeTeam AI: API Key konfiguriert! Agenten sind jetzt bereit.');
                } catch (error) {
                    // Still no valid API key
                    console.log('Configuration changed but still no valid API key');
                }
            }
        })
    );
}

async function executeAgentTask(
    agentType: 'coder' | 'reviewer' | 'tester' | 'docs' | 'architect',
    input: string
): Promise<void> {
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
                    const insert = await vscode.window.showInformationMessage(
                        'Code generated! Would you like to insert it?',
                        'Insert at cursor',
                        'Copy to clipboard',
                        'View in panel'
                    );

                    if (insert === 'Insert at cursor') {
                        const editor = vscode.window.activeTextEditor;
                        if (editor) {
                            await editor.edit(editBuilder => {
                                editBuilder.insert(
                                    editor.selection.active,
                                    response.codeBlocks![0].code
                                );
                            });
                        }
                    } else if (insert === 'Copy to clipboard') {
                        await vscode.env.clipboard.writeText(response.codeBlocks[0].code);
                        vscode.window.showInformationMessage('Code copied to clipboard');
                    }
                }
            } else {
                vscode.window.showErrorMessage(`Agent error: ${response.content}`);
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
    }
}

function getEditorContext(): import('./types').TaskContext {
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

export function deactivate() {
    console.log('CodeTeam AI deactivated');
}
