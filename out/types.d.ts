/**
 * CodeTeam AI - Multi-Agent Types
 * Type definitions for the multi-agent system
 */
export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    agentId?: AgentType;
}
export interface ChatOptions {
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
}
export type AgentType = 'orchestrator' | 'productManager' | 'architect' | 'developer' | 'reviewer' | 'tester' | 'docsWriter' | 'uxDesigner' | 'security' | 'devops' | 'coder' | 'docs';
export interface AgentResponse {
    agentType: AgentType;
    content: string;
    success: boolean;
    codeBlocks?: CodeBlock[];
    suggestions?: string[];
    nextAgent?: AgentType;
    metadata?: Record<string, unknown>;
}
export interface CodeBlock {
    language: string;
    code: string;
    filename?: string;
    startLine?: number;
    endLine?: number;
}
export type TaskType = 'code_generation' | 'code_review' | 'test_generation' | 'documentation' | 'architecture' | 'refactoring' | 'debugging' | 'explanation' | 'general';
export interface Task {
    id: string;
    type: TaskType;
    input: string;
    context?: TaskContext;
    priority?: 'low' | 'normal' | 'high';
    createdAt: Date;
}
export interface TaskContext {
    currentFile?: string;
    selectedCode?: string;
    openFiles?: string[];
    projectRoot?: string;
    language?: string;
    framework?: string;
}
export interface ComplexTask extends Task {
    subtasks: Task[];
    workflow: WorkflowStep[];
}
export interface WorkflowStep {
    stepId: string;
    agentType: AgentType;
    action: string;
    dependsOn?: string[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: AgentResponse;
}
export interface WorkflowResult {
    taskId: string;
    success: boolean;
    steps: WorkflowStep[];
    finalOutput: string;
    duration: number;
}
export interface ProjectMemory {
    projectRoot: string;
    conversationHistory: Message[];
    decisions: ArchitecturalDecision[];
    constraints: ProjectConstraint[];
    codebaseContext: CodebaseContext;
}
export interface ArchitecturalDecision {
    id: string;
    title: string;
    description: string;
    rationale: string;
    timestamp: Date;
    agentType: AgentType;
}
export interface ProjectConstraint {
    type: 'tech_stack' | 'pattern' | 'style' | 'security' | 'performance';
    description: string;
    enforced: boolean;
}
export interface CodebaseContext {
    languages: string[];
    frameworks: string[];
    buildSystem?: string;
    testFramework?: string;
    fileStructure?: string[];
}
export type BuildSystem = 'npm' | 'yarn' | 'pnpm' | 'cargo' | 'gradle' | 'maven' | 'dotnet' | 'make' | 'unknown';
export interface BuildResult {
    success: boolean;
    output: string;
    errors: string[];
    warnings: string[];
    duration: number;
}
export interface TestResult extends BuildResult {
    passed: number;
    failed: number;
    skipped: number;
    coverage?: number;
}
export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'deepseek' | 'kimi' | 'minimax' | 'ollama';
export interface LLMConfig {
    provider: LLMProvider;
    apiKey?: string;
    endpoint?: string;
    model?: string;
}
export interface LLMClient {
    chat(messages: Message[], options?: ChatOptions): Promise<string>;
    stream(messages: Message[], options?: ChatOptions): AsyncIterable<string>;
}
export interface QualityScore {
    overall: number;
    correctness: number;
    clarity: number;
    efficiency: number;
    security: number;
    issues: QualityIssue[];
}
export interface QualityIssue {
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: string;
    message: string;
    line?: number;
    suggestion?: string;
}
export interface Tool {
    name: string;
    description: string;
    parameters: Record<string, any>;
    execute: (args: any) => Promise<any>;
}
export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
}
export interface ToolResult {
    toolCallId: string;
    name: string;
    result: any;
    isError?: boolean;
}
//# sourceMappingURL=types.d.ts.map