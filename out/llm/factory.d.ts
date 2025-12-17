/**
 * CodeTeam AI Ultra - LLM Client Factory
 * Creates the appropriate LLM client based on configuration
 */
import * as vscode from 'vscode';
import { LLMClient, LLMProvider } from '../types';
export declare class LLMClientFactory {
    /**
     * Create an LLM client from VS Code configuration
     */
    static create(config: vscode.WorkspaceConfiguration): LLMClient;
    /**
     * Create an LLM client for a specific provider
     */
    static createForProvider(provider: LLMProvider, config: vscode.WorkspaceConfiguration): LLMClient;
    /**
     * Get list of all available providers
     */
    static getAvailableProviders(): LLMProvider[];
    /**
     * Get provider display info
     */
    static getProviderInfo(provider: LLMProvider): {
        name: string;
        description: string;
        strengths: string[];
    };
}
//# sourceMappingURL=factory.d.ts.map