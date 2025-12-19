import { Tool } from '../types';
import { readFileTool, writeFileTool, listFilesTool } from './file-system';
import { searchFilesTool } from './search';

export class ToolRegistry {
    private tools: Map<string, Tool> = new Map();

    constructor() {
        this.registerDefaultTools();
    }

    private registerDefaultTools() {
        this.registerTool(readFileTool);
        this.registerTool(writeFileTool);
        this.registerTool(listFilesTool);
        this.registerTool(searchFilesTool);
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
        return await tool.execute(args);
    }
}
