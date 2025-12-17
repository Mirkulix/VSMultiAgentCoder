/**
 * CodeTeam AI - OpenAI Client
 * LLM Client implementation for OpenAI API
 */
import OpenAI from 'openai';
import { LLMClient, Message, ChatOptions } from '../types';

export class OpenAIClient implements LLMClient {
    private client: OpenAI;
    private model: string;

    constructor(apiKey: string, model: string = 'gpt-4o') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<string> {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4000,
            stop: options?.stopSequences
        });

        return response.choices[0]?.message?.content || '';
    }

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4000,
            stop: options?.stopSequences,
            stream: true
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    }
}
