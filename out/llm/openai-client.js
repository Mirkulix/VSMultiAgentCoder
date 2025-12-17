"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
/**
 * CodeTeam AI - OpenAI Client
 * LLM Client implementation for OpenAI API
 */
const openai_1 = __importDefault(require("openai"));
class OpenAIClient {
    client;
    model;
    constructor(apiKey, model = 'gpt-4o') {
        this.client = new openai_1.default({ apiKey });
        this.model = model;
    }
    async chat(messages, options) {
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
    async *stream(messages, options) {
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
exports.OpenAIClient = OpenAIClient;
//# sourceMappingURL=openai-client.js.map