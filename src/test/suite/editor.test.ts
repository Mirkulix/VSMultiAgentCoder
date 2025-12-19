import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';

suite('Editor Tool Test Suite', () => {
    test('edit_file should exist', () => {
        const registry = new ToolRegistry();
        assert.ok(registry.getTool('edit_file'));
    });
});
