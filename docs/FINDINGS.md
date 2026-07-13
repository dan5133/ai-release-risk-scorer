# AI Release Risk Scorer — Governance Findings

## Finding 1: Pass Rate is a Vanity Metric

**Observed:** A 94% pass rate (44/47 tests passing) triggered a HOLD recommendation.
The 2 failing tests were both in the payment confirmation flow.

**Why it matters:** Teams make go/no-go decisions based on overall pass rate.
A single critical path failure buried in a green dashboard ships to production.
This tool weights failures by business impact, not test count.

**Governance implication:** Never use overall pass rate as a release gate.
Define business-critical paths explicitly. Any failure in those paths = HOLD,
regardless of what the dashboard shows.

---

## Finding 2: Flaky Tests Mask Real Failures

**Observed:** 3 tests passed on retry. The tool flags these separately from clean passes.
Two of the retried tests were in the checkout flow — same area as the hard failures.

**Why it matters:** Retry logic is often added to "fix" flakiness without
investigating root cause. When flakiness clusters in the same area as failures,
it's a signal of genuine instability, not test infrastructure noise.

**Governance implication:** Flaky tests in critical paths require human review
before they are classified as infrastructure noise. The tool surfaces the pattern.
A human decides whether to investigate or ship.

---

## Finding 3: The Stakeholder Summary is the Most Used Output

**Observed:** When sharing reports with non-technical stakeholders, the structured
JSON fields were ignored. The stakeholder_summary field was read, shared in Slack,
and used to make the release decision.

**Why it matters:** QA produces data. Leaders make decisions. The translation
between those two things is the governance layer. A tool that only produces
test counts forces a QA engineer to translate in every meeting. A tool that
produces plain English lets the data speak directly.

**Governance implication:** The human reviewer must validate the stakeholder
summary before it is shared. AI-generated plain English can be confidently wrong.
The governance note field exists specifically to prompt this review.

---

## The Human-in-the-Loop Principle

This tool makes recommendations. It does not make decisions.

Every report includes a governance_note field that tells the human reviewer
what to validate before accepting the recommendation. This is not optional.

The tool names the risk. The human owns the outcome.
