/**
 * CodeTeam AI Ultra - Model Farm Configuration
 * Manages providers, models, and their enabled/disabled states
 */
import * as vscode from 'vscode';
import { LLMProvider } from '../types';

export interface ModelConfig {
    id: string;
    name: string;
    enabled: boolean;
    contextWindow?: number;
    description?: string;
}

export interface ProviderConfig {
    id: LLMProvider;
    name: string;
    enabled: boolean;
    apiKey: string;
    apiKeyConfigured: boolean;
    models: ModelConfig[];
    selectedModel: string;
    lastTested?: Date;
    testStatus?: 'success' | 'failed' | 'untested';
    endpoint?: string;
}

export const DEFAULT_PROVIDER_MODELS: Record<LLMProvider, ModelConfig[]> = {
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o', enabled: true, contextWindow: 128000, description: 'Stärkstes Modell, multimodal' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', enabled: true, contextWindow: 128000, description: 'Schneller als GPT-4' },
        { id: 'gpt-4', name: 'GPT-4', enabled: false, contextWindow: 8192, description: 'Original GPT-4' },
        { id: 'o1-preview', name: 'o1-preview', enabled: false, contextWindow: 128000, description: 'Reasoning-Modell' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: false, contextWindow: 16385, description: 'Schnell & günstig' }
    ],
    anthropic: [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', enabled: true, contextWindow: 200000, description: 'Bestes Code-Modell' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', enabled: false, contextWindow: 200000, description: 'Stärkstes Claude' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', enabled: false, contextWindow: 200000, description: 'Schnell & günstig' }
    ],
    gemini: [
        { id: 'gemini-pro', name: 'Gemini Pro', enabled: true, contextWindow: 32000, description: 'Standard Gemini' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', enabled: false, contextWindow: 1000000, description: '1M Context' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', enabled: false, contextWindow: 1000000, description: 'Schnell' }
    ],
    groq: [
        { id: 'llama-3.1-70b-versatile', name: 'LLaMA 3.1 70B', enabled: true, contextWindow: 32768, description: 'Stärkstes Open Source' },
        { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', enabled: true, contextWindow: 32768, description: 'Ultra-schnell' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', enabled: false, contextWindow: 32768, description: 'MoE Modell' },
        { id: 'llama-3.2-90b-vision-preview', name: 'LLaMA 3.2 90B Vision', enabled: false, contextWindow: 8192, description: 'Multimodal' }
    ],
    deepseek: [
        { id: 'deepseek-coder', name: 'DeepSeek Coder', enabled: true, contextWindow: 16000, description: 'Code-Spezialist' },
        { id: 'deepseek-chat', name: 'DeepSeek Chat', enabled: false, contextWindow: 16000, description: 'Allgemein' }
    ],
    kimi: [
        { id: 'moonshot-v1-8k', name: 'Moonshot 8K', enabled: true, contextWindow: 8000, description: 'Standard' },
        { id: 'moonshot-v1-32k', name: 'Moonshot 32K', enabled: false, contextWindow: 32000, description: 'Long Context' },
        { id: 'moonshot-v1-128k', name: 'Moonshot 128K', enabled: false, contextWindow: 128000, description: 'Ultra Long' }
    ],
    minimax: [
        { id: 'abab6-chat', name: 'ABAB6 Chat', enabled: true, contextWindow: 8000, description: 'Standard' },
        { id: 'abab5.5-chat', name: 'ABAB5.5 Chat', enabled: false, contextWindow: 8000, description: 'Älteres Modell' }
    ],
    ollama: [
        { id: 'codellama', name: 'CodeLlama', enabled: true, description: 'Code-Generierung' },
        { id: 'llama3.1', name: 'LLaMA 3.1', enabled: false, description: 'Allgemein' },
        { id: 'mistral', name: 'Mistral', enabled: false, description: 'Schnell' },
        { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', enabled: false, description: 'Code' },
        { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', enabled: false, description: 'Code' }
    ]
};

export class ModelFarmManager {
    private context: vscode.ExtensionContext;
    private config: vscode.WorkspaceConfiguration;
    private providers: Map<LLMProvider, ProviderConfig> = new Map();

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration('codeteam');
        this.loadProviders();
    }

    private loadProviders(): void {
        const allProviders: LLMProvider[] = [
            'openai', 'anthropic', 'gemini', 'groq',
            'deepseek', 'kimi', 'minimax', 'ollama'
        ];

        const savedProviders = this.context.globalState.get<Record<string, ProviderConfig>>(
            'codeteam.modelFarm',
            {}
        );

        for (const providerId of allProviders) {
            const saved = savedProviders[providerId];
            const apiKey = this.getApiKey(providerId);

            const provider: ProviderConfig = {
                id: providerId,
                name: this.getProviderDisplayName(providerId),
                enabled: saved?.enabled ?? (apiKey ? true : false),
                apiKey: apiKey,
                apiKeyConfigured: !!apiKey,
                models: saved?.models ?? DEFAULT_PROVIDER_MODELS[providerId],
                selectedModel: saved?.selectedModel ?? DEFAULT_PROVIDER_MODELS[providerId][0]?.id ?? '',
                lastTested: saved?.lastTested ? new Date(saved.lastTested) : undefined,
                testStatus: saved?.testStatus ?? 'untested',
                endpoint: this.getEndpoint(providerId)
            };

            this.providers.set(providerId, provider);
        }
    }

    private getApiKey(provider: LLMProvider): string {
        const keyMap: Record<LLMProvider, string> = {
            openai: 'openaiApiKey',
            anthropic: 'anthropicApiKey',
            gemini: 'geminiApiKey',
            groq: 'groqApiKey',
            deepseek: 'deepseekApiKey',
            kimi: 'kimiApiKey',
            minimax: 'minimaxApiKey',
            ollama: ''
        };
        return this.config.get<string>(keyMap[provider], '');
    }

    private getEndpoint(provider: LLMProvider): string | undefined {
        if (provider === 'ollama') {
            return this.config.get<string>('ollamaEndpoint', 'http://localhost:11434');
        }
        return undefined;
    }

    private getProviderDisplayName(provider: LLMProvider): string {
        const names: Record<LLMProvider, string> = {
            openai: 'OpenAI',
            anthropic: 'Anthropic (Claude)',
            gemini: 'Google Gemini',
            groq: 'Groq',
            deepseek: 'DeepSeek',
            kimi: 'Kimi (Moonshot)',
            minimax: 'Minimax',
            ollama: 'Ollama (Lokal)'
        };
        return names[provider];
    }

    async saveProviders(): Promise<void> {
        const toSave: Record<string, ProviderConfig> = {};
        for (const [id, provider] of this.providers) {
            toSave[id] = provider;
        }
        await this.context.globalState.update('codeteam.modelFarm', toSave);
    }

    // Get all providers
    getAllProviders(): ProviderConfig[] {
        return Array.from(this.providers.values());
    }

    // Get enabled providers
    getEnabledProviders(): ProviderConfig[] {
        return this.getAllProviders().filter(p => p.enabled && p.apiKeyConfigured);
    }

    // Get provider by ID
    getProvider(id: LLMProvider): ProviderConfig | undefined {
        return this.providers.get(id);
    }

    // Enable/disable provider
    async setProviderEnabled(id: LLMProvider, enabled: boolean): Promise<void> {
        const provider = this.providers.get(id);
        if (provider) {
            provider.enabled = enabled;
            await this.saveProviders();
        }
    }

    // Enable/disable model
    async setModelEnabled(providerId: LLMProvider, modelId: string, enabled: boolean): Promise<void> {
        const provider = this.providers.get(providerId);
        if (provider) {
            const model = provider.models.find(m => m.id === modelId);
            if (model) {
                model.enabled = enabled;
                await this.saveProviders();
            }
        }
    }

    // Select model for provider
    async selectModel(providerId: LLMProvider, modelId: string): Promise<void> {
        const provider = this.providers.get(providerId);
        if (provider) {
            provider.selectedModel = modelId;
            await this.saveProviders();
        }
    }

    // Get enabled models for a provider
    getEnabledModels(providerId: LLMProvider): ModelConfig[] {
        const provider = this.providers.get(providerId);
        return provider?.models.filter(m => m.enabled) ?? [];
    }

    // Test provider connection
    async testProvider(providerId: LLMProvider): Promise<{ success: boolean; message: string; latency?: number }> {
        const provider = this.providers.get(providerId);
        if (!provider) {
            return { success: false, message: 'Provider nicht gefunden' };
        }

        if (!provider.apiKeyConfigured && providerId !== 'ollama') {
            return { success: false, message: 'API Key nicht konfiguriert' };
        }

        const startTime = Date.now();

        try {
            // Simple test request
            let testUrl: string;
            let headers: Record<string, string> = {};

            switch (providerId) {
                case 'openai':
                    testUrl = 'https://api.openai.com/v1/models';
                    headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                    break;
                case 'anthropic':
                    // Anthropic doesn't have a simple models endpoint, use a minimal message
                    testUrl = 'https://api.anthropic.com/v1/messages';
                    headers = {
                        'x-api-key': provider.apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    };
                    break;
                case 'groq':
                    testUrl = 'https://api.groq.com/openai/v1/models';
                    headers = { 'Authorization': `Bearer ${provider.apiKey}` };
                    break;
                case 'ollama':
                    testUrl = `${provider.endpoint}/api/tags`;
                    break;
                default:
                    // For other providers, we'll just mark as untested
                    provider.testStatus = 'untested';
                    provider.lastTested = new Date();
                    await this.saveProviders();
                    return { success: true, message: 'Provider konfiguriert (Test nicht verfügbar)' };
            }

            const response = await fetch(testUrl, {
                method: 'GET',
                headers
            });

            const latency = Date.now() - startTime;

            if (response.ok || response.status === 401) {
                // 401 means the endpoint is reachable but key might be wrong
                const success = response.ok;
                provider.testStatus = success ? 'success' : 'failed';
                provider.lastTested = new Date();
                await this.saveProviders();

                return {
                    success,
                    message: success ? `Verbindung OK (${latency}ms)` : 'API Key ungültig',
                    latency
                };
            } else {
                provider.testStatus = 'failed';
                provider.lastTested = new Date();
                await this.saveProviders();
                return { success: false, message: `Fehler: ${response.status}` };
            }
        } catch (error) {
            provider.testStatus = 'failed';
            provider.lastTested = new Date();
            await this.saveProviders();
            return { success: false, message: `Verbindungsfehler: ${error}` };
        }
    }

    // Get summary of active models
    getModelFarmSummary(): string {
        const enabled = this.getEnabledProviders();
        if (enabled.length === 0) {
            return 'Keine Provider aktiv';
        }

        let summary = `**${enabled.length} Provider aktiv:**\n`;
        for (const provider of enabled) {
            const activeModels = provider.models.filter(m => m.enabled).length;
            const status = provider.testStatus === 'success' ? '✅' :
                provider.testStatus === 'failed' ? '❌' : '⚪';
            summary += `${status} ${provider.name}: ${activeModels} Modelle\n`;
        }
        return summary;
    }

    // Reload configuration from VS Code settings
    reload(): void {
        this.config = vscode.workspace.getConfiguration('codeteam');
        this.loadProviders();
    }
}
