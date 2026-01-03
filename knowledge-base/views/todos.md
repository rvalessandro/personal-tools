---
created: 2026-01-03
---

# All Todos

## Today
```dataview
TABLE WITHOUT ID
  file.link AS "Task",
  category AS "Cat",
  estimate AS "Est",
  due AS "Due"
FROM "20-todos"
WHERE status != "done" AND priority = "today"
SORT due ASC
```

## This Week
```dataview
TABLE WITHOUT ID
  file.link AS "Task",
  category AS "Cat",
  estimate AS "Est",
  due AS "Due"
FROM "20-todos"
WHERE status != "done" AND priority = "this-week"
SORT due ASC
```

## This Month
```dataview
TABLE WITHOUT ID
  file.link AS "Task",
  category AS "Cat",
  estimate AS "Est",
  due AS "Due"
FROM "20-todos"
WHERE status != "done" AND priority = "this-month"
SORT due ASC
```

## Someday
```dataview
TABLE WITHOUT ID
  file.link AS "Task",
  category AS "Cat"
FROM "20-todos"
WHERE status != "done" AND priority = "someday"
SORT file.name ASC
```

## Overdue
```dataview
TABLE WITHOUT ID
  file.link AS "Task",
  category AS "Cat",
  due AS "Due"
FROM "20-todos"
WHERE status != "done" AND due < date(today)
SORT due ASC
```

---

## By Category

### Systeric (1)
```dataview
LIST
FROM "20-todos"
WHERE status != "done" AND category = 1
SORT priority ASC
```

### SeeDr (2)
```dataview
LIST
FROM "20-todos"
WHERE status != "done" AND category = 2
SORT priority ASC
```

### NoOn (3)
```dataview
LIST
FROM "20-todos"
WHERE status != "done" AND category = 3
SORT priority ASC
```

### Laku6 (4)
```dataview
LIST
FROM "20-todos"
WHERE status != "done" AND category = 4
SORT priority ASC
```

### Personal (8)
```dataview
LIST
FROM "20-todos"
WHERE status != "done" AND category = 8
SORT priority ASC
```

### General (0)
```dataview
LIST
FROM "20-todos"
WHERE status != "done" AND category = 0
SORT priority ASC
```

---

## Delegated
```dataview
TABLE WITHOUT ID
  file.link AS "Task",
  delegated_to AS "To",
  delegated_when AS "When"
FROM "20-todos"
WHERE status != "done" AND owner = "not-me"
SORT delegated_when ASC
```

## Completed
```dataview
TABLE WITHOUT ID
  file.link AS "Task",
  category AS "Cat"
FROM "20-todos"
WHERE status = "done"
SORT file.mtime DESC
LIMIT 20
```
