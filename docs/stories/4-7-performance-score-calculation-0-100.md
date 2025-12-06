# Story 4.7: Performance Score Calculation (0-100)

**Story ID:** 4.7
**Epic:** 4 (Performance Monitoring Dashboard)
**Status:** Ready for Development

## User Story

As a developer,
I want a simple 0-100 performance score summarizing various metrics,
So that I can quickly gauge the overall health of the application.

## Acceptance Criteria

### AC 1: Score Calculation Logic
- [ ] Determine a weighted formula based on Core Web Vitals (e.g., LCP 30%, CLS 30%, FCP 40% or standard Lighthouse weights).
- [ ] Map raw values to a 0-100 log-normal distribution (similar to Lighthouse).

### AC 2: Score Display
- [ ] `ScoreGauge` component displays the score as a radial chart.
- [ ] Color coded: 0-49 (Red), 50-89 (Orange), 90-100 (Green).

### AC 3: Real-time Recalculation
- [ ] Score updates whenever individual vitals values change.

## Design & Implementation

### Component Structure
- **`ScoreGauge.tsx`**: Radial progress bar.

### Technical Notes
- Use `lh-score` or similar utility logic: `(1 - logNormalDist(value)) * weight`.
