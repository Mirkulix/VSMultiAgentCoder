import { LLMClient, Message, ChatOptions } from '../types';
export declare class OpenAIClient implements LLMClient {
    private client;
    private model;
    constructor(apiKey: string, model?: string);
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
//# sourceMappingURL=openai-client.d.ts.map