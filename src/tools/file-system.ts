import * as vscode from 'vscode';
import { Tool } from '../types';
import * as path from 'path';

export const readFileTool: Tool = {
    name: 'read_file',
    description: 'Reads the content of a file from the file system. Use this to read source code, config files, or documentation.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The relative path to the file (e.g., "src/index.ts")'
            }
        },
        required: ['path']
    },
    execute: async (args: { path: string }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return { error: 'No workspace open' };
            }

            const root = workspaceFolders[0].uri;
            const fileUri = vscode.Uri.joinPath(root, args.path);
            const content = await vscode.workspace.fs.readFile(fileUri);
            return { content: content.toString() };
        } catch (error: any) {
            return { error: `Failed to read file ${args.path}: ${error.message}` };
        }
    }
};

export const writeFileTool: Tool = {
    name: 'write_file',
    description: 'Writes content to a file. Overwrites existing content. Use this to create new files or update existing ones.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The relative path to the file'
            },
            content: {
                type: 'string',
                description: 'The content to write to the file'
            }
        },
        required: ['path', 'content']
    },
    execute: async (args: { path: string, content: string }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return { error: 'No workspace open' };
            }

            const root = workspaceFolders[0].uri;
            const fileUri = vscode.Uri.joinPath(root, args.path);
            const contentBuffer = Buffer.from(args.content, 'utf8');
            await vscode.workspace.fs.writeFile(fileUri, contentBuffer);
            return { success: true, message: `File ${args.path} written successfully.` };
        } catch (error: any) {
            return { error: `Failed to write file ${args.path}: ${error.message}` };
        }
    }
};

export const listFilesTool: Tool = {
    name: 'list_files',
    description: 'Lists all files in a directory (recursive or flat). Use this to explore the project structure.',
    parameters: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'The relative path to the directory (default: root)',
                default: '.'
            },
            recursive: {
                type: 'boolean',
                description: 'Whether to list files recursively (default: false)',
                default: false
            }
        }
    },
    execute: async (args: { path?: string, recursive?: boolean }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return { error: 'No workspace open' };
            }

            const root = workspaceFolders[0].uri;
            const targetPath = args.path ? args.path : '.';
            const dirUri = vscode.Uri.joinPath(root, targetPath);

            // Simple non-recursive list for now to be safe, or recursive if needed
            // Implementing a simple recursive lister or using findFiles
            if (args.recursive) {
                const pattern = new vscode.RelativePattern(dirUri, '**/*');
                const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 100); // Limit to 100 files to avoid context bloat
                return {
                    files: files.map(f => vscode.workspace.asRelativePath(f))
                };
            } else {
                const entries = await vscode.workspace.fs.readDirectory(dirUri);
                return {
                    files: entries.map(([name, type]) => {
                        return {
                            name,
                            type: type === vscode.FileType.Directory ? 'directory' : 'file'
                        };
                    })
                };
            }
        } catch (error: any) {
            return { error: `Failed to list files in ${args.path}: ${error.message}` };
        }
    }
};
