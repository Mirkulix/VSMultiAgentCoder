/**
 * CodeTeam AI - Project Memory
 * Shared context and memory for all agents
 */
import * as vscode from 'vscode';
import { Message, ArchitecturalDecision, ProjectConstraint, CodebaseContext, AgentType } from '../types';
export declare class ProjectMemory {
    private context;
    private conversationHistory;
    private decisions;
    private constraints;
    private codebaseContext;
    constructor(context: vscode.ExtensionContext);
    addMessage(message: Message): void;
    getConversationHistory(limit?: number): Message[];
    getContextForAgent(agentType: AgentType): Message[];
    clearConversation(): void;
    addDecision(decision: Omit<ArchitecturalDecision, 'id' | 'timestamp'>): void;
    getDecisions(): ArchitecturalDecision[];
    getDecisionsSummary(): string;
    addConstraint(constraint: ProjectConstraint): void;
    getConstraints(): ProjectConstraint[];
    getEnforcedConstraints(): string[];
    analyzeCodebase(): Promise<CodebaseContext>;
    getCodebaseContext(): CodebaseContext | null;
    getCodebaseSummary(): string;
    getFullContext(): string;
    private saveToStorage;
    private loadFromStorage;
    resetAll(): void;
}
//# sourceMappingURL=memory.d.ts.map