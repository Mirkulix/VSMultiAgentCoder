"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamConfigManager = exports.DEFAULT_TEAM_CONFIG = void 0;
/**
 * CodeTeam AI Ultra - Team Configuration
 * Manages team member configuration and provider assignments
 */
const vscode = __importStar(require("vscode"));
const factory_1 = require("../llm/factory");
exports.DEFAULT_TEAM_CONFIG = [
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
class TeamConfigManager {
    context;
    config;
    clientCache = new Map();
    constructor(context) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration('codeteam');
    }
    /**
     * Get the current team configuration
     */
    getTeamConfig() {
        const savedMembers = this.context.globalState.get('codeteam.teamMembers', exports.DEFAULT_TEAM_CONFIG);
        const workflowMode = this.config.get('workflowMode', 'semi-automatic');
        const requireApproval = this.config.get('requireApproval', ['planning', 'implementation']);
        return {
            members: savedMembers,
            workflowMode,
            requireApproval
        };
    }
    /**
     * Get enabled team members
     */
    getEnabledMembers() {
        return this.getTeamConfig().members.filter(m => m.enabled);
    }
    /**
     * Get team member by agent type
     */
    getMember(agentType) {
        return this.getTeamConfig().members.find(m => m.agentType === agentType);
    }
    /**
     * Update a team member's configuration
     */
    async updateMember(agentType, updates) {
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
    async setMemberEnabled(agentType, enabled) {
        await this.updateMember(agentType, { enabled });
    }
    /**
     * Change provider for a team member
     */
    async setMemberProvider(agentType, provider) {
        await this.updateMember(agentType, { provider });
    }
    /**
     * Get LLM client for a specific agent
     */
    getClientForAgent(agentType) {
        const member = this.getMember(agentType);
        if (!member) {
            throw new Error(`Agent ${agentType} not found in team`);
        }
        // Check cache first
        if (this.clientCache.has(member.provider)) {
            return this.clientCache.get(member.provider);
        }
        // Create new client
        const client = factory_1.LLMClientFactory.createForProvider(member.provider, this.config);
        this.clientCache.set(member.provider, client);
        return client;
    }
    /**
     * Check if a provider is configured (has API key)
     */
    isProviderConfigured(provider) {
        switch (provider) {
            case 'openai':
                return !!this.config.get('openaiApiKey');
            case 'anthropic':
                return !!this.config.get('anthropicApiKey');
            case 'gemini':
                return !!this.config.get('geminiApiKey');
            case 'groq':
                return !!this.config.get('groqApiKey');
            case 'deepseek':
                return !!this.config.get('deepseekApiKey');
            case 'kimi':
                return !!this.config.get('kimiApiKey');
            case 'minimax':
                return !!this.config.get('minimaxApiKey') &&
                    !!this.config.get('minimaxGroupId');
            case 'ollama':
                return true; // Local, always available
            default:
                return false;
        }
    }
    /**
     * Get list of configured providers
     */
    getConfiguredProviders() {
        return factory_1.LLMClientFactory.getAvailableProviders().filter(provider => this.isProviderConfigured(provider));
    }
    /**
     * Reset team to default configuration
     */
    async resetToDefaults() {
        await this.context.globalState.update('codeteam.teamMembers', exports.DEFAULT_TEAM_CONFIG);
        this.clientCache.clear();
    }
    /**
     * Get team summary for display
     */
    getTeamSummary() {
        const enabled = this.getEnabledMembers();
        return enabled.map(m => `${m.emoji} ${m.displayName} (${m.provider})`).join('\n');
    }
}
exports.TeamConfigManager = TeamConfigManager;
//# sourceMappingURL=team-config.js.map