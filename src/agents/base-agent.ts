/**
 * CodeTeam AI - Base Agent
 * Abstract base class for all specialized agents
 */
import {
    Task,
    AgentResponse,
    AgentType,
    Message,
    CodeBlock,
    LLMClient,
    ToolCall
} from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { ToolRegistry } from '../tools/registry';

export abstract class BaseAgent {
    protected llmClient: LLMClient;
    protected memory: ProjectMemory;
    protected agentType: AgentType;
    protected toolRegistry: ToolRegistry;

    constructor(llmClient: LLMClient, memory: ProjectMemory, agentType: AgentType) {
        this.llmClient = llmClient;
        this.memory = memory;
        this.agentType = agentType;
        this.toolRegistry = new ToolRegistry();
    }

    /**
     * Get the system prompt for this agent
     */
    abstract getSystemPrompt(): string;

    /**
     * Check if this agent can handle a specific task
     */
    abstract canHandle(task: Task): boolean;

    /**
     * Execute a task with tool support (ReAct loop)
     */
    async execute(task: Task): Promise<AgentResponse> {
        try {
            const messages = this.buildMessages(task);
            let response = await this.llmClient.chat(messages, {
                temperature: 0.7,
                maxTokens: 4000
            });

            // ReAct Loop: Check for tool calls
            // Max 5 turns to prevent infinite loops
            for (let i = 0; i < 5; i++) {
                const toolCalls = this.extractToolCalls(response);

                if (toolCalls.length === 0) {
                    break;
                }

                // Add assistant's response (with tool call) to history
                messages.push({
                    role: 'assistant',
                    content: response
                });

                // Execute tools
                const toolResults = [];
                for (const call of toolCalls) {
                    try {
                        const result = await this.toolRegistry.executeTool(call.name, call.arguments);
                        toolResults.push({
                            id: call.id,
                            result
                        });
                    } catch (err: any) {
                        toolResults.push({
                            id: call.id,
                            error: err.message
                        });
                    }
                }

                // Create tool result message
                const resultMessage = `Tool Results:\n${JSON.stringify(toolResults, null, 2)}\n\nBased on these results, please continue.`;
                messages.push({
                    role: 'user', // Simulating system feedback as user message or system message
                    content: resultMessage
                });

                // Get next response from LLM
                response = await this.llmClient.chat(messages, {
                    temperature: 0.7,
                    maxTokens: 4000
                });
            }

            const codeBlocks = this.extractCodeBlocks(response);

            return {
                agentType: this.agentType,
                content: response,
                success: true,
                codeBlocks,
                suggestions: this.extractSuggestions(response)
            };
        } catch (error) {
            return {
                agentType: this.agentType,
                content: `Error: ${error}`,
                success: false
            };
        }
    }

    /**
     * Build the message array for the LLM
     */
    protected buildMessages(task: Task): Message[] {
        const messages: Message[] = [];

        // System prompt
        messages.push({
            role: 'system',
            content: this.buildFullSystemPrompt(task)
        });

        // Conversation history (last 10 relevant messages)
        const history = this.memory.getContextForAgent(this.agentType).slice(-10);
        messages.push(...history);

        // Current task
        messages.push({
            role: 'user',
            content: this.formatTaskInput(task)
        });

        return messages;
    }

    /**
     * Build the complete system prompt including context
     */
    protected buildFullSystemPrompt(task: Task): string {
        const parts: string[] = [];

        // Agent-specific system prompt
        parts.push(this.getSystemPrompt());

        // Tool Definitions
        parts.push(`
## Available Tools
You can use the following tools. To use a tool, output a JSON block like this:

\`\`\`json
{
  "tool": "tool_name",
  "arguments": {
    "arg1": "value1"
  }
}
\`\`\`

Tools available:
${this.toolRegistry.getToolsDescription()}
`);

        // Project context
        const projectContext = this.memory.getFullContext();
        if (projectContext) {
            parts.push('\n---\n# Project Context\n' + projectContext);
        }

        // Task-specific context
        if (task.context) {
            parts.push('\n---\n# Current Context');
            if (task.context.currentFile) {
                parts.push(`Current File: ${task.context.currentFile}`);
            }
            if (task.context.language) {
                parts.push(`Language: ${task.context.language}`);
            }
            if (task.context.framework) {
                parts.push(`Framework: ${task.context.framework}`);
            }
        }

        return parts.join('\n');
    }

    /**
     * Format the task input for the LLM
     */
    protected formatTaskInput(task: Task): string {
        let input = task.input;

        if (task.context?.selectedCode) {
            input += `\n\n## Selected Code\n\`\`\`\n${task.context.selectedCode}\n\`\`\``;
        }

        return input;
    }

    /**
     * Extract code blocks from response
     */
    protected extractCodeBlocks(response: string): CodeBlock[] {
        const codeBlocks: CodeBlock[] = [];
        const regex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;

        while ((match = regex.exec(response)) !== null) {
            // Skip JSON blocks if they look like tool calls
            const lang = match[1] || '';
            const content = match[2].trim();
            if (lang === 'json' && content.includes('"tool":')) {
                continue;
            }

            codeBlocks.push({
                language: lang || 'text',
                code: content
            });
        }

        return codeBlocks;
    }

    /**
     * Extract tool calls from response
     */
    protected extractToolCalls(response: string): ToolCall[] {
        const toolCalls: ToolCall[] = [];
        // Look for JSON blocks
        const regex = /```json\n([\s\S]*?)```/g;
        let match;

        while ((match = regex.exec(response)) !== null) {
            try {
                const json = JSON.parse(match[1]);
                if (json.tool && json.arguments) {
                    toolCalls.push({
                        id: crypto.randomUUID(),
                        name: json.tool,
                        arguments: json.arguments
                    });
                }
            } catch (e) {
                // Not valid JSON or not a tool call, ignore
            }
        }

        return toolCalls;
    }

    /**
     * Extract suggestions/recommendations from response
     */
    protected extractSuggestions(response: string): string[] {
        const suggestions: string[] = [];

        // Look for bullet points after "Suggestions:" or "Recommendations:"
        const suggestionMatch = response.match(/(?:Suggestions?|Recommendations?|Tips?):\s*\n((?:[-*]\s+.+\n?)+)/i);

        if (suggestionMatch) {
            const lines = suggestionMatch[1].split('\n');
            for (const line of lines) {
                const cleaned = line.replace(/^[-*]\s+/, '').trim();
                if (cleaned) {
                    suggestions.push(cleaned);
                }
            }
        }

        return suggestions;
    }
}
