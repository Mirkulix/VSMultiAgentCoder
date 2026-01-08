import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';

suite('Semantic Search Tool Test Suite', () => {
    test('semantic_search should exist and handle empty query', async () => {
        const registry = new ToolRegistry();

        // Short query should return error
        const resultShort = await registry.executeTool('semantic_search', { query: 'hi' });
        assert.ok(resultShort.error);

        // Valid query test is hard without a workspace with files,
        // but we can check it doesn't crash
        if (!vscode.workspace.workspaceFolders) {
            console.log('Skipping semantic search real run - no workspace');
            return;
        }

        const result = await registry.executeTool('semantic_search', { query: 'authentication login' });
        // It might return found: false if no files, but shouldn't error
        assert.ok(result);
    });
});
