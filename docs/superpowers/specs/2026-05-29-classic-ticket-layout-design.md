# Classic Ticket Layout Design

## Context

The classic frontend already has an initial ticket system under `web/classic/src/pages/Tickets/`.
The current list page can load tickets, filter by status, create user tickets, and open details.
The current detail page can show a ticket, show messages, reply, and close user-owned tickets.

The pages are functional but sparse: the table has little hierarchy, admin-only context is weak, empty/loading states are plain, several detail sections use inline styles, and mobile layout is not yet polished.

## Goals

- Improve both user and admin ticket pages in the classic frontend.
- Keep the current routes and API endpoints.
- Match the existing classic frontend stack: React 18, Semi UI, local CSS, and `web/classic/src/pages/Tickets/i18n.js`.
- Make list and detail pages easier to scan, especially status, priority, category, and timing.
- Add responsive behavior so ticket pages remain usable on narrow screens.
- Keep the change scoped to classic ticket display and layout.

## Non-Goals

- Do not redesign the backend ticket model or ticket API.
- Do not change the default frontend ticket module.
- Do not add file attachment upload unless the existing UI already receives attachment URLs and only needs display polish.
- Do not introduce a new UI library or global design system.

## Recommended Approach

Enhance the existing classic pages in place.

This keeps risk low because the routes, API calls, page ownership, and Semi UI patterns already exist. The implementation can add small helpers for formatting and labels, replace inline styles with class names, and improve the table/detail composition without changing backend behavior.

## List Page Design

The ticket list uses a compact operations layout:

- Header with page title, total count, and a create button for non-admin users.
- Status summary strip showing counts for all visible tickets on the current page.
- Filter toolbar with status for all users, plus category and priority filters for admins when supported by the existing API.
- Search input using existing search endpoints, with clear/reset behavior.
- Table with stable columns: ID, title, category, priority, status, assigned admin for admins, created time, and updated time where available.
- Empty state with a clear message and a primary action for users to create their first ticket.
- Loading state that keeps the page structure stable instead of replacing the whole layout with a spinner.

The user view focuses on "my tickets" and creation. The admin view focuses on triage, so filters and columns expose category, priority, status, and assignment.

## Detail Page Design

The detail page becomes a structured support conversation view:

- Header with back action, ticket ID/title, status, and close action when the ticket is open.
- Metadata row for category, priority, created time, updated time, and closed time when present.
- Main content column with the original description and message timeline.
- Admin-only user context panel when `user_context` is present.
- Reply composer fixed to the content flow with clear disabled/closed states.
- Closed tickets show a closed-state notice instead of an active reply composer.

The message timeline should visually distinguish user and admin messages, preserve whitespace, and avoid oversized bubbles on mobile.

## Data Flow

- List page loads categories from `GET /api/ticket/categories`.
- User list loads from `GET /api/ticket/self`.
- Admin list loads from `GET /api/ticket/`.
- User search uses `GET /api/ticket/self/search`.
- Admin search uses `GET /api/ticket/search`.
- Detail page loads from `GET /api/ticket/:id`.
- Replies use `POST /api/ticket/:id/message`.
- User close action uses `PUT /api/ticket/:id/close`.

The UI should tolerate missing optional fields, including empty categories, missing `updated_at`, missing `user_context`, and empty message arrays.

## Internationalization

Ticket-only copy remains in `web/classic/src/pages/Tickets/i18n.js`.
New labels should be added for all languages already present in that local file where practical, with Chinese and English treated as required.

## Responsive Behavior

- On desktop, the list can use a full table with horizontal density.
- On tablet and mobile, the table should allow horizontal scroll or switch dense secondary fields into compact text blocks if that matches the existing Semi table behavior better.
- Detail metadata and action buttons should wrap cleanly.
- Reply composer should stack vertically on narrow screens.
- Text should wrap within cards, table cells, messages, and buttons without overlapping nearby content.

## Verification

- Run the classic frontend build from `web/classic`.
- Verify ticket list and detail render without JSX or lint-time syntax errors.
- If a dev server is started, inspect `/tickets`, `/ticket/:id`, `/console/tickets`, and `/console/ticket/:id` with representative data or loading/empty states.
- Confirm no protected project identity or organization references are modified.

## Acceptance Criteria

- User and admin classic ticket list pages are visually organized and responsive.
- User and admin classic ticket detail pages have clear metadata, description, conversation, and reply/closed states.
- Search and filters do not regress existing list loading.
- Ticket creation, reply, and close actions keep the current API behavior.
- Added copy is internationalized through the local ticket i18n bundle.
