import { BuildSystem, BuildResult, TestResult } from '../types';
export declare class BuildRunner {
    private outputChannel;
    constructor();
    /**
     * Detect the build system used in the current workspace
     */
    detectBuildSystem(): Promise<BuildSystem>;
    /**
     * Get the build command for the detected system
     */
    getBuildCommand(system: BuildSystem): string;
    /**
     * Get the test command for the detected system
     */
    getTestCommand(system: BuildSystem): string;
    /**
     * Run the build process
     */
    runBuild(): Promise<BuildResult>;
    /**
     * Run tests
     */
    runTests(): Promise<TestResult>;
    /**
     * Execute a shell command
     */
    private executeCommand;
    /**
     * Parse error messages from output
     */
    private parseErrors;
    /**
     * Parse warning messages from output
     */
    private parseWarnings;
    /**
     * Parse test results from output
     */
    private parseTestResults;
    dispose(): void;
}
//# sourceMappingURL=runner.d.ts.map