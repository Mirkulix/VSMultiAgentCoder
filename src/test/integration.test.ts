/**
 * CodeTeam AI Ultra - Integration Tests
 * Tests for component integration
 */

// Test LLM Client Factory structure
console.log('🔧 Integration Tests\n');

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => boolean): void {
    try {
        if (fn()) {
            console.log(`✅ ${name}`);
            passed++;
        } else {
            console.log(`❌ ${name}: Assertion failed`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ ${name}: ${error}`);
        failed++;
    }
}

// Test: All LLM client files exist (check exports compile)
runTest('OpenAI Client exports properly', () => {
    const { OpenAIClient } = require('../llm/openai-client');
    return typeof OpenAIClient === 'function';
});

runTest('Anthropic Client exports properly', () => {
    const { AnthropicClient } = require('../llm/anthropic-client');
    return typeof AnthropicClient === 'function';
});

runTest('Gemini Client exports properly', () => {
    const { GeminiClient } = require('../llm/gemini-client');
    return typeof GeminiClient === 'function';
});

runTest('Groq Client exports properly', () => {
    const { GroqClient } = require('../llm/groq-client');
    return typeof GroqClient === 'function';
});

runTest('DeepSeek Client exports properly', () => {
    const { DeepSeekClient } = require('../llm/deepseek-client');
    return typeof DeepSeekClient === 'function';
});

runTest('Kimi Client exports properly', () => {
    const { KimiClient } = require('../llm/kimi-client');
    return typeof KimiClient === 'function';
});

runTest('Minimax Client exports properly', () => {
    const { MinimaxClient } = require('../llm/minimax-client');
    return typeof MinimaxClient === 'function';
});

runTest('Ollama Client exports properly', () => {
    const { OllamaClient } = require('../llm/ollama-client');
    return typeof OllamaClient === 'function';
});

runTest('LLM Factory exports properly', () => {
    const { LLMClientFactory } = require('../llm/factory');
    return typeof LLMClientFactory === 'function' &&
        typeof LLMClientFactory.getAvailableProviders === 'function';
});

// Test: All Agent files export properly
runTest('CoderAgent exports properly', () => {
    const { CoderAgent } = require('../agents/coder-agent');
    return typeof CoderAgent === 'function';
});

runTest('ReviewerAgent exports properly', () => {
    const { ReviewerAgent } = require('../agents/reviewer-agent');
    return typeof ReviewerAgent === 'function';
});

runTest('TesterAgent exports properly', () => {
    const { TesterAgent } = require('../agents/tester-agent');
    return typeof TesterAgent === 'function';
});

runTest('DocsAgent exports properly', () => {
    const { DocsAgent } = require('../agents/docs-agent');
    return typeof DocsAgent === 'function';
});

runTest('ArchitectAgent exports properly', () => {
    const { ArchitectAgent } = require('../agents/architect-agent');
    return typeof ArchitectAgent === 'function';
});

runTest('ProductManagerAgent exports properly', () => {
    const { ProductManagerAgent } = require('../agents/product-manager-agent');
    return typeof ProductManagerAgent === 'function';
});

runTest('UXDesignerAgent exports properly', () => {
    const { UXDesignerAgent } = require('../agents/ux-designer-agent');
    return typeof UXDesignerAgent === 'function';
});

runTest('SecurityAgent exports properly', () => {
    const { SecurityAgent } = require('../agents/security-agent');
    return typeof SecurityAgent === 'function';
});

runTest('DevOpsAgent exports properly', () => {
    const { DevOpsAgent } = require('../agents/devops-agent');
    return typeof DevOpsAgent === 'function';
});

// Test: Orchestrator exports
runTest('Orchestrator exports properly', () => {
    const { Orchestrator } = require('../orchestrator/router');
    return typeof Orchestrator === 'function';
});

runTest('ProjectMemory exports properly', () => {
    const { ProjectMemory } = require('../orchestrator/memory');
    return typeof ProjectMemory === 'function';
});

// Test: Config exports
runTest('TeamConfigManager exports properly', () => {
    const { TeamConfigManager, DEFAULT_TEAM_CONFIG } = require('../config/team-config');
    return typeof TeamConfigManager === 'function' &&
        Array.isArray(DEFAULT_TEAM_CONFIG) &&
        DEFAULT_TEAM_CONFIG.length === 9;
});

// Test: Build Runner exports
runTest('BuildRunner exports properly', () => {
    const { BuildRunner } = require('../build/runner');
    return typeof BuildRunner === 'function';
});

// Summary
console.log(`\n📊 Integration Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
