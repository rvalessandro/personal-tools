---
created: 2026-01-04
owner: me
priority: this-week
category: 2
estimate: 2h
due:
status: pending
tags: [seedr, documentation, knowledge-management, team]
---

# Setup Shared SeeDr Documentation System

## Problem Statement

Currently, SeeDr codebase knowledge lives in:
- ❌ Claude Code memory (only accessible to me)
- ❌ Individual developer's heads (not documented)
- ❌ Scattered Linear tickets and PRs

**Result**: New engineers and existing team can't access accumulated learnings. Knowledge doesn't compound across the team.

## Goal

Create a **shared, living documentation system** in the SeeDr monorepo where:
- ✅ All architectural decisions are documented
- ✅ All learnings from code reviews compound over time
- ✅ New engineers can onboard faster
- ✅ Team has single source of truth for "why we did X"

---

## Tasks

### Phase 1: Research & Planning (30m)
- [ ] Review existing documentation patterns in the monorepo
- [ ] Check what's already in `docs/` folder (if any)
- [ ] Research documentation best practices (ADRs, RFCs, runbooks)
- [ ] Draft documentation structure proposal

### Phase 2: Setup Documentation Framework (45m)
- [ ] Create `/docs` folder structure in monorepo
- [ ] Add README explaining documentation system
- [ ] Create templates for common doc types
- [ ] Setup PR review process for docs

### Phase 3: Migrate Existing Knowledge (30m)
- [ ] Extract key learnings from Claude Code memory
- [ ] Document recent architectural decisions (e.g., consultation queue optimization)
- [ ] Create initial "known issues" and "gotchas" doc

### Phase 4: Team Rollout (15m)
- [ ] Post announcement in Discord
- [ ] Add docs contribution to onboarding checklist
- [ ] Create habit: "Update docs when you learn something non-obvious"

---

## Proposed Documentation Structure

```
reallysick-monorepo/
├── docs/
│   ├── README.md                          # How to use this documentation
│   ├── architecture/
│   │   ├── overview.md                    # System architecture overview
│   │   ├── consultation-flow.md           # Doctor-patient matching flow
│   │   ├── video-providers.md             # DailyCo vs Vonage decision
│   │   └── database-schema.md             # MongoDB collections explained
│   ├── decisions/                         # Architecture Decision Records (ADRs)
│   │   ├── 001-migrate-to-sveltekit.md
│   │   ├── 002-feature-flag-strategy.md
│   │   └── template.md
│   ├── runbooks/
│   │   ├── incident-response.md           # What to do when things break
│   │   ├── debugging-stuck-consultations.md
│   │   └── rollback-deployment.md
│   ├── onboarding/
│   │   ├── new-engineer.md                # First week setup
│   │   ├── codebase-tour.md               # Where to find things
│   │   └── development-workflow.md        # Git flow, PR process
│   ├── guides/
│   │   ├── feature-flags.md               # How to use Growthbook
│   │   ├── testing.md                     # Testing philosophy and patterns
│   │   └── code-review.md                 # Review checklist and standards
│   └── gotchas/
│       ├── common-bugs.md                 # "Why does X happen?"
│       ├── performance-tips.md            # Known performance bottlenecks
│       └── deployment-warnings.md         # Things to check before deploy
```

---

## Documentation Best Practices

### 1. Architecture Decision Records (ADRs)

**Format:**
```markdown
# ADR-XXX: [Title]

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded

## Context
What problem are we solving? What constraints exist?

## Decision
What did we decide to do?

## Consequences
What are the trade-offs? What changes because of this?

## Alternatives Considered
What other options did we evaluate and reject?
```

**Example Use Cases:**
- ADR-001: Why we chose SvelteKit over Next.js
- ADR-002: Feature flag strategy (Growthbook + caching)
- ADR-003: Video provider migration (OpenTok → DailyCo)

### 2. Runbooks (Operational Guides)

**Format:**
```markdown
# Runbook: [Problem/Incident Type]

## Symptoms
How do you know this is happening?

## Impact
What breaks? Who's affected?

## Diagnosis
How to confirm this is the issue?

## Resolution
Step-by-step fix.

## Prevention
How to avoid this in the future?
```

**Example Use Cases:**
- Stuck consultations in queue
- Payment webhook failures
- Video session creation errors

### 3. Code Guides

**Format:**
```markdown
# Guide: [Topic]

## Overview
What is this and why do we use it?

## Quick Start
Minimal example to get started.

## Common Patterns
How we typically use this in the codebase.

## Gotchas & Pitfalls
Non-obvious things that will bite you.

## Examples
Links to real code examples in the repo.
```

---

## Integration with Development Workflow

### PR Template Addition

Add to `.github/pull_request_template.md`:
```markdown
## Documentation
<!-- Check all that apply -->
- [ ] This PR includes updates to `/docs` for new features/patterns
- [ ] No documentation needed (bug fix, refactor with no API changes)
- [ ] Created ADR for architectural decision
- [ ] Updated runbook for operational changes

<!-- If you checked "No documentation needed", explain why -->
```

### Code Review Checklist

Add to review process:
- If PR introduces new pattern → Require documentation
- If PR fixes tricky bug → Require gotchas.md update
- If PR changes architecture → Require ADR

