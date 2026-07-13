# ai-release-risk-scorer

> "98% of tests passed. We almost shipped. The 2% was the payment flow.
> I built a tool that would have caught that before anyone looked at the number."

---

## What This Is

A release risk assessment tool that ingests Playwright test results, analyses
them using the Claude API, and returns a structured **SHIP / HOLD / ESCALATE**
recommendation — weighted by business criticality, not pass rate.

This is not a test report. This is the tool a Head of QA uses in a meeting
with the CTO. A risk conversation, not a dashboard number.

---

## The Core Principle

**Pass rate is a vanity metric.**

A 98% pass rate with a payment flow failure is a HOLD.
A 100% pass rate with 5 tests covering a 200-test surface is not a green light.

This tool knows the difference — because you told it what matters, and because
it asks the questions a senior QA engineer would ask before signing off a release.

---

## Live Output

Here is real output from a run against an e-commerce test suite:

```
🔍 AI Release Risk Scorer
=========================
Total: 5 | Passed: 5 | Failed: 0 | Flaky: 0
Pass Rate: 100.0%

🤖 Sending to Claude for risk analysis...

✅ RECOMMENDATION: SHIP
Risk Level: LOW | Confidence: 82%

Stakeholder Summary:
All 5 tests passed with no failures or retries, and none of the
business-critical paths triggered an automatic hold. However, the test
suite is very small — passing 5 tests is not the same as thoroughly
validating the product. The recommendation is to proceed with release,
but a human reviewer must confirm that the right tests were run and
that coverage is genuinely sufficient before treating this as a green light.

Governance Note:
The human QA reviewer must verify:
(1) which specific test cases map to payment_flow, checkout, and
    authentication — confirm these are not superficial smoke tests
(2) that the 5 tests are not a subset of a larger suite that was
    partially skipped or excluded from this run
(3) that no tests were removed or disabled since the last release cycle
(4) that the 51.9s duration is expected and no tests exited early
(5) whether a prior release had more tests — a reduction in test count
    without explanation is a governance red flag
```

The tool recommended SHIP — but flagged five governance questions the human
reviewer must answer first. That is the point. AI names the risk.
Human owns the outcome.

---

## How It Works

```
Playwright test suite runs
          ↓
JSON results ingested by scorer
          ↓
Business criticality weighting applied
  (payment_flow weight 1.0, auto_hold true)
  (search weight 0.3, auto_hold false)
          ↓
Claude API analyses:
  - Failure clustering (isolated or systemic?)
  - Flakiness patterns (real noise or genuine instability?)
  - Coverage gaps (what journeys have no coverage?)
  - Critical path failures (did payment flow pass?)
          ↓
Structured risk output:
  SHIP / HOLD / ESCALATE
  + confidence score
  + stakeholder summary (plain English)
  + governance note (what human must validate)
          ↓
Human QA engineer reviews governance note and signs off
Human makes the release decision
```

---

## The Business Criticality Layer

You define which journeys matter most in `config/critical-paths.json`:

```json
{
  "critical_paths": [
    { "journey": "payment_flow", "weight": 1.0, "auto_hold": true },
    { "journey": "checkout",     "weight": 1.0, "auto_hold": true },
    { "journey": "authentication","weight": 0.9, "auto_hold": true },
    { "journey": "registration", "weight": 0.8, "auto_hold": false },
    { "journey": "search",       "weight": 0.3, "auto_hold": false }
  ]
}
```

`auto_hold: true` means any failure in that journey triggers a HOLD
recommendation regardless of overall pass rate.

**98% pass rate + payment failure = HOLD. Every time.**

---

## Setup

```bash
# 1. Clone the repo
git clone https://github.com/dan5133/ai-release-risk-scorer.git
cd ai-release-risk-scorer

# 2. Install dependencies
npm install

# 3. Add your Anthropic API key
cp .env.example .env
# Edit .env and add: ANTHROPIC_API_KEY=your_key_here

# 4. Define your critical paths
# Edit config/critical-paths.json

# 5. Run against your Playwright results
npm run score ./playwright-results.json
```

---

## Connecting to Real Playwright Tests

Add the JSON reporter to your `playwright.config.ts`:

```typescript
reporter: [
  ['json', { outputFile: 'playwright-results.json' }],
  ['list']
]
```

Run your tests then score the results:

```bash
npx playwright test
npm run score ./playwright-results.json
```

Or in one command:

```bash
npm run test:score
```

---

## GitHub Actions — Auto-Score Every PR

The repo includes a GitHub Actions workflow that automatically runs the
risk scorer on every pull request. Add your API key to GitHub Secrets
(`ANTHROPIC_API_KEY`) and every PR gets a risk assessment as an artifact.

---

## Governance Findings

See [`docs/FINDINGS.md`](docs/FINDINGS.md) for three documented findings
from building and running this tool:

**Finding 1: Pass rate is a vanity metric**
A 100% pass rate across 5 tests is not a release signal. The tool
catches this and flags it in the governance note — even when recommending SHIP.

**Finding 2: Flaky tests mask real failures**
Tests that pass on retry are surfaced separately. Flakiness clustering
in the same area as failures is a signal of genuine instability, not noise.

**Finding 3: The stakeholder summary is the most used output**
Non-technical stakeholders ignore structured JSON. They read two sentences
of plain English and make a decision. The governance layer must bridge
that gap — and the human reviewer must validate the summary before it travels.

---

## The Human-in-the-Loop Principle

This tool makes recommendations. It does not make decisions.

Every report includes a `governance_note` that tells the human reviewer
exactly what to validate before accepting the recommendation. This is
not optional. It is the point.

**AI names the risk. Human owns the outcome.**

---

## Stack

| Layer | Technology |
|-------|-----------|
| Test execution | Playwright |
| Results ingestion | TypeScript |
| Risk analysis | Claude API (claude-sonnet-4-6) |
| Report generation | Markdown |
| CI/CD integration | GitHub Actions |
| Environment | Node.js v20+ |

---

## Part of a Broader AI Governance Portfolio

This repo is one of three public projects documenting AI governance
patterns in quality engineering:

- **[ai-release-risk-scorer](https://github.com/dan5133/ai-release-risk-scorer)**
  — this repo. AI-assessed release risk weighted by business criticality.
- **[ai-contract-triage-agent](https://github.com/dan5133/ai-contract-triage-agent)**
  — contract classification with governance documentation and DPA notice.
- **[AI-Native Testing Framework](https://github.com/dan5133)**
  — Playwright MCP self-healing pipeline with documented governance findings.

Full portfolio: **github.com/dan5133**

---

## The Governance Framework Behind This

These repos are built on five documented AI governance failure patterns
in quality engineering:

1. **Confident but wrong** — AI generates flawed output without flagging uncertainty
2. **Scope blindness** — AI tests what it can see, misses what it can't
3. **Coverage theatre** — high test counts masking low meaningful coverage
4. **Escalation vacuum** — no defined point where agent stops and human decides
5. **Drift without detection** — AI suites that pass but decouple from the product

This tool directly addresses patterns 3 and 4.

---

*Built by Adnan Siddiqi — AI-Native QA Governance*
*github.com/dan5133 | linkedin.com/in/adnan-siddiqi-16a42a3a6*
