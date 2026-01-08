import * as vscode from 'vscode';
import { Tool } from '../types';

export const readWebsiteTool: Tool = {
    name: 'read_website',
    description: 'Fetches content from a URL and returns it as text. Useful for reading documentation or external resources.',
    parameters: {
        type: 'object',
        properties: {
            url: {
                type: 'string',
                description: 'The URL to fetch'
            }
        },
        required: ['url']
    },
    execute: async (args: { url: string }) => {
        try {
            // In a real VS Code extension, we might use a library like 'node-fetch' or 'axios'.
            // However, VS Code environment provides 'fetch' globally in recent versions (Node 18+),
            // or we can use the 'https' module.
            // Let's use the built-in global fetch if available, or fallback to a simple https get.

            // Note: Since we are in an extension, we might not want to depend on external npm packages
            // if we can avoid it to keep bundle size small and dependencies simple.
            // But 'undici' or 'node-fetch' is often needed.
            // For now, let's assume we can use the global fetch (Node 18+).

            // Safety check
            if (!args.url.startsWith('http')) {
                return { error: 'Invalid URL. Must start with http:// or https://' };
            }

            const response = await fetch(args.url);
            if (!response.ok) {
                return { error: `Failed to fetch URL: ${response.status} ${response.statusText}` };
            }

            const text = await response.text();

            // Simple HTML to text conversion (naive)
            // In production, use 'cheerio' or 'jsdom' or 'html-to-text'
            // Here we just strip tags for a basic version
            const plainText = text
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "") // Remove scripts
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")   // Remove styles
                .replace(/<[^>]+>/g, "\n")                             // Replace tags with newline
                .replace(/\n\s*\n/g, "\n")                             // Collapse newlines
                .trim();

            return {
                url: args.url,
                content: plainText.slice(0, 10000) // Limit to 10k chars to avoid context bloat
            };

        } catch (error: any) {
            return { error: `Failed to read website: ${error.message}` };
        }
    }
};