### Onboarding Process

New engineers must:
1. Read `docs/onboarding/new-engineer.md`
2. Complete codebase tour
3. Submit first PR: "Add myself to CONTRIBUTORS.md + fix a typo in docs"
   - Forces them to read docs
   - Gets them comfortable with contribution flow

---

## Examples from Other Companies

### Stripe's "Dev Docs" Approach
- Heavy focus on "how-to" guides
- Code examples for every major pattern
- "Recipes" for common tasks

### GitLab's Handbook
- Everything documented, even company processes
- Async-first: "Write it down or it didn't happen"
- Encourages iterative improvement

### Basecamp's Shape Up
- Documents the "why" behind processes
- Living document that evolves
- Team contributes improvements

---

## Metrics for Success

After 3 months, measure:
- ✅ New engineer onboarding time reduced by 30%+
- ✅ Repeat questions in Discord/Slack reduced
- ✅ Docs referenced in at least 20% of PRs
- ✅ Team members contribute to docs (not just me)

---

## Anti-Patterns to Avoid

❌ **Outdated docs worse than no docs**
- Solution: Add "last reviewed" date, mark stale docs

❌ **Over-documentation paralysis**
- Solution: Start small, document as you go

❌ **Docs as afterthought**
- Solution: Make docs part of PR checklist

❌ **Single owner (bus factor = 1)**
- Solution: Encourage team contributions, rotate doc reviews

---

## Implementation Steps

### Step 1: Create Minimal Viable Docs (MVD)
1. Create `/docs` folder
2. Add README with structure explanation
3. Create 3 initial documents:
   - `architecture/consultation-flow.md` (critical path)
   - `gotchas/common-bugs.md` (highest ROI)
   - `onboarding/codebase-tour.md` (help new engineers)

### Step 2: Socialize with Team
1. Post in Discord:
   ```
   Hi team 👋

   We now have a /docs folder in the monorepo for shared knowledge.

   **Why**: Right now, a lot of knowledge lives in people's heads or Claude Code memory.
   When someone learns something non-obvious, it should benefit the whole team.

   **What's there**:
   - Architecture docs (how consultation flow works)
   - Common gotchas (bugs you'll probably hit)
   - Onboarding guide (for new engineers)

   **How to contribute**:
   When you figure out something tricky → add it to gotchas.md
   When you make architectural decision → create an ADR
   When you fix a production issue → update runbooks

   Link: [monorepo/docs/README.md]

   Let's compound our knowledge 📚
   ```

2. Add to next standup agenda: "Demo of new docs system"

### Step 3: Lead by Example
- When reviewing PRs, ask: "Should this be documented?"
- When fixing bugs, update gotchas.md
- When making decisions, write ADRs

### Step 4: Iterate
- After 1 month: Ask team what's missing
- After 3 months: Measure impact on onboarding time
- Continuously: Keep docs up to date

---

## Quick Wins (Do These First)

### 1. Document Consultation Flow (30m)
**Why**: Most critical path, affects every consultation
**What**: Flowchart + explanation of matching algorithm
**Impact**: Huge - everyone touches this code

### 2. Known Gotchas (15m)
**Why**: Prevents repeat questions
**What**: List of "why does X happen?" with answers
**Examples**:
- Why `notify-matched` endpoint does nothing
- Why feature flags need caching
- Why we have both DailyCo and Vonage

### 3. Onboarding Guide (30m)
**Why**: Reduces time-to-productivity for new engineers
**What**: "First week" checklist and codebase map
**Impact**: Direct ROI on hiring

---

## Tools & Automation

### Optional Enhancements

**1. Docs Linting**
```bash
# Add to CI pipeline
npm install -g markdownlint-cli
markdownlint 'docs/**/*.md'
```

**2. Link Checking**
```bash
# Catch broken internal links
npm install -g markdown-link-check
find docs -name "*.md" -exec markdown-link-check {} \;
```

**3. Docs Site (Future)**
- Use Docusaurus, VitePress, or MkDocs
- Auto-deploy on PR merge
- Search functionality

---

## Context & Resources

### Related to:
- Team Memo: Operating with Agency & Clarity
- Team Memo: Daily Standup Reports
- Onboarding process improvements

### Inspiration:
- [Stripe's Engineering Blog](https://stripe.com/blog/engineering)
- [GitLab Handbook](https://about.gitlab.com/handbook/)
- [ADR GitHub Org](https://adr.github.io/)
- [Divio Documentation System](https://documentation.divio.com/)

### Similar Tools:
- Confluence (too heavy for code-level docs)
- Notion (good for product, not code)
- GitHub Wiki (harder to version control)
- **Markdown in `/docs`** ✓ (simple, version-controlled, searchable)

---

## Notes

- This is about **compounding knowledge**, not creating bureaucracy
- Start minimal, grow organically based on team needs
- Documentation should reduce friction, not create it
- "If it's not written down, it didn't happen" - GitLab principle
- Make it easy to contribute: Markdown, in the repo, reviewed in PRs

**Key Insight**: Claude Code memory is powerful for me, but it's a single point of failure. The team needs shared context to move faster independently.

