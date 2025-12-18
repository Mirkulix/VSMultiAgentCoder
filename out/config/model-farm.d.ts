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
export declare const DEFAULT_PROVIDER_MODELS: Record<LLMProvider, ModelConfig[]>;
export declare class ModelFarmManager {
    private context;
    private config;
    private providers;
    constructor(context: vscode.ExtensionContext);
    private loadProviders;
    private getApiKey;
    private getEndpoint;
    private getProviderDisplayName;
    saveProviders(): Promise<void>;
    getAllProviders(): ProviderConfig[];
    getEnabledProviders(): ProviderConfig[];
    getProvider(id: LLMProvider): ProviderConfig | undefined;
    setProviderEnabled(id: LLMProvider, enabled: boolean): Promise<void>;
    setModelEnabled(providerId: LLMProvider, modelId: string, enabled: boolean): Promise<void>;
    selectModel(providerId: LLMProvider, modelId: string): Promise<void>;
    getEnabledModels(providerId: LLMProvider): ModelConfig[];
    saveApiKey(providerId: LLMProvider, apiKey: string): Promise<boolean>;
    fetchModelsFromApi(providerId: LLMProvider): Promise<ModelConfig[]>;
    private fetchOpenAIModels;
    private fetchGroqModels;
    private fetchOllamaModels;
    private formatModelName;
    private getContextWindow;
    private getModelDescription;
    refreshProviderModels(providerId: LLMProvider): Promise<void>;
    testProvider(providerId: LLMProvider): Promise<{
        success: boolean;
        message: string;
        latency?: number;
    }>;
    getModelFarmSummary(): string;
    reload(): void;
}
//# sourceMappingURL=model-farm.d.ts.map