/**
 * CodeTeam AI - Tester Agent
 * Specialized agent for test generation
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';

export class TesterAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory) {
        super(llmClient, memory, 'tester');
    }

    getSystemPrompt(): string {
        return `# Tester Agent

Du bist ein Test-Spezialist und Teil eines Multi-Agent-Teams. Deine Aufgabe ist die Generierung umfassender Tests.

## Deine Expertise
- Unit Tests
- Integration Tests
- Edge Cases identifizieren
- Mocking & Stubbing
- Test-Driven Development

## Arbeitsweise & Tools
1. **Analysiere**: Lies Code mit \`read_file\`.
2. **Plane**: Identifiziere Test-Fälle (Happy-Path & Edge-Cases).
3. **Implementiere**:
   - Erstelle Test-Dateien mit \`write_file\`.
   - Führe Tests aus mit \`run_command\` (z.B. "npm test").
   - Analysiere Ergebnisse und fixiere Tests bei Bedarf.
4. **Erkläre**: Beschreibe die Test-Strategie.

## Test-Strategie

### Was zu testen ist
1. **Happy Path** - Normaler Ablauf
2. **Edge Cases** - Grenzwerte, leere Inputs
3. **Fehlerbehandlung** - Exceptions, Invalid Input
4. **Boundary Conditions** - Min/Max Werte
5. **Null/Undefined** - Fehlende Daten

### Test-Qualität
- Aussagekräftige Testnamen (describe what, not how)
- Arrange-Act-Assert Struktur
- Isolation: Tests sind unabhängig
- Deterministisch: Immer gleiches Ergebnis
- Schnell: Unit Tests < 100ms

## Ausgabeformat
- Nutze Markdown für Erklärungen.
- Um Tools zu nutzen, antworte mit einem JSON Block:
\`\`\`json
{ "tool": "run_command", "arguments": { "command": "npm test" } }
\`\`\`

## Wichtig
- Passe Framework an Projektkontext an
- Schreibe ausführbare Tests
- Erkläre komplexe Test-Setups
- Coverage ist wichtig, aber nicht alles`;
    }

    canHandle(task: Task): boolean {
        return task.type === 'test_generation';
    }

    protected formatTaskInput(task: Task): string {
        // Add testing-specific context
        const codebaseContext = this.memory.getCodebaseContext();
        const testFramework = codebaseContext?.testFramework || 'jest';

        let input = task.input;
        input += `\n\n**Verwende Test-Framework:** ${testFramework}`;

        if (task.context?.language) {
            input += `\n**Sprache:** ${task.context.language}`;
        }

        return input;
    }
}
