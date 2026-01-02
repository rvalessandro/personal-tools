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
- 1: Systeric
- 2: sys: SeeDr
- 3: sys: NoOn
- 4: carousell/lk6
- 8: Personal

**Time Estimate:**
- 15m | 30m | 1h | 2h | 4h | 1d | 2d | 1w

**Due Date (optional):**
- YYYY-MM-DD format

## Process

1. **Understand the task**: Ask about what needs to be done (or use provided arguments)

2. **Detect people**: If the task mentions a person by name:
   - Search `knowledge-base/40-contacts/` for existing contact
   - If NOT found, ask: "I don't have [Name] in contacts. Want me to create them? What's their main contact method (slack/discord/whatsapp/email)?"
   - If user confirms, create contact FIRST in background at `knowledge-base/40-contacts/[name].md`

3. **Infer and confirm**: Based on the task, INFER the following (then confirm with user):
   - **Owner**: Is this you or waiting on someone?
   - **Priority**: When does this realistically need to happen?
   - **Category**: Which area of life? (detect from context: sys: clients are Systeric work)
   - **Time estimate**: How long will this take? Be realistic:
     - Quick fix, email, message → 15m
     - Small task, review, call → 30m-1h
     - Feature, document, meeting prep → 2h-4h
     - Complex work, multiple steps → 1d-2d
     - Project, initiative → 1w+
   - **Due date**: If there's an implicit deadline, infer it

4. **Create the todo file**: Write to `knowledge-base/20-todos/[slug].md` using the template:
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

5. **Enrich with context**: Search for and include:
   - Link to contact if person mentioned: `[[40-contacts/name|Name]]`
   - Related notes in knowledge-base (use Grep/Glob)
   - Relevant resources from preferred sources:
     - Matt Mochary (The Great CEO Within, Mochary Method)
     - Will Larson (Staff Engineer, An Elegant Puzzle)
     - Sam Altman (startup advice, YC resources)
     - Shishir Mehrotra (rituals, todo philosophy)
   - Use WebSearch to find specific resources if relevant

6. **Confirm creation**: Show the created todo and file path (and contact if created)

## Preferred Sources for Context

When searching for helpful resources, prioritize:
- **Leadership/Management**: Matt Mochary, Will Larson, Lara Hogan, Camille Fournier
- **Startups/Strategy**: Sam Altman, Paul Graham, First Round Review
- **Productivity/Rituals**: Shishir Mehrotra, David Allen (GTD)
- **Engineering**: Martin Fowler, Stripe engineering blog, Netflix tech blog

## Example

User: "I need to set up 1:1s with my new reports at Lk6"

**Inferred:**
- Owner: me
- Priority: this-week (onboarding is time-sensitive)
- Category: 4 (carousell/lk6)
- Estimate: 2h (need to schedule + prep questions for each report)
- Due: 2026-01-10 (within first week of onboarding)

**Created todo:**
- File: `knowledge-base/20-todos/setup-1on1s-lk6.md`
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
- Category: 4 (carousell/lk6)
- Estimate: N/A (waiting)

---

User: "follow up with Irvan about the API integration"

**Contact check:** Irvan not found in contacts.

Claude: "I don't have Irvan in contacts. Want me to create them? What's their main contact method?"

User: "yes, slack"

**Created:**
1. Contact: `knowledge-base/40-contacts/irvan.md` (primary: slack)
2. Todo: `knowledge-base/20-todos/followup-irvan-api.md` with link to [[40-contacts/irvan|Irvan]]

Start by asking: "What do you need to do?"
