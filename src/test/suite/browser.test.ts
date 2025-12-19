import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';

suite('Browser Tool Test Suite', () => {
    test('read_website should fail for invalid url', async () => {
        const registry = new ToolRegistry();
        const result = await registry.executeTool('read_website', { url: 'not-a-url' });
        assert.ok(result.error);
    });

    // We can't easily test actual fetch without network and potentially slow tests,
    // but we can verify the tool exists and handles basics.
});
