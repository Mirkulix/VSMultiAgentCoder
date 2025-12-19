import * as vscode from 'vscode';
import { Tool } from '../types';

/**
 * A lightweight semantic search tool using Keyword Extraction and Scoring (TF-IDF inspired).
 * Real vector embeddings are too heavy for this environment without external services.
 */
export const semanticSearchTool: Tool = {
    name: 'semantic_search',
    description: 'Smart search that finds relevant files based on concept keywords rather than exact matches. Use this to understand "how auth works" or "where user data is stored".',
    parameters: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'The concept or question to search for (e.g. "authentication logic", "user database schema")'
            },
            limit: {
                type: 'number',
                description: 'Max number of results (default: 10)'
            }
        },
        required: ['query']
    },
    execute: async (args: { query: string, limit?: number }) => {
        try {
            const limit = args.limit || 10;
            const keywords = args.query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

            if (keywords.length === 0) {
                 return { error: 'Query too short. Please provide meaningful keywords.' };
            }

            // Find all potential files (excluding node_modules, etc.)
            // We use a broader pattern here to get candidate files
            const uris = await vscode.workspace.findFiles('**/*.{ts,js,py,java,go,rs,md,json}', '**/node_modules/**', 200);

            const scores: { file: string, score: number, snippets: string[] }[] = [];

            // Simple scoring:
            // +10 for filename match
            // +1 per keyword occurrence in content
            // Capped at 50 occurrences to speed up

            for (const uri of uris) {
                const relativePath = vscode.workspace.asRelativePath(uri);
                let score = 0;

                // Filename scoring
                keywords.forEach(k => {
                    if (relativePath.toLowerCase().includes(k)) score += 10;
                });

                // Content scoring (read file)
                try {
                    const doc = await vscode.workspace.openTextDocument(uri);
                    const text = doc.getText();
                    const lowerText = text.toLowerCase();
                    const snippets: string[] = [];

                    keywords.forEach(k => {
                        let count = 0;
                        let pos = lowerText.indexOf(k);
                        while (pos !== -1 && count < 5) { // Cap at 5 matches per keyword per file for snippet extraction
                            count++;
                            score += 1;

                            // Extract snippet
                            const start = Math.max(0, pos - 40);
                            const end = Math.min(lowerText.length, pos + k.length + 40);
                            snippets.push('...' + text.slice(start, end).replace(/\n/g, ' ') + '...');

                            pos = lowerText.indexOf(k, pos + 1);
                        }
                    });

                    if (score > 0) {
                        scores.push({
                            file: relativePath,
                            score,
                            snippets: snippets.slice(0, 3) // Return top 3 snippets
                        });
                    }

                } catch (e) {
                    // Ignore read errors
                }
            }

            // Sort by score desc
            scores.sort((a, b) => b.score - a.score);

            const topResults = scores.slice(0, limit);

            if (topResults.length === 0) {
                return { found: false, message: 'No relevant files found for keywords: ' + keywords.join(', ') };
            }

            return {
                found: true,
                count: topResults.length,
                results: topResults
            };

        } catch (error: any) {
            return { error: `Semantic search failed: ${error.message}` };
        }
    }
};
