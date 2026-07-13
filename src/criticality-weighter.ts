import * as fs from 'fs';
import * as path from 'path';
import { CriticalPath, PlaywrightTestResult } from './schema';

export function loadCriticalPaths(): CriticalPath[] {
  const configPath = path.join(process.cwd(), 'config', 'critical-paths.json');
  if (!fs.existsSync(configPath)) {
    console.warn('No critical-paths.json found. All paths treated equally.');
    return [];
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw).critical_paths || [];
}

export interface CriticalPathAnalysis {
  failed_critical_paths: string[];
  auto_hold_triggered: boolean;
  highest_weight_failure: number;
}

export function analyseCriticalPaths(
  tests: PlaywrightTestResult[],
  criticalPaths: CriticalPath[]
): CriticalPathAnalysis {
  const failedTests = tests.filter(t => t.status === 'failed');
  const failed_critical_paths: string[] = [];
  let auto_hold_triggered = false;
  let highest_weight_failure = 0;

  for (const path of criticalPaths) {
    const pathFailed = failedTests.some(
      t => t.title.toLowerCase().includes(path.journey.toLowerCase()) ||
           t.tags?.some(tag => tag.toLowerCase().includes(path.journey.toLowerCase()))
    );

    if (pathFailed) {
      failed_critical_paths.push(path.journey);
      if (path.auto_hold) auto_hold_triggered = true;
      if (path.weight > highest_weight_failure) {
        highest_weight_failure = path.weight;
      }
    }
  }

  return { failed_critical_paths, auto_hold_triggered, highest_weight_failure };
}
