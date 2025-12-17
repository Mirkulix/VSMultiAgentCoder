/**
 * CodeTeam AI - Tester Agent
 * Specialized agent for test generation
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class TesterAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
    protected formatTaskInput(task: Task): string;
}
//# sourceMappingURL=tester-agent.d.ts.map