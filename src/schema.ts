export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Recommendation = 'SHIP' | 'HOLD' | 'ESCALATE';

export interface CriticalPath {
  journey: string;
  weight: number;       // 0.0 to 1.0
  auto_hold: boolean;   // true = any failure triggers HOLD regardless of pass rate
}

export interface PlaywrightTestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'flaky';
  duration: number;
  retry: number;
  error?: string;
  tags?: string[];
}

export interface PlaywrightSuiteOutput {
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    duration: number;
  };
  tests: PlaywrightTestResult[];
}

export interface RiskAssessment {
  release_recommendation: Recommendation;
  risk_level: RiskLevel;
  confidence: number;                    // 0.0 to 1.0
  primary_concern: string;
  secondary_concern: string | null;
  escalation_required: boolean;
  critical_path_failures: string[];      // which critical paths failed
  coverage_gaps: string[];               // where coverage is missing
  flakiness_signal: string;             // real noise or genuine instability?
  stakeholder_summary: string;           // plain English for non-technical sign-off
  governance_note: string;              // what the human reviewer should validate
}
