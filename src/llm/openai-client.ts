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

    // Prüft ob es ein Reasoning-Modell ist (o1, o3)
    private isReasoningModel(): boolean {
        return this.model.startsWith('o1') || this.model.startsWith('o3');
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<string> {
        const isReasoning = this.isReasoningModel();

        // Reasoning-Modelle (o1, o3) haben andere Parameter
        const requestParams: OpenAI.ChatCompletionCreateParamsNonStreaming = {
            model: this.model,
            messages: messages.map(m => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content
            })),
        };

        if (isReasoning) {
            // o1/o3 Modelle: max_completion_tokens, kein temperature/stop
            requestParams.max_completion_tokens = options?.maxTokens ?? 16000;
        } else {
            // GPT-4 Modelle: normale Parameter
            requestParams.temperature = options?.temperature ?? 0.7;
            requestParams.max_tokens = options?.maxTokens ?? 4000;
            requestParams.stop = options?.stopSequences;
        }

        const response = await this.client.chat.completions.create(requestParams);
        return response.choices[0]?.message?.content || '';
    }

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
        const isReasoning = this.isReasoningModel();

        // Reasoning-Modelle unterstützen kein Streaming, fallback auf normale Anfrage
        if (isReasoning) {
            const result = await this.chat(messages, options);
            yield result;
            return;
        }

        const stream = await this.client.chat.completions.create({
            model: this.model,
            messages: messages.map(m => ({
                role: m.role as 'user' | 'assistant' | 'system',
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
