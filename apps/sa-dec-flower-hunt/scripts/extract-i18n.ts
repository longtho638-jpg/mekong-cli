import fs from 'fs';
import path from 'path';

// Regex to find potential hardcoded text
// Matches text inside JSX tags: >Text<
const JSX_TEXT_REGEX = />([^<>{}\n]+)</g;
// Matches text in attributes: title="Text" or label="Text" or alt="Text"
const ATTRIBUTE_TEXT_REGEX = /(?:title|label|alt|placeholder|aria-label)="([^"{}]+)"/g;

const ROOT_DIR = process.cwd();
const PAGES_DIR = path.join(ROOT_DIR, 'app');

function scanFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches: string[] = [];

    // Scan JSX content
    let match;
    while ((match = JSX_TEXT_REGEX.exec(content)) !== null) {
        const text = match[1].trim();
        if (text && !text.match(/^[0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)) {
            // Filter out just numbers/symbols
            matches.push(text);
        }
    }

    // Scan Attributes
    while ((match = ATTRIBUTE_TEXT_REGEX.exec(content)) !== null) {
        const text = match[1].trim();
        if (text) {
            matches.push(text);
        }
    }

    return matches;
}

function walkDir(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath, fileList);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

function main() {
    console.log("🕵️  Scanning for hardcoded text...");
    const files = walkDir(PAGES_DIR);
    const report: Record<string, string[]> = {};
    let totalIssues = 0;

    files.forEach(file => {
        // Skip layout.tsx and page.tsx if they are just wrappers often
        // But for deep check we scan everything
        if (file.includes('node_modules')) return;

        const issues = scanFile(file);
        if (issues.length > 0) {
            const relPath = path.relative(ROOT_DIR, file);
            report[relPath] = issues;
            totalIssues += issues.length;
        }
    });

    console.log(`\nFound ${totalIssues} potential hardcoded strings in ${Object.keys(report).length} files:\n`);

    for (const [file, texts] of Object.entries(report)) {
        console.log(`\n📄 ${file}`);
        texts.forEach(t => console.log(`   - "${t}"`));
    }

    console.log("\n✅ Suggestion: Use 'withI18n' HOC for these pages.");
}

main();
