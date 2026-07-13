import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import { ingestPlaywrightResults, summariseResults } from './ingester';
import { loadCriticalPaths, analyseCriticalPaths } from './criticality-weighter';
import { analyseRisk } from './risk-analyser';
import { generateReport } from './reporter';

async function main() {
  const resultsFile = process.argv[2] || 
    path.join(process.cwd(), 'sample-results', 'sample-playwright-output.json');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(
    process.cwd(), 'reports', 
    `risk-assessment-${timestamp}.md`
  );

  console.log('🔍 AI Release Risk Scorer');
  console.log('=========================');
  console.log(`Ingesting results: ${resultsFile}`);

  // Step 1: Ingest
  const suiteOutput = ingestPlaywrightResults(resultsFile);
  const summary = summariseResults(suiteOutput);
  console.log('\n' + summary);

  // Step 2: Analyse critical paths
  const criticalPaths = loadCriticalPaths();
  const criticalPathAnalysis = analyseCriticalPaths(suiteOutput.tests, criticalPaths);
  
  if (criticalPathAnalysis.auto_hold_triggered) {
    console.log('\n🛑 AUTO-HOLD TRIGGERED: Critical path failure detected');
  }

  // Step 3: Claude risk analysis
  console.log('\n🤖 Sending to Claude for risk analysis...');
  const assessment = await analyseRisk(
    suiteOutput, 
    summary, 
    criticalPaths, 
    criticalPathAnalysis
  );

  // Step 4: Generate report
  const report = generateReport(assessment, suiteOutput, reportFile);
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n${assessment.release_recommendation === 'SHIP' ? '✅' : 
               assessment.release_recommendation === 'HOLD' ? '🛑' : '⚠️'} RECOMMENDATION: ${assessment.release_recommendation}`);
  console.log(`Risk Level: ${assessment.risk_level} | Confidence: ${(assessment.confidence * 100).toFixed(0)}%`);
  console.log(`\nStakeholder Summary:\n${assessment.stakeholder_summary}`);
  console.log(`\nGovernance Note:\n${assessment.governance_note}`);
  console.log('\n' + '='.repeat(50));

  // Exit with error code if HOLD or ESCALATE (for CI/CD integration)
  if (assessment.release_recommendation !== 'SHIP') {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
