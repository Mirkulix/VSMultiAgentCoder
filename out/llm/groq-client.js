"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqClient = void 0;
class GroqClient {
    apiKey;
    model;
    baseUrl = 'https://api.groq.com/openai/v1';
    constructor(apiKey, model = 'llama-3.1-70b-versatile') {
        this.apiKey = apiKey;
        this.model = model;
    }
    async chat(messages, options) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4000,
                stop: options?.stopSequences,
                stream: false
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }
    async *stream(messages, options) {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4000,
                stop: options?.stopSequences,
                stream: true
            })
        });
        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
            for (const line of lines) {
                if (line === 'data: [DONE]')
                    continue;
                try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                }
                catch {
                    // Ignore parse errors for incomplete chunks
                }
            }
        }
    }
}
exports.GroqClient = GroqClient;
//# sourceMappingURL=groq-client.js.map