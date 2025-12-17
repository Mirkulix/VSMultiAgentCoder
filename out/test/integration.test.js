"use strict";
/**
 * CodeTeam AI Ultra - Integration Tests
 * Tests for component integration
 */
// Test LLM Client Factory structure
console.log('🔧 Integration Tests\n');
let passed = 0;
let failed = 0;
function test(name, fn) {
    try {
        if (fn()) {
            console.log(`✅ ${name}`);
            passed++;
        }
        else {
            console.log(`❌ ${name}: Assertion failed`);
            failed++;
        }
    }
    catch (error) {
        console.log(`❌ ${name}: ${error}`);
        failed++;
    }
}
// Test: All LLM client files exist (check exports compile)
test('OpenAI Client exports properly', () => {
    const { OpenAIClient } = require('../llm/openai-client');
    return typeof OpenAIClient === 'function';
});
test('Anthropic Client exports properly', () => {
    const { AnthropicClient } = require('../llm/anthropic-client');
    return typeof AnthropicClient === 'function';
});
test('Gemini Client exports properly', () => {
    const { GeminiClient } = require('../llm/gemini-client');
    return typeof GeminiClient === 'function';
});
test('Groq Client exports properly', () => {
    const { GroqClient } = require('../llm/groq-client');
    return typeof GroqClient === 'function';
});
test('DeepSeek Client exports properly', () => {
    const { DeepSeekClient } = require('../llm/deepseek-client');
    return typeof DeepSeekClient === 'function';
});
test('Kimi Client exports properly', () => {
    const { KimiClient } = require('../llm/kimi-client');
    return typeof KimiClient === 'function';
});
test('Minimax Client exports properly', () => {
    const { MinimaxClient } = require('../llm/minimax-client');
    return typeof MinimaxClient === 'function';
});
test('Ollama Client exports properly', () => {
    const { OllamaClient } = require('../llm/ollama-client');
    return typeof OllamaClient === 'function';
});
test('LLM Factory exports properly', () => {
    const { LLMClientFactory } = require('../llm/factory');
    return typeof LLMClientFactory === 'function' &&
        typeof LLMClientFactory.getAvailableProviders === 'function';
});
// Test: All Agent files export properly
test('CoderAgent exports properly', () => {
    const { CoderAgent } = require('../agents/coder-agent');
    return typeof CoderAgent === 'function';
});
test('ReviewerAgent exports properly', () => {
    const { ReviewerAgent } = require('../agents/reviewer-agent');
    return typeof ReviewerAgent === 'function';
});
test('TesterAgent exports properly', () => {
    const { TesterAgent } = require('../agents/tester-agent');
    return typeof TesterAgent === 'function';
});
test('DocsAgent exports properly', () => {
    const { DocsAgent } = require('../agents/docs-agent');
    return typeof DocsAgent === 'function';
});
test('ArchitectAgent exports properly', () => {
    const { ArchitectAgent } = require('../agents/architect-agent');
    return typeof ArchitectAgent === 'function';
});
test('ProductManagerAgent exports properly', () => {
    const { ProductManagerAgent } = require('../agents/product-manager-agent');
    return typeof ProductManagerAgent === 'function';
});
test('UXDesignerAgent exports properly', () => {
    const { UXDesignerAgent } = require('../agents/ux-designer-agent');
    return typeof UXDesignerAgent === 'function';
});
test('SecurityAgent exports properly', () => {
    const { SecurityAgent } = require('../agents/security-agent');
    return typeof SecurityAgent === 'function';
});
test('DevOpsAgent exports properly', () => {
    const { DevOpsAgent } = require('../agents/devops-agent');
    return typeof DevOpsAgent === 'function';
});
// Test: Orchestrator exports
test('Orchestrator exports properly', () => {
    const { Orchestrator } = require('../orchestrator/router');
    return typeof Orchestrator === 'function';
});
test('ProjectMemory exports properly', () => {
    const { ProjectMemory } = require('../orchestrator/memory');
    return typeof ProjectMemory === 'function';
});
// Test: Config exports
test('TeamConfigManager exports properly', () => {
    const { TeamConfigManager, DEFAULT_TEAM_CONFIG } = require('../config/team-config');
    return typeof TeamConfigManager === 'function' &&
        Array.isArray(DEFAULT_TEAM_CONFIG) &&
        DEFAULT_TEAM_CONFIG.length === 9;
});
// Test: Build Runner exports
test('BuildRunner exports properly', () => {
    const { BuildRunner } = require('../build/runner');
    return typeof BuildRunner === 'function';
});
// Summary
console.log(`\n📊 Integration Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
//# sourceMappingURL=integration.test.js.map