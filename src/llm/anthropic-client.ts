/**
 * CodeTeam AI Ultra - Anthropic Client
 * LLM Client implementation for Anthropic Claude API
 * Note: Uses any type for SDK compatibility
 */
import Anthropic from '@anthropic-ai/sdk';
import { LLMClient, Message, ChatOptions } from '../types';

interface TextBlock {
    type: 'text';
    text: string;
}

export class AnthropicClient implements LLMClient {
    private client: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = 'claude-3-5-sonnet-20241022') {
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<string> {
        // Separate system message from conversation
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }));

        // Using any type cast for SDK compatibility
        const response = await (this.client as any).messages.create({
            model: this.model,
            max_tokens: options?.maxTokens ?? 4000,
            system: systemMessage?.content,
            messages: conversationMessages
        });

        // Extract text from content blocks
        const textContent = (response.content as any[])
            .filter((block: any): block is TextBlock => block.type === 'text')
            .map((block: TextBlock) => block.text)
            .join('');

        return textContent;
    }

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            }));

        // Using any type cast for SDK compatibility
        const stream = await (this.client as any).messages.stream({
            model: this.model,
            max_tokens: options?.maxTokens ?? 4000,
            system: systemMessage?.content,
            messages: conversationMessages
        });

        for await (const event of stream) {
            if (event.type === 'content_block_delta' &&
                (event.delta as any).type === 'text_delta') {
                yield (event.delta as any).text;
            }
        }
    }
}
