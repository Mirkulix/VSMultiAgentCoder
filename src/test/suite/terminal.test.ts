import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';

suite('Terminal Tool Test Suite', () => {
    test('run_command should execute shell command', async () => {
        if (!vscode.workspace.workspaceFolders) {
            console.log('Skipping terminal tests - no workspace');
            return;
        }

        const registry = new ToolRegistry();

        // Run a simple echo
        const result = await registry.executeTool('run_command', {
            command: 'echo "Hello Terminal"'
        });

        assert.ok(!result.error, 'Command failed: ' + result.error);
        assert.strictEqual(result.stdout, 'Hello Terminal');
    });
});
