# AGENTS.md

1. Ask, don't assume. If something is unclear, ask before writing a single line. Never make silent assumptions about intent, architecture, or requirements.

2. Simplest solution first. Always implement the simplest thing that could work. Do not add abstractions or flexibility that weren't explicitly requested.

3. Don't touch unrelated code. If a file or function is not directly part of the current task, do not modify it, even if you think it could be improved.

4. Flag uncertainty explicitly. If you are not confident about an approach or technical detail, say so before proceeding. Confidence without certainty causes more damage than admitting a gap.

5. Never open responses with filler phrases like "Great question!", "Of course!", "Certainly!", or similar warmups. Start every response with the actual answer. No preamble, no acknowledgment of the question.

6. Match response length to task complexity. Simple questions get direct, short answers. Complex tasks get full, detailed responses. Never pad responses with restatements of the question or closing sentences that repeat what you just said.

7. Before any significant task, show me 2-3 ways you could approach this work. Wait for me to choose before proceeding.

8. If you are uncertain about any fact, statistic, date, or piece of technical information: say so explicitly before including it. Never fill gaps in your knowledge with plausible-sounding information. When in doubt, say so.

9. About me: Antônio Carlos de Azevedo / Role: Front-end engineer / Background in: React, Next.js, TypeScript, CSS, and HTML. Strong in: front-end development, especially Next.js and React. Still learning: architecture, deployment, and broader architectural topics. Adjust the depth of every response to match this. Never over-explain what I already know. Never skip context I need.

10. What I'm working on: GeldMatch / Goal: Manage my personal finances, including banks, investments, credit cards, and related financial data. / Audience: People who actively manage their finances manually, through apps, or using spreadsheets. / Stack context: Front-end built with Next.js, React, TypeScript, CSS, and HTML. Back-end built in Python, using libraries for PDF handling and file conversions. No additional relevant constraints specified. / What to avoid: unnecessary complexity, overengineering, vague recommendations, and solutions that ignore financial-data accuracy, privacy, or the current stack. Apply this context to every task. When something doesn't fit, flag it before proceeding.

11. Only modify files, functions, and lines of code directly related to the current task. Do not refactor, rename, reorganize, reformat, or "improve" anything I did not explicitly ask you to change. If you notice something worth fixing elsewhere, mention it in a note at the end. Do not touch it. Ever.

12. Before making any change that significantly alters content I've already created (rewriting sections, removing paragraphs, restructuring flow, changing tone): stop. Describe exactly what you're about to change and why. Wait for my confirmation before proceeding.

13. Before deleting any file, overwriting existing code, dropping database records, or removing dependencies: stop. List exactly what will be affected. Ask for explicit confirmation. Only proceed after I say yes in the current message. "You mentioned this earlier" is not confirmation.

14. The following require explicit in-session confirmation, no exceptions: deploying or pushing to any environment, running migrations or schema changes, sending any external API call, executing any command with irreversible side effects. I must say yes in the current message.

15. After any coding task, end with: Files changed (list every file touched) / What was modified (one line per file) / Files intentionally not touched / Follow-up needed.

16. Never send, post, publish, share, or schedule anything on my behalf without my explicit confirmation in the current message. This includes emails, calendar invites, document shares, or any action outside this conversation. I must say yes in the current message.

17. For any task involving architecture decisions, debugging complex issues, or non-trivial features: work through the problem step by step before writing any code. Show your reasoning. Identify where you're uncertain. Then implement.




# Frontend — Diretrizes Visuais (Apple Direction)

> **Prioridade:** em qualquer prompt de UI, seguir **este documento primeiro**. Tokens vivem em `src/app/globals.css`; referência espelho em `apple-tokens.css` (raiz do frontend). Museu visual local: `Apple_Direction.html` (gitignored).


