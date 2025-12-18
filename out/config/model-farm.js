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
exports.ModelFarmManager = exports.DEFAULT_PROVIDER_MODELS = void 0;
/**
 * CodeTeam AI Ultra - Model Farm Configuration
 * Manages providers, models, and their enabled/disabled states
 */
const vscode = __importStar(require("vscode"));
exports.DEFAULT_PROVIDER_MODELS = {
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
class ModelFarmManager {
    context;
    config;
    providers = new Map();
    constructor(context) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration('codeteam');
        this.loadProviders();
    }
    loadProviders() {
        const allProviders = [
            'openai', 'anthropic', 'gemini', 'groq',
            'deepseek', 'kimi', 'minimax', 'ollama'
        ];
        const savedProviders = this.context.globalState.get('codeteam.modelFarm', {});
        for (const providerId of allProviders) {
            const saved = savedProviders[providerId];
            const apiKey = this.getApiKey(providerId);
            const provider = {
                id: providerId,
                name: this.getProviderDisplayName(providerId),
                enabled: saved?.enabled ?? (apiKey ? true : false),
                apiKey: apiKey,
                apiKeyConfigured: !!apiKey,
                models: saved?.models ?? exports.DEFAULT_PROVIDER_MODELS[providerId],
                selectedModel: saved?.selectedModel ?? exports.DEFAULT_PROVIDER_MODELS[providerId][0]?.id ?? '',
                lastTested: saved?.lastTested ? new Date(saved.lastTested) : undefined,
                testStatus: saved?.testStatus ?? 'untested',
                endpoint: this.getEndpoint(providerId)
            };
            this.providers.set(providerId, provider);
        }
    }
    getApiKey(provider) {
        const keyMap = {
            openai: 'openaiApiKey',
            anthropic: 'anthropicApiKey',
            gemini: 'geminiApiKey',
            groq: 'groqApiKey',
            deepseek: 'deepseekApiKey',
            kimi: 'kimiApiKey',
            minimax: 'minimaxApiKey',
            ollama: ''
        };
        return this.config.get(keyMap[provider], '');
    }
    getEndpoint(provider) {
        if (provider === 'ollama') {
            return this.config.get('ollamaEndpoint', 'http://localhost:11434');
        }
        return undefined;
    }
    getProviderDisplayName(provider) {
        const names = {
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
    async saveProviders() {
        const toSave = {};
        for (const [id, provider] of this.providers) {
            toSave[id] = provider;
        }
        await this.context.globalState.update('codeteam.modelFarm', toSave);
    }
    // Get all providers
    getAllProviders() {
        return Array.from(this.providers.values());
    }
    // Get enabled providers
    getEnabledProviders() {
        return this.getAllProviders().filter(p => p.enabled && p.apiKeyConfigured);
    }
    // Get provider by ID
    getProvider(id) {
        return this.providers.get(id);
    }
    // Enable/disable provider
    async setProviderEnabled(id, enabled) {
        const provider = this.providers.get(id);
        if (provider) {
            provider.enabled = enabled;
            await this.saveProviders();
        }
    }
    // Enable/disable model
    async setModelEnabled(providerId, modelId, enabled) {
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
    async selectModel(providerId, modelId) {
        const provider = this.providers.get(providerId);
        if (provider) {
            provider.selectedModel = modelId;
            await this.saveProviders();
        }
    }
    // Get enabled models for a provider
    getEnabledModels(providerId) {
        const provider = this.providers.get(providerId);
        return provider?.models.filter(m => m.enabled) ?? [];
    }
    // Save API Key to VS Code settings
    async saveApiKey(providerId, apiKey) {
        const keyMap = {
            openai: 'openaiApiKey',
            anthropic: 'anthropicApiKey',
            gemini: 'geminiApiKey',
            groq: 'groqApiKey',
            deepseek: 'deepseekApiKey',
            kimi: 'kimiApiKey',
            minimax: 'minimaxApiKey',
            ollama: ''
        };
        const settingKey = keyMap[providerId];
        if (!settingKey)
            return false;
        try {
            await vscode.workspace.getConfiguration('codeteam').update(settingKey, apiKey, vscode.ConfigurationTarget.Global);
            // Reload config
            this.config = vscode.workspace.getConfiguration('codeteam');
            // Update provider state
            const provider = this.providers.get(providerId);
            if (provider) {
                provider.apiKey = apiKey;
                provider.apiKeyConfigured = !!apiKey;
                provider.enabled = !!apiKey;
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to save API key for ${providerId}:`, error);
            return false;
        }
    }
    // Fetch available models from API dynamically
    async fetchModelsFromApi(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider || !provider.apiKeyConfigured) {
            return exports.DEFAULT_PROVIDER_MODELS[providerId];
        }
        try {
            switch (providerId) {
                case 'openai':
                    return await this.fetchOpenAIModels(provider.apiKey);
                case 'groq':
                    return await this.fetchGroqModels(provider.apiKey);
                case 'ollama':
                    return await this.fetchOllamaModels(provider.endpoint || 'http://localhost:11434');
                default:
                    // For providers without model listing API, use defaults
                    return exports.DEFAULT_PROVIDER_MODELS[providerId];
            }
        }
        catch (error) {
            console.error(`Failed to fetch models for ${providerId}:`, error);
            return exports.DEFAULT_PROVIDER_MODELS[providerId];
        }
    }
    async fetchOpenAIModels(apiKey) {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
        }
        const data = await response.json();
        // Filter and sort relevant models
        const relevantModels = data.data
            .filter((m) => m.id.startsWith('gpt-') ||
            m.id.startsWith('o1') ||
            m.id.startsWith('o3') ||
            m.id.includes('chatgpt'))
            .sort((a, b) => b.created - a.created);
        return relevantModels.map((m) => ({
            id: m.id,
            name: this.formatModelName(m.id),
            enabled: m.id.includes('gpt-4o') || m.id === 'gpt-4-turbo',
            contextWindow: this.getContextWindow(m.id),
            description: this.getModelDescription(m.id)
        }));
    }
    async fetchGroqModels(apiKey) {
        const response = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }
        const data = await response.json();
        return data.data.map((m) => ({
            id: m.id,
            name: this.formatModelName(m.id),
            enabled: m.id.includes('llama') || m.id.includes('mixtral'),
            contextWindow: m.context_window || 32768,
            description: m.id.includes('vision') ? 'Multimodal' : 'Text'
        }));
    }
    async fetchOllamaModels(endpoint) {
        const response = await fetch(`${endpoint}/api/tags`);
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }
        const data = await response.json();
        return data.models.map((m) => ({
            id: m.name,
            name: m.name,
            enabled: true,
            description: `${(m.size / 1e9).toFixed(1)}GB`
        }));
    }
    formatModelName(id) {
        return id
            .replace(/-/g, ' ')
            .replace(/gpt/i, 'GPT')
            .replace(/\b\w/g, c => c.toUpperCase());
    }
    getContextWindow(modelId) {
        if (modelId.includes('gpt-4o') || modelId.includes('o1') || modelId.includes('gpt-4-turbo'))
            return 128000;
        if (modelId.includes('gpt-4-32k'))
            return 32768;
        if (modelId.includes('gpt-4'))
            return 8192;
        if (modelId.includes('gpt-3.5-turbo-16k'))
            return 16385;
        if (modelId.includes('gpt-3.5'))
            return 4096;
        return 8192;
    }
    getModelDescription(modelId) {
        if (modelId.includes('o1') || modelId.includes('o3'))
            return 'Reasoning-Modell';
        if (modelId.includes('gpt-4o-mini'))
            return 'Schnell & günstig';
        if (modelId.includes('gpt-4o'))
            return 'Multimodal, schnell';
        if (modelId.includes('gpt-4-turbo'))
            return 'Schneller als GPT-4';
        if (modelId.includes('gpt-4'))
            return 'Stärkstes Modell';
        if (modelId.includes('gpt-3.5'))
            return 'Schnell & günstig';
        return '';
    }
    // Update provider models with fetched ones
    async refreshProviderModels(providerId) {
        const models = await this.fetchModelsFromApi(providerId);
        const provider = this.providers.get(providerId);
        if (provider && models.length > 0) {
            provider.models = models;
            if (!provider.selectedModel || !models.find(m => m.id === provider.selectedModel)) {
                provider.selectedModel = models[0]?.id || '';
            }
            await this.saveProviders();
        }
    }
    // Test provider connection
    async testProvider(providerId) {
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
            let testUrl;
            let headers = {};
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
            }
            else {
                provider.testStatus = 'failed';
                provider.lastTested = new Date();
                await this.saveProviders();
                return { success: false, message: `Fehler: ${response.status}` };
            }
        }
        catch (error) {
            provider.testStatus = 'failed';
            provider.lastTested = new Date();
            await this.saveProviders();
            return { success: false, message: `Verbindungsfehler: ${error}` };
        }
    }
    // Get summary of active models
    getModelFarmSummary() {
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
    reload() {
        this.config = vscode.workspace.getConfiguration('codeteam');
        this.loadProviders();
    }
}
exports.ModelFarmManager = ModelFarmManager;
//# sourceMappingURL=model-farm.js.map