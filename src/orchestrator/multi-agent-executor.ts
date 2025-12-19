/**
 * CodeTeam AI Ultra - Multi-Agent Executor
 * Executes multiple agents in parallel with real-time progress tracking
 */
import * as vscode from 'vscode';
import { Orchestrator } from './router';
import { SupervisorAgent, AgentTask, SupervisorPlan } from '../agents/supervisor-agent';
import { AgentType, AgentResponse, TaskContext } from '../types';

export interface ExecutionProgress {
    currentPhase: number;
    totalPhases: number;
    currentTasks: AgentTask[];
    completedTasks: AgentTask[];
    failedTasks: AgentTask[];
    logs: ExecutionLog[];
}

export interface ExecutionLog {
    timestamp: Date;
    level: 'info' | 'success' | 'warning' | 'error';
    agent?: AgentType;
    message: string;
}

export interface ExecutionResult {
    success: boolean;
    plan: SupervisorPlan;
    tasks: AgentTask[];
    duration: number;
    logs: ExecutionLog[];
    finalOutput: string;
}

export class MultiAgentExecutor {
    private orchestrator: Orchestrator;
    private supervisor: SupervisorAgent;
    private progressCallback?: (progress: ExecutionProgress) => void;

    constructor(orchestrator: Orchestrator, supervisor: SupervisorAgent) {
        this.orchestrator = orchestrator;
        this.supervisor = supervisor;
    }

    /**
     * Set callback for progress updates
     */
    onProgress(callback: (progress: ExecutionProgress) => void): void {
        this.progressCallback = callback;
    }

    /**
     * Execute a complete multi-agent workflow
     */
    async execute(
        userRequest: string,
        context?: TaskContext
    ): Promise<ExecutionResult> {
        const startTime = Date.now();
        const logs: ExecutionLog[] = [];

        const addLog = (level: ExecutionLog['level'], message: string, agent?: AgentType) => {
            const log: ExecutionLog = {
                timestamp: new Date(),
                level,
                agent,
                message
            };
            logs.push(log);
            console.log(`[${level.toUpperCase()}] ${agent ? `[${agent}]` : ''} ${message}`);
        };

        addLog('info', `Starting multi-agent execution for: ${userRequest}`);

        try {
            // Phase 1: Supervisor creates execution plan
            addLog('info', 'Supervisor analyzing task and creating execution plan...');
            const plan = await this.supervisor.createExecutionPlan(userRequest, context);

            addLog('success', `Plan created: ${plan.tasks.length} tasks in ${plan.parallelGroups.length} phases`);
            addLog('info', `Estimated time: ${plan.estimatedTime}s`);

            // Log the plan
            plan.tasks.forEach((task, i) => {
                addLog('info', `Task ${i + 1}: [${task.agentType}] ${task.task.slice(0, 60)}...`);
            });

            // Phase 2: Execute tasks in parallel groups
            const completedTasks: AgentTask[] = [];
            const failedTasks: AgentTask[] = [];

            for (let phaseIndex = 0; phaseIndex < plan.parallelGroups.length; phaseIndex++) {
                const phase = plan.parallelGroups[phaseIndex];

                addLog('info', `\n━━━ Phase ${phaseIndex + 1}/${plan.parallelGroups.length} ━━━`);
                addLog('info', `Executing ${phase.length} task(s) in parallel`);

                // Update progress
                this.notifyProgress({
                    currentPhase: phaseIndex + 1,
                    totalPhases: plan.parallelGroups.length,
                    currentTasks: phase,
                    completedTasks,
                    failedTasks,
                    logs
                });

                // Execute all tasks in this phase in parallel
                const promises = phase.map(task => this.executeTask(task, context, addLog));

                const results = await Promise.allSettled(promises);

                // Process results
                results.forEach((result, index) => {
                    const task = phase[index];

                    if (result.status === 'fulfilled') {
                        task.status = 'completed';
                        task.result = result.value;
                        task.endTime = Date.now();
                        completedTasks.push(task);
                        addLog('success', `✓ Task completed: [${task.agentType}]`, task.agentType);
                    } else {
                        task.status = 'failed';
                        task.endTime = Date.now();
                        failedTasks.push(task);
                        addLog('error', `✗ Task failed: ${result.reason}`, task.agentType);
                    }
                });

                // Check if we should continue
                if (failedTasks.length > 0 && phaseIndex < plan.parallelGroups.length - 1) {
                    addLog('warning', `${failedTasks.length} task(s) failed, but continuing with workflow`);
                }
            }

            // Phase 3: Compile final output
            const duration = Date.now() - startTime;
            addLog('info', `\n━━━ Execution Complete ━━━`);
            addLog('info', `Duration: ${(duration / 1000).toFixed(1)}s`);
            addLog('success', `Completed: ${completedTasks.length}/${plan.tasks.length} tasks`);

            if (failedTasks.length > 0) {
                addLog('warning', `Failed: ${failedTasks.length} tasks`);
            }

            const finalOutput = this.compileFinalOutput(plan.tasks, completedTasks, failedTasks);

            return {
                success: failedTasks.length === 0,
                plan,
                tasks: plan.tasks,
                duration,
                logs,
                finalOutput
            };

        } catch (error) {
            addLog('error', `Execution failed: ${error}`);

            return {
                success: false,
                plan: { tasks: [], parallelGroups: [], estimatedTime: 0 },
                tasks: [],
                duration: Date.now() - startTime,
                logs,
                finalOutput: `Execution failed: ${error}`
            };
        }
    }

