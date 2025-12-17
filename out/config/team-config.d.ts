/**
 * CodeTeam AI Ultra - Team Configuration
 * Manages team member configuration and provider assignments
 */
import * as vscode from 'vscode';
import { AgentType, LLMProvider, LLMClient } from '../types';
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
export declare const DEFAULT_TEAM_CONFIG: TeamMemberConfig[];
export declare class TeamConfigManager {
    private context;
    private config;
    private clientCache;
    constructor(context: vscode.ExtensionContext);
    /**
     * Get the current team configuration
     */
    getTeamConfig(): TeamConfig;
    /**
     * Get enabled team members
     */
    getEnabledMembers(): TeamMemberConfig[];
    /**
     * Get team member by agent type
     */
    getMember(agentType: AgentType): TeamMemberConfig | undefined;
    /**
     * Update a team member's configuration
     */
    updateMember(agentType: AgentType, updates: Partial<TeamMemberConfig>): Promise<void>;
    /**
     * Enable/disable a team member
     */
    setMemberEnabled(agentType: AgentType, enabled: boolean): Promise<void>;
    /**
     * Change provider for a team member
     */
    setMemberProvider(agentType: AgentType, provider: LLMProvider): Promise<void>;
    /**
     * Get LLM client for a specific agent
     */
    getClientForAgent(agentType: AgentType): LLMClient;
    /**
     * Check if a provider is configured (has API key)
     */
    isProviderConfigured(provider: LLMProvider): boolean;
    /**
     * Get list of configured providers
     */
    getConfiguredProviders(): LLMProvider[];
    /**
     * Reset team to default configuration
     */
    resetToDefaults(): Promise<void>;
    /**
     * Get team summary for display
     */
    getTeamSummary(): string;
}
//# sourceMappingURL=team-config.d.ts.map