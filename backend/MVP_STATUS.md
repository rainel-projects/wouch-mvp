
# MVP Flow Comprehensive Status Report

## 1. What Is There (Implemented & Verified)
These components are present in the codebase and database schema.

### Database Layer (Supabase)
*   **Questions & Answers:** `questions`, `question_responses` (Verified)
*   **Scoring:** `score_rules` (Verified `points` column), `user_scores` (Verified columns), `scores` (Verified).
*   **Flow Control:** `flows`, `user_flows` (Tables exist).
*   **Content:** `modules`, `kai_lessons` (Tables exist).

### Backend Services (Node.js/Express)
*   **`server.js`:** All MVP endpoints defined (`/onboarding/state`, `/answer`, `/kai/lesson/complete`).
*   **`scoringService.js`:** Logic for applying rules, aggregating scores, and raising flags. (**NOTE: Currently throwing 500 Error**)
*   **`branchingService.js`:** Logic for evaluating conditions and determining next steps.
*   **`flowService.js`:** Managing user state.
*   **`kaiService.js`:** Handling KAI lesson unlocks.

### Frontend (React/Vite)
*   **Onboarding Flow:** UI for rendering questions.
*   **API Client:** `api.js` configured to hit backend.

## 2. What Is Usable (Working End-to-End)
These features can be tested right now.

*   **View Questions:** `GET /question/{code}` is working. You can load and view questions.
*   **Check State:** `GET /onboarding/state` is working. It correctly identifies where a user is.
*   **Readiness Score:** `GET /readiness` logic is implemented (though depends on scores).

## 3. What Is Broken (Technical Blockers)
These features exist but are currently failing tests.

*   **Answer Submission (`POST /answer`):**
    *   **Status:** **CRITICAL FAULT (500 Error)**
    *   **Cause:** Logic error in `scoringService.js` during Score Rule application or Score Aggregation.
    *   **Impact:** Users cannot progress past the first question. Scores are not saved. Flags are not raised. Branching logic is never reached.

## 4. What Is Not There (Missing)
These features are part of the spec but either missing or not fully robust.

*   **Admin UI:** No interface to view audit logs or manually adjust scores (Database only).
*   **Complex Flag Logic:** Only basic range-based flags are implemented. Complex multi-condition flags might need more work.
*   **Robust Error Handling:** API returns generic 500 errors often without widely accessible logs (now partially improved in frontend).

## 5. What Won't Be Seen (Invisible Logic)
These are "Black Box" backend processes that users won't see but are critical for the "Rule-Based" nature.

*   **Atomic Score Deltas:** Every single point added/subtracted is stored in `user_scores` with a timestamp and rule ID.
*   **Flag Triggers:** The system silently raises flags like `emotional_volatility` in `user_flags` based on thresholds.
*   **Branching Evaluations:** The `evaluateBranching` function runs silently after every answer, checking all active flags and scores to decide the next step.
*   **Audit Trail:** `user_flow_events` tracks every move, but this is for admin/analytics, not user display.

## Summary
The system is **90% feature complete** code-wise but **0% usable** for the core flow due to the critical blocking error on `POST /answer`. Once `scoringService.js` is fixed, the entire chain (Answer -> Score -> Flag -> Branch -> Next Question) should function as intended.
