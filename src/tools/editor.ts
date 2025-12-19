import * as vscode from 'vscode';
import { Tool } from '../types';

export const editFileTool: Tool = {
    name: 'edit_file',
    description: 'Edits a file by replacing a search string with a replacement string. Use this for targeted edits to avoid overwriting the whole file.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The path to the file to edit'
            },
            search: {
                type: 'string',
                description: 'The exact code block to search for (must match exactly, including whitespace)'
            },
            replace: {
                type: 'string',
                description: 'The new code to replace the search block with'
            }
        },
        required: ['path', 'search', 'replace']
    },
    execute: async (args: { path: string, search: string, replace: string }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };

            const root = workspaceFolders[0].uri;
            const uri = vscode.Uri.joinPath(root, args.path);

            // Read file content
            const document = await vscode.workspace.openTextDocument(uri);
            const fullText = document.getText();

            // Find the search string
            const index = fullText.indexOf(args.search);
            if (index === -1) {
                // Try normalizing line endings if not found
                const normalizedText = fullText.replace(/\r\n/g, '\n');
                const normalizedSearch = args.search.replace(/\r\n/g, '\n');
                const normalizedIndex = normalizedText.indexOf(normalizedSearch);

                if (normalizedIndex === -1) {
                    return {
                        error: 'Search string not found in file. Please ensure the search block matches the file content exactly, including indentation.'
                    };
                }

                // If found with normalized line endings, we need to map back to original positions.
                // For simplicity/safety in this MVP, we will fail if exact match fails,
                // but suggest using read_file to check content.
                 return {
                        error: 'Search string not found (exact match). Warning: Line endings might differ. Please use read_file to verify the exact content before editing.'
                    };
            }

            // Calculate range for replacement
            const startPos = document.positionAt(index);
            const endPos = document.positionAt(index + args.search.length);
            const range = new vscode.Range(startPos, endPos);

            // Apply edit
            const edit = new vscode.WorkspaceEdit();
            edit.replace(uri, range, args.replace);
            const success = await vscode.workspace.applyEdit(edit);

            if (!success) {
                return { error: 'Failed to apply edit.' };
            }

            // Save the file
            await document.save();

            return {
                success: true,
                message: `Successfully edited ${args.path}`
            };

        } catch (error: any) {
            return { error: `Failed to edit file: ${error.message}` };
        }
    }
};
