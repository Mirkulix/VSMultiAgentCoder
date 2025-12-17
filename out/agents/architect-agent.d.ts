/**
 * CodeTeam AI - Architect Agent
 * Specialized agent for system design and architecture decisions
 */
import { Task, AgentResponse, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class ArchitectAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<AgentResponse>;
    private recordDecision;
}
//# sourceMappingURL=architect-agent.d.ts.map