import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';

suite('Navigation Tool Test Suite', () => {
    test('Tools should exist', () => {
        const registry = new ToolRegistry();
        assert.ok(registry.getTool('get_definition'));
        assert.ok(registry.getTool('find_references'));
        assert.ok(registry.getTool('get_symbols'));
    });
});
