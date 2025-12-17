/**
 * CodeTeam AI - Ollama Client
 * LLM Client implementation for local Ollama
 */
import { LLMClient, Message, ChatOptions } from '../types';
export declare class OllamaClient implements LLMClient {
    private endpoint;
    private model;
    constructor(endpoint?: string, model?: string);
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
//# sourceMappingURL=ollama-client.d.ts.map