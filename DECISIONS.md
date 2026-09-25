# Decisions

Key decisions I made while building this project: what I chose, why, and what it cost.

<!-- TEMPLATE
## Decision No: <question>

- **Problem:** what needs deciding, and why now
- **Options:** the real alternatives
- **Choice & why:** what I picked, tied to the user's need or the project's goal
- **Cost:** what I gave up
- **AI input:** (optional) what the AI suggested, and whether I agreed, disagreed, or changed it
- **Revisit if:** (optional) what would make me change my mind -->

## Decision 01: build frontend or backend first?

- **Problem:** build client or server first. The order matters since I will think about the product in terms of the UX more when building client first, or in terms of the good product architecture under perspectives of a developer. Decide now is to priortize what's more important: `UX-driven or architecture-drive`

- **Options:**
    1. backend-first: set up the frontend tooling (vite) -> build whole backend -> back to UI
    2. frontend-first: split product into small feature -> build UI for one feature at a time (fake data if needed), then connect to its backend, test end-to-end -> repeatfor the remaining features of the project

- **Choice & why:** backend-first. This core of this project is backend logic

- **Cost:** Since UX is less prioritized, the design may not cover all user expects, may need take more time to redesign

- **AI input:** AI suggested me to be clear about what the decisions are, compare the tradeoffs, decides and must have a `why`.
