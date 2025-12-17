/**
 * CodeTeam AI Ultra - LLM Client Factory
 * Creates the appropriate LLM client based on configuration
 */
import * as vscode from 'vscode';
import { LLMClient, LLMProvider } from '../types';
import { OpenAIClient } from './openai-client';
import { AnthropicClient } from './anthropic-client';
import { GeminiClient } from './gemini-client';
import { GroqClient } from './groq-client';
import { DeepSeekClient } from './deepseek-client';
import { KimiClient } from './kimi-client';
import { MinimaxClient } from './minimax-client';
import { OllamaClient } from './ollama-client';

export class LLMClientFactory {
    /**
     * Create an LLM client from VS Code configuration
     */
    static create(config: vscode.WorkspaceConfiguration): LLMClient {
        const provider = config.get<LLMProvider>('provider', 'openai');
        return this.createForProvider(provider, config);
    }

    /**
     * Create an LLM client for a specific provider
     */
    static createForProvider(
        provider: LLMProvider,
        config: vscode.WorkspaceConfiguration
    ): LLMClient {
        switch (provider) {
            case 'openai': {
                const apiKey = config.get<string>('openaiApiKey', '');
                const model = config.get<string>('openaiModel', 'gpt-4o');
                if (!apiKey) {
                    throw new Error('OpenAI API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new OpenAIClient(apiKey, model);
            }

            case 'anthropic': {
                const apiKey = config.get<string>('anthropicApiKey', '');
                const model = config.get<string>('anthropicModel', 'claude-3-5-sonnet-20241022');
                if (!apiKey) {
                    throw new Error('Anthropic API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new AnthropicClient(apiKey, model);
            }

            case 'gemini': {
                const apiKey = config.get<string>('geminiApiKey', '');
                const model = config.get<string>('geminiModel', 'gemini-pro');
                if (!apiKey) {
                    throw new Error('Gemini API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new GeminiClient(apiKey, model);
            }

            case 'groq': {
                const apiKey = config.get<string>('groqApiKey', '');
                const model = config.get<string>('groqModel', 'llama-3.1-70b-versatile');
                if (!apiKey) {
                    throw new Error('Groq API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new GroqClient(apiKey, model);
            }

            case 'deepseek': {
                const apiKey = config.get<string>('deepseekApiKey', '');
                const model = config.get<string>('deepseekModel', 'deepseek-coder');
                if (!apiKey) {
                    throw new Error('DeepSeek API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new DeepSeekClient(apiKey, model);
            }

            case 'kimi': {
                const apiKey = config.get<string>('kimiApiKey', '');
                const model = config.get<string>('kimiModel', 'moonshot-v1-8k');
                if (!apiKey) {
                    throw new Error('Kimi API Key nicht konfiguriert. Bitte in den Einstellungen setzen.');
                }
                return new KimiClient(apiKey, model);
            }

            case 'minimax': {
                const apiKey = config.get<string>('minimaxApiKey', '');
                const groupId = config.get<string>('minimaxGroupId', '');
                const model = config.get<string>('minimaxModel', 'abab6-chat');
                if (!apiKey || !groupId) {
                    throw new Error('Minimax API Key oder Group ID nicht konfiguriert.');
                }
                return new MinimaxClient(apiKey, groupId, model);
            }

            case 'ollama': {
                const endpoint = config.get<string>('ollamaEndpoint', 'http://localhost:11434');
                const model = config.get<string>('ollamaModel', 'codellama');
                return new OllamaClient(endpoint, model);
            }

            default:
                throw new Error(`Unbekannter LLM Provider: ${provider}`);
        }
    }

    /**
     * Get list of all available providers
     */
    static getAvailableProviders(): LLMProvider[] {
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
    static getProviderInfo(provider: LLMProvider): {
        name: string;
        description: string;
        strengths: string[];
    } {
        const info: Record<LLMProvider, { name: string; description: string; strengths: string[] }> = {
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
