import Anthropic from '@anthropic-ai/sdk';
import { RiskAssessment, PlaywrightSuiteOutput, CriticalPath } from './schema';
import { CriticalPathAnalysis } from './criticality-weighter';

const client = new Anthropic();

export async function analyseRisk(
  suiteOutput: PlaywrightSuiteOutput,
  resultsSummary: string,
  criticalPaths: CriticalPath[],
  criticalPathAnalysis: CriticalPathAnalysis
): Promise<RiskAssessment> {

  const criticalPathContext = criticalPaths.length > 0
    ? `\nBUSINESS-CRITICAL PATHS DEFINED:\n${criticalPaths.map(
        p => `- ${p.journey} (weight: ${p.weight}, auto_hold: ${p.auto_hold})`
      ).join('\n')}\n\nFAILED CRITICAL PATHS: ${
        criticalPathAnalysis.failed_critical_paths.join(', ') || 'None'
      }\nAUTO-HOLD TRIGGERED: ${criticalPathAnalysis.auto_hold_triggered}`
    : '\nNo business-critical paths configured.';

  const prompt = `You are a senior QA governance analyst reviewing test results before a production release.

Your job is NOT to report pass rates. Your job is to assess BUSINESS RISK and make a release recommendation.

CORE PRINCIPLE: A 98% pass rate with a payment flow failure is a HOLD. Pass rate is a vanity metric. Business impact is the only metric that matters.

${resultsSummary}
${criticalPathContext}

Analyse these results and return ONLY a JSON object with this exact structure — no other text, no markdown, no explanation:

{
  "release_recommendation": "SHIP" | "HOLD" | "ESCALATE",
  "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "confidence": 0.0-1.0,
  "primary_concern": "specific description of the most important risk",
  "secondary_concern": "second most important risk or null",
  "escalation_required": true | false,
  "critical_path_failures": ["list", "of", "failed", "critical", "paths"],
  "coverage_gaps": ["inferred gaps based on test titles and failure patterns"],
  "flakiness_signal": "assessment of whether flaky tests represent real instability",
  "stakeholder_summary": "2-3 sentences in plain English for a non-technical CTO or PM. No jargon. State the risk and the recommendation clearly.",
  "governance_note": "what the human QA reviewer must validate before accepting this recommendation"
}

RECOMMENDATION RULES:
- SHIP: all critical paths pass, no systemic failures, low flakiness
- HOLD: any critical path fails OR systemic failure pattern OR high-confidence coverage gap in business-critical area
- ESCALATE: conflicting signals, ambiguous failures, or the auto_hold was triggered but confidence is low

Remember: you are naming the risk so a human can make the decision. You do not make the final call. The human does.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }

  try {
    const clean = content.text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean) as RiskAssessment;
  } catch (err) {
    throw new Error(`Failed to parse risk assessment: ${content.text}`);
  }
}
