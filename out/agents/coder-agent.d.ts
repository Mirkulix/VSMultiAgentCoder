/**
 * CodeTeam AI - Coder Agent
 * Specialized agent for code generation, refactoring, and debugging
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class CoderAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
}
//# sourceMappingURL=coder-agent.d.ts.map