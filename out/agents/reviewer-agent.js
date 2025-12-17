"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewerAgent = void 0;
const base_agent_1 = require("./base-agent");
class ReviewerAgent extends base_agent_1.BaseAgent {
    constructor(llmClient, memory) {
        super(llmClient, memory, 'reviewer');
    }
    getSystemPrompt() {
        return `# Reviewer Agent

Du bist ein erfahrener Code-Reviewer und Teil eines Multi-Agent-Teams. Deine Hauptaufgabe ist die kritische Analyse von Code.

## Deine Rolle
- Sei konstruktiv kritisch
- Finde Bugs und Sicherheitslücken
- Identifiziere Verbesserungspotenzial
- Achte auf Best Practices

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
    canHandle(task) {
        return task.type === 'code_review';
    }
    async execute(task) {
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
    parseReviewIssues(content) {
        const issues = [];
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
exports.ReviewerAgent = ReviewerAgent;
//# sourceMappingURL=reviewer-agent.js.map