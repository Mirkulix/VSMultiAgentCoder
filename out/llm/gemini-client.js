"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
/**
 * CodeTeam AI - Gemini Client
 * LLM Client implementation for Google Gemini API
 */
const generative_ai_1 = require("@google/generative-ai");
class GeminiClient {
    client;
    model;
    constructor(apiKey, modelName = 'gemini-pro') {
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({ model: modelName });
    }
    async chat(messages, options) {
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
            history: history,
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
    async *stream(messages, options) {
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');
        const history = conversationMessages.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));
        const lastMessage = conversationMessages[conversationMessages.length - 1];
        const chat = this.model.startChat({
            history: history,
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
exports.GeminiClient = GeminiClient;
//# sourceMappingURL=gemini-client.js.map