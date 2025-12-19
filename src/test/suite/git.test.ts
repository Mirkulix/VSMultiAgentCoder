import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';

suite('Git Tool Test Suite', () => {
    test('Git tools should be registered', () => {
        const registry = new ToolRegistry();
        assert.ok(registry.getTool('git_status'));
        assert.ok(registry.getTool('git_diff'));
        assert.ok(registry.getTool('git_commit'));
        assert.ok(registry.getTool('git_log'));
    });
});
