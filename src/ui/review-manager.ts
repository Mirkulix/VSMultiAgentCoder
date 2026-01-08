import * as vscode from 'vscode';
import { DiffContentProvider } from './diff-provider';

interface PendingChange {
    id: string;
    targetUri: vscode.Uri;
    previewUri: vscode.Uri;
    newContent: string;
    originalContent: string;
}

export class ReviewManager {
    private pendingChanges = new Map<string, PendingChange>();
    private provider: DiffContentProvider;

    constructor(context: vscode.ExtensionContext, provider: DiffContentProvider) {
        this.provider = provider;

        // Register commands
        context.subscriptions.push(
            vscode.commands.registerCommand('codeteam.acceptChange', (id: string) => this.acceptChange(id)),
            vscode.commands.registerCommand('codeteam.rejectChange', (id: string) => this.rejectChange(id))
        );
    }

    async requestReview(filePath: string, newContent: string): Promise<boolean> {
        const id = crypto.randomUUID();
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return false;

        const root = workspaceFolders[0].uri;
        const targetUri = vscode.Uri.joinPath(root, filePath);

        // Create a preview URI
        const previewUri = vscode.Uri.parse(`${DiffContentProvider.scheme}:${filePath}?id=${id}`);

        // Store content in provider
        this.provider.setContent(previewUri, newContent);

        // Store pending change
        let originalContent = '';
        try {
            const doc = await vscode.workspace.openTextDocument(targetUri);
            originalContent = doc.getText();
        } catch {
            // New file
        }

        this.pendingChanges.set(id, {
            id,
            targetUri,
            previewUri,
            newContent,
            originalContent
        });

        // Open Diff Editor
        await vscode.commands.executeCommand('vscode.diff',
            targetUri,
            previewUri,
            `Review: ${filePath} (Pending)`,
            { preview: true }
        );

        // Prompt user
        const choice = await vscode.window.showInformationMessage(
            `Agent wants to update ${filePath}. Review changes?`,
            'Accept',
            'Reject'
        );

        if (choice === 'Accept') {
            await this.acceptChange(id);
            return true;
        } else {
            await this.rejectChange(id);
            return false;
        }
    }

    async acceptChange(id: string): Promise<void> {
        const change = this.pendingChanges.get(id);
        if (!change) return;

        // Write to disk
        const edit = new vscode.WorkspaceEdit();
        // If file doesn't exist, create it
        // Check if file exists
        try {
            await vscode.workspace.fs.stat(change.targetUri);
            // Overwrite
            const doc = await vscode.workspace.openTextDocument(change.targetUri);
            const fullRange = new vscode.Range(
                doc.positionAt(0),
                doc.positionAt(doc.getText().length)
            );
            edit.replace(change.targetUri, fullRange, change.newContent);
        } catch {
            // Create new
            edit.createFile(change.targetUri, { overwrite: true });
            edit.insert(change.targetUri, new vscode.Position(0, 0), change.newContent);
        }

        await vscode.workspace.applyEdit(edit);

        // Cleanup
        this.cleanup(id);
        vscode.window.showInformationMessage('Changes applied successfully.');

        // Close diff editor (tricky in VS Code API, but we can try to close active if it matches)
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }

    async rejectChange(id: string): Promise<void> {
        this.cleanup(id);
        vscode.window.showInformationMessage('Changes rejected.');
        vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    }

    private cleanup(id: string): void {
        const change = this.pendingChanges.get(id);
        if (change) {
            this.provider.deleteContent(change.previewUri);
            this.pendingChanges.delete(id);
        }
    }
}
