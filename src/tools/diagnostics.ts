import * as vscode from 'vscode';
import { Tool } from '../types';

export const getDiagnosticsTool: Tool = {
    name: 'get_diagnostics',
    description: 'Retrieves code diagnostics (errors, warnings) for a specific file or the entire workspace. Use this to check for syntax errors or type issues.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The relative path to the file to check. If omitted, returns all workspace diagnostics.'
            },
            severity: {
                type: 'string',
                enum: ['error', 'warning', 'all'],
                description: 'Filter by severity (default: "all")',
                default: 'all'
            }
        }
    },
    execute: async (args: { path?: string, severity?: 'error' | 'warning' | 'all' }) => {
        try {
            let diagnostics: [vscode.Uri, vscode.Diagnostic[]][];

            if (args.path) {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    return { error: 'No workspace open' };
                }
                const root = workspaceFolders[0].uri;
                const fileUri = vscode.Uri.joinPath(root, args.path);
                diagnostics = [[fileUri, vscode.languages.getDiagnostics(fileUri)]];
            } else {
                diagnostics = vscode.languages.getDiagnostics();
            }

            const result = [];
            const severityFilter = args.severity || 'all';

            for (const [uri, diags] of diagnostics) {
                const filtered = diags.filter(d => {
                    if (severityFilter === 'all') return true;
                    if (severityFilter === 'error') return d.severity === vscode.DiagnosticSeverity.Error;
                    if (severityFilter === 'warning') return d.severity === vscode.DiagnosticSeverity.Warning;
                    return true;
                });

                if (filtered.length > 0) {
                    result.push({
                        file: vscode.workspace.asRelativePath(uri),
                        diagnostics: filtered.map(d => ({
                            message: d.message,
                            severity: d.severity === vscode.DiagnosticSeverity.Error ? 'Error' :
                                      d.severity === vscode.DiagnosticSeverity.Warning ? 'Warning' :
                                      d.severity === vscode.DiagnosticSeverity.Information ? 'Info' : 'Hint',
                            line: d.range.start.line + 1,
                            code: d.code
                        }))
                    });
                }
            }

            if (result.length === 0) {
                return { message: 'No diagnostics found. Code looks clean!' };
            }

            return {
                summary: `Found issues in ${result.length} file(s).`,
                issues: result
            };

        } catch (error: any) {
            return { error: `Failed to get diagnostics: ${error.message}` };
        }
    }
};
