/**
 * CodeTeam AI Ultra - DevOps Agent
 * Specialized agent for CI/CD, deployment, and infrastructure
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class DevOpsAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
}
//# sourceMappingURL=devops-agent.d.ts.map