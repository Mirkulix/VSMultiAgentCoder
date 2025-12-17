/**
 * CodeTeam AI Ultra - Kimi Client (Moonshot AI)
 * LLM Client implementation for Kimi API (Long context specialist)
 */
import { LLMClient, Message, ChatOptions } from '../types';
export declare class KimiClient implements LLMClient {
    private apiKey;
    private model;
    private baseUrl;
    constructor(apiKey: string, model?: string);
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
//# sourceMappingURL=kimi-client.d.ts.map