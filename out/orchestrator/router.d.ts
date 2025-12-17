/**
 * CodeTeam AI Ultra - Master Orchestrator
 * The "Tech Lead" of the agent system - routes tasks and coordinates agents
 */
import { AgentType, AgentResponse, TaskType, TaskContext, WorkflowStep, WorkflowResult, LLMClient } from '../types';
import { ProjectMemory } from './memory';
import { TeamConfigManager } from '../config/team-config';
export declare class Orchestrator {
    private agents;
    private memory;
    private llmClient;
    private teamConfig?;
    constructor(llmClient: LLMClient, memory: ProjectMemory, teamConfig?: TeamConfigManager);
    private initializeAgents;
    /**
     * Get agent with team-configured LLM client (if available)
     */
    private getAgentWithConfig;
    private createAgentInstance;
    /**
     * Analyze user input and determine the appropriate task type
     */
    analyzeTask(input: string): TaskType;
    /**
     * Determine which agent should handle a task type
     */
    getAgentForTaskType(taskType: TaskType): AgentType;
    /**
     * Route a task directly to a specific agent
     */
    routeToAgent(agentType: AgentType, input: string, context?: TaskContext): Promise<AgentResponse>;
    /**
     * Smart routing - analyze input and route to appropriate agent
     */
    smartRoute(input: string, context?: TaskContext): Promise<AgentResponse>;
    /**
     * Execute a complex workflow involving multiple agents
     */
    orchestrateWorkflow(input: string, workflow: WorkflowStep[], context?: TaskContext): Promise<WorkflowResult>;
    /**
     * Create a comprehensive feature workflow (4-phase methodology)
     */
    createFeatureWorkflow(featureDescription: string): WorkflowStep[];
    /**
     * Get list of available agents
     */
    getAvailableAgents(): AgentType[];
    private createTask;
    updateLLMClient(newClient: LLMClient): void;
    setTeamConfig(teamConfig: TeamConfigManager): void;
}
//# sourceMappingURL=router.d.ts.map