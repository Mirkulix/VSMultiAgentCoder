/**
 * CodeTeam AI - Docs Agent
 * Specialized agent for documentation generation
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class DocsAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
}
//# sourceMappingURL=docs-agent.d.ts.map