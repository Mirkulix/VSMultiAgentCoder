# CodeTeam AI Ultra - Installationsanleitung

## 📋 Voraussetzungen

### 1. Software installiert
- ✅ **VS Code** (Version 1.85.0 oder höher)
- ✅ **Node.js** (Version 16 oder höher)
- ✅ **npm** (kommt mit Node.js)
- ✅ **Git** (für Klonen des Repos)

### 2. API Key besorgen (mindestens einer)

**Empfehlung für Anfänger: Groq (KOSTENLOS)**
1. Gehe zu [console.groq.com](https://console.groq.com)
2. Registriere dich kostenlos
3. Erstelle API Key
4. Notiere den Key irgendwo

**Alternativen:**
- **OpenAI**: [platform.openai.com](https://platform.openai.com) (kostenpflichtig, ~$20)
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com) (kostenpflichtig, $20)
- **Ollama**: Lokale Installation (kostenlos, offline)

---

## 🚀 Installation - Schritt für Schritt

### Schritt 1: Repository klonen (Falls noch nicht geschehen)

```bash
# Öffne Terminal/PowerShell
cd C:\Users\a.b\repo
git clone https://github.com/Mirkulix/VSMultiAgentCoder.git
cd VSMultiAgentCoder
```

### Schritt 2: Dependencies installieren

```bash
# Im VSMultiAgentCoder Verzeichnis
npm install
```

**Erwartete Ausgabe:**
```
added 185 packages, and audited 185 packages in 5s
41 packages are looking for funding
found 0 vulnerabilities
```

### Schritt 3: TypeScript kompilieren

```bash
npm run compile
```

**Erwartete Ausgabe:**
```
> codeteam-ai-ultra@2.0.0 compile
> tsc -p ./
```

Falls Fehler: Ignorieren Sie Warnings, solange keine ERRORS erscheinen.

### Schritt 4: Extension in VS Code öffnen

```bash
# VS Code im Projekt-Ordner öffnen
code .
```

**ODER:** VS Code manuell öffnen → `File` → `Open Folder` → `VSMultiAgentCoder` auswählen

---

## 🎮 Extension starten (Development Mode)

### Methode 1: F5 Taste (Einfachste)

1. In VS Code: **Drücke `F5`**
2. Ein neues VS Code Fenster öffnet sich (Extension Development Host)
3. Die Extension wird automatisch geladen

### Methode 2: Run & Debug Menu

1. Klicke auf **Run & Debug** Icon in der linken Sidebar (▷)
2. Wähle **"Run Extension"** aus dem Dropdown
3. Klicke auf grünen Play-Button ▷

### Methode 3: Command Palette

1. `Ctrl+Shift+P` (oder `Cmd+Shift+P` auf Mac)
2. Tippe: "Debug: Start Debugging"
3. Enter

---

## ⚙️ API Key konfigurieren

### Im neuen VS Code Fenster (Extension Development Host):

#### Option A: Über Settings UI (Empfohlen für Anfänger)

1. **Öffne Settings:**
   - Windows/Linux: `Ctrl + ,`
   - Mac: `Cmd + ,`

2. **Suche:** Tippe "codeteam" in die Suchleiste

3. **Konfiguriere Provider:**

   **Für Groq (kostenlos):**
   ```
   ▼ CodeTeam AI Ultra
     ├─ Groq Api Key: [Dein Key hier einfügen]
     └─ Groq Model: llama-3.1-70b-versatile
   ```

   **Für OpenAI:**
   ```
   ▼ CodeTeam AI Ultra
     ├─ Openai Api Key: [Dein Key hier]
     └─ Openai Model: gpt-4o
   ```

4. **Speichern:** Automatisch gespeichert

#### Option B: Über settings.json (Für Fortgeschrittene)

1. `Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)"
2. Füge hinzu:

```json
{
  "codeteam.groqApiKey": "gsk_DEIN_KEY_HIER",
  "codeteam.groqModel": "llama-3.1-70b-versatile"
}
```

ODER für OpenAI:

```json
{
  "codeteam.openaiApiKey": "sk-DEIN_KEY_HIER",
  "codeteam.openaiModel": "gpt-4o"
}
```

#### Option C: Model Farm (Visuell & Einfach)

1. Klicke auf **🤖 Icon** in der linken Sidebar
2. Klicke auf **🏭 Model Farm**
3. Klicke **⚙️ Settings**
4. Trage API Key ein

---

## ✅ Testen ob alles funktioniert

### Test 1: Extension geladen?

1. Schaue in die linke Sidebar
2. Siehst du das **🤖 CodeTeam AI** Icon?
3. ✅ JA → Extension ist geladen!
4. ❌ NEIN → Siehe Troubleshooting unten

### Test 2: API Key funktioniert?

1. `Ctrl+Shift+P` (oder `Cmd+Shift+P`)
2. Tippe: **"CodeTeam AI: Implement Plan"**
3. Enter
4. Eingabe: **"Create a hello world function"**
5. Enter

**Erwartetes Ergebnis:**
```
✅ Notification: "CodeTeam AI - Multi-Agent Execution"
ℹ️ Output Channel öffnet sich
ℹ️ Du siehst: "Starting multi-agent execution..."
ℹ️ Agenten arbeiten...
✅ Nach 30-60s: "Multi-Agent workflow completed!"
```

### Test 3: Sidebar Panel

1. Klicke auf **🤖 Icon** in der Sidebar
2. Du siehst Chat-Interface
3. Tippe: **"Hello, create a function to add two numbers"**
4. Klicke **Senden**
5. ✅ Agent antwortet mit Code!

---

## 🎯 Erste Schritte nach Installation

### 1. Einfacher Test
```
Command: CodeTeam AI: Implement Plan
Input: "Create a function to calculate factorial"
```

### 2. Multi-Agent Test
```
Command: CodeTeam AI: Implement Plan
Input: "User authentication with JWT"
Beobachte: Mehrere Agenten arbeiten parallel!
```

### 3. Specify → Plan → Implement Workflow
```
Step 1: Command: "CodeTeam AI: Specify Feature"
        Input: "Shopping cart with add/remove items"

Step 2: Command: "CodeTeam AI: Create Plan"
        Input: "Shopping cart with add/remove items"
        → Schaue dir den Plan an!

Step 3: Klicke "Implement Now" in der Notification
        → Team führt aus!
```

---

## 🐛 Troubleshooting

### Problem: "No API Key configured"

**Lösung:**
1. Stelle sicher, dass du im **Extension Development Host** Fenster bist
2. Öffne Settings in DIESEM Fenster
3. Konfiguriere API Key erneut
4. Reload Window: `Ctrl+Shift+P` → "Developer: Reload Window"

### Problem: Extension Icon (🤖) nicht sichtbar

**Lösung:**
1. Schaue ins Terminal im ursprünglichen VS Code Fenster
2. Siehst du Fehler?
3. Falls ja: `npm run compile` erneut ausführen
4. F5 erneut drücken

### Problem: "Extension host terminated unexpectedly"

**Lösung 1: Node Modules neu installieren**
```bash
rm -rf node_modules
npm install
npm run compile
```

**Lösung 2: VS Code Cache leeren**
```bash
# Windows
rmdir /s %APPDATA%\Code\User\workspaceStorage

# Linux/Mac
rm -rf ~/.config/Code/User/workspaceStorage
```

### Problem: TypeScript Compile Errors

**Lösung:**
```bash
# Dependencies neu installieren
npm install --save-dev @types/node @types/vscode typescript

# Erneut kompilieren
npm run compile
```

### Problem: "Cannot find module 'openai'"

**Lösung:**
```bash
npm install openai @anthropic-ai/sdk @google/generative-ai
npm run compile
```

### Problem: API Calls fehlschlagen

**Mögliche Ursachen:**
1. ❌ Falscher API Key → Überprüfe Key
2. ❌ Kein Internet → Prüfe Verbindung
3. ❌ API Limit erreicht → Warte oder wechsle Provider
4. ❌ Firewall blockiert → Prüfe Firewall-Einstellungen

**Check:**
```bash
# Test Groq API (in Terminal)
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer DEIN_KEY_HIER"
```

### Problem: Extension zu langsam

**Lösungen:**
1. Wechsle zu **Groq** (ultra-schnell)
2. Settings → `groqModel` → `llama-3.1-8b-instant` (kleineres Modell)
3. Oder nutze lokales **Ollama**

---

## 📦 Installation für Produktion (Optional)

Falls du die Extension dauerhaft installieren willst:

### Extension packen

```bash
# VSCE installieren (falls noch nicht)
npm install -g @vscode/vsce

# Extension packen
cd VSMultiAgentCoder
vsce package
```

**Ausgabe:** `codeteam-ai-ultra-2.0.0.vsix`

### Extension installieren

1. VS Code öffnen
2. Extensions View: `Ctrl+Shift+X`
3. Klicke auf **`...`** (oben rechts)
4. **"Install from VSIX..."**
5. Wähle `codeteam-ai-ultra-2.0.0.vsix`
6. Reload VS Code

---

## 🔧 Konfigurationsoptionen (Alle Provider)

```json
{
  // OpenAI
  "codeteam.openaiApiKey": "sk-...",
  "codeteam.openaiModel": "gpt-4o",

  // Anthropic
  "codeteam.anthropicApiKey": "sk-ant-...",
  "codeteam.anthropicModel": "claude-3-5-sonnet-20241022",

  // Groq (KOSTENLOS!)
  "codeteam.groqApiKey": "gsk_...",
  "codeteam.groqModel": "llama-3.1-70b-versatile",

  // Google Gemini
  "codeteam.geminiApiKey": "AIza...",
  "codeteam.geminiModel": "gemini-pro",

  // DeepSeek
  "codeteam.deepseekApiKey": "sk-...",
  "codeteam.deepseekModel": "deepseek-coder",

  // Ollama (lokal)
  "codeteam.ollamaEndpoint": "http://localhost:11434",
  "codeteam.ollamaModel": "codellama"
}
```

---

## 📚 Nächste Schritte

Nach erfolgreicher Installation:

1. **Lese:** `MULTI_AGENT_GUIDE.md` - Wie das System funktioniert
2. **Teste:** Verschiedene Commands ausprobieren
3. **Experimentiere:** Mit verschiedenen Prompts und Workflows

---

## ⚡ Schnell-Installation (Erfahrene User)

```bash
# 1. Klonen & Setup
git clone https://github.com/Mirkulix/VSMultiAgentCoder.git
cd VSMultiAgentCoder
npm install
npm run compile

# 2. VS Code öffnen
code .

# 3. F5 drücken

# 4. Im neuen Fenster Settings öffnen (Ctrl+,)
#    Suche "codeteam" → API Key eintragen

# 5. Testen: Ctrl+Shift+P → "CodeTeam AI: Implement Plan"
```

---

## 🆘 Hilfe benötigt?

1. **Output Channel checken:**
   - `View` → `Output` → "CodeTeam AI - Multi-Agent"

2. **Developer Console öffnen:**
   - `Help` → `Toggle Developer Tools`
   - Schaue nach Fehlern

3. **Extension Host Log:**
   - `Ctrl+Shift+P` → "Developer: Show Logs"
   - Wähle "Extension Host"

4. **Komplettes Cleanup:**
   ```bash
   rm -rf node_modules out
   npm install
   npm run compile
   ```

---

## ✅ Installation erfolgreich wenn:

- [ ] VS Code öffnet zweites Fenster (Extension Development Host)
- [ ] 🤖 Icon erscheint in der Sidebar
- [ ] Settings zeigt "CodeTeam AI Ultra" Optionen
- [ ] Test-Command funktioniert
- [ ] Agenten antworten auf Fragen

**Viel Erfolg! 🚀**
