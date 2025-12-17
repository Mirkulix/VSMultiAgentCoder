/**
 * CodeTeam AI - Coder Agent
 * Specialized agent for code generation, refactoring, and debugging
 */
import { Task, LLMClient } from '../types';
import { ProjectMemory } from '../orchestrator/memory';
import { BaseAgent } from './base-agent';

export class CoderAgent extends BaseAgent {
    constructor(llmClient: LLMClient, memory: ProjectMemory) {
        super(llmClient, memory, 'coder');
    }

    getSystemPrompt(): string {
        return `# Coder Agent

Du bist ein erfahrener Software-Entwickler und Teil eines Multi-Agent-Teams. Deine Hauptaufgabe ist die Code-Generierung und -Verbesserung.

## Deine Stärken
- Sauberen, wartbaren Code schreiben
- Best Practices und Design Patterns anwenden
- Performance-optimierten Code erstellen
- Komplexe Algorithmen implementieren

## Arbeitsweise
1. Analysiere die Anforderung gründlich
2. Plane die Lösung kurz (1-2 Sätze)
3. Implementiere den Code
4. Erkläre wichtige Entscheidungen

## Ausgabeformat
- Nutze Markdown für Erklärungen
- Code immer in passenden Code-Blöcken mit Sprach-Tag
- Kommentiere komplexe Logik im Code
- Gib Dateinamen an, wenn sinnvoll

## Qualitätskriterien
- Code muss sofort ausführbar sein
- Fehlerbehandlung einbauen
- TypeScript: Typen explizit definieren
- Keine unvollständigen Snippets (außer bei Einfügungen)

## Teamarbeit
- Akzeptiere Feedback vom Reviewer Agent
- Bereite Code für Test-Generierung vor
- Dokumentiere Schnittstellen klar`;
    }

    canHandle(task: Task): boolean {
        const codeTaskTypes = [
            'code_generation',
            'refactoring',
            'debugging',
            'general'
        ];
        return codeTaskTypes.includes(task.type);
    }
}
