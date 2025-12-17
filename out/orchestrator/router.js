"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Orchestrator = void 0;
// Import all agents
const coder_agent_1 = require("../agents/coder-agent");
const reviewer_agent_1 = require("../agents/reviewer-agent");
const tester_agent_1 = require("../agents/tester-agent");
const docs_agent_1 = require("../agents/docs-agent");
const architect_agent_1 = require("../agents/architect-agent");
const product_manager_agent_1 = require("../agents/product-manager-agent");
const ux_designer_agent_1 = require("../agents/ux-designer-agent");
const security_agent_1 = require("../agents/security-agent");
const devops_agent_1 = require("../agents/devops-agent");
class Orchestrator {
    agents;
    memory;
    llmClient;
    teamConfig;
    constructor(llmClient, memory, teamConfig) {
        this.llmClient = llmClient;
        this.memory = memory;
        this.teamConfig = teamConfig;
        this.agents = new Map();
        this.initializeAgents();
    }
    initializeAgents() {
        // Core agents (always available)
        this.agents.set('coder', new coder_agent_1.CoderAgent(this.llmClient, this.memory));
        this.agents.set('developer', new coder_agent_1.CoderAgent(this.llmClient, this.memory)); // Alias
        this.agents.set('reviewer', new reviewer_agent_1.ReviewerAgent(this.llmClient, this.memory));
        this.agents.set('tester', new tester_agent_1.TesterAgent(this.llmClient, this.memory));
        this.agents.set('docs', new docs_agent_1.DocsAgent(this.llmClient, this.memory));
        this.agents.set('docsWriter', new docs_agent_1.DocsAgent(this.llmClient, this.memory)); // Alias
        this.agents.set('architect', new architect_agent_1.ArchitectAgent(this.llmClient, this.memory));
        // Extended agents (new in Ultra)
        this.agents.set('productManager', new product_manager_agent_1.ProductManagerAgent(this.llmClient, this.memory));
        this.agents.set('uxDesigner', new ux_designer_agent_1.UXDesignerAgent(this.llmClient, this.memory));
        this.agents.set('security', new security_agent_1.SecurityAgent(this.llmClient, this.memory));
        this.agents.set('devops', new devops_agent_1.DevOpsAgent(this.llmClient, this.memory));
    }
    /**
     * Get agent with team-configured LLM client (if available)
     */
    getAgentWithConfig(agentType) {
        if (this.teamConfig) {
            const member = this.teamConfig.getMember(agentType);
            if (member && member.enabled) {
                try {
                    const client = this.teamConfig.getClientForAgent(agentType);
                    // Create agent instance with configured client
                    return this.createAgentInstance(agentType, client);
                }
                catch {
                    // Fall back to default client
                }
            }
        }
        return this.agents.get(agentType);
    }
    createAgentInstance(agentType, client) {
        switch (agentType) {
            case 'coder':
            case 'developer':
                return new coder_agent_1.CoderAgent(client, this.memory);
            case 'reviewer':
                return new reviewer_agent_1.ReviewerAgent(client, this.memory);
            case 'tester':
                return new tester_agent_1.TesterAgent(client, this.memory);
            case 'docs':
            case 'docsWriter':
                return new docs_agent_1.DocsAgent(client, this.memory);
            case 'architect':
                return new architect_agent_1.ArchitectAgent(client, this.memory);
            case 'productManager':
                return new product_manager_agent_1.ProductManagerAgent(client, this.memory);
            case 'uxDesigner':
                return new ux_designer_agent_1.UXDesignerAgent(client, this.memory);
            case 'security':
                return new security_agent_1.SecurityAgent(client, this.memory);
            case 'devops':
                return new devops_agent_1.DevOpsAgent(client, this.memory);
            default:
                return new coder_agent_1.CoderAgent(client, this.memory);
        }
    }
    /**
     * Analyze user input and determine the appropriate task type
     */
    analyzeTask(input) {
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
    getAgentForTaskType(taskType) {
        const mapping = {
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
    async routeToAgent(agentType, input, context) {
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
        }
        catch (error) {
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
    async smartRoute(input, context) {
        const taskType = this.analyzeTask(input);
        const agentType = this.getAgentForTaskType(taskType);
        return this.routeToAgent(agentType, input, context);
    }
    /**
     * Execute a complex workflow involving multiple agents
     */
    async orchestrateWorkflow(input, workflow, context) {
        const startTime = Date.now();
        const results = [];
        for (const step of workflow) {
            // Check dependencies
            if (step.dependsOn) {
                const dependencies = results.filter(r => step.dependsOn.includes(r.stepId));
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
            }
            catch (error) {
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
            .map(r => `[${r.agentType}]: ${r.result.content}`)
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
    createFeatureWorkflow(featureDescription) {
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
    getAvailableAgents() {
        return Array.from(this.agents.keys());
    }
    createTask(input, context) {
        return {
            id: crypto.randomUUID(),
            type: this.analyzeTask(input),
            input,
            context,
            priority: 'normal',
            createdAt: new Date()
        };
    }
    updateLLMClient(newClient) {
        this.llmClient = newClient;
        this.initializeAgents();
    }
    setTeamConfig(teamConfig) {
        this.teamConfig = teamConfig;
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=router.js.map