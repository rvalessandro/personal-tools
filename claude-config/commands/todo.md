# Todo

You are helping create a todo item in the Obsidian knowledge-base at `knowledge-base/20-todos/`.

## Schema (Shishir-style)

**Ownership:**
- `owner`: me | not-me
- If not-me: `delegated_to`, `delegated_what`, `delegated_when`

**Priority:**
- today | this-week | this-month | someday

**Category (numbered):**
- 0: General
- 1: Systeric (your company)
- 2: SeeDr (fractional CTO)
- 3: NoOn (fractional CTO)
- 4: Laku6 (Head of Engineering)
- 8: Personal (family, health, social)

**Time Estimate:**
- 15m | 30m | 1h | 2h | 4h | 1d | 2d | 1w

**Due Date (optional):**
- YYYY-MM-DD format

## Process

1. **Understand the task**: Ask about what needs to be done (or use provided arguments)

2. **Infer and confirm**: Based on the task, INFER the following (then confirm with user):
   - **Owner**: Is this you or waiting on someone?
   - **Priority**: When does this realistically need to happen?
   - **Category**: Which area of life? (detect from context: Laku6 = engineering team, SeeDr/NoOn = client work, etc.)
   - **Time estimate**: How long will this take? Be realistic:
     - Quick fix, email, message → 15m
     - Small task, review, call → 30m-1h
     - Feature, document, meeting prep → 2h-4h
     - Complex work, multiple steps → 1d-2d
     - Project, initiative → 1w+
   - **Due date**: If there's an implicit deadline, infer it

3. **Create the todo file**: Write to `knowledge-base/20-todos/[slug].md` using the template:
   ```markdown
   ---
   created: [today's date]
   owner: [me|not-me]
   delegated_to: [if not-me]
   delegated_what: [if not-me]
   delegated_when: [if not-me]
   priority: [today|this-week|this-month|someday]
   category: [0-8]
   estimate: [15m|30m|1h|2h|4h|1d|2d|1w]
   due: [YYYY-MM-DD if applicable]
   status: pending
   tags: []
   ---

   # [Title]

   ## Description
   [Clear description of what needs to be done]

   ## Tasks
   - [ ] [Actionable sub-tasks with time estimates if helpful]

   ## Context & Resources
   [Helpful links, references, related notes]

   ## Notes
   ```

4. **Enrich with context**: Search for and include:
   - Related notes in knowledge-base (use Grep/Glob)
   - Relevant resources from preferred sources:
     - Matt Mochary (The Great CEO Within, Mochary Method)
     - Will Larson (Staff Engineer, An Elegant Puzzle)
     - Sam Altman (startup advice, YC resources)
     - Shishir Mehrotra (rituals, todo philosophy)
   - Use WebSearch to find specific resources if relevant

5. **Confirm creation**: Show the created todo and file path

## Preferred Sources for Context

When searching for helpful resources, prioritize:
- **Leadership/Management**: Matt Mochary, Will Larson, Lara Hogan, Camille Fournier
- **Startups/Strategy**: Sam Altman, Paul Graham, First Round Review
- **Productivity/Rituals**: Shishir Mehrotra, David Allen (GTD)
- **Engineering**: Martin Fowler, Stripe engineering blog, Netflix tech blog

## Example

User: "I need to set up 1:1s with my new reports at Laku6"

**Inferred:**
- Owner: me
- Priority: this-week (onboarding is time-sensitive)
- Category: 4 (Laku6 - mentioned explicitly)
- Estimate: 2h (need to schedule + prep questions for each report)
- Due: 2026-01-10 (within first week of onboarding)

**Created todo:**
- File: `knowledge-base/20-todos/setup-1on1s-laku6.md`
- Context includes:
  - Link to Matt Mochary's 1:1 template
  - Lara Hogan's first 1:1 questions
  - Related notes in knowledge-base about team management

---

User: "waiting for legal review from Carousell on the new contract"

**Inferred:**
- Owner: not-me
- Delegated to: Carousell Legal
- Delegated what: Contract review
- Priority: this-week
- Category: 4 (Laku6 - Carousell subsidiary)
- Estimate: N/A (waiting)

Start by asking: "What do you need to do?"
