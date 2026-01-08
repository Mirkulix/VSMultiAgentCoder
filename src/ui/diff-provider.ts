import * as vscode from 'vscode';

export class DiffContentProvider implements vscode.TextDocumentContentProvider {
    static scheme = 'codeteam-preview';
    private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
    private contentMap = new Map<string, string>();

    get onDidChange(): vscode.Event<vscode.Uri> {
        return this._onDidChange.event;
    }

    provideTextDocumentContent(uri: vscode.Uri): string | undefined {
        return this.contentMap.get(uri.toString());
    }

    setContent(uri: vscode.Uri, content: string): void {
        this.contentMap.set(uri.toString(), content);
        this._onDidChange.fire(uri);
    }

    deleteContent(uri: vscode.Uri): void {
        this.contentMap.delete(uri.toString());
    }
}
