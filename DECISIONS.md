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

## Decision 02: how does Node run Typescript?

- **Problem:** Node is build to run javascript. The server is written in typescript -> how to run typescript?

- **Options:**
    1. compile first: `tsc` package compiles `.ts` into `.js`, then Node runs the `.js`.
    2. `tsx` package that runs `.ts` directly
    3. Node 24 can run `.ts` directly by STRIPPING THE TYPES, no extra dependencies 

- **Choice & why:** By comparing the tradeoffs below, Node 24 will be chosen
    1. first approach requires one build step and adding one dependencie (typescript) to the project
    2. second approach add 1 dependency to the project
    3. install NO dependency but NO build steps/output folder and NO tools needed to run `.ts`. Clarification: We will install and use a `typescript` compiler in to perform the type checking manually, make sure everything works nice (this happens at compile time). Iff the type check reports no error, Node 24 just need to strip all the types, and then run that JS file (100% work, since safety-check is done already)

- **Cost:** node 24 approach miss some few syntax rules. e.g: importing files need the `.ts` extension OR typescript features like `enum` aren't allowed. + nothing to check types when the code runs so need to run `npm run typecheck` (a dependency like a ts compiler) manually

- **AI input:** AI suggested me to pick Option 3. I didn't agree immediately but questioned what the point of TypeScipt is if the types get stripped, which led to separing `running` from `type checking`.


