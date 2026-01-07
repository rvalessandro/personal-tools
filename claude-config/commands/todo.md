# Todo

You are helping create a todo item in Tana via the Input API.

## Tana API Config

```
Endpoint: https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2
Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmaWxlSWQiOiJVcWdlTVBHc2dnIiwiY3JlYXRlZCI6MTc2NzY4MTc5MjEwNSwidG9rZW5JZCI6IkJaV2t2cExULUlvMSJ9.zSGdI2vytclzzQjfXlr95mjCa2GsrWfjOHMAEf_etXk
Target: INBOX
```

## Supertag & Field IDs

```
#task: juAIyJUpch_A
#project: it_E4gKGrvRk
#person: vLYHAirth0ov

Fields:
- Status: UAzZw1ckDEpa (options: todo, doing, waiting, done)
- Priority: h5qdcTpl9oRt (options: 0 - Today, 1 - This week, 2 - This month, 3 - Someday)
- Estimate: nR5rTSO9M8DI (options: 5m, 15m, 30m, 1h, 2h, half-day)
- Due: bZnj57tjPiTp (date)
- Done at: GAJjT45fZFWi (date)
- Category: PaGDk-9l5yFc (reference to #project)
- Delegated to: 6AfI3k6GlOTl (reference to #person)
- Delegated what: abzF1TvgeJpD (text)
- Delegated when: f6LpbdWS_0Fg (date)

Project IDs:
- General: X9uqgwygWoAe
- Systeric: fnd-QbjyQS2A
- SeeDr: FRe2XfyxFMSD
- NoOn: 91mFSA58bmWc
- Laku6: rO7GTcx7BErQ
- Personal: NzmkGAI9Y-l3
```

## Schema

**Priority:**
- 0 - Today
- 1 - This week
- 2 - This month
- 3 - Someday

**Category:**
- General
- Systeric
- SeeDr (Systeric client)
- NoOn (Systeric client)
- Laku6 (carousell/lk6)
- Personal

**Time Estimate:**
- 5m | 15m | 30m | 1h | 2h | half-day

## Process

1. **Understand the task**: Ask about what needs to be done (or use provided arguments)

2. **Infer fields**: Based on the task, infer:
   - **Priority**: When does this need to happen?
   - **Category**: Which project/area?
   - **Estimate**: How long? Be realistic:
     - Quick fix, message → 5m-15m
     - Small task, review → 30m-1h
     - Feature, document → 2h
     - Complex work → half-day
   - **Due date**: If there's an implicit deadline

3. **Create via API**: Use curl to POST to Tana.

**REQUIRED FIELDS** - Always include these three:
- Status (UAzZw1ckDEpa): "todo"
- Priority (h5qdcTpl9oRt): "0 - Today" | "1 - This week" | "2 - This month" | "3 - Someday"
- Category (PaGDk-9l5yFc): Use project node ID from list above

```bash
curl -s -X POST "https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmaWxlSWQiOiJVcWdlTVBHc2dnIiwiY3JlYXRlZCI6MTc2NzY4MTc5MjEwNSwidG9rZW5JZCI6IkJaV2t2cExULUlvMSJ9.zSGdI2vytclzzQjfXlr95mjCa2GsrWfjOHMAEf_etXk" \
  -H "Content-Type: application/json" \
  -d '{
    "targetNodeId": "INBOX",
    "nodes": [
      {
        "name": "[Task title]",
        "supertags": [{"id": "juAIyJUpch_A"}],
        "children": [
          {"type": "field", "attributeId": "UAzZw1ckDEpa", "children": [{"name": "todo"}]},
          {"type": "field", "attributeId": "h5qdcTpl9oRt", "children": [{"name": "[priority]"}]},
          {"type": "field", "attributeId": "PaGDk-9l5yFc", "children": [{"id": "[PROJECT_NODE_ID]"}]},
          {"type": "field", "attributeId": "nR5rTSO9M8DI", "children": [{"name": "[estimate]"}]},
          {"name": "[Goal or context]"},
          {"name": "[Subtask 1]"}
        ]
      }
    ]
  }'
```

**Category Project IDs** (use these for the Category field):
- General: X9uqgwygWoAe
- Systeric: fnd-QbjyQS2A
- SeeDr: FRe2XfyxFMSD
- NoOn: 91mFSA58bmWc
- Laku6: rO7GTcx7BErQ
- Personal: NzmkGAI9Y-l3

4. **Structure as subnodes**: Add task details as child nodes, not description:
   - Goal statement
   - Actionable subtasks
   - Context and references
   - Nested details where helpful

5. **Confirm creation**: Show what was created

## Example

User: "I need to review the API docs for Stripe integration"

**Inferred:**
- Status: todo
- Priority: 1 - This week
- Category: SeeDr → use ID: FRe2XfyxFMSD
- Estimate: 1h

**API call sets these fields:**
```json
{"type": "field", "attributeId": "UAzZw1ckDEpa", "children": [{"name": "todo"}]},
{"type": "field", "attributeId": "h5qdcTpl9oRt", "children": [{"name": "1 - This week"}]},
{"type": "field", "attributeId": "PaGDk-9l5yFc", "children": [{"id": "FRe2XfyxFMSD"}]},
{"type": "field", "attributeId": "nR5rTSO9M8DI", "children": [{"name": "1h"}]}
```

**Result in Tana:**
```
Review Stripe API docs for integration
├── Status: todo
├── Priority: 1 - This week
├── Category: SeeDr
├── Estimate: 1h
├── Goal: Understand Stripe API for payment integration
└── [subtasks...]
```

---

User: "waiting on Kevin for the design mockups"

**Inferred:**
- Status: waiting
- Priority: 1 - This week
- Delegated to: Kevin
- Delegated what: Design mockups

Creates task with waiting status and delegation fields.

Start by asking: "What do you need to do?" (or use arguments if provided)
