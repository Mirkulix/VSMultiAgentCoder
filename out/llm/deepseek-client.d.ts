/**
 * CodeTeam AI Ultra - DeepSeek Client
 * LLM Client implementation for DeepSeek API (Code specialist)
 */
import { LLMClient, Message, ChatOptions } from '../types';
export declare class DeepSeekClient implements LLMClient {
    private apiKey;
    private model;
    private baseUrl;
    constructor(apiKey: string, model?: string);
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
//# sourceMappingURL=deepseek-client.d.ts.map