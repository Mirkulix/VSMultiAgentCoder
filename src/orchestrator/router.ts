/**
 * CodeTeam AI Ultra - Master Orchestrator
 * The "Tech Lead" of the agent system - routes tasks and coordinates agents
 */
import {
    AgentType,
    AgentResponse,
    Task,
    TaskType,
    TaskContext,
    WorkflowStep,
    WorkflowResult,
    LLMClient
} from '../types';
import { ProjectMemory } from './memory';
import { TeamConfigManager } from '../config/team-config';
import { BaseAgent } from '../agents/base-agent';

// Import all agents
import { CoderAgent } from '../agents/coder-agent';
import { ReviewerAgent } from '../agents/reviewer-agent';
import { TesterAgent } from '../agents/tester-agent';
import { DocsAgent } from '../agents/docs-agent';
import { ArchitectAgent } from '../agents/architect-agent';
import { ProductManagerAgent } from '../agents/product-manager-agent';
import { UXDesignerAgent } from '../agents/ux-designer-agent';
import { SecurityAgent } from '../agents/security-agent';
import { DevOpsAgent } from '../agents/devops-agent';

export class Orchestrator {
    private agents: Map<AgentType, BaseAgent>;
    private memory: ProjectMemory;
    private llmClient: LLMClient;
    private teamConfig?: TeamConfigManager;

    constructor(llmClient: LLMClient, memory: ProjectMemory, teamConfig?: TeamConfigManager) {
        this.llmClient = llmClient;
        this.memory = memory;
        this.teamConfig = teamConfig;
        this.agents = new Map();

        this.initializeAgents();
    }

    private initializeAgents(): void {
        // Core agents (always available)
        this.agents.set('coder', new CoderAgent(this.llmClient, this.memory));
        this.agents.set('developer', new CoderAgent(this.llmClient, this.memory)); // Alias
        this.agents.set('reviewer', new ReviewerAgent(this.llmClient, this.memory));
        this.agents.set('tester', new TesterAgent(this.llmClient, this.memory));
        this.agents.set('docs', new DocsAgent(this.llmClient, this.memory));
        this.agents.set('docsWriter', new DocsAgent(this.llmClient, this.memory)); // Alias
        this.agents.set('architect', new ArchitectAgent(this.llmClient, this.memory));

        // Extended agents (new in Ultra)
        this.agents.set('productManager', new ProductManagerAgent(this.llmClient, this.memory));
        this.agents.set('uxDesigner', new UXDesignerAgent(this.llmClient, this.memory));
        this.agents.set('security', new SecurityAgent(this.llmClient, this.memory));
        this.agents.set('devops', new DevOpsAgent(this.llmClient, this.memory));
    }

    /**
     * Get agent with team-configured LLM client (if available)
     */
    private getAgentWithConfig(agentType: AgentType): BaseAgent | undefined {
        if (this.teamConfig) {
            const member = this.teamConfig.getMember(agentType);
            if (member && member.enabled) {
                try {
                    const client = this.teamConfig.getClientForAgent(agentType);
                    // Create agent instance with configured client
                    return this.createAgentInstance(agentType, client);
                } catch {
                    // Fall back to default client
                }
            }
        }
        return this.agents.get(agentType);
    }

    private createAgentInstance(agentType: AgentType, client: LLMClient): BaseAgent {
        switch (agentType) {
            case 'coder':
            case 'developer':
                return new CoderAgent(client, this.memory);
            case 'reviewer':
                return new ReviewerAgent(client, this.memory);
            case 'tester':
                return new TesterAgent(client, this.memory);
            case 'docs':
            case 'docsWriter':
                return new DocsAgent(client, this.memory);
            case 'architect':
                return new ArchitectAgent(client, this.memory);
            case 'productManager':
                return new ProductManagerAgent(client, this.memory);
            case 'uxDesigner':
                return new UXDesignerAgent(client, this.memory);
            case 'security':
                return new SecurityAgent(client, this.memory);
            case 'devops':
                return new DevOpsAgent(client, this.memory);
            default:
                return new CoderAgent(client, this.memory);
        }
    }

    /**
     * Analyze user input and determine the appropriate task type
     */
    analyzeTask(input: string): TaskType {
        const lowerInput = input.toLowerCase();

        // Pattern matching for task type detection
        if (lowerInput.includes('review') || lowerInput.includes('check') || lowerInput.includes('analyze')) {
            return 'code_review';
        }
        if (lowerInput.includes('test') || lowerInput.includes('spec') || lowerInput.includes('unit')) {
            return 'test_generation';
        }
        if (lowerInput.includes('document') || lowerInput.includes('doc') || lowerInput.includes('comment')) {
            return 'documentation';
        }
        if (lowerInput.includes('architect') || lowerInput.includes('design') || lowerInput.includes('structure')) {
            return 'architecture';
        }
        if (lowerInput.includes('refactor') || lowerInput.includes('improve') || lowerInput.includes('clean')) {
            return 'refactoring';
        }
        if (lowerInput.includes('debug') || lowerInput.includes('fix') || lowerInput.includes('bug')) {
            return 'debugging';
        }
        if (lowerInput.includes('explain') || lowerInput.includes('what') || lowerInput.includes('how')) {
            return 'explanation';
        }
        if (lowerInput.includes('create') || lowerInput.includes('implement') || lowerInput.includes('write') || lowerInput.includes('generate')) {
            return 'code_generation';
        }

        return 'general';
    }

