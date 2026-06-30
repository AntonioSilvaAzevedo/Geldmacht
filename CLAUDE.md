## 0. Operating Priority

Follow this document before any project-specific implementation preference.

When instructions conflict, apply this priority order:

1. Safety and explicit user confirmation rules.
2. Current user request.
3. Project constraints and architecture.
4. Front-end standards.
5. General code style and implementation preferences.

Do not silently override these rules. If a conflict exists, state it clearly before proceeding.

---

## 1. Critical Rules

### 1.1 Ask, Do Not Assume

- If intent, architecture, requirements, or expected behavior are unclear, ask before writing code.
- Never make silent assumptions about user intent, system architecture, data shape, or business rules.
- If a request can be interpreted in multiple valid ways, present the options and wait for the user to choose.

### 1.2 Simplest Solution First

- Always implement the simplest solution that can work.
- Do not add abstractions, flexibility, configuration layers, or future-proofing unless explicitly requested.
- Avoid overengineering, especially in UI components and feature-level code.

### 1.3 Do Not Touch Unrelated Code

- Modify only files, functions, and lines directly related to the current task.
- Do not refactor, rename, reorganize, reformat, or "improve" unrelated code.
- If something unrelated is worth fixing, mention it in a note at the end. Do not change it.

### 1.4 Flag Uncertainty

- If you are not confident about an approach, technical detail, fact, statistic, or date, say so before proceeding.
- Never fill gaps with plausible-sounding information.
- When in doubt, state the uncertainty and ask for clarification or verify the information.

### 1.5 No Filler Openings

- Never open responses with filler phrases such as:
  - "Great question!"
  - "Of course!"
  - "Certainly!"
  - Similar warmups.
- Start with the actual answer.
- No preamble and no unnecessary acknowledgment of the question.

### 1.6 Match Response Length to Task Complexity

- Simple questions should receive direct, short answers.
- Complex tasks should receive detailed, structured answers.
- Do not pad responses by restating the question.
- Do not end with a closing sentence that repeats what was already said.

---

## 2. Confirmation and Side-Effect Rules

### 2.1 Significant Work Requires Approach Options

Before any significant task:

1. Show 2-3 possible approaches.
2. Explain the trade-offs briefly.
3. Wait for the user to choose before proceeding.

Applies to:
- Non-trivial features.
- Architecture decisions.
- Large refactors.
- Multi-file changes.
- Debugging complex issues.

### 2.2 Content Rewrites Require Confirmation

Before making a change that significantly alters existing user-created content, stop and explain:

- What will be changed.
- Why it will be changed.
- What the expected result will be.

Wait for explicit confirmation before proceeding.

Examples:
- Rewriting sections.
- Removing paragraphs.
- Restructuring flow.
- Changing tone.
- Reorganizing documentation.

### 2.3 Destructive or Irreversible Actions Require Explicit Confirmation

Before deleting, overwriting, dropping, deploying, pushing, sending, publishing, scheduling, or running irreversible actions, stop and list exactly what will be affected.

The following always require explicit in-session confirmation:

- Deleting files.
- Overwriting existing code.
- Dropping database records.
- Removing dependencies.
- Deploying or pushing to any environment.
- Running migrations or schema changes.
- Sending external API calls.
- Sending emails, calendar invites, document shares, or any action outside this conversation.
- Scheduling anything on the user's behalf.

The user must explicitly say yes in the current message.

Previous context does not count as confirmation.

---

## 3. User Context

### 3.1 User Profile

- Name: Antônio Carlos de Azevedo.
- Role: Front-end engineer.
- Background: React, Next.js, TypeScript, CSS, and HTML.
- Strongest area: front-end development, especially Next.js and React.
- Still learning: architecture, deployment, and broader system design topics.

### 3.2 Response Depth

- Do not over-explain concepts the user already knows.
- Do not skip architectural context the user may still need.
- When explaining architecture, deployment, or broader technical topics, be more explicit and step-by-step.

---

## 4. Project Context

### 4.1 Product

- Project name: GeldMatch.
- Goal: manage personal finances, including banks, investments, credit cards, and related financial data.
- Audience: people who actively manage their finances manually through apps, spreadsheets, or similar workflows.

### 4.2 Stack

- Front-end: Next.js, React, TypeScript, CSS, and HTML.
- Back-end: Python.
- Back-end responsibilities include PDF handling and file conversions.

