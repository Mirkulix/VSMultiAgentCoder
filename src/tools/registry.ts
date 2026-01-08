import * as vscode from 'vscode';
import { Tool } from '../types';
import { readFileTool, writeFileTool, listFilesTool } from './file-system';
import { searchFilesTool } from './search';
import { runCommandTool } from './terminal';
import { getDiagnosticsTool } from './diagnostics';
import { getDefinitionTool, findReferencesTool, getSymbolsTool } from './navigation';
import { editFileTool } from './editor';
import { readWebsiteTool } from './browser';
import { semanticSearchTool } from './semantic-search';
import { gitStatusTool, gitDiffTool, gitLogTool, gitCommitTool } from './git';
import { ReviewManager } from '../ui/review-manager';
import { DiffContentProvider } from '../ui/diff-provider';

export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();
    private sensitiveTools = new Set(['write_file', 'edit_file', 'run_command', 'git_commit']);
    private reviewManager?: ReviewManager;

    constructor() {
        this.registerDefaultTools();
    }

    setReviewManager(manager: ReviewManager) {
        this.reviewManager = manager;
    }

    private registerDefaultTools() {
        this.registerTool(readFileTool);
        this.registerTool(writeFileTool);
        this.registerTool(listFilesTool);
        this.registerTool(searchFilesTool);
        this.registerTool(runCommandTool);
        this.registerTool(getDiagnosticsTool);
        this.registerTool(getDefinitionTool);
        this.registerTool(findReferencesTool);
        this.registerTool(getSymbolsTool);
        this.registerTool(editFileTool);
        this.registerTool(readWebsiteTool);
        this.registerTool(semanticSearchTool);
        this.registerTool(gitStatusTool);
        this.registerTool(gitDiffTool);
        this.registerTool(gitLogTool);
        this.registerTool(gitCommitTool);
    }

    registerTool(tool: Tool) {
        this.tools.set(tool.name, tool);
    }

    getTool(name: string): Tool | undefined {
        return this.tools.get(name);
    }

    getAllTools(): Tool[] {
        return Array.from(this.tools.values());
    }

    getToolsDescription(): string {
        return Array.from(this.tools.values())
            .map(t => {
                return `- **${t.name}**: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`;
            })
            .join('\n\n');
    }

    async executeTool(name: string, args: any): Promise<any> {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool '${name}' not found`);
        }

        // Check for approval if tool is sensitive
        if (this.sensitiveTools.has(name)) {
            const approved = await this.checkApproval(name, args);
            if (!approved) {
                return { error: 'User denied tool execution.' };
            }
        }

        return await tool.execute(args);
    }

    private async checkApproval(name: string, args: any): Promise<boolean> {
        const config = vscode.workspace.getConfiguration('codeteam');
        const mode = config.get<string>('workflowMode', 'assisted');

        // Automatic mode requires no approval
        if (mode === 'automatic') {
            return true;
        }

        // Interactive Review Mode for File Changes
        if (this.reviewManager && (name === 'write_file' || name === 'edit_file')) {
            // Reconstruct content to review
            let content = '';
            let path = '';

            if (name === 'write_file') {
                content = args.content;
                path = args.path;
                return await this.reviewManager.requestReview(path, content);
            } else if (name === 'edit_file') {
                // Not supported in visual review yet, fallback to standard dialog
                // TODO: Implement in-memory patching for edit_file visual review
            }
        }

        // Standard Approval for other tools (or fallback)
        // We trim the args display to avoid massive dialogs
        const argsStr = JSON.stringify(args).slice(0, 200) + (JSON.stringify(args).length > 200 ? '...' : '');

        const answer = await vscode.window.showInformationMessage(
            `🤖 Agent wants to execute: ${name}\nArgs: ${argsStr}`,
            { modal: true },
            'Approve',
            'Deny'
        );

        return answer === 'Approve';
    }
}
