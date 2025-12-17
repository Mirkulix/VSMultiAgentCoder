/**
 * CodeTeam AI - Build Runner
 * Detects and runs build systems
 */
import * as vscode from 'vscode';
import { BuildSystem, BuildResult, TestResult } from '../types';
import * as path from 'path';

export class BuildRunner {
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('CodeTeam AI Build');
    }

    /**
     * Detect the build system used in the current workspace
     */
    async detectBuildSystem(): Promise<BuildSystem> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return 'unknown';
        }

        const root = workspaceFolders[0].uri;

        // Check for various build files
        const checks: Array<{ file: string; system: BuildSystem }> = [
            { file: 'package.json', system: 'npm' },
            { file: 'yarn.lock', system: 'yarn' },
            { file: 'pnpm-lock.yaml', system: 'pnpm' },
            { file: 'Cargo.toml', system: 'cargo' },
            { file: 'build.gradle', system: 'gradle' },
            { file: 'build.gradle.kts', system: 'gradle' },
            { file: 'pom.xml', system: 'maven' },
            { file: '*.csproj', system: 'dotnet' },
            { file: 'Makefile', system: 'make' }
        ];

        for (const check of checks) {
            try {
                if (check.file.includes('*')) {
                    // Glob pattern - search for files
                    const files = await vscode.workspace.findFiles(check.file, null, 1);
                    if (files.length > 0) {
                        return check.system;
                    }
                } else {
                    // Direct file check
                    const fileUri = vscode.Uri.joinPath(root, check.file);
                    await vscode.workspace.fs.stat(fileUri);
                    return check.system;
                }
            } catch {
                // File doesn't exist, continue checking
            }
        }

        return 'unknown';
    }

    /**
     * Get the build command for the detected system
     */
    getBuildCommand(system: BuildSystem): string {
        switch (system) {
            case 'npm':
                return 'npm run build';
            case 'yarn':
                return 'yarn build';
            case 'pnpm':
                return 'pnpm build';
            case 'cargo':
                return 'cargo build';
            case 'gradle':
                return './gradlew build';
            case 'maven':
                return 'mvn compile';
            case 'dotnet':
                return 'dotnet build';
            case 'make':
                return 'make';
            default:
                return '';
        }
    }

    /**
     * Get the test command for the detected system
     */
    getTestCommand(system: BuildSystem): string {
        switch (system) {
            case 'npm':
                return 'npm test';
            case 'yarn':
                return 'yarn test';
            case 'pnpm':
                return 'pnpm test';
            case 'cargo':
                return 'cargo test';
            case 'gradle':
                return './gradlew test';
            case 'maven':
                return 'mvn test';
            case 'dotnet':
                return 'dotnet test';
            case 'make':
                return 'make test';
            default:
                return '';
        }
    }

    /**
     * Run the build process
     */
    async runBuild(): Promise<BuildResult> {
        const startTime = Date.now();
        const system = await this.detectBuildSystem();
        const command = this.getBuildCommand(system);

        if (!command) {
            return {
                success: false,
                output: 'Kein Build-System erkannt',
                errors: ['Kein unterstütztes Build-System gefunden'],
                warnings: [],
                duration: Date.now() - startTime
            };
        }

        this.outputChannel.show();
        this.outputChannel.appendLine(`\n🔨 Running: ${command}\n`);

        try {
            const result = await this.executeCommand(command);
            const output = result.stdout + result.stderr;
            const errors = this.parseErrors(output);
            const warnings = this.parseWarnings(output);

            return {
                success: result.exitCode === 0,
                output,
                errors,
                warnings,
                duration: Date.now() - startTime
            };
        } catch (error) {
            return {
                success: false,
                output: String(error),
                errors: [String(error)],
                warnings: [],
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Run tests
     */
    async runTests(): Promise<TestResult> {
        const startTime = Date.now();
        const system = await this.detectBuildSystem();
        const command = this.getTestCommand(system);

        if (!command) {
            return {
                success: false,
                output: 'Kein Test-Command verfügbar',
                errors: ['Kein Test-Framework erkannt'],
                warnings: [],
                duration: Date.now() - startTime,
                passed: 0,
                failed: 0,
                skipped: 0
            };
        }

        this.outputChannel.show();
        this.outputChannel.appendLine(`\n🧪 Running: ${command}\n`);

        try {
            const result = await this.executeCommand(command);
            const output = result.stdout + result.stderr;
            const { passed, failed, skipped } = this.parseTestResults(output, system);

            return {
                success: result.exitCode === 0,
                output,
                errors: this.parseErrors(output),
                warnings: this.parseWarnings(output),
                duration: Date.now() - startTime,
                passed,
                failed,
                skipped
            };
        } catch (error) {
            return {
                success: false,
                output: String(error),
                errors: [String(error)],
                warnings: [],
                duration: Date.now() - startTime,
                passed: 0,
                failed: 0,
                skipped: 0
            };
        }
    }

    /**
     * Execute a shell command
     */
    private async executeCommand(command: string): Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
    }> {
        return new Promise((resolve, reject) => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                reject(new Error('No workspace folder open'));
                return;
            }

            const cwd = workspaceFolders[0].uri.fsPath;
            const { exec } = require('child_process');

            exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
                this.outputChannel.appendLine(stdout);
                if (stderr) {
                    this.outputChannel.appendLine(stderr);
                }

                resolve({
                    stdout,
                    stderr,
                    exitCode: error ? error.code || 1 : 0
                });
            });
        });
    }

    /**
     * Parse error messages from output
     */
    private parseErrors(output: string): string[] {
        const errors: string[] = [];
        const patterns = [
            /error\[.*?\]:\s*(.+)/gi,
            /ERROR:\s*(.+)/g,
            /error:\s*(.+)/gi,
            /✖\s*(.+)/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(output)) !== null) {
                errors.push(match[1].trim());
            }
        }

        return errors;
    }

    /**
     * Parse warning messages from output
     */
    private parseWarnings(output: string): string[] {
        const warnings: string[] = [];
        const patterns = [
            /warning\[.*?\]:\s*(.+)/gi,
            /WARN:\s*(.+)/g,
            /warning:\s*(.+)/gi,
            /⚠\s*(.+)/g
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(output)) !== null) {
                warnings.push(match[1].trim());
            }
        }

        return warnings;
    }

    /**
     * Parse test results from output
     */
    private parseTestResults(output: string, system: BuildSystem): {
        passed: number;
        failed: number;
        skipped: number;
    } {
        let passed = 0;
        let failed = 0;
        let skipped = 0;

        // Jest/Vitest pattern
        const jestMatch = output.match(/(\d+)\s+passed.*?(\d+)\s+failed.*?(\d+)\s+skipped/i);
        if (jestMatch) {
            passed = parseInt(jestMatch[1], 10);
            failed = parseInt(jestMatch[2], 10);
            skipped = parseInt(jestMatch[3], 10);
            return { passed, failed, skipped };
        }

        // Alternative Jest pattern
        const jestAlt = output.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+failed/i);
        if (jestAlt) {
            passed = parseInt(jestAlt[1], 10);
            failed = parseInt(jestAlt[2], 10);
            return { passed, failed, skipped };
        }

        // Cargo test pattern
        const cargoMatch = output.match(/(\d+)\s+passed;\s+(\d+)\s+failed;\s+(\d+)\s+ignored/);
        if (cargoMatch) {
            passed = parseInt(cargoMatch[1], 10);
            failed = parseInt(cargoMatch[2], 10);
            skipped = parseInt(cargoMatch[3], 10);
            return { passed, failed, skipped };
        }

        // Generic pass/fail counting
        passed = (output.match(/✓|PASS|passed/gi) || []).length;
        failed = (output.match(/✗|FAIL|failed/gi) || []).length;

        return { passed, failed, skipped };
    }

    dispose(): void {
        this.outputChannel.dispose();
    }
}
