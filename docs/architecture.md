# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep page rendering and user-facing loading, empty, and error states in the React presentation tier. Use the shared API client with relative `/api` paths; do not put database or business rules in components.
- Logic tier decision: Implement validation and capability behavior in the Express service layer, with routes responsible for HTTP status codes and response envelopes. Return deliberate 4xx responses for invalid or unknown input rather than leaking Mongoose cast/validation errors as 500s.
- Data tier decision: Keep persistence in Mongoose models and the existing seed script. Require the contract fields, model user/team relationships with ObjectId references, and preserve the seed's idempotent upserts without deleting unrelated records. Do not add authentication in this exercise.
- Activity tracking approach: Validate the request shape, ID format, and that both referenced records exist before creating an activity. Store the user, team, type, and minutes with a computed point total (one point per minute, consistent with seeded records) and an occurrence timestamp; keep list and create response shapes consistent.
- Team management approach: Require a non-empty name and mascot, default members to an empty array, and retain submitted member references. Return the same team fields from create and list operations.
- Leaderboard approach: Aggregate activity points by team, include teams with no activity at zero points, sort by total points descending, and assign ranks starting at 1.
- Workout suggestions approach: Find the requested user by email, consider their goal and recent activity when selecting matching workouts, and include a concise reason for the leading suggestion. Return a 4xx response if no user matches.

## Test plan

Commands run against the starter implementation:

| Tier/check | Command | Result | What failures indicate |
| --- | --- | --- | --- |
| Data contracts | `npm run test:data --prefix octofit-tracker/backend` | **Failed: 4 failed, 1 passed.** User, team, activity, and workout schema validation checks fail; seed idempotency passes. | Missing required model fields/defaults or a regression in preserving idempotent, non-destructive seeding. |
| API contracts | `npm run test:api --prefix octofit-tracker/backend` | **Failed: 4 failed.** Invalid activity/team requests return 501 instead of 400, leaderboard is empty, and workout suggestions lack the expected activity-based reason. | Incomplete route/service behavior, invalid-input handling, aggregation, or user-specific recommendation logic. |
| Frontend contracts | `npm test --prefix octofit-tracker/frontend` | **Failed: 15 failed.** The API-rendering and workout-request checks fail, as do loading, empty, and accessible API-error checks on all four pages. | Missing API wiring or page states/accessibility behavior in the presentation tier. |
| Backend build | `npm run build --prefix octofit-tracker/backend` | **Passed.** | A failure indicates a TypeScript compile/type error in the backend. |
| Frontend build | `npm run build --prefix octofit-tracker/frontend` | **Passed.** | A failure indicates a TypeScript or Vite production-build issue in the frontend. |

Implement and verify in dependency order: data contracts first, then API behavior, then presentation behavior. Re-run each focused contract suite after its tier changes, and run both builds to catch cross-tier type/build regressions.