    /**
     * Determine which agent should handle a task type
     */
    getAgentForTaskType(taskType: TaskType): AgentType {
        const mapping: Record<TaskType, AgentType> = {
            'code_generation': 'developer',
            'code_review': 'reviewer',
            'test_generation': 'tester',
            'documentation': 'docsWriter',
            'architecture': 'architect',
            'refactoring': 'developer',
            'debugging': 'developer',
            'explanation': 'docsWriter',
            'general': 'developer'
        };

        return mapping[taskType];
    }

    /**
     * Route a task directly to a specific agent
     */
    async routeToAgent(
        agentType: AgentType,
        input: string,
        context?: TaskContext
    ): Promise<AgentResponse> {
        const agent = this.getAgentWithConfig(agentType) || this.agents.get(agentType);

        if (!agent) {
            return {
                agentType,
                content: `Agent '${agentType}' not found`,
                success: false
            };
        }

        const task = this.createTask(input, context);

        // Add to memory
        this.memory.addMessage({
            role: 'user',
            content: input,
            timestamp: new Date()
        });

        try {
            const response = await agent.execute(task);

            // Add response to memory
            this.memory.addMessage({
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                agentId: agentType
            });

            return response;
        } catch (error) {
            return {
                agentType,
                content: `Error executing agent: ${error}`,
                success: false
            };
        }
    }

    /**
     * Smart routing - analyze input and route to appropriate agent
     */
    async smartRoute(input: string, context?: TaskContext): Promise<AgentResponse> {
        const taskType = this.analyzeTask(input);
        const agentType = this.getAgentForTaskType(taskType);

        return this.routeToAgent(agentType, input, context);
    }

    /**
     * Execute a complex workflow involving multiple agents
     */
    async orchestrateWorkflow(
        input: string,
        workflow: WorkflowStep[],
        context?: TaskContext
    ): Promise<WorkflowResult> {
        const startTime = Date.now();
        const results: WorkflowStep[] = [];

        for (const step of workflow) {
            // Check dependencies
            if (step.dependsOn) {
                const dependencies = results.filter(r => step.dependsOn!.includes(r.stepId));
                if (dependencies.some(d => d.status === 'failed')) {
                    step.status = 'failed';
                    results.push(step);
                    continue;
                }
            }

            step.status = 'running';

            try {
                const response = await this.routeToAgent(step.agentType, step.action, context);
                step.result = response;
                step.status = response.success ? 'completed' : 'failed';
            } catch (error) {
                step.status = 'failed';
                step.result = {
                    agentType: step.agentType,
                    content: `Step failed: ${error}`,
                    success: false
                };
            }

            results.push(step);
        }

        const allSucceeded = results.every(r => r.status === 'completed');
        const finalOutput = results
            .filter(r => r.result)
            .map(r => `[${r.agentType}]: ${r.result!.content}`)
            .join('\n\n');

        return {
            taskId: crypto.randomUUID(),
            success: allSucceeded,
            steps: results,
            finalOutput,
            duration: Date.now() - startTime
        };
    }

    /**
     * Create a comprehensive feature workflow (4-phase methodology)
     */
    createFeatureWorkflow(featureDescription: string): WorkflowStep[] {
        return [
            // Phase 1: Planning
            {
                stepId: 'requirements',
                agentType: 'productManager',
                action: `Create PRD and user stories for: ${featureDescription}`,
                status: 'pending'
            },
            // Phase 2: Solutioning
            {
                stepId: 'architecture',
                agentType: 'architect',
                action: `Design architecture based on requirements`,
                dependsOn: ['requirements'],
                status: 'pending'
            },
            {
                stepId: 'security-review',
                agentType: 'security',
                action: 'Review architecture for security concerns',
                dependsOn: ['architecture'],
                status: 'pending'
            },
            // Phase 3: Implementation
            {
                stepId: 'implement',
                agentType: 'developer',
                action: `Implement the feature based on the architecture`,
                dependsOn: ['security-review'],
                status: 'pending'
            },
            {
                stepId: 'code-review',
                agentType: 'reviewer',
                action: 'Review the implementation for issues',
                dependsOn: ['implement'],
                status: 'pending'
            },
            {
                stepId: 'tests',
                agentType: 'tester',
                action: 'Generate tests for the implementation',
                dependsOn: ['code-review'],
                status: 'pending'
            },
            // Phase 4: Finalization
            {
                stepId: 'documentation',
                agentType: 'docsWriter',
                action: 'Generate documentation',
                dependsOn: ['tests'],
                status: 'pending'
            },
            {
                stepId: 'deployment',
                agentType: 'devops',
                action: 'Create deployment configuration',
                dependsOn: ['tests'],
                status: 'pending'
            }
        ];
    }

    /**
     * Get list of available agents
     */
    getAvailableAgents(): AgentType[] {
        return Array.from(this.agents.keys());
    }

    private createTask(input: string, context?: TaskContext): Task {
        return {
            id: crypto.randomUUID(),
            type: this.analyzeTask(input),
            input,
            context,
            priority: 'normal',
            createdAt: new Date()
        };
    }

    updateLLMClient(newClient: LLMClient): void {
        this.llmClient = newClient;
        this.initializeAgents();
    }

    setTeamConfig(teamConfig: TeamConfigManager): void {
        this.teamConfig = teamConfig;
    }
}
