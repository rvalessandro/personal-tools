---
tags: [habits, dashboard]
---

# Habit Dashboard

## Quick Links
- [[templates/daily|Daily Template]]
- [[templates/examples/bible-study|Bible Study Details]]
- [[templates/examples/gym|Gym Details]]

## This Week's Progress

```dataview
TABLE WITHOUT ID
  file.link as "Day",
  choice(contains(file.tasks.text, "Bible study") AND file.tasks.completed, "✅", "⬜") as "📖",
  choice(contains(file.tasks.text, "Gym") AND file.tasks.completed, "✅", "⬜") as "💪",
  choice(contains(file.tasks.text, "Swimming") AND file.tasks.completed, "✅", "⬜") as "🏊",
  choice(contains(file.tasks.text, "Fasting") AND file.tasks.completed, "✅", "⬜") as "🍽️",
  choice(contains(file.tasks.text, "Screen time") AND file.tasks.completed, "✅", "⬜") as "📱"
FROM "daily"
WHERE date >= date(today) - dur(7 days)
SORT date DESC
```

## January 2026

| Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-----|-----|-----|-----|-----|-----|-----|
| | | 1 [[daily/2026-01-01\|·]] | 2 [[daily/2026-01-02\|·]] | 3 | 4 | 5 |
| 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| 13 | 14 | 15 | 16 | 17 | 18 | 19 |
| 20 | 21 | 22 | 23 | 24 | 25 | 26 |
| 27 | 28 | 29 | 30 | 31 | | |

## Streaks

```dataview
TABLE WITHOUT ID
  "📖 Bible Study" as Habit,
  length(filter(rows, (r) => contains(r.file.tasks.text, "Bible study") AND r.file.tasks.completed)) as "Days Done"
FROM "daily"
WHERE date >= date("2026-01-01")
GROUP BY true
```

## Q1 2026 Targets

| Habit | Target | Current | Progress |
|-------|--------|---------|----------|
| Bible Study | 90 days | 0 | 0% |
| Gym | 39 sessions (3x/week) | 0 | 0% |
| Swimming | 52 sessions (4x/week) | 0 | 0% |
| Fasting | 26 days (Tue/Wed) | 0 | 0% |
| Screen < 45min | 90 days | 0 | 0% |
| Tithe | 24M IDR | 0 | 0% |

---

**Setup Required:**
1. Install **Dataview** plugin in Obsidian
2. Install **Templater** or use Daily Notes core plugin
3. Set daily note folder to `daily/`
4. Set daily note template to `templates/daily.md`
