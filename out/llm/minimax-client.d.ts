/**
 * CodeTeam AI Ultra - Minimax Client
 * LLM Client implementation for Minimax API
 */
import { LLMClient, Message, ChatOptions } from '../types';
export declare class MinimaxClient implements LLMClient {
    private apiKey;
    private groupId;
    private model;
    private baseUrl;
    constructor(apiKey: string, groupId: string, model?: string);
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
//# sourceMappingURL=minimax-client.d.ts.map