"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicClient = void 0;
/**
 * CodeTeam AI Ultra - Anthropic Client
 * LLM Client implementation for Anthropic Claude API
 * Note: Uses any type for SDK compatibility
 */
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AnthropicClient {
    client;
    model;
    constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
        this.client = new sdk_1.default({ apiKey });
        this.model = model;
    }
    async chat(messages, options) {
        // Separate system message from conversation
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
            role: m.role,
            content: m.content
        }));
        // Using any type cast for SDK compatibility
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: options?.maxTokens ?? 4000,
            system: systemMessage?.content,
            messages: conversationMessages
        });
        // Extract text from content blocks
        const textContent = response.content
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('');
        return textContent;
    }
    async *stream(messages, options) {
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages
            .filter(m => m.role !== 'system')
            .map(m => ({
            role: m.role,
            content: m.content
        }));
        // Using any type cast for SDK compatibility
        const stream = await this.client.messages.stream({
            model: this.model,
            max_tokens: options?.maxTokens ?? 4000,
            system: systemMessage?.content,
            messages: conversationMessages
        });
        for await (const event of stream) {
            if (event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta') {
                yield event.delta.text;
            }
        }
    }
}
exports.AnthropicClient = AnthropicClient;
//# sourceMappingURL=anthropic-client.js.map