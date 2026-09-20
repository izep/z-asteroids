# Task: Project Planning & Backlog Management

Review the current project state, produce an updated task list as JSON output, and return the next task to implement.

## Step 1: Gather Context
- Read `ralph/task-status.json` to understand the current task inventory and what has already been completed.
- Read `requirements.md` first. Treat it as the authoritative source of product requirements and acceptance expectations.
- Read `README.md` and `ralph/epic.md` for implementation context and epic priority.
- Survey the codebase to understand what is already implemented and working.

## Step 2: Output the Updated Task List as JSON
Produce a JSON array of ALL tasks still needed to complete the project. Emit it as the FIRST block in your response, inside a fenced `json` code block.

Rules for building the task list:
- Include ALL remaining tasks: features, integrations, tests, documentation, and quality work required by the epic and requirements.
- Do NOT include tasks that are already `"done"` or `"blocked"`.
- Preserve existing `id` values when the same work is still needed.
- Assign new IDs for genuinely new tasks: start from (highest existing ID + 1) and increment for each.
- Order tasks by optimal implementation sequence, resolving dependencies first.
- Set `status` to `"backlog"` for every entry.

Each task object must have exactly these four keys:
- `id`: integer
- `title`: short descriptive string (3-8 words)
- `description`: 1-2 sentence summary of the task
- `status`: `"backlog"`

## Step 3: Select and Describe the Next Task
Select the first `"backlog"` task from the updated list as the current task.
Write a full, implementation-ready description that includes:
- What needs to be done and why it matters
- Clear implementation guidance
- Testing steps
- Acceptance criteria

## Output Format
1. A fenced JSON block with the full updated task list:
```json
[
  { "id": 1, "title": "Short task title", "description": "Summary", "status": "backlog" }
]
```

2. The full implementation-ready task description prose.

3. The task ID signal at the very end:
```
<task-id>N</task-id>
```

## Completion Rule
If there are no remaining `"backlog"` tasks (the project/epic is complete), output exactly:
```
<status>complete</status>
```
