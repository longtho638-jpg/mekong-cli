/**
 * Output Manager
 * Save outputs in JSON, Markdown, PDF formats
 */

import * as fs from 'fs';
import * as path from 'path';

export type OutputFormat = 'json' | 'md' | 'pdf';

export class OutputManager {
    private static outputDir = path.join(process.cwd(), 'outputs');

    /**
     * Ensure output directory exists
     */
    static ensureOutputDirectory(): void {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Save output in specified format
     */
    static saveOutput(data: any, format: OutputFormat, prefix: string): string {
        this.ensureOutputDirectory();

        const filename = this.generateFilename(prefix, format);
        const filepath = path.join(this.outputDir, filename);

        switch (format) {
            case 'json':
                this.saveAsJson(data, filepath);
                break;
            case 'md':
                this.saveAsMarkdown(data, filepath);
                break;
            case 'pdf':
                this.saveAsPdf(data, filepath);
                break;
        }

        return filepath;
    }

    /**
     * Generate timestamped filename
     */
    private static generateFilename(prefix: string, format: OutputFormat): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        return `${prefix}-${timestamp}.${format}`;
    }

    /**
     * Save as JSON (pretty-print)
     */
    private static saveAsJson(data: any, filepath: string): void {
        const content = JSON.stringify(data, null, 2);
        fs.writeFileSync(filepath, content, 'utf-8');
    }

    /**
     * Save as Markdown
     */
    private static saveAsMarkdown(data: any, filepath: string): void {
        let markdown = `# Business Plan 2026\n\n`;
        markdown += `Generated: ${new Date().toISOString()}\n\n`;
        markdown += `---\n\n`;

        // Convert data to markdown (simplified)
        if (data.sections) {
            Object.entries(data.sections).forEach(([key, value]: [string, any]) => {
                markdown += `## ${this.formatSectionTitle(key)}\n\n`;
                markdown += this.objectToMarkdown(value);
                markdown += `\n---\n\n`;
            });
        }

        fs.writeFileSync(filepath, markdown, 'utf-8');
    }

    /**
     * Save as PDF (placeholder - would use pdf-lib)
     */
    private static saveAsPdf(data: any, filepath: string): void {
        // Placeholder - full implementation would use pdf-lib
        const jsonPath = filepath.replace('.pdf', '.json');
        this.saveAsJson(data, jsonPath);
        console.warn(`PDF generation not fully implemented. Saved as JSON: ${jsonPath}`);
    }

    /**
     * Format section title
     */
    private static formatSectionTitle(key: string): string {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Convert object to markdown
     */
    private static objectToMarkdown(obj: any, level: number = 0): string {
        let md = '';
        const indent = '  '.repeat(level);

        if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
            return `${obj}\n\n`;
        }

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                md += `${indent}- ${this.objectToMarkdown(item, level + 1)}`;
            });
            return md;
        }

        if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
                md += `${indent}**${key}**: ${this.objectToMarkdown(value, level + 1)}`;
            });
        }

        return md;
    }

    /**
     * Print summary to console
     */
    static printSummary(output: any): void {
        console.log('\n📊 Output Summary:');

        if (output.skillId) {
            console.log(`   Skill: ${output.skillId} - ${output.skillName}`);
        }

        if (output.generatedAt) {
            console.log(`   Generated: ${output.generatedAt}`);
        }

        if (output.status) {
            console.log(`   Status: ${output.status}`);
        }

        console.log('');
    }
}
