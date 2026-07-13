import * as fs from 'fs';
import { PlaywrightSuiteOutput, PlaywrightTestResult } from './schema';

export function ingestPlaywrightResults(filePath: string): PlaywrightSuiteOutput {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Results file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // Handle both Playwright JSON reporter formats
  const tests: PlaywrightTestResult[] = [];
  
  const extractTests = (suites: any[]) => {
    for (const suite of suites || []) {
      for (const spec of suite.specs || []) {
        for (const test of spec.tests || []) {
          tests.push({
            title: `${suite.title} > ${spec.title}`,
            status: test.status,
            duration: test.results?.[0]?.duration || 0,
            retry: test.results?.length - 1 || 0,
            error: test.results?.[0]?.error?.message,
            tags: spec.tags || []
          });
        }
      }
      extractTests(suite.suites || []);
    }
  };

  extractTests(data.suites || []);

  const stats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    skipped: tests.filter(t => t.status === 'skipped').length,
    flaky: tests.filter(t => t.retry > 0 && t.status === 'passed').length,
    duration: data.stats?.duration || 0
  };

  return { stats, tests };
}

export function summariseResults(output: PlaywrightSuiteOutput): string {
  const { stats, tests } = output;
  const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
  
  const failedTests = tests
    .filter(t => t.status === 'failed')
    .map(t => `- FAILED: ${t.title}${t.error ? ` | Error: ${t.error.substring(0, 100)}` : ''}`)
    .join('\n');

  const flakyTests = tests
    .filter(t => t.retry > 0)
    .map(t => `- FLAKY (${t.retry} retries): ${t.title}`)
    .join('\n');

  return `
TEST SUITE SUMMARY
==================
Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} | 
Skipped: ${stats.skipped} | Flaky: ${stats.flaky}
Pass Rate: ${passRate}%
Duration: ${(stats.duration / 1000).toFixed(1)}s

FAILED TESTS:
${failedTests || 'None'}

FLAKY TESTS (passed with retries - may be masking real failures):
${flakyTests || 'None'}
  `.trim();
}
