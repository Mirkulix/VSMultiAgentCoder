import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';

suite('Diagnostics Tool Test Suite', () => {
    test('get_diagnostics should return object', async () => {
        const registry = new ToolRegistry();

        const result = await registry.executeTool('get_diagnostics', {});

        // Even if empty, it should return a structure
        assert.ok(result);
        if (result.issues) {
            assert.ok(Array.isArray(result.issues));
        } else {
            assert.ok(result.message);
        }
    });
});
