/**
 * CodeTeam AI Ultra - Groq Client
 * LLM Client implementation for Groq API (Ultra-fast inference)
 */
import { LLMClient, Message, ChatOptions } from '../types';
export declare class GroqClient implements LLMClient {
    private apiKey;
    private model;
    private baseUrl;
    constructor(apiKey: string, model?: string);
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
//# sourceMappingURL=groq-client.d.ts.map