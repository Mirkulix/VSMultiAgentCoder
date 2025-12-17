/**
 * CodeTeam AI - Project Memory
 * Shared context and memory for all agents
 */
import * as vscode from 'vscode';
import {
    Message,
    ArchitecturalDecision,
    ProjectConstraint,
    CodebaseContext,
    AgentType
} from '../types';

export class ProjectMemory {
    private context: vscode.ExtensionContext;
    private conversationHistory: Message[] = [];
    private decisions: ArchitecturalDecision[] = [];
    private constraints: ProjectConstraint[] = [];
    private codebaseContext: CodebaseContext | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadFromStorage();
    }

    // ==========================================
    // Conversation History
    // ==========================================

    addMessage(message: Message): void {
        this.conversationHistory.push(message);

        // Keep only last 50 messages to prevent memory bloat
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }

        this.saveToStorage();
    }

    getConversationHistory(limit?: number): Message[] {
        if (limit) {
            return this.conversationHistory.slice(-limit);
        }
        return [...this.conversationHistory];
    }

    getContextForAgent(agentType: AgentType): Message[] {
        // Filter relevant messages for the agent
        return this.conversationHistory.filter(msg =>
            msg.agentId === agentType ||
            msg.role === 'user' ||
            msg.agentId === 'orchestrator'
        );
    }

    clearConversation(): void {
        this.conversationHistory = [];
        this.saveToStorage();
    }

    // ==========================================
    // Architectural Decisions
    // ==========================================

    addDecision(decision: Omit<ArchitecturalDecision, 'id' | 'timestamp'>): void {
        const fullDecision: ArchitecturalDecision = {
            ...decision,
            id: crypto.randomUUID(),
            timestamp: new Date()
        };

        this.decisions.push(fullDecision);
        this.saveToStorage();
    }

    getDecisions(): ArchitecturalDecision[] {
        return [...this.decisions];
    }

    getDecisionsSummary(): string {
        if (this.decisions.length === 0) {
            return 'No architectural decisions recorded yet.';
        }

        return this.decisions
            .map(d => `- **${d.title}**: ${d.description}`)
            .join('\n');
    }

    // ==========================================
    // Project Constraints
    // ==========================================

    addConstraint(constraint: ProjectConstraint): void {
        this.constraints.push(constraint);
        this.saveToStorage();
    }

    getConstraints(): ProjectConstraint[] {
        return [...this.constraints];
    }

    getEnforcedConstraints(): string[] {
        return this.constraints
            .filter(c => c.enforced)
            .map(c => c.description);
    }

    // ==========================================
    // Codebase Context
    // ==========================================

    async analyzeCodebase(): Promise<CodebaseContext> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return { languages: [], frameworks: [] };
        }

        const root = workspaceFolders[0].uri;
        const context: CodebaseContext = {
            languages: [],
            frameworks: [],
            buildSystem: undefined,
            testFramework: undefined,
            fileStructure: []
        };

        // Detect package.json for Node.js projects
        try {
            const packageJsonUri = vscode.Uri.joinPath(root, 'package.json');
            const packageJson = await vscode.workspace.fs.readFile(packageJsonUri);
            const pkg = JSON.parse(packageJson.toString());

            context.buildSystem = 'npm';
            context.languages.push('javascript', 'typescript');

            // Detect frameworks
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            if (deps['react']) context.frameworks.push('react');
            if (deps['vue']) context.frameworks.push('vue');
            if (deps['@angular/core']) context.frameworks.push('angular');
            if (deps['express']) context.frameworks.push('express');
            if (deps['next']) context.frameworks.push('next.js');

            // Detect test framework
            if (deps['jest']) context.testFramework = 'jest';
            if (deps['mocha']) context.testFramework = 'mocha';
            if (deps['vitest']) context.testFramework = 'vitest';
        } catch {
            // No package.json
        }

        // Detect Cargo.toml for Rust projects
        try {
            const cargoUri = vscode.Uri.joinPath(root, 'Cargo.toml');
            await vscode.workspace.fs.stat(cargoUri);
            context.buildSystem = 'cargo';
            context.languages.push('rust');
        } catch {
            // No Cargo.toml
        }

        // Detect build.gradle for Java/Kotlin projects
        try {
            const gradleUri = vscode.Uri.joinPath(root, 'build.gradle');
            await vscode.workspace.fs.stat(gradleUri);
            context.buildSystem = 'gradle';
            context.languages.push('java', 'kotlin');
        } catch {
            // No build.gradle
        }

        // Detect pom.xml for Maven projects
        try {
            const pomUri = vscode.Uri.joinPath(root, 'pom.xml');
            await vscode.workspace.fs.stat(pomUri);
            context.buildSystem = 'maven';
            context.languages.push('java');
        } catch {
            // No pom.xml
        }

        this.codebaseContext = context;
        this.saveToStorage();

        return context;
    }

    getCodebaseContext(): CodebaseContext | null {
        return this.codebaseContext;
    }

    getCodebaseSummary(): string {
        if (!this.codebaseContext) {
            return 'Codebase not analyzed yet.';
        }

        const ctx = this.codebaseContext;
        const parts: string[] = [];

        if (ctx.languages.length > 0) {
            parts.push(`Languages: ${ctx.languages.join(', ')}`);
        }
        if (ctx.frameworks.length > 0) {
            parts.push(`Frameworks: ${ctx.frameworks.join(', ')}`);
        }
        if (ctx.buildSystem) {
            parts.push(`Build System: ${ctx.buildSystem}`);
        }
        if (ctx.testFramework) {
            parts.push(`Test Framework: ${ctx.testFramework}`);
        }

        return parts.join('\n') || 'No codebase information available.';
    }

    // ==========================================
    // Full Context for LLM
    // ==========================================

    getFullContext(): string {
        const parts: string[] = [];

        // Codebase info
        const codebaseSummary = this.getCodebaseSummary();
        if (codebaseSummary !== 'Codebase not analyzed yet.') {
            parts.push(`## Project Context\n${codebaseSummary}`);
        }

        // Constraints
        const constraints = this.getEnforcedConstraints();
        if (constraints.length > 0) {
            parts.push(`## Constraints\n${constraints.map(c => `- ${c}`).join('\n')}`);
        }

        // Decisions
        const decisions = this.getDecisionsSummary();
        if (decisions !== 'No architectural decisions recorded yet.') {
            parts.push(`## Architectural Decisions\n${decisions}`);
        }

        return parts.join('\n\n');
    }

    // ==========================================
    // Storage
    // ==========================================

    private saveToStorage(): void {
        this.context.globalState.update('codeteam.conversationHistory', this.conversationHistory);
        this.context.globalState.update('codeteam.decisions', this.decisions);
        this.context.globalState.update('codeteam.constraints', this.constraints);
        this.context.globalState.update('codeteam.codebaseContext', this.codebaseContext);
    }

    private loadFromStorage(): void {
        this.conversationHistory = this.context.globalState.get('codeteam.conversationHistory', []);
        this.decisions = this.context.globalState.get('codeteam.decisions', []);
        this.constraints = this.context.globalState.get('codeteam.constraints', []);
        this.codebaseContext = this.context.globalState.get('codeteam.codebaseContext', null);
    }

    resetAll(): void {
        this.conversationHistory = [];
        this.decisions = [];
        this.constraints = [];
        this.codebaseContext = null;
        this.saveToStorage();
    }
}
