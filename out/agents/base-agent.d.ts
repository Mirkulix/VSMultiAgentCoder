/**
 * CodeTeam AI - Base Agent
 * Abstract base class for all specialized agents
 */
import { Task, AgentResponse, AgentType, Message, CodeBlock, LLMClient, ToolCall } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { ToolRegistry } from '../tools/registry';
export declare abstract class BaseAgent {
    protected llmClient: LLMClient;
    protected memory: ProjectMemory;
    protected agentType: AgentType;
    protected toolRegistry: ToolRegistry;
    constructor(llmClient: LLMClient, memory: ProjectMemory, agentType: AgentType);
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
    execute(task: Task): Promise<AgentResponse>;
    /**
     * Build the message array for the LLM
     */
    protected buildMessages(task: Task): Message[];
    /**
     * Build the complete system prompt including context
     */
    protected buildFullSystemPrompt(task: Task): string;
    /**
     * Format the task input for the LLM
     */
    protected formatTaskInput(task: Task): string;
    /**
     * Extract code blocks from response
     */
    protected extractCodeBlocks(response: string): CodeBlock[];
    /**
     * Extract tool calls from response
     */
    protected extractToolCalls(response: string): ToolCall[];
    /**
     * Extract suggestions/recommendations from response
     */
    protected extractSuggestions(response: string): string[];
}
//# sourceMappingURL=base-agent.d.ts.map