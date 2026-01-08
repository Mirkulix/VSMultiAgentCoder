import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Tool } from '../types';

export const runCommandTool: Tool = {
    name: 'run_command',
    description: 'Executes a shell command in the project root. Use this to run tests, builds, or other shell utilities. Returns stdout and stderr.',
    parameters: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'The shell command to execute (e.g., "npm test", "ls -la")'
            }
        },
        required: ['command']
    },
    execute: async (args: { command: string }) => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                return { error: 'No workspace open' };
            }

            const root = workspaceFolders[0].uri.fsPath;

            return new Promise((resolve) => {
                cp.exec(args.command, { cwd: root, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
                    resolve({
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        error: error ? error.message : null,
                        exitCode: error ? error.code : 0
                    });
                });
            });
        } catch (error: any) {
            return { error: `Failed to execute command: ${error.message}` };
        }
    }
};
