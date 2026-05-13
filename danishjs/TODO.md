# TODO - Reports Section Functionality Fix

## Completed
- [ ] 

## To do (step-by-step)
1. [ ] Update `js/reports.js` to make selected report period a single source of truth (avoid relying on DOM `.active`).
2. [ ] Fix weekly filter to represent actual “this week” (Mon–Sun) using real transaction dates.
3. [ ] Ensure Chart.js renders only current period data and always destroys previous instance to prevent stale/duplicate charts.
4. [ ] Keep existing UI/HTML/CSS exactly the same; only logic/JS changes.
5. [ ] Verify real-time refresh on `studentTransactionsChanged` and `studentSavingsChanged` for currently selected filter.

