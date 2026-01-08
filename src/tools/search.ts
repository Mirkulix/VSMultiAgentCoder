import * as vscode from 'vscode';
import { Tool } from '../types';

export const searchFilesTool: Tool = {
    name: 'search_files',
    description: 'Searches for files matching a glob pattern or containing specific text.',
    parameters: {
        type: 'object',
        properties: {
            pattern: {
                type: 'string',
                description: 'The glob pattern to match file paths (e.g. "**/*.ts")'
            },
            contains: {
                type: 'string',
                description: 'Text content to search for inside files (optional)'
            },
            limit: {
                type: 'number',
                description: 'Max number of results (default: 20)'
            }
        },
        required: ['pattern']
    },
    execute: async (args: { pattern: string, contains?: string, limit?: number }) => {
        try {
            const limit = args.limit || 20;
            const exclude = '**/node_modules/**'; // Always exclude node_modules

            // If "contains" is provided, we might need a more complex search
            // But VS Code API findFiles doesn't search content directly.
            // For content search, we often use ripgrep or similar, but here we can only filter after finding.
            // OR use vscode.workspace.findTextInFiles (which is complex to implement in extension API cleanly without UI)

            // For now, let's just find files by name pattern
            const files = await vscode.workspace.findFiles(args.pattern, exclude, limit);

            // If content search is requested, we read files and check.
            // WARNING: This is slow for many files.
            let results = files.map(f => vscode.workspace.asRelativePath(f));

            if (args.contains) {
                const filtered: string[] = [];
                for (const file of files) {
                    try {
                        const doc = await vscode.workspace.openTextDocument(file);
                        if (doc.getText().includes(args.contains)) {
                            filtered.push(vscode.workspace.asRelativePath(file));
                        }
                    } catch {
                        // ignore read errors
                    }
                }
                results = filtered;
            }

            return {
                found: results.length > 0,
                files: results
            };
        } catch (error: any) {
            return { error: `Search failed: ${error.message}` };
        }
    }
};
