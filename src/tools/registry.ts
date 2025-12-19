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

export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();
    private sensitiveTools = new Set(['write_file', 'edit_file', 'run_command']);

    constructor() {
        this.registerDefaultTools();
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

        // For assisted/semi-automatic, ask user
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
