import fs from 'fs';
import path from 'path';

export interface ProviderTestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  isConfigured: boolean;
  endpoint?: string;
  model?: string;
  latencyMs?: number;
  message: string;
  errorDetails?: string | null;
  suggestions?: string[];
}

export interface TestRunRecord {
  runId: string;
  timestamp: string;
  environment: string;
  totalTested: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  results: ProviderTestResult[];
}

const ERROR_DIR = path.resolve(process.cwd(), process.env.TESTING_ERROR_LOG_DIR || 'testing/errors');

export class ErrorLogger {
  constructor() {
    this.ensureDirectory();
  }

  private ensureDirectory() {
    try {
      if (!fs.existsSync(ERROR_DIR)) {
        fs.mkdirSync(ERROR_DIR, { recursive: true });
      }
    } catch (err) {
      console.error('Failed to create testing/errors directory:', err);
    }
  }

  public saveTestRun(record: TestRunRecord): { filePath: string; latestPath: string } {
    this.ensureDirectory();

    // Format safe timestamp: YYYY-MM-DDTHH-mm-ss-SSSZ
    const safeTimestamp = record.timestamp.replace(/[:.]/g, '-');
    const filename = `error_log_${safeTimestamp}.json`;
    const filePath = path.join(ERROR_DIR, filename);
    const latestPath = path.join(ERROR_DIR, 'latest_test_run.json');
    const summaryMdPath = path.join(ERROR_DIR, 'latest_summary.md');

    // 1. Write timestamped JSON log file
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf-8');

    // 2. Overwrite latest_test_run.json pointer
    fs.writeFileSync(latestPath, JSON.stringify(record, null, 2), 'utf-8');

    // 3. Write human-readable Markdown summary
    const mdContent = this.generateMarkdownSummary(record);
    fs.writeFileSync(summaryMdPath, mdContent, 'utf-8');

    return { filePath, latestPath };
  }

  public getLatestRun(): TestRunRecord | null {
    this.ensureDirectory();
    const latestPath = path.join(ERROR_DIR, 'latest_test_run.json');
    if (fs.existsSync(latestPath)) {
      try {
        const raw = fs.readFileSync(latestPath, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  public listLogFiles(): string[] {
    this.ensureDirectory();
    try {
      const files = fs.readdirSync(ERROR_DIR);
      return files
        .filter(f => f.startsWith('error_log_') && f.endsWith('.json'))
        .sort()
        .reverse();
    } catch (e) {
      return [];
    }
  }

  private generateMarkdownSummary(record: TestRunRecord): string {
    const lines: string[] = [
      `# Skolve AI Providers Diagnostic Test Run`,
      `**Run ID:** \`${record.runId}\`  `,
      `**Timestamp:** \`${record.timestamp}\`  `,
      `**Summary:** ${record.passedCount} Passed · ${record.failedCount} Failed · ${record.skippedCount} Skipped`,
      '',
      `| Provider | Status | Configured | Model | Latency | Diagnosis / Message |`,
      `| :--- | :--- | :--- | :--- | :--- | :--- |`,
    ];

    record.results.forEach(r => {
      const icon = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⚠️';
      const lat = r.latencyMs !== undefined ? `${r.latencyMs}ms` : '—';
      const cleanMsg = r.message.replace(/\|/g, '\\|');
      lines.push(`| **${r.name}** | ${icon} ${r.status.toUpperCase()} | ${r.isConfigured ? 'Yes' : 'No'} | \`${r.model || '—'}\` | ${lat} | ${cleanMsg} |`);
    });

    lines.push('');
    lines.push('## Diagnostic Notes & Remediation');

    const issues = record.results.filter(r => r.status === 'failed' || r.status === 'skipped');
    if (issues.length === 0) {
      lines.push('All configured AI providers validated successfully without error.');
    } else {
      issues.forEach(issue => {
        lines.push(`### ${issue.name} (${issue.status.toUpperCase()})`);
        lines.push(`- **Message:** ${issue.message}`);
        if (issue.errorDetails) {
          lines.push(`- **Details:** \`${issue.errorDetails}\``);
        }
        if (issue.suggestions && issue.suggestions.length > 0) {
          lines.push('- **Suggestions:**');
          issue.suggestions.forEach(s => lines.push(`  - ${s}`));
        }
        lines.push('');
      });
    }

    return lines.join('\n');
  }
}

export const errorLogger = new ErrorLogger();
