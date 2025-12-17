/**
 * CodeTeam AI Ultra - Security Analyst Agent
 * Specialized agent for security review and vulnerability detection
 */
import { Task, AgentResponse, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class SecurityAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<AgentResponse>;
}
//# sourceMappingURL=security-agent.d.ts.map