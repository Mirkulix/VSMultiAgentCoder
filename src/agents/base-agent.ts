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
    LLMClient
} from '../types';
import { ProjectMemory } from '../orchestrator/memory';

export abstract class BaseAgent {
    protected llmClient: LLMClient;
    protected memory: ProjectMemory;
    protected agentType: AgentType;

    constructor(llmClient: LLMClient, memory: ProjectMemory, agentType: AgentType) {
        this.llmClient = llmClient;
        this.memory = memory;
        this.agentType = agentType;
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
     * Execute a task
     */
    async execute(task: Task): Promise<AgentResponse> {
        try {
            const messages = this.buildMessages(task);
            const response = await this.llmClient.chat(messages, {
                temperature: 0.7,
                maxTokens: 4000
            });

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
            codeBlocks.push({
                language: match[1] || 'text',
                code: match[2].trim()
            });
        }

        return codeBlocks;
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
