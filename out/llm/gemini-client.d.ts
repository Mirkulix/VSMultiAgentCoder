import { LLMClient, Message, ChatOptions } from '../types';
export declare class GeminiClient implements LLMClient {
    private client;
    private model;
    constructor(apiKey: string, modelName?: string);
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
//# sourceMappingURL=gemini-client.d.ts.map