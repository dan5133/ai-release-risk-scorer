# ai-release-risk-scorer

> "98% of tests passed. We almost shipped. The 2% was the payment flow.
> I built a tool that would have caught that before anyone looked at the number."

## What This Is

A release risk assessment tool that ingests Playwright test results, analyses
them using the Claude API, and returns a structured SHIP / HOLD / ESCALATE
recommendation — weighted by business criticality, not pass rate.

This is the tool a Head of QA uses in a meeting with the CTO.
Not a test report. A risk conversation.

## The Core Principle

Pass rate is a vanity metric.

A 98% pass rate with a payment flow failure is a HOLD.
This tool knows that because you told it which journeys matter most.

## Setup

1. Clone this repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and add your Anthropic API key
4. Edit `config/critical-paths.json` to define your business-critical journeys
5. Run: `npm run score ./your-playwright-output.json`

## Output

```json
{
  "release_recommendation": "HOLD",
  "risk_level": "HIGH",
  "confidence": 0.91,
  "primary_concern": "2 failures clustered in payment confirmation flow",
  "secondary_concern": "3 flaky tests in same area suggest wider instability",
  "escalation_required": true,
  "stakeholder_summary": "Two tests failed in the payment flow...",
  "governance_note": "Human reviewer must validate payment flow manually..."
}
Governance Findings
See docs/FINDINGS.md for documented findings on:
•	Why pass rate is a vanity metric
•	How flaky tests mask real failures
•	Why the stakeholder summary is the most used output
The Human-in-the-Loop Principle
This tool makes recommendations. It does not make decisions. The human QA engineer reviews the governance note and signs off. AI names the risk. Human owns the outcome.
Part of a Broader AI Governance Portfolio
github.com/dan5133 — AI-native testing frameworks with governance layers, CI/CD, Docker, and documented AI findings.

---

## Step 15: Run it and verify

```bash
# Install dependencies
npm install

# Run against sample data
npm run score

# Expected output:
# ✅ / 🛑 RECOMMENDATION: HOLD
# Risk Level: HIGH | Confidence: 91%
# Stakeholder Summary: ...
# Report written to: reports/risk-assessment-[timestamp].md
## Why This Exists

Most teams make release decisions based on pass rate.
Pass rate tells you how many tests passed.
It does not tell you whether the thing that matters passed.

This tool knows the difference because you told it what matters.
Define your critical paths. Set auto_hold on payment flows.
A single failure in a critical path overrides everything else.

The dashboard can be green. The recommendation can still be HOLD.
