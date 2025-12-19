import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Tool } from '../types';

async function execGit(command: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        cp.exec(`git ${command}`, { cwd, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
            if (err) {
                reject(new Error(stderr || err.message));
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

export const gitStatusTool: Tool = {
    name: 'git_status',
    description: 'Shows the working tree status (changed files).',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    execute: async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };
            const root = workspaceFolders[0].uri.fsPath;

            const status = await execGit('status --short', root);
            return { status: status || 'Clean working tree' };
        } catch (error: any) {
            return { error: `Git status failed: ${error.message}` };
        }
    }
};

export const gitDiffTool: Tool = {
    name: 'git_diff',
    description: 'Shows changes between commits, commit and working tree, etc.',
    parameters: {
        type: 'object',
        properties: {
            cached: {
                type: 'boolean',
                description: 'Show staged changes (default: false)'
            },
            file: {
                type: 'string',
                description: 'Limit diff to specific file'
            }
        }
    },
    execute: async (args: { cached?: boolean, file?: string }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };
            const root = workspaceFolders[0].uri.fsPath;

            let cmd = 'diff';
            if (args.cached) cmd += ' --cached';
            if (args.file) cmd += ` "${args.file}"`;

            const diff = await execGit(cmd, root);
            return { diff: diff || 'No changes' };
        } catch (error: any) {
            return { error: `Git diff failed: ${error.message}` };
        }
    }
};

export const gitLogTool: Tool = {
    name: 'git_log',
    description: 'Shows the commit logs.',
    parameters: {
        type: 'object',
        properties: {
            limit: {
                type: 'number',
                description: 'Number of commits to show (default: 5)'
            }
        }
    },
    execute: async (args: { limit?: number }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };
            const root = workspaceFolders[0].uri.fsPath;

            const limit = args.limit || 5;
            const log = await execGit(`log -n ${limit} --pretty=format:"%h - %an, %ar : %s"`, root);
            return { log };
        } catch (error: any) {
            return { error: `Git log failed: ${error.message}` };
        }
    }
};

export const gitCommitTool: Tool = {
    name: 'git_commit',
    description: 'Records changes to the repository.',
    parameters: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: 'Commit message'
            },
            files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files to stage and commit (optional, defaults to "all tracked")'
            }
        },
        required: ['message']
    },
    execute: async (args: { message: string, files?: string[] }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return { error: 'No workspace open' };
            const root = workspaceFolders[0].uri.fsPath;

            // Stage files
            if (args.files && args.files.length > 0) {
                await execGit(`add ${args.files.map(f => `"${f}"`).join(' ')}`, root);
            } else {
                await execGit('add .', root);
            }

            // Commit
            // Escape quotes in message
            const safeMessage = args.message.replace(/"/g, '\\"');
            const result = await execGit(`commit -m "${safeMessage}"`, root);

            return { success: true, output: result };
        } catch (error: any) {
            return { error: `Git commit failed: ${error.message}` };
        }
    }
};
