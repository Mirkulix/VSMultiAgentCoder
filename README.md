# CodeTeam AI - Multi-Agent VS Code Extension

Eine VS Code Extension mit Multi-Agent KI-Architektur, die die Prinzipien erfolgreicher Entwicklerteams auf KI überträgt.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85+-green)

## 🤖 Agent Team

| Agent | Rolle | Aufgaben |
|-------|-------|----------|
| 🎯 **Orchestrator** | Tech Lead | Verteilt Aufgaben, koordiniert Workflows |
| 👨‍💻 **Coder** | Entwickler | Code-Generierung, Refactoring, Debugging |
| 🔍 **Reviewer** | Prüfer | Code-Review, Security-Analyse |
| 🧪 **Tester** | QA | Test-Generierung, Edge Cases |
| 📝 **Docs** | Dokumentation | JSDoc, README, Erklärungen |
| 🏗️ **Architect** | System-Design | Architektur, Patterns, Struktur |

## 🚀 Installation

### 1. npm Cache-Problem beheben (falls nötig)

```bash
sudo chown -R $(whoami) ~/.npm
```

### 2. Abhängigkeiten installieren

```bash
cd VSCodeExtension
npm install
```

### 3. Extension kompilieren

```bash
npm run compile
```

### 4. In VS Code laden

1. Öffne VS Code
2. Drücke `F5` oder gehe zu `Run > Start Debugging`
3. Wähle "VS Code Extension Development Host"

## ⚙️ Konfiguration

Öffne VS Code Settings (`Cmd/Ctrl + ,`) und suche nach "CodeTeam":

| Setting | Beschreibung | Standard |
|---------|--------------|----------|
| `codeteam.provider` | KI Provider | `openai` |
| `codeteam.openaiApiKey` | OpenAI API Key | - |
| `codeteam.anthropicApiKey` | Anthropic API Key | - |
| `codeteam.geminiApiKey` | Google Gemini API Key | - |
| `codeteam.ollamaEndpoint` | Ollama Endpoint | `http://localhost:11434` |
| `codeteam.ollamaModel` | Ollama Model | `codellama` |

## 📋 Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `CodeTeam AI: Open Panel` | Öffnet das Chat-Panel |
| `CodeTeam AI: Ask Coder Agent` | Frage den Coder Agent |
| `CodeTeam AI: Review Selected Code` | Code-Review für Auswahl |
| `CodeTeam AI: Generate Tests` | Tests generieren |
| `CodeTeam AI: Generate Documentation` | Dokumentation erstellen |
| `CodeTeam AI: Plan Architecture` | Architektur planen |

## 🔄 Multi-Agent Workflow

Die Extension kann komplexe Aufgaben automatisch auf mehrere Agenten verteilen:

```
User Request: "Implement user authentication"
     │
     ▼
┌─────────────────┐
│   Orchestrator  │ ─── Analysiert & verteilt
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Architect│ │ Coder  │ ─── Plant & implementiert
└────┬───┘ └────┬───┘
     │          │
     ▼          ▼
┌────────┐ ┌────────┐
│Reviewer│ │ Tester │ ─── Prüft & testet
└────────┘ └────────┘
```

## 🏗️ Projektstruktur

```
src/
├── extension.ts          # Entry Point
├── types.ts              # Type Definitions
├── orchestrator/
│   ├── router.ts         # Task-Verteilung
│   └── memory.ts         # Shared Context
├── agents/
│   ├── base-agent.ts     # Basis-Klasse
│   ├── coder-agent.ts    # Code-Generierung
│   ├── reviewer-agent.ts # Code-Review
│   ├── tester-agent.ts   # Test-Generierung
│   ├── docs-agent.ts     # Dokumentation
│   └── architect-agent.ts# System-Design
├── llm/
│   ├── factory.ts        # Client Factory
│   ├── openai-client.ts  # OpenAI API
│   ├── anthropic-client.ts# Claude API
│   ├── gemini-client.ts  # Gemini API
│   └── ollama-client.ts  # Local Ollama
├── build/
│   └── runner.ts         # Build-System
└── ui/
    └── panel.ts          # WebView Panel
```

## 🛠️ Unterstützte Build-Systeme

- npm / yarn / pnpm (Node.js)
- cargo (Rust)
- gradle / maven (Java/Kotlin)
- dotnet (C#)
- make

## 📝 Lizenz

MIT License

## 🤝 Contributing

Pull Requests sind willkommen! Bitte erstelle erst ein Issue für größere Änderungen.
