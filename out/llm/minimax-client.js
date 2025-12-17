"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinimaxClient = void 0;
class MinimaxClient {
    apiKey;
    groupId;
    model;
    baseUrl = 'https://api.minimax.chat/v1';
    constructor(apiKey, groupId, model = 'abab6-chat') {
        this.apiKey = apiKey;
        this.groupId = groupId;
        this.model = model;
    }
    async chat(messages, options) {
        // Convert messages to Minimax format
        const minimaxMessages = messages.filter(m => m.role !== 'system').map(m => ({
            sender_type: m.role === 'user' ? 'USER' : 'BOT',
            text: m.content
        }));
        const systemMessage = messages.find(m => m.role === 'system');
        const response = await fetch(`${this.baseUrl}/text/chatcompletion?GroupId=${this.groupId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: minimaxMessages,
                prompt: systemMessage?.content || '',
                temperature: options?.temperature ?? 0.7,
                tokens_to_generate: options?.maxTokens ?? 4000,
                stream: false
            })
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Minimax API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return data.reply || '';
    }
    async *stream(messages, options) {
        const minimaxMessages = messages.filter(m => m.role !== 'system').map(m => ({
            sender_type: m.role === 'user' ? 'USER' : 'BOT',
            text: m.content
        }));
        const systemMessage = messages.find(m => m.role === 'system');
        const response = await fetch(`${this.baseUrl}/text/chatcompletion?GroupId=${this.groupId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: minimaxMessages,
                prompt: systemMessage?.content || '',
                temperature: options?.temperature ?? 0.7,
                tokens_to_generate: options?.maxTokens ?? 4000,
                stream: true
            })
        });
        if (!response.ok) {
            throw new Error(`Minimax API error: ${response.status}`);
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
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                }
                catch {
                    // Ignore parse errors
                }
            }
        }
    }
}
exports.MinimaxClient = MinimaxClient;
//# sourceMappingURL=minimax-client.js.map