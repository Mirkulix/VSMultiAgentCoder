/**
 * CodeTeam AI - Reviewer Agent
 * Specialized agent for code review and quality analysis
 */
import { Task, AgentResponse, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';

export class ReviewerAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory) {
        super(llmClient, memory, 'reviewer');
    }

    getSystemPrompt(): string {
        return `# Reviewer Agent

Du bist ein erfahrener Code-Reviewer und Teil eines Multi-Agent-Teams. Deine Hauptaufgabe ist die kritische Analyse von Code.

## Deine Rolle
- Sei konstruktiv kritisch
- Finde Bugs und Sicherheitslücken
- Identifiziere Verbesserungspotenzial
- Achte auf Best Practices

## Arbeitsweise & Tools
1. **Analysiere**:
   - Lies den betroffenen Code mit \`read_file\`.
   - Prüfe auf Compiler-Fehler/Warnungen mit \`get_diagnostics\`.
   - Navigiere zu Definitionen mit \`get_definition\` um Kontext zu verstehen.
2. **Review**: Gehe den Code Zeile für Zeile durch.
3. **Report**: Notiere Issues mit Schweregrad und mache Verbesserungsvorschläge.

## Prüfkriterien

### Korrektheit
- Logikfehler
- Edge Cases
- Null/Undefined Handling
- Race Conditions

### Sicherheit
- Input Validation
- SQL Injection
- XSS Vulnerabilities
- Sensitive Data Exposure

### Code-Qualität
- Clean Code Prinzipien
- DRY (Don't Repeat Yourself)
- SOLID Principles
- Namensgebung und Lesbarkeit

### Performance
- Unnötige Schleifen
- Memory Leaks
- N+1 Queries
- Ineffiziente Algorithmen

## Ausgabeformat

### Struktur
1. **Zusammenfassung** - Gesamteindruck in 1-2 Sätzen
2. **Kritische Probleme** - Bugs, Security Issues (❌)
3. **Verbesserungen** - Sollte geändert werden (⚠️)
4. **Kleinigkeiten** - Nice to have (💡)
5. **Positives** - Was gut gemacht wurde (✅)

### Für jedes Problem
- Zeile/Bereich angeben
- Problem beschreiben
- Lösungsvorschlag geben

## Wichtig
- Sei direkt aber respektvoll
- Schlage konkrete Fixes vor
- Priorisiere nach Schwere
- Lobe guten Code`;
    }

    canHandle(task: Task): boolean {
        return task.type === 'code_review';
    }

    async execute(task: Task): Promise<AgentResponse> {
        const response = await super.execute(task);

        // Parse review results for additional metadata
        if (response.success) {
            const issues = this.parseReviewIssues(response.content);
            response.metadata = {
                totalIssues: issues.length,
                criticalIssues: issues.filter(i => i.severity === 'critical').length,
                warnings: issues.filter(i => i.severity === 'warning').length
            };
        }

        return response;
    }

    private parseReviewIssues(content: string): Array<{ severity: string; message: string }> {
        const issues: Array<{ severity: string; message: string }> = [];

        // Parse critical issues (❌)
        const criticalMatches = content.match(/❌\s*(.+)/g);
        if (criticalMatches) {
            criticalMatches.forEach(match => {
                issues.push({ severity: 'critical', message: match.replace('❌', '').trim() });
            });
        }

        // Parse warnings (⚠️)
        const warningMatches = content.match(/⚠️\s*(.+)/g);
        if (warningMatches) {
            warningMatches.forEach(match => {
                issues.push({ severity: 'warning', message: match.replace('⚠️', '').trim() });
            });
        }

        return issues;
    }
}
