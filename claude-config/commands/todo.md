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
- Status: _SoE5weHHoAJ (options: todo, doing, waiting, done)
- Priority: i6WS0d1KX45x (options: 0 - Today, 1 - This week, 2 - This month, 3 - Someday)
- Estimate: wIaLH2bO7l1a (options: 5m, 15m, 30m, 1h, 2h, half-day)
- Due: bZnj57tjPiTp (date)
- Done at: GAJjT45fZFWi (date)
- Category: jMwqEMblreJO (reference to #project)
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

3. **Create via API**: Use curl to POST to Tana:

```bash
curl -s -X POST "https://europe-west1-tagr-prod.cloudfunctions.net/addToNodeV2" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "targetNodeId": "INBOX",
    "nodes": [
      {
        "name": "[Task title]",
        "supertags": [{"id": "juAIyJUpch_A"}],
        "children": [
          {"type": "field", "attributeId": "_SoE5weHHoAJ", "children": [{"name": "todo"}]},
          {"type": "field", "attributeId": "i6WS0d1KX45x", "children": [{"name": "[priority]"}]},
          {"type": "field", "attributeId": "wIaLH2bO7l1a", "children": [{"name": "[estimate]"}]},
          {"name": "[Goal or context]"},
          {"name": "[Subtask 1]"},
          {"name": "[Subtask 2]", "children": [
            {"name": "[Nested detail]"}
          ]}
        ]
      }
    ]
  }'
```

4. **Structure as subnodes**: Add task details as child nodes, not description:
   - Goal statement
   - Actionable subtasks
   - Context and references
   - Nested details where helpful

5. **Confirm creation**: Show what was created

## Example

User: "I need to review the API docs for Stripe integration"

**Inferred:**
- Priority: 1 - This week
- Category: SeeDr (if context suggests)
- Estimate: 1h

**API call creates:**
```
Review Stripe API docs for integration
├── Status: todo
├── Priority: 1 - This week
├── Estimate: 1h
├── Goal: Understand Stripe API for payment integration
├── Review authentication and API keys
├── Check webhook setup requirements
├── Document integration approach
└── Reference: https://stripe.com/docs/api
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
