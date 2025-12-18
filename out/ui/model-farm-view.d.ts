/**
 * CodeTeam AI Ultra - Model Farm Settings Webview
 * Interactive UI for managing providers and models
 */
import * as vscode from 'vscode';
import { ModelFarmManager } from '../config/model-farm';
export declare class ModelFarmViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri;
    static readonly viewType = "codeteam.modelFarm";
    private _view?;
    private modelFarm;
    constructor(extensionUri: vscode.Uri, modelFarm: ModelFarmManager);
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): void;
    private testProviderWithProgress;
    private saveApiKeyWithFeedback;
    private fetchModelsWithProgress;
    private updateContent;
    refresh(): void;
    private getHtmlContent;
    private renderProvider;
}
//# sourceMappingURL=model-farm-view.d.ts.map