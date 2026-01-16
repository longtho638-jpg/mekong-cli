'use client'

import { useCallback, useState } from 'react'

/**
 * 📥 Export Utilities Hook
 *
 * Export data as CSV, JSON, or trigger print for PDF
 */

interface UseExportOptions {
  filename?: string
  onExportStart?: () => void
  onExportComplete?: (format: string) => void
  onExportError?: (error: Error) => void
}

export function useExport(options: UseExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false)
  const { filename = 'export', onExportStart, onExportComplete, onExportError } = options

  /**
   * Export data as CSV
   */
  const exportToCSV = useCallback(
    (data: Record<string, unknown>[], customFilename?: string) => {
      try {
        setIsExporting(true)
        onExportStart?.()

        if (!data || data.length === 0) {
          throw new Error('No data to export')
        }

        // Get headers from first object keys
        const headers = Object.keys(data[0])

        // Create CSV content
        const csvRows = [
          headers.join(','), // Header row
          ...data.map(row =>
            headers
              .map(header => {
                const value = row[header]
                // Escape quotes and wrap in quotes if contains comma
                const stringValue = String(value ?? '')
                if (stringValue.includes(',') || stringValue.includes('"')) {
                  return `"${stringValue.replace(/"/g, '""')}"`
                }
                return stringValue
              })
              .join(',')
          ),
        ]

        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        downloadBlob(blob, `${customFilename || filename}.csv`)

        onExportComplete?.('csv')
      } catch (error) {
        onExportError?.(error as Error)
      } finally {
        setIsExporting(false)
      }
    },
    [filename, onExportStart, onExportComplete, onExportError]
  )

  /**
   * Export data as JSON
   */
  const exportToJSON = useCallback(
    (data: unknown, customFilename?: string) => {
      try {
        setIsExporting(true)
        onExportStart?.()

        const jsonContent = JSON.stringify(data, null, 2)
        const blob = new Blob([jsonContent], { type: 'application/json' })
        downloadBlob(blob, `${customFilename || filename}.json`)

        onExportComplete?.('json')
      } catch (error) {
        onExportError?.(error as Error)
      } finally {
        setIsExporting(false)
      }
    },
    [filename, onExportStart, onExportComplete, onExportError]
  )

  /**
   * Export as PDF (print dialog)
   */
  const exportToPDF = useCallback(
    (elementId?: string) => {
      try {
        setIsExporting(true)
        onExportStart?.()

        if (elementId) {
          // Print specific element
          const element = document.getElementById(elementId)
          if (element) {
            const printWindow = window.open('', '_blank')
            if (printWindow) {
              printWindow.document.write(`
                            <html>
                            <head>
                                <title>${filename}</title>
                                <style>
                                    body { font-family: system-ui, sans-serif; padding: 20px; }
                                    @media print { body { padding: 0; } }
                                </style>
                            </head>
                            <body>${element.innerHTML}</body>
                            </html>
                        `)
              printWindow.document.close()
              printWindow.print()
            }
          }
        } else {
          // Print entire page
          window.print()
        }

        onExportComplete?.('pdf')
      } catch (error) {
        onExportError?.(error as Error)
      } finally {
        setIsExporting(false)
      }
    },
    [filename, onExportStart, onExportComplete, onExportError]
  )

  /**
   * Copy data to clipboard
   */
  const copyToClipboard = useCallback(
    async (data: unknown) => {
      try {
        setIsExporting(true)
        const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        await navigator.clipboard.writeText(text)
        onExportComplete?.('clipboard')
      } catch (error) {
        onExportError?.(error as Error)
      } finally {
        setIsExporting(false)
      }
    },
    [onExportComplete, onExportError]
  )

  return {
    isExporting,
    exportToCSV,
    exportToJSON,
    exportToPDF,
    copyToClipboard,
  }
}

/**
 * Helper to download blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format date for filenames
 */
export function getExportFilename(prefix: string): string {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0]
  return `${prefix}_${dateStr}`
}

export default useExport
