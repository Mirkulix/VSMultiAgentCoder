/**
 * CodeTeam AI Ultra - Supervisor Agent
 * Master coordinator that orchestrates multiple agents in parallel
 */
import { Task, AgentResponse, AgentType, LLMClient, WorkflowStep } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';

export interface AgentTask {
    agentType: AgentType;
    task: string;
    dependsOn?: string[];
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: AgentResponse;
    startTime?: number;
    endTime?: number;
}

export interface SupervisorPlan {
    tasks: AgentTask[];
    parallelGroups: AgentTask[][];
    estimatedTime: number;
}

export class SupervisorAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory) {
        super(llmClient, memory, 'orchestrator');
    }

    getSystemPrompt(): string {
        return `# Supervisor Agent - Master Coordinator

Du bist der Supervisor eines Multi-Agent-Coder-Teams. Deine Aufgabe ist es, komplexe Programmieraufgaben in konkrete Teil-Aufgaben zu zerlegen und sie optimal auf spezialisierte Agenten zu verteilen.

## Dein Team

**👨‍💻 Coder/Developer Agent**
- Code-Generierung und Implementierung
- Refactoring und Bugfixes
- Kann: JavaScript, TypeScript, Python, Java, Rust, Go

**🔍 Reviewer Agent**
- Code-Review und Qualitätsanalyse
- Security-Checks
- Best Practices Validierung

**🧪 Tester Agent**
- Test-Generierung (Unit, Integration)
- Edge Cases identifizieren
- Test-Frameworks: Jest, Vitest, pytest, JUnit

**📝 Docs Agent**
- Dokumentation schreiben
- JSDoc/Docstrings
- README und API-Docs

**🏗️ Architect Agent**
- System-Design und Architektur
- Design Patterns
- Tech-Stack Entscheidungen

**👔 Product Manager Agent**
- Requirements Analysis
- User Stories
- PRD erstellen

**🎨 UX Designer Agent**
- UI/UX Design
- Component Design
- Accessibility

**🔒 Security Agent**
- Security Audit
- Vulnerability Analysis
- Security Best Practices

**⚙️ DevOps Agent**
- Deployment Config
- CI/CD Pipelines
- Docker, Kubernetes

## Deine Aufgabe

Analysiere die User-Anfrage und erstelle einen **konkreten Ausführungsplan** mit diesen Schritten:

1. **Zerlegung**: Teile die Aufgabe in kleine, konkrete Teil-Aufgaben
2. **Zuweisung**: Ordne jeden Schritt dem passenden Agent zu
3. **Abhängigkeiten**: Definiere welche Schritte parallel laufen können
4. **Reihenfolge**: Plane die optimale Ausführungsreihenfolge

## Ausgabeformat

Gib deine Antwort als JSON zurück:

\`\`\`json
{
  "analysis": "Kurze Analyse der Aufgabe",
  "tasks": [
    {
      "id": "task-1",
      "agent": "productManager",
      "action": "Konkrete Anweisung an den Agent",
      "dependsOn": [],
      "reasoning": "Warum dieser Agent und warum jetzt"
    },
    {
      "id": "task-2",
      "agent": "architect",
      "action": "Design the system architecture for...",
      "dependsOn": ["task-1"],
      "reasoning": "..."
    }
  ],
  "parallelGroups": [
    ["task-1"],
    ["task-2", "task-3"],
    ["task-4"]
  ],
  "estimatedSteps": 5
}
\`\`\`

## Wichtige Regeln

1. **Konkret**: Jede action muss eine klare, ausführbare Anweisung sein
2. **Atomar**: Ein Task = Eine klare Verantwortung
3. **Parallelisierung**: Nutze parallelGroups für unabhängige Tasks
4. **Workflow-Phasen**:
   - Planning (PM, Architect)
   - Implementation (Developer, Tester)
   - Review (Reviewer, Security)
   - Finalization (Docs, DevOps)
5. **Realistisch**: 3-8 Tasks für normale Features
6. **Robustheit**: Plane Reviews und Tests ein. Wenn ein Task fehlschlägt, versucht das System automatisch einen Fix (Auto-Fix Loop), also plane keine expliziten "If failed then fix" Tasks.

## Beispiele

**Anfrage**: "Implement user authentication"
**Dein Plan**:
- Task 1: PM erstellt Requirements
- Task 2: Security reviewed Security Requirements
- Task 3: Architect designed System
- Task 4 & 5 (parallel): Developer implementiert Backend + Frontend
- Task 6: Tester generiert Tests
- Task 7: Reviewer macht Code Review
- Task 8: Docs schreibt Dokumentation

**Anfrage**: "Fix bug in payment processing"
**Dein Plan**:
- Task 1: Developer analysiert und fixt Bug
- Task 2: Tester schreibt Regression Tests
- Task 3: Reviewer prüft Fix`;
    }

    canHandle(task: Task): boolean {
        return true; // Supervisor kann alles koordinieren
    }

    /**
     * Analyze user request and create execution plan
     */
    async createExecutionPlan(userRequest: string, context?: any): Promise<SupervisorPlan> {
        const messages = [
            {
                role: 'system' as const,
                content: this.getSystemPrompt()
            },
            {
                role: 'user' as const,
                content: `Erstelle einen Ausführungsplan für:\n\n${userRequest}\n\nKontext: ${JSON.stringify(context || {})}`
            }
        ];

        try {
            const response = await this.llmClient.chat(messages);

            // Extract JSON from response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (!jsonMatch) {
                throw new Error('No valid JSON plan found in response');
            }

            const plan = JSON.parse(jsonMatch[1]);

            // Convert to SupervisorPlan
            const tasks: AgentTask[] = plan.tasks.map((t: any) => ({
                id: t.id,
                agentType: t.agent as AgentType,
                task: t.action,
                dependsOn: t.dependsOn || [],
                status: 'pending' as const
            }));

            const parallelGroups = plan.parallelGroups.map((group: string[]) =>
                tasks.filter(t => group.includes(t.id))
            );

            return {
                tasks,
                parallelGroups,
                estimatedTime: plan.estimatedSteps * 30 // 30s per step estimate
            };
        } catch (error) {
            console.error('Failed to create execution plan:', error);

            // Fallback: Simple sequential plan
            return this.createFallbackPlan(userRequest);
        }
    }

    /**
     * Fallback plan when LLM fails
     */
    private createFallbackPlan(userRequest: string): SupervisorPlan {
        const tasks: AgentTask[] = [];

        // Analyze request to determine task type
        const lowerRequest = userRequest.toLowerCase();

        if (lowerRequest.includes('implement') || lowerRequest.includes('create') || lowerRequest.includes('build')) {
            // Feature implementation workflow
            tasks.push(
                {
                    id: 'task-1',
                    agentType: 'productManager',
                    task: `Analyze requirements for: ${userRequest}`,
                    dependsOn: [],
                    status: 'pending'
                },
                {
                    id: 'task-2',
                    agentType: 'architect',
                    task: `Design architecture for: ${userRequest}`,
                    dependsOn: ['task-1'],
                    status: 'pending'
                },
                {
                    id: 'task-3',
                    agentType: 'developer',
                    task: `Implement: ${userRequest}`,
                    dependsOn: ['task-2'],
                    status: 'pending'
                },
                {
                    id: 'task-4',
                    agentType: 'tester',
                    task: `Generate tests for: ${userRequest}`,
                    dependsOn: ['task-3'],
                    status: 'pending'
                },
                {
                    id: 'task-5',
                    agentType: 'reviewer',
                    task: `Review implementation of: ${userRequest}`,
                    dependsOn: ['task-3'],
                    status: 'pending'
                },
                {
                    id: 'task-6',
                    agentType: 'docsWriter',
                    task: `Document: ${userRequest}`,
                    dependsOn: ['task-4', 'task-5'],
                    status: 'pending'
                }
            );

            return {
                tasks,
                parallelGroups: [
                    [tasks[0]], // PM
                    [tasks[1]], // Architect
                    [tasks[2]], // Developer
                    [tasks[3], tasks[4]], // Tester + Reviewer parallel
                    [tasks[5]]  // Docs
                ],
                estimatedTime: 180
            };
        } else if (lowerRequest.includes('review') || lowerRequest.includes('check')) {
            // Code review workflow
            tasks.push(
                {
                    id: 'task-1',
                    agentType: 'reviewer',
                    task: userRequest,
                    dependsOn: [],
                    status: 'pending'
                },
                {
                    id: 'task-2',
                    agentType: 'security',
                    task: `Security review for: ${userRequest}`,
                    dependsOn: [],
                    status: 'pending'
                }
            );

            return {
                tasks,
                parallelGroups: [[tasks[0], tasks[1]]], // Both parallel
                estimatedTime: 60
            };
        } else {
            // Default: single developer task
            tasks.push({
                id: 'task-1',
                agentType: 'developer',
                task: userRequest,
                dependsOn: [],
                status: 'pending'
            });

            return {
                tasks,
                parallelGroups: [[tasks[0]]],
                estimatedTime: 30
            };
        }
    }
}
