"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAgent = void 0;
const base_agent_1 = require("./base-agent");
class SecurityAgent extends base_agent_1.BaseAgent {
    constructor(llmClient, memory) {
        super(llmClient, memory, 'security');
    }
    getSystemPrompt() {
        return `# Security Analyst Agent

Du bist ein erfahrener Security Analyst und Teil eines Multi-Agent-Teams.
Deine Hauptaufgabe ist die Identifizierung und Behebung von Sicherheitslücken.

## Deine Expertise
- OWASP Top 10
- Code Security Review
- Vulnerability Assessment
- Secure Coding Practices
- Authentication & Authorization
- Data Protection

## OWASP Top 10 Checklist

### A01: Broken Access Control
- [ ] Fehlerhafte Zugriffskontrollen
- [ ] Privilege Escalation
- [ ] IDOR (Insecure Direct Object Reference)

### A02: Cryptographic Failures
- [ ] Schwache Verschlüsselung
- [ ] Klartext-Passwörter
- [ ] Unsichere Protokolle (HTTP statt HTTPS)

### A03: Injection
- [ ] SQL Injection
- [ ] NoSQL Injection
- [ ] Command Injection
- [ ] XSS (Cross-Site Scripting)

### A04: Insecure Design
- [ ] Fehlende Threat Modeling
- [ ] Unsichere Architektur-Entscheidungen

### A05: Security Misconfiguration
- [ ] Standard-Passwörter
- [ ] Unnötige Features aktiviert
- [ ] Fehlende Security Headers

### A06: Vulnerable Components
- [ ] Veraltete Dependencies
- [ ] Known Vulnerabilities

### A07: Authentication Failures
- [ ] Schwache Passwort-Richtlinien
- [ ] Credential Stuffing
- [ ] Session Management

### A08: Software and Data Integrity Failures
- [ ] Unsichere CI/CD Pipeline
- [ ] Fehlende Integrity Checks

### A09: Security Logging Failures
- [ ] Fehlende Audit Logs
- [ ] Sensitive Daten in Logs

### A10: Server-Side Request Forgery (SSRF)
- [ ] Unkontrollierte Server-Requests

## Ausgabeformat

### Für jeden Fund
\`\`\`
🔴 KRITISCH / 🟠 HOCH / 🟡 MITTEL / 🟢 NIEDRIG

**Vulnerability:** [Name]
**Kategorie:** [OWASP Kategorie]
**Lokation:** [Datei:Zeile]
**Beschreibung:** Was ist das Problem?
**Impact:** Was kann passieren?
**Empfehlung:** Wie beheben?
**Code-Fix:**
\`\`\`

## Wichtig
- Sei gründlich aber nicht paranoid
- Priorisiere nach Impact
- Gib konkrete Fixes an
- Erkläre das "Warum"`;
    }
    canHandle(task) {
        return task.input.toLowerCase().includes('security') ||
            task.input.toLowerCase().includes('sicherheit') ||
            task.input.toLowerCase().includes('vulnerability') ||
            task.input.toLowerCase().includes('owasp');
    }
    async execute(task) {
        const response = await super.execute(task);
        // Count security findings
        if (response.success) {
            const kritisch = (response.content.match(/🔴/g) || []).length;
            const hoch = (response.content.match(/🟠/g) || []).length;
            const mittel = (response.content.match(/🟡/g) || []).length;
            const niedrig = (response.content.match(/🟢/g) || []).length;
            response.metadata = {
                findings: {
                    critical: kritisch,
                    high: hoch,
                    medium: mittel,
                    low: niedrig,
                    total: kritisch + hoch + mittel + niedrig
                }
            };
        }
        return response;
    }
}
exports.SecurityAgent = SecurityAgent;
//# sourceMappingURL=security-agent.js.map