/**
 * CodeTeam AI - Agent Panel Provider
 * WebView Panel for interacting with the agent team
 */
import * as vscode from 'vscode';
import { Orchestrator } from '../orchestrator/router';
import { BuildRunner } from '../build/runner';
import { AgentResponse } from '../types';
export declare class AgentPanelProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri;
    private _view?;
    private orchestrator;
    private buildRunner;
    constructor(extensionUri: vscode.Uri, orchestrator: Orchestrator, buildRunner: BuildRunner);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): void;
    private handleChatMessage;
    private handleBuildRequest;
    private handleTestRequest;
    private handleWorkflowRequest;
    private getEditorContext;
    showResponse(response: AgentResponse): void;
    private getHtmlContent;
}
//# sourceMappingURL=panel.d.ts.map