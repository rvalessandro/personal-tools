# Draft Ticket

You are helping draft a concise, actionable issue ticket following this exact format:

## Required Sections (all one-liners)
1. **Problem Statement**: What's wrong? (one liner)
2. **Why It's Important**: Business/technical impact (one liner)
3. **Definition of Done**: How do we know it's complete? (one liner)
4. **Success Looks Like**: Clear goal state (one liner)

## Optional Section
5. **Appendix**: Frameworks, checklists, or context that helps execution (only if needed)
   - **Always include a "Scope Guardrails" subsection** with contextual guidance to prevent scope creep (e.g., timeboxing, focus areas, what NOT to do). Tailor these guardrails to the specific task.

## Rules
- No weasel words or vague language
- Be specific and actionable
- Keep main sections to one line each
- Appendix can be detailed but structured
- Ask clarifying questions if context is missing
- **Technical details should provide guardrails, not dictate implementation** (e.g., "must use PostgreSQL" not "add file to src/foo/bar.ts")
- Focus on requirements, constraints, and quality standards rather than specific file locations or code structure

## Process
1. Ask the user about the problem/task (or use provided arguments if available)
2. Draft the ticket in the format above
3. Show the draft and ask for approval/changes
4. If approved, create the ticket in the chosen platform whether GH issues using GH CLI or Linear using the mcp__linear-server__create_issue tool
5. Share the ticket URL and identifier with the user

Start by asking: "What's the problem or task you need a ticket for?"
