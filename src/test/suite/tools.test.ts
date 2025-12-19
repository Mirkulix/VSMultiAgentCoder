import * as assert from 'assert';
import * as vscode from 'vscode';
import { ToolRegistry } from '../../tools/registry';
// import { readFileTool, writeFileTool } from '../../tools/file-system';

// We use the 'test' function from integration.test.ts if we want to run it that way,
// but since we are in the suite folder, it expects mocha/vscode-test runner.
// The errors before were because I was mixing custom 'test' function from integration.test.ts
// with mocha's global 'test' or 'suite'.
// The integration.test.ts defines a global 'test' which conflicts with mocha types.
// I will rename the custom test function in integration.test.ts later or just use mocha here correctly.
// But integration.test.ts is not using mocha, it is a standalone script it seems.
// Let's stick to mocha here as it is the standard for VS Code extensions.

suite('Tool Registry Test Suite', () => {
    vscode.window.showInformationMessage('Start Tool Tests.');

    test('Tool Registry should register default tools', () => {
        const registry = new ToolRegistry();
        const tools = registry.getAllTools();

        assert.ok(tools.find(t => t.name === 'read_file'));
        assert.ok(tools.find(t => t.name === 'write_file'));
        assert.ok(tools.find(t => t.name === 'list_files'));
        assert.ok(tools.find(t => t.name === 'search_files'));
    });

    test('Read/Write file tool should work', async () => {
        // This test requires a workspace. Since we might not have one in unit tests easily without setup,
        // we will mock vscode.workspace.fs if possible, or just skip if no workspace.

        if (!vscode.workspace.workspaceFolders) {
            console.log('Skipping file system tests - no workspace');
            return;
        }

        const registry = new ToolRegistry();

        // Write a test file
        const testPath = 'test_tool_output.txt';
        const testContent = 'Hello Tool World';

        const writeResult = await registry.executeTool('write_file', {
            path: testPath,
            content: testContent
        });

        assert.ok(writeResult.success, 'Write failed: ' + writeResult.error);

        // Read it back
        const readResult = await registry.executeTool('read_file', {
            path: testPath
        });

        assert.strictEqual(readResult.content, testContent);
    });
});
