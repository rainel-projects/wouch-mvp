
# Wouch MVP

**Date:** 3 Jan 2026
**Status:** MVP Flow Implementation in Progress

## Project Overview
Wouch is an app designed to guide users through a structured onboarding flow using a database-driven, rule-based engine.

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** Supabase (PostgreSQL)

## MVP Flow Status (3 Jan 2026)

### Core Principle
The onboarding flow is fully database-driven. The backend evaluates user progression using:
- Stored responses
- Scoring rules
- Aggregated scores
- Derived flags
- Branching rules
- Flow state

### Current Implementation Status

#### 1. Implemented & Verified (What Is There)
- **Database Layer:**
    - `questions`, `question_responses` (Verified)
    - `score_rules`, `user_scores`, `scores` (Schema Verified)
    - `flows`, `user_flows`
    - `modules`, `kai_lessons`
- **Backend Services:**
    - `server.js` (API Endpoints)
    - `scoringService.js` (Rule Engine)
    - `branchingService.js` (Decision Engine)
    - `flowService.js` (State Management)
    - `kaiService.js` (Content Unlocking)
- **Frontend:**
    - Onboarding Flow UI
    - API Integration

#### 2. Usable Features (What Works)
- `GET /question/{code}`: View questions
- `GET /onboarding/state`: Check user flow state
- `GET /readiness`: Calculate readiness score

#### 3. Known Issues (What is Broken)
- **High Priority:** `POST /answer` endpoint is currently returning a 500 error due to a scoring logic exception. This blocks the user from progressing past the first question.
    - *Fix in progress:* Debugging `scoringService.js` to align SQL queries with `insight_engine_schema.user_scores` schema.

## Run Instructions

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