### 4.3 Project Priorities

Always protect:

- Financial data accuracy.
- Privacy.
- Simplicity.
- Maintainability.
- Compatibility with the current stack.

Avoid:

- Unnecessary complexity.
- Overengineering.
- Vague recommendations.
- Solutions that ignore financial accuracy.
- Solutions that ignore privacy.
- Solutions that do not fit the current stack.

When a request does not fit the project context, flag it before proceeding.

---

## 5. Development Workflow

### 5.1 Before Implementation

For architecture decisions, complex debugging, or non-trivial features:

1. Work through the problem step by step.
2. Identify assumptions.
3. Identify uncertainty.
4. Choose the simplest viable approach.
5. Implement only after the approach is clear.

### 5.2 During Implementation

- Keep changes narrow.
- Avoid unrelated cleanup.
- Prefer readable code over clever code.
- Prefer explicit business rules over hidden behavior.
- Keep financial calculations easy to inspect and test.

### 5.3 After Any Coding Task

End with the following format:

```text
Files changed
- <file path>

What was modified
- <one line per file>

Files intentionally not touched
- <file path or area>

Follow-up needed
- <required follow-up or "None">
```

---

# Front-end Standards

## 6. Front-end Priority

For any UI or front-end prompt, follow this document first.

Token references:

- Source tokens: `src/app/globals.css`.
- Mirror reference: `apple-tokens.css` at the front-end root.
- Complete token table: `tokens.md`.
- Local visual reference: `Apple_Direction.html` (gitignored).

---

## 7. Styling and Design System

### 7.1 Tailwind by Default

- All styling must be done with Tailwind classes.
- Do not use the inline JSX prop `style={{ ... }}` by default.
- For token-based values, use Tailwind arbitrary utilities:
  - `bg-[var(--surface-2)]`
  - `text-[var(--text-secondary)]`
  - `rounded-[var(--radius-md)]`

Inline `style` is allowed only for genuinely dynamic runtime values that cannot reasonably become a class.

Even then, prefer:

1. Inline CSS variables.
2. Tailwind classes that consume those CSS variables.

### 7.2 Tokens Only

Colors, radii, fonts, and spacing must use `var(--token)` from `apple-tokens.css`.

Do not use:

- Raw hex values in JSX.
- Undocumented colors.
- Undocumented radii.
- Undocumented font values.
- Undocumented spacing values.

### 7.3 Dynamic Colors and Gradients

- Component color props must not accept arbitrary raw color strings unless explicitly required.
- Prefer semantic tokens, CSS variables, or a constrained color map.
- Dynamic gradients may use inline CSS variables only when they cannot be represented with static Tailwind classes.
- Do not concatenate alpha values into raw color strings inside JSX.
- If a dynamic visual value is needed, document why it cannot use a token or static class.

### 7.4 Typography

- Font size, line height, font weight, and letter spacing should use project typography tokens when available.
- Avoid arbitrary typography values such as:
  - `text-[22px]`
  - `text-[28px]`
  - `tracking-[-0.02em]`
- Arbitrary typography values are allowed only when they are part of a documented visual specification.
- Repeated typography combinations should be extracted into reusable component classes, variants, or small presentational components.

---

## 8. Component Architecture

### 8.1 Component Responsibilities

Keep UI components focused:

- Components should render UI.
- Custom hooks should coordinate state, data fetching, and side effects.
- Pure functions should make business-rule decisions.
- Event handlers should stay small and delegate non-trivial logic.
- Avoid putting business rules directly inside JSX.

### 8.2 Container vs Presentational Components

Use this split when complexity grows:

- Container components:
  - data loading
  - state coordination
  - side effects
  - permission or domain decisions

- Presentational components:
  - receive props
  - render UI
  - contain minimal branching
  - avoid business logic

Do not split components only to reduce line count. Split when the extracted part has a clear responsibility.

### 8.3 Controlled Components

Selection components must be controlled.

Use:

- `value` or `active`
- `onChange`

State belongs in the parent screen unless there is a clear reason to keep it local.

---

## 9. Next.js Client and Server Boundaries

- Do not add `'use client'` by default.
- Use `'use client'` only when the component directly uses:
  - React state
  - React effects
  - event handlers
  - browser APIs
  - client-only libraries
