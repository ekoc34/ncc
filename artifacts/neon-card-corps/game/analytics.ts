export type AnalyticsEvent =
  | 'tutorial_started'
  | 'tutorial_step_completed'
  | 'tutorial_completed'
  | 'tutorial_skipped'
  | 'run_started'
  | 'run_completed'
  | 'run_failed';

export interface EventProperties {
  step?: number;
  steps_completed?: number;
  step_at_skip?: number;
  wave?: number;
  gold?: number;
  turns?: number;
  [key: string]: unknown;
}

export function trackEvent(event: AnalyticsEvent, properties?: EventProperties): void {
  if (__DEV__) {
    console.log(`[Analytics] ${event}`, properties ?? '');
  }
  // Future: POST to analytics endpoint
  // Example:
  // fetch(`${BASE_URL}api/analytics`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ event, properties, ts: Date.now() }),
  // }).catch(() => {});
}
