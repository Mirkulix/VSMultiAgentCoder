/**
 * CodeTeam AI Ultra - UX Designer Agent
 * Specialized agent for UI/UX design and wireframes
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class UXDesignerAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
}
//# sourceMappingURL=ux-designer-agent.d.ts.map