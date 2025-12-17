"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClientFactory = void 0;
const openai_client_1 = require("./openai-client");
const anthropic_client_1 = require("./anthropic-client");
const gemini_client_1 = require("./gemini-client");
const groq_client_1 = require("./groq-client");
const deepseek_client_1 = require("./deepseek-client");
const kimi_client_1 = require("./kimi-client");
const minimax_client_1 = require("./minimax-client");
const ollama_client_1 = require("./ollama-client");
class LLMClientFactory {
    /**
     * Create an LLM client from VS Code configuration
     */
    static create(config) {
        const provider = config.get('provider', 'openai');
        return this.createForProvider(provider, config);
    }
    /**
     * Create an LLM client for a specific provider
     */
    static createForProvider(provider, config) {
        switch (provider) {
            case 'openai': {
                const apiKey = config.get('openaiApiKey', '');
                const model = config.get('openaiModel', 'gpt-4o');
                if (!apiKey) {
                    throw new Error('OpenAI API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new openai_client_1.OpenAIClient(apiKey, model);
            }
            case 'anthropic': {
                const apiKey = config.get('anthropicApiKey', '');
                const model = config.get('anthropicModel', 'claude-3-5-sonnet-20241022');
                if (!apiKey) {
                    throw new Error('Anthropic API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new anthropic_client_1.AnthropicClient(apiKey, model);
            }
            case 'gemini': {
                const apiKey = config.get('geminiApiKey', '');
                const model = config.get('geminiModel', 'gemini-pro');
                if (!apiKey) {
                    throw new Error('Gemini API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new gemini_client_1.GeminiClient(apiKey, model);
            }
            case 'groq': {
                const apiKey = config.get('groqApiKey', '');
                const model = config.get('groqModel', 'llama-3.1-70b-versatile');
                if (!apiKey) {
                    throw new Error('Groq API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new groq_client_1.GroqClient(apiKey, model);
            }
            case 'deepseek': {
                const apiKey = config.get('deepseekApiKey', '');
                const model = config.get('deepseekModel', 'deepseek-coder');
                if (!apiKey) {
                    throw new Error('DeepSeek API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new deepseek_client_1.DeepSeekClient(apiKey, model);
            }
            case 'kimi': {
                const apiKey = config.get('kimiApiKey', '');
                const model = config.get('kimiModel', 'moonshot-v1-8k');
                if (!apiKey) {
                    throw new Error('Kimi API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new kimi_client_1.KimiClient(apiKey, model);
            }
            case 'minimax': {
                const apiKey = config.get('minimaxApiKey', '');
                const groupId = config.get('minimaxGroupId', '');
                const model = config.get('minimaxModel', 'abab6-chat');
                if (!apiKey || !groupId) {
                    throw new Error('Minimax API Key oder Group ID nicht konfiguriert.');
                }
                return new minimax_client_1.MinimaxClient(apiKey, groupId, model);
            }
            case 'ollama': {
                const endpoint = config.get('ollamaEndpoint', 'http://localhost:11434');
                const model = config.get('ollamaModel', 'codellama');
                return new ollama_client_1.OllamaClient(endpoint, model);
            }
            default:
                throw new Error(`Unbekannter LLM Provider: ${provider}`);
        }
    }
    /**
     * Get list of all available providers
     */
    static getAvailableProviders() {
        return [
            'openai',
            'anthropic',
            'gemini',
            'groq',
            'deepseek',
            'kimi',
            'minimax',
            'ollama'
        ];
    }
    /**
     * Get provider display info
     */
    static getProviderInfo(provider) {
        const info = {
            openai: {
                name: 'OpenAI',
                description: 'GPT-4o, GPT-4-Turbo',
                strengths: ['Allrounder', 'Reasoning', 'Visuell']
            },
            anthropic: {
                name: 'Anthropic',
                description: 'Claude 3.5 Sonnet, Opus',
                strengths: ['Code-Qualität', 'Safety', 'Kritisches Denken']
            },
            gemini: {
                name: 'Google Gemini',
                description: 'Gemini Pro, Ultra',
                strengths: ['Long Context', 'Speed', 'Multimodal']
            },
            groq: {
                name: 'Groq',
                description: 'LLaMA 3.1 70B, Mixtral',
                strengths: ['Extrem schnell', 'Open Source Models']
            },
            deepseek: {
                name: 'DeepSeek',
                description: 'DeepSeek Coder V2',
                strengths: ['Code-Spezialist', 'Günstig']
            },
            kimi: {
                name: 'Kimi (Moonshot)',
                description: 'Moonshot V1',
                strengths: ['Long Context (128k)', 'Chinesisch']
            },
            minimax: {
                name: 'Minimax',
                description: 'abab6-chat',
                strengths: ['Multimodal', 'Asiatische Sprachen']
            },
            ollama: {
                name: 'Ollama (Lokal)',
                description: 'CodeLlama, Mistral, etc.',
                strengths: ['Privatsphäre', 'Offline', 'Kostenlos']
            }
        };
        return info[provider];
    }
}
exports.LLMClientFactory = LLMClientFactory;
//# sourceMappingURL=factory.js.map