    /**
     * Execute a single task with Auto-Fix Loop
     */
    private async executeTask(
        task: AgentTask,
        context: TaskContext | undefined,
        addLog: (level: ExecutionLog['level'], message: string, agent?: AgentType) => void,
        retryCount = 0
    ): Promise<AgentResponse> {
        task.status = 'running';
        task.startTime = Date.now();

        addLog('info', `Starting: ${task.task.slice(0, 80)}... (Attempt ${retryCount + 1})`, task.agentType);

        try {
            // Route to appropriate agent
            const response = await this.orchestrator.routeToAgent(
                task.agentType,
                task.task,
                context
            );

            if (!response.success) {
                // Check if we should auto-fix
                if (retryCount < 2) { // Limit retries
                    addLog('warning', `Task failed. Initiating Auto-Fix attempt ${retryCount + 1}...`, task.agentType);

                    // Create a fix task
                    const fixRequest = `Fix the following error encountered during task "${task.task}":\n\nError: ${response.content}`;

                    // Let the Developer Agent try to fix it
                    const fixResponse = await this.orchestrator.routeToAgent(
                        'developer',
                        fixRequest,
                        context
                    );

                    if (fixResponse.success) {
                        addLog('success', `Auto-Fix applied successfully. Retrying original task...`, 'developer');
                        // Recursive retry
                        return this.executeTask(task, context, addLog, retryCount + 1);
                    } else {
                        addLog('error', `Auto-Fix failed: ${fixResponse.content}`, 'developer');
                    }
                }

                throw new Error(response.content);
            }

            // Log summary of response
            const summary = response.content.slice(0, 150).replace(/\n/g, ' ');
            addLog('info', `Response: ${summary}...`, task.agentType);

            return response;

        } catch (error) {
            addLog('error', `Failed: ${error}`, task.agentType);
            throw error;
        }
    }

    /**
     * Notify progress callback
     */
    private notifyProgress(progress: ExecutionProgress): void {
        if (this.progressCallback) {
            this.progressCallback(progress);
        }
    }

    /**
     * Compile final output from all tasks
     */
    private compileFinalOutput(
        allTasks: AgentTask[],
        completed: AgentTask[],
        failed: AgentTask[]
    ): string {
        const sections: string[] = [];

        sections.push('# Multi-Agent Execution Summary\n');

        // Overview
        sections.push('## Overview');
        sections.push(`- Total Tasks: ${allTasks.length}`);
        sections.push(`- Completed: ${completed.length}`);
        sections.push(`- Failed: ${failed.length}`);
        sections.push('');

        // Completed tasks
        if (completed.length > 0) {
            sections.push('## Completed Tasks\n');

            completed.forEach((task, i) => {
                const duration = task.endTime && task.startTime
                    ? ((task.endTime - task.startTime) / 1000).toFixed(1)
                    : '?';

                sections.push(`### ${i + 1}. ${this.getAgentEmoji(task.agentType)} ${task.agentType.toUpperCase()}`);
                sections.push(`**Task:** ${task.task}`);
                sections.push(`**Duration:** ${duration}s`);
                sections.push('');

                if (task.result) {
                    sections.push('**Result:**');
                    sections.push(task.result.content);
                    sections.push('');
                }

                sections.push('---\n');
            });
        }

        // Failed tasks
        if (failed.length > 0) {
            sections.push('## Failed Tasks\n');

            failed.forEach(task => {
                sections.push(`### ❌ ${task.agentType.toUpperCase()}`);
                sections.push(`**Task:** ${task.task}`);
                sections.push('');
            });
        }

        return sections.join('\n');
    }

    /**
     * Get emoji for agent type
     */
    private getAgentEmoji(agentType: AgentType): string {
        const emojis: Record<AgentType, string> = {
            orchestrator: '🎯',
            productManager: '👔',
            architect: '🏗️',
            developer: '👨‍💻',
            reviewer: '🔍',
            tester: '🧪',
            docsWriter: '📝',
            uxDesigner: '🎨',
            security: '🔒',
            devops: '⚙️',
            coder: '👨‍💻',
            docs: '📝'
        };

        return emojis[agentType] || '🤖';
    }
}
