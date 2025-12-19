import * as vscode from 'vscode';
import { Tool } from '../types';

export const getDefinitionTool: Tool = {
    name: 'get_definition',
    description: 'Finds the definition of a symbol at a specific location.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The path to the file containing the symbol usage'
            },
            line: {
                type: 'number',
                description: 'The line number (1-based)'
            },
            character: {
                type: 'number',
                description: 'The character position (1-based)'
            }
        },
        required: ['path', 'line']
    },
    execute: async (args: { path: string, line: number, character?: number }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };

            const root = workspaceFolders[0].uri;
            const uri = vscode.Uri.joinPath(root, args.path);
            const pos = new vscode.Position(args.line - 1, (args.character || 1) - 1);

            const definitions = await vscode.commands.executeCommand<vscode.Location[] | vscode.LocationLink[]>(
                'vscode.executeDefinitionProvider',
                uri,
                pos
            );

            if (!definitions || definitions.length === 0) {
                return { found: false, message: 'No definition found.' };
            }

            const results = [];
            for (const def of definitions) {
                let targetUri: vscode.Uri;
                let range: vscode.Range;

                if ('targetUri' in def) {
                    // LocationLink
                    targetUri = def.targetUri;
                    range = def.targetRange;
                } else {
                    // Location
                    targetUri = def.uri;
                    range = def.range;
                }

                results.push({
                    file: vscode.workspace.asRelativePath(targetUri),
                    line: range.start.line + 1,
                    character: range.start.character + 1
                });
            }

            return { found: true, definitions: results };
        } catch (error: any) {
            return { error: `Failed to get definition: ${error.message}` };
        }
    }
};

export const findReferencesTool: Tool = {
    name: 'find_references',
    description: 'Finds all references to a symbol at a specific location.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The path to the file'
            },
            line: {
                type: 'number',
                description: 'The line number (1-based)'
            },
            character: {
                type: 'number',
                description: 'The character position (1-based)'
            }
        },
        required: ['path', 'line']
    },
    execute: async (args: { path: string, line: number, character?: number }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };

            const root = workspaceFolders[0].uri;
            const uri = vscode.Uri.joinPath(root, args.path);
            const pos = new vscode.Position(args.line - 1, (args.character || 1) - 1);

            const references = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uri,
                pos
            );

            if (!references || references.length === 0) {
                return { found: false, message: 'No references found.' };
            }

            const results = references.map(ref => ({
                file: vscode.workspace.asRelativePath(ref.uri),
                line: ref.range.start.line + 1,
                character: ref.range.start.character + 1
            }));

            // Limit results to avoid context overflow
            return {
                found: true,
                count: results.length,
                references: results.slice(0, 50)
            };
        } catch (error: any) {
            return { error: `Failed to find references: ${error.message}` };
        }
    }
};

export const getSymbolsTool: Tool = {
    name: 'get_symbols',
    description: 'Lists all symbols (functions, classes, variables) in a file.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The path to the file'
            }
        },
        required: ['path']
    },
    execute: async (args: { path: string }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };

            const root = workspaceFolders[0].uri;
            const uri = vscode.Uri.joinPath(root, args.path);

            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                uri
            );

            if (!symbols || symbols.length === 0) {
                return { found: false, message: 'No symbols found.' };
            }

            function simplifySymbol(sym: vscode.DocumentSymbol): any {
                return {
                    name: sym.name,
                    kind: vscode.SymbolKind[sym.kind],
                    line: sym.range.start.line + 1,
                    children: sym.children ? sym.children.map(simplifySymbol) : []
                };
            }

            return {
                found: true,
                symbols: symbols.map(simplifySymbol)
            };
        } catch (error: any) {
            return { error: `Failed to get symbols: ${error.message}` };
        }
    }
};
