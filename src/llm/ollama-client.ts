/**
 * CodeTeam AI - Ollama Client
 * LLM Client implementation for local Ollama
 */
import { LLMClient, Message, ChatOptions } from '../types';

interface OllamaResponse {
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

export class OllamaClient implements LLMClient {
    private endpoint: string;
    private model: string;

    constructor(endpoint: string = 'http://localhost:11434', model: string = 'codellama') {
        this.endpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
        this.model = model;
    }

    async chat(messages: Message[], options?: ChatOptions): Promise<string> {
        const response = await fetch(`${this.endpoint}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4000,
                    stop: options?.stopSequences
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as OllamaResponse;
        return data.message.content;
    }

    async *stream(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
        const response = await fetch(`${this.endpoint}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                stream: true,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4000,
                    stop: options?.stopSequences
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
                try {
                    const data = JSON.parse(line) as OllamaResponse;
                    if (data.message?.content) {
                        yield data.message.content;
                    }
                } catch {
                    // Ignore JSON parse errors for incomplete chunks
                }
            }
        }
    }
}
