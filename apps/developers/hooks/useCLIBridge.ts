 
'use client'

import { useState, useCallback } from 'react'

interface CommandResult {
    success: boolean
    output: string
    error?: string
    duration: number
}

interface CLICommand {
    command: string
    args?: string[]
    cwd?: string
}

export function useCLIBridge() {
    const [isExecuting, setIsExecuting] = useState(false)
    const [history, setHistory] = useState<Array<{ command: string; result: CommandResult; timestamp: Date }>>([])
    const [lastResult, setLastResult] = useState<CommandResult | null>(null)

    const execute = useCallback(async (cmd: CLICommand): Promise<CommandResult> => {
        setIsExecuting(true)
        const startTime = Date.now()

        try {
            const response = await fetch('/api/cli/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cmd)
            })

            const data = await response.json()
            const result: CommandResult = {
                success: response.ok,
                output: data.output || '',
                error: data.error,
                duration: Date.now() - startTime
            }

            setLastResult(result)
            setHistory(prev => [...prev, {
                command: `${cmd.command} ${cmd.args?.join(' ') || ''}`.trim(),
                result,
                timestamp: new Date()
            }])

            return result
        } catch (error) {
            const result: CommandResult = {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            }
            setLastResult(result)
            return result
        } finally {
            setIsExecuting(false)
        }
    }, [])

    // Quick commands for common actions
    const quickCommands = {
        cook: () => execute({ command: 'npm', args: ['run', 'dev'] }),
        ship: () => execute({ command: 'git', args: ['push', 'origin', 'main'] }),
        test: () => execute({ command: 'npm', args: ['run', 'test'] }),
        lint: () => execute({ command: 'npm', args: ['run', 'lint:strict'] }),
        build: () => execute({ command: 'npm', args: ['run', 'build'] }),
        typecheck: () => execute({ command: 'npm', args: ['run', 'typecheck'] }),
    }

    const clearHistory = useCallback(() => {
        setHistory([])
        setLastResult(null)
    }, [])

    return {
        execute,
        isExecuting,
        history,
        lastResult,
        quickCommands,
        clearHistory
    }
}
