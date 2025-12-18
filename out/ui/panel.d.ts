/**
 * CodeTeam AI - Agent Panel Provider
 * WebView Panel for interacting with the agent team
 * With integrated code workflow
 */
import * as vscode from 'vscode';
import { Orchestrator } from '../orchestrator/router';
import { BuildRunner } from '../build/runner';
import { AgentResponse } from '../types';
import { MultiAgentExecutor, ExecutionProgress } from '../orchestrator/multi-agent-executor';
export declare class AgentPanelProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri;
    private _view?;
    private orchestrator;
    private buildRunner;
    private multiAgentExecutor?;
    private lastGeneratedCode;
    constructor(extensionUri: vscode.Uri, orchestrator: Orchestrator, buildRunner: BuildRunner, multiAgentExecutor?: MultiAgentExecutor);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): void;
    private handleChatMessage;
    private handleGenerateCode;
    private handleReviewCode;
    private handleGenerateTests;
    private handleGenerateDocs;
    private insertCodeToEditor;
    private createNewFile;
    private runFullWorkflow;
    private detectLanguage;
    private getExtension;
    private handleBuildRequest;
    private handleTestRequest;
    private getEditorContext;
    showResponse(response: AgentResponse): void;
    showMultiAgentProgress(progress: ExecutionProgress): void;
    private getHtmlContent;
}
//# sourceMappingURL=panel.d.ts.map