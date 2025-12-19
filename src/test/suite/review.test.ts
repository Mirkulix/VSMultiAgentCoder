import * as assert from 'assert';
import * as vscode from 'vscode';
import { ReviewManager } from '../../ui/review-manager';
import { DiffContentProvider } from '../../ui/diff-provider';

suite('Review Manager Test Suite', () => {
    test('ReviewManager should register commands', () => {
        // Mock context (partial)
        const context = {
            subscriptions: []
        } as any;

        const provider = new DiffContentProvider();
        const manager = new ReviewManager(context, provider);

        assert.ok(manager);
        assert.strictEqual(context.subscriptions.length, 2, 'Should register 2 commands');
    });
});