- Presentational components that only receive props and render UI should remain Server Components whenever possible.
- If a child component requires client behavior, isolate the client boundary as low in the tree as possible.

---

## 10. JSX Readability

- Avoid non-trivial calculations directly inside JSX.
- Prepare derived collections before the return statement.
- Name conditions used inside mapped lists when they affect:
  - layout
  - borders
  - visibility
  - behavior
- Avoid nested ternaries in JSX.
- Prefer named variables, pure decision functions, or component maps.
- Keep render paths easy to scan.

---

## 11. Complexity Standards

### 11.1 Cyclomatic Complexity Limits

Use these limits for front-end code:

| Target | Limit |
|---|---:|
| Component render/body | `10` |
| Event handlers | `5-8` |
| `useEffect` callbacks | `5` |
| Custom hooks | `8-10` |
| Utility functions | `10` |

Action thresholds:

| Complexity | Action |
|---|---|
| Above `10` | Review carefully |
| Above `15` | Refactor |
| Above `20` | Block the PR |

### 11.2 Component Complexity Warning Signs

A component should be reviewed when it has:

- More than `3` local states.
- More than `2` `useEffect` calls.
- More than `3` conditional render branches.
- More than `1` primary responsibility.
- More than `100-150` lines.
- Cyclomatic complexity above `10`.

### 11.3 Cognitive Complexity

Use these thresholds:

| Cognitive complexity | Action |
|---|---|
| Above `10` | Warn |
| Above `15` | Error |
| Above `20` | Hard block |

Prefer cognitive complexity over cyclomatic complexity when reviewing UI readability.

Cyclomatic complexity helps estimate test paths.

Cognitive complexity is usually better for detecting UI code that is hard to understand because of:

- Nested JSX.
- Conditional rendering.
- State branching.
- Effect logic.
- Deeply nested control flow.

### 11.4 Reducing Complexity

When complexity exceeds the limits, reduce it by:

- Extracting pure decision functions.
- Replacing nested ternaries with named variables.
- Replacing branch-heavy rendering with component maps.
- Extracting custom hooks for stateful logic.
- Splitting container components from presentational components.
- Separating unrelated `useEffect` logic.
- Moving business rules out of JSX.

---

## 12. Interactive Elements and Accessibility

- Every interactive element must have visible `hover`, `focus-visible`, and disabled states when applicable.
- Links styled as buttons must remain semantically valid navigation links.
- Buttons must be used for actions.
- Links must be used for navigation.
- Decorative icons must be marked as decorative or handled by the receiving component.
- Do not rely on color alone to communicate financial status.
- Prefer semantic HTML before adding ARIA.
- Add ARIA only when semantic HTML is not enough.

---

## 13. Financial Data and Calculations

### 13.1 Formatting

- Financial display values must be formatted through shared formatters.
- Monetary values must use:
  - `var(--font-mono)`
  - `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`

### 13.2 Calculations

- Financial calculations should live in tested helpers, selectors, or API-computed fields.
- UI components may perform only trivial display calculations.
- Any calculation involving credit limits, balances, invoices, investments, or totals must be easy to unit test.
- Avoid duplicating financial formulas across components.
- Never hide financial rounding, conversion, or fallback behavior inside JSX.

### 13.3 Accuracy and Privacy

- Prefer explicit data handling over implicit behavior.
- Never expose sensitive financial data unnecessarily.
- Be careful with logs, debug output, screenshots, and generated examples.
- Do not introduce third-party services for financial data unless explicitly approved.

---

## 14. Code Review Checklist

Before considering a front-end change complete, verify:

- The solution is the simplest viable one.
- Only directly related code was changed.
- No unnecessary abstraction was introduced.
- No raw hex values were added to JSX.
- Styling uses Tailwind and project tokens.
- Inline `style` is avoided or clearly justified.
- `'use client'` is used only when necessary.
- JSX does not contain non-trivial calculations.
- Financial values use shared formatters.
- Financial calculations are testable.
- Interactive elements have appropriate states.
- Complexity thresholds are respected.
- Uncertainty and trade-offs were called out when relevant.

---

## 15. Notes for LLM Agents

- Treat this file as the source of truth for project behavior.
- Do not optimize for cleverness.
- Optimize for correctness, clarity, and maintainability.
- When rules appear to conflict, ask instead of guessing.
- When a requested change would violate this document, flag it before implementing.


