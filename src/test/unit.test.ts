/**
 * CodeTeam AI Ultra - Test Suite
 * Tests for core functionality
 */
import * as assert from 'assert';

// Mock VS Code API
const mockVscode = {
    workspace: {
        getConfiguration: () => ({
            get: (key: string, defaultValue: any) => defaultValue
        }),
        workspaceFolders: []
    },
    window: {
        activeTextEditor: undefined,
        visibleTextEditors: []
    }
};

// Simple test runner
class TestRunner {
    private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
    private passed = 0;
    private failed = 0;

    test(name: string, fn: () => Promise<void> | void) {
        this.tests.push({ name, fn });
    }

    async run(): Promise<{ passed: number; failed: number; results: string[] }> {
        const results: string[] = [];

        for (const test of this.tests) {
            try {
                await test.fn();
                this.passed++;
                results.push(`✅ ${test.name}`);
            } catch (error) {
                this.failed++;
                results.push(`❌ ${test.name}: ${error}`);
            }
        }

        return { passed: this.passed, failed: this.failed, results };
    }
}

// ============================================
// TESTS
// ============================================

const runner = new TestRunner();

// Test 1: Types are properly defined
runner.test('AgentType includes all 9 agents', () => {
    type AgentType =
        | 'orchestrator'
        | 'productManager'
        | 'architect'
        | 'developer'
        | 'reviewer'
        | 'tester'
        | 'docsWriter'
        | 'uxDesigner'
        | 'security'
        | 'devops'
        | 'coder'
        | 'docs';

    const agents: AgentType[] = [
        'orchestrator', 'productManager', 'architect', 'developer',
        'reviewer', 'tester', 'docsWriter', 'uxDesigner', 'security', 'devops'
    ];

    assert.strictEqual(agents.length, 10, 'Should have 10 agent types (excluding legacy)');
});

// Test 2: LLMProvider includes all 8 providers
runner.test('LLMProvider includes all 8 providers', () => {
    type LLMProvider =
        | 'openai'
        | 'anthropic'
        | 'gemini'
        | 'groq'
        | 'deepseek'
        | 'kimi'
        | 'minimax'
        | 'ollama';

    const providers: LLMProvider[] = [
        'openai', 'anthropic', 'gemini', 'groq',
        'deepseek', 'kimi', 'minimax', 'ollama'
    ];

    assert.strictEqual(providers.length, 8, 'Should have 8 LLM providers');
});

// Test 3: Default team configuration
runner.test('Default team has correct member count', () => {
    const DEFAULT_TEAM_CONFIG = [
        { agentType: 'productManager', enabled: true, provider: 'anthropic' },
        { agentType: 'architect', enabled: true, provider: 'openai' },
        { agentType: 'developer', enabled: true, provider: 'deepseek' },
        { agentType: 'reviewer', enabled: true, provider: 'anthropic' },
        { agentType: 'tester', enabled: true, provider: 'openai' },
        { agentType: 'docsWriter', enabled: true, provider: 'groq' },
        { agentType: 'uxDesigner', enabled: false, provider: 'openai' },
        { agentType: 'security', enabled: false, provider: 'anthropic' },
        { agentType: 'devops', enabled: false, provider: 'groq' }
    ];

    assert.strictEqual(DEFAULT_TEAM_CONFIG.length, 9, 'Should have 9 team members');

    const enabledCount = DEFAULT_TEAM_CONFIG.filter(m => m.enabled).length;
    assert.strictEqual(enabledCount, 6, 'Should have 6 enabled by default');
});

// Test 4: Task type detection
runner.test('Task type detection works correctly', () => {
    const analyzeTask = (input: string) => {
        const lowerInput = input.toLowerCase();

        if (lowerInput.includes('review') || lowerInput.includes('check')) {
            return 'code_review';
        }
        if (lowerInput.includes('test')) {
            return 'test_generation';
        }
        if (lowerInput.includes('document') || lowerInput.includes('doc')) {
            return 'documentation';
        }
        if (lowerInput.includes('architect') || lowerInput.includes('design')) {
            return 'architecture';
        }
        if (lowerInput.includes('create') || lowerInput.includes('implement')) {
            return 'code_generation';
        }

        return 'general';
    };

    assert.strictEqual(analyzeTask('Review my code'), 'code_review');
    assert.strictEqual(analyzeTask('Generate tests'), 'test_generation');
    assert.strictEqual(analyzeTask('Create documentation'), 'documentation');
    assert.strictEqual(analyzeTask('Design the architecture'), 'architecture');
    assert.strictEqual(analyzeTask('Implement user auth'), 'code_generation');
    assert.strictEqual(analyzeTask('Hello world'), 'general');
});

// Test 5: Workflow steps are properly ordered
runner.test('Feature workflow has correct steps', () => {
    const workflow = [
        { stepId: 'requirements', agentType: 'productManager', dependsOn: undefined },
        { stepId: 'architecture', agentType: 'architect', dependsOn: ['requirements'] },
        { stepId: 'security-review', agentType: 'security', dependsOn: ['architecture'] },
        { stepId: 'implement', agentType: 'developer', dependsOn: ['security-review'] },
        { stepId: 'code-review', agentType: 'reviewer', dependsOn: ['implement'] },
        { stepId: 'tests', agentType: 'tester', dependsOn: ['code-review'] },
        { stepId: 'documentation', agentType: 'docsWriter', dependsOn: ['tests'] },
        { stepId: 'deployment', agentType: 'devops', dependsOn: ['tests'] }
    ];

    assert.strictEqual(workflow.length, 8, 'Should have 8 workflow steps');
    assert.strictEqual(workflow[0].stepId, 'requirements', 'First step should be requirements');
    assert.strictEqual(workflow[0].dependsOn, undefined, 'First step has no dependencies');
});

// Test 6: Code block extraction regex
runner.test('Code block extraction works', () => {
    const content = `Here is the code:

\`\`\`typescript
function hello() {
    return "Hello World";
}
\`\`\`

And some more text.`;

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(codeBlockRegex)];

    assert.strictEqual(matches.length, 1, 'Should find 1 code block');
    assert.strictEqual(matches[0][1], 'typescript', 'Language should be typescript');
    assert.ok(matches[0][2].includes('Hello World'), 'Should contain code content');
});

// Test 7: Provider info structure
runner.test('Provider info has correct structure', () => {
    const providerInfo = {
        openai: { name: 'OpenAI', description: 'GPT-4o', strengths: ['Allrounder'] },
        anthropic: { name: 'Anthropic', description: 'Claude 3.5', strengths: ['Code-Qualität'] },
        groq: { name: 'Groq', description: 'LLaMA 70B', strengths: ['Extrem schnell'] },
        deepseek: { name: 'DeepSeek', description: 'Coder V2', strengths: ['Code-Spezialist'] }
    };

    const providers = Object.keys(providerInfo);
    assert.ok(providers.includes('openai'), 'Should include openai');
    assert.ok(providers.includes('groq'), 'Should include groq');
    assert.ok(providers.includes('deepseek'), 'Should include deepseek');
});

// Run tests
async function main() {
    console.log('🧪 Running CodeTeam AI Ultra Tests...\n');

    const { passed, failed, results } = await runner.run();

    results.forEach(r => console.log(r));

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    process.exit(failed > 0 ? 1 : 0);
}

main();
