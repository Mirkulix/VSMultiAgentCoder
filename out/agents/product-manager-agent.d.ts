/**
 * CodeTeam AI Ultra - Product Manager Agent
 * Specialized agent for requirements, PRDs, and user stories
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class ProductManagerAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
}
//# sourceMappingURL=product-manager-agent.d.ts.map