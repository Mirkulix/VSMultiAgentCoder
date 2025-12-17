/**
 * CodeTeam AI - Reviewer Agent
 * Specialized agent for code review and quality analysis
 */
import { Task, AgentResponse, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';
export declare class ReviewerAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory);
    getSystemPrompt(): string;
    canHandle(task: Task): boolean;
    execute(task: Task): Promise<AgentResponse>;
    private parseReviewIssues;
}
//# sourceMappingURL=reviewer-agent.d.ts.map