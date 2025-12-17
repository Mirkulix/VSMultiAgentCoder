/**
 * CodeTeam AI Ultra - Team Configuration
 * Manages team member configuration and provider assignments
 */
import * as vscode from 'vscode';
import { AgentType, LLMProvider, LLMClient } from '../types';
import { LLMClientFactory } from '../llm/factory';

export interface TeamMemberConfig {
    agentType: AgentType;
    enabled: boolean;
    provider: LLMProvider;
    displayName: string;
    emoji: string;
    description: string;
}

export interface TeamConfig {
    members: TeamMemberConfig[];
    workflowMode: 'assisted' | 'semi-automatic' | 'automatic';
    requireApproval: ('analysis' | 'planning' | 'solutioning' | 'implementation')[];
}

export const DEFAULT_TEAM_CONFIG: TeamMemberConfig[] = [
    {
        agentType: 'productManager',
        enabled: true,
        provider: 'anthropic',
        displayName: 'Product Manager',
        emoji: '📊',
        description: 'PRDs, User Stories, Anforderungen'
    },
    {
        agentType: 'architect',
        enabled: true,
        provider: 'openai',
        displayName: 'Architect',
        emoji: '🏗️',
        description: 'System-Design, Architektur, Patterns'
    },
    {
        agentType: 'developer',
        enabled: true,
        provider: 'deepseek',
        displayName: 'Developer',
        emoji: '👨‍💻',
        description: 'Code-Generierung, Implementierung'
    },
    {
        agentType: 'reviewer',
        enabled: true,
        provider: 'anthropic',
        displayName: 'Reviewer',
        emoji: '🔍',
        description: 'Code-Review, Best Practices'
    },
    {
        agentType: 'tester',
        enabled: true,
        provider: 'openai',
        displayName: 'Tester',
        emoji: '🧪',
        description: 'Test-Generierung, Edge Cases'
    },
    {
        agentType: 'docsWriter',
        enabled: true,
        provider: 'groq',
        displayName: 'Docs Writer',
        emoji: '📝',
        description: 'Dokumentation, JSDoc, README'
    },
    {
        agentType: 'uxDesigner',
        enabled: false,
        provider: 'openai',
        displayName: 'UX Designer',
        emoji: '🎨',
        description: 'UI/UX Design, Wireframes'
    },
    {
        agentType: 'security',
        enabled: false,
        provider: 'anthropic',
        displayName: 'Security Analyst',
        emoji: '🔒',
        description: 'Security Review, OWASP'
    },
    {
        agentType: 'devops',
        enabled: false,
        provider: 'groq',
        displayName: 'DevOps Engineer',
        emoji: '⚙️',
        description: 'CI/CD, Deployment, Docker'
    }
];

export class TeamConfigManager {
    private context: vscode.ExtensionContext;
    private config: vscode.WorkspaceConfiguration;
    private clientCache: Map<LLMProvider, LLMClient> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration('codeteam');
    }

    /**
     * Get the current team configuration
     */
    getTeamConfig(): TeamConfig {
        const savedMembers = this.context.globalState.get<TeamMemberConfig[]>(
            'codeteam.teamMembers',
            DEFAULT_TEAM_CONFIG
        );

        const workflowMode = this.config.get<'assisted' | 'semi-automatic' | 'automatic'>(
            'workflowMode',
            'semi-automatic'
        );

        const requireApproval = this.config.get<string[]>(
            'requireApproval',
            ['planning', 'implementation']
        ) as TeamConfig['requireApproval'];

        return {
            members: savedMembers,
            workflowMode,
            requireApproval
        };
    }

    /**
     * Get enabled team members
     */
    getEnabledMembers(): TeamMemberConfig[] {
        return this.getTeamConfig().members.filter(m => m.enabled);
    }

    /**
     * Get team member by agent type
     */
    getMember(agentType: AgentType): TeamMemberConfig | undefined {
        return this.getTeamConfig().members.find(m => m.agentType === agentType);
    }

    /**
     * Update a team member's configuration
     */
    async updateMember(
        agentType: AgentType,
        updates: Partial<TeamMemberConfig>
    ): Promise<void> {
        const config = this.getTeamConfig();
        const memberIndex = config.members.findIndex(m => m.agentType === agentType);

        if (memberIndex >= 0) {
            config.members[memberIndex] = { ...config.members[memberIndex], ...updates };
            await this.context.globalState.update('codeteam.teamMembers', config.members);

            // Clear client cache if provider changed
            if (updates.provider) {
                this.clientCache.delete(updates.provider);
            }
        }
    }

    /**
     * Enable/disable a team member
     */
    async setMemberEnabled(agentType: AgentType, enabled: boolean): Promise<void> {
        await this.updateMember(agentType, { enabled });
    }

    /**
     * Change provider for a team member
     */
    async setMemberProvider(agentType: AgentType, provider: LLMProvider): Promise<void> {
        await this.updateMember(agentType, { provider });
    }

    /**
     * Get LLM client for a specific agent
     */
    getClientForAgent(agentType: AgentType): LLMClient {
        const member = this.getMember(agentType);
        if (!member) {
            throw new Error(`Agent ${agentType} not found in team`);
        }

        // Check cache first
        if (this.clientCache.has(member.provider)) {
            return this.clientCache.get(member.provider)!;
        }

        // Create new client
        const client = LLMClientFactory.createForProvider(member.provider, this.config);
        this.clientCache.set(member.provider, client);

        return client;
    }

    /**
     * Check if a provider is configured (has API key)
     */
    isProviderConfigured(provider: LLMProvider): boolean {
        switch (provider) {
            case 'openai':
                return !!this.config.get<string>('openaiApiKey');
            case 'anthropic':
                return !!this.config.get<string>('anthropicApiKey');
            case 'gemini':
                return !!this.config.get<string>('geminiApiKey');
            case 'groq':
                return !!this.config.get<string>('groqApiKey');
            case 'deepseek':
                return !!this.config.get<string>('deepseekApiKey');
            case 'kimi':
                return !!this.config.get<string>('kimiApiKey');
            case 'minimax':
                return !!this.config.get<string>('minimaxApiKey') &&
                    !!this.config.get<string>('minimaxGroupId');
            case 'ollama':
                return true; // Local, always available
            default:
                return false;
        }
    }

    /**
     * Get list of configured providers
     */
    getConfiguredProviders(): LLMProvider[] {
        return LLMClientFactory.getAvailableProviders().filter(
            provider => this.isProviderConfigured(provider)
        );
    }

    /**
     * Reset team to default configuration
     */
    async resetToDefaults(): Promise<void> {
        await this.context.globalState.update('codeteam.teamMembers', DEFAULT_TEAM_CONFIG);
        this.clientCache.clear();
    }

    /**
     * Get team summary for display
     */
    getTeamSummary(): string {
        const enabled = this.getEnabledMembers();
        return enabled.map(m => `${m.emoji} ${m.displayName} (${m.provider})`).join('\n');
    }
}
