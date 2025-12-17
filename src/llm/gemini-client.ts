/**
 * CodeTeam AI - Gemini Client
 * LLM Client implementation for Google Gemini API
 */
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { LLMClient, Message, ChatOptions } from '../types';

export class GeminiClient implements LLMClient {
    private client: GoogleGenerativeAI;
    private model: GenerativeModel;

    constructor(apiKey: string, modelName: string = 'gemini-pro') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({ model: modelName });
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<string> {
        // Convert messages to Gemini format
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');

        // Build chat history
        const history = conversationMessages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMessage = conversationMessages[conversationMessages.length - 1];

        // Start chat with history
        const chat = this.model.startChat({
            history: history as any,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 4000,
                stopSequences: options?.stopSequences
            }
        });

        // Prepend system message to user message if exists
        const userMessage = systemMessage
            ? `${systemMessage.content}\n\n---\n\n${lastMessage.content}`
            : lastMessage.content;

        const result = await chat.sendMessage(userMessage);
        return result.response.text();
    }

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');

        const history = conversationMessages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const lastMessage = conversationMessages[conversationMessages.length - 1];

        const chat = this.model.startChat({
            history: history as any,
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 4000,
                stopSequences: options?.stopSequences
            }
        });

        const userMessage = systemMessage
            ? `${systemMessage.content}\n\n---\n\n${lastMessage.content}`
            : lastMessage.content;

        const result = await chat.sendMessageStream(userMessage);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                yield text;
            }
        }
    }
}
