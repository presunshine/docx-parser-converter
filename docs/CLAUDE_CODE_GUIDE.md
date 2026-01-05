# Claude Code Implementation Guide

> Based on Boris Cherny's (creator of Claude Code) tips and best practices.
> Sources: [Original Thread](https://x.com/bcherny/status/2007179832300581177), [Thread Reader](https://twitter-thread.com/t/2007179832300581177)

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Session Management](#session-management)
3. [Model Selection](#model-selection)
4. [Plan Mode](#plan-mode)
5. [CLAUDE.md - Institutional Memory](#claudemd---institutional-memory)
6. [Slash Commands](#slash-commands)
7. [Subagents](#subagents)
8. [Hooks](#hooks)
9. [Permissions Strategy](#permissions-strategy)
10. [MCP Servers](#mcp-servers)
11. [Session Forking](#session-forking)
12. [Long-Running Tasks](#long-running-tasks)
13. [Verification - The Force Multiplier](#verification---the-force-multiplier)
14. [Context Window Management](#context-window-management)

---

## Core Philosophy

Boris Cherny's setup is "surprisingly vanilla" - Claude Code works great out of the box. The key insight:

> **"Give Claude a way to verify its work. If Claude has that feedback loop, it will 2-3x the quality of the final result."**

This is the single most important principle for getting excellent results.

---

## Session Management

### Parallel Sessions Strategy

Run multiple Claude instances simultaneously for maximum throughput:

```
Terminal Setup:
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Claude 1│ Claude 2│ Claude 3│ Claude 4│ Claude 5│
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

- **Terminal sessions**: 5 numbered tabs (1-5) with system notifications
- **Web sessions**: 5-10 additional sessions on claude.ai/code
- **Mobile sessions**: Start sessions from iOS app for async work

### Session Commands

```bash
# Start new session
claude

# Continue previous session
claude --continue

# Resume specific session
claude --resume

# Teleport between local and web sessions
claude --teleport
```

### System Notifications

Enable notifications to know when Claude needs input:
```bash
# macOS
# System Preferences > Notifications > Terminal > Allow Notifications
```

---

## Model Selection

### Recommended: Opus 4.5 with Thinking

Boris uses **Opus 4.5 with thinking** for everything:

> "Even though it's bigger and slower than Sonnet, since you have to steer it less and it's better at tool use, it is almost always faster in the end."

### When to Use Each Model

| Model | Best For |
|-------|----------|
| **Opus 4.5** | Complex tasks, multi-file changes, architecture decisions |
| **Sonnet** | Quick fixes, simple edits, cost-sensitive work |
| **Haiku** | Subagent tasks, verification, repetitive operations |

### Configuration

```bash
# Set default model in settings
claude config set model opus

# Or per-session
claude --model opus
```

---

## Plan Mode

### The Planning Workflow

Start most sessions in Plan mode for complex tasks:

```
Shift+Tab (twice) → Enter Plan Mode
```

### The Process

1. **Enter Plan Mode**: Shift+Tab twice
2. **Iterate on Plan**: Go back and forth until satisfied
3. **Switch to Auto-Accept**: When plan is solid
4. **Execute**: Claude usually 1-shots it

### Example Workflow

```
User: I need to add pagination to the API

[Plan Mode]
Claude: Here's my plan:
1. Add pagination parameters to endpoint
2. Modify query to use LIMIT/OFFSET
3. Add metadata to response (total, page, per_page)
4. Update tests

User: Also add cursor-based pagination option

Claude: Updated plan:
1. Add pagination parameters (page-based and cursor-based)
2. Create pagination utility functions
3. Modify queries for both strategies
4. Add response metadata
5. Update tests for both modes

User: Looks good, proceed

[Auto-Accept Mode - Claude executes the plan]
```

### When to Use Plan Mode

- Pull request preparation
- Multi-file changes
- Architecture decisions
- Refactoring tasks
- Any non-trivial work

---

## CLAUDE.md - Institutional Memory

### Purpose

CLAUDE.md serves as **institutional memory** - a living document that prevents Claude from repeating mistakes.

### Structure

```markdown
# CLAUDE.md

## Project Overview
Brief description of what this project does.

## Tech Stack
- Language: Python 3.10+
- Framework: FastAPI
- Database: PostgreSQL
- Testing: pytest

## Commands
```bash
# Run tests
pytest

# Type checking
pyright

# Linting
ruff check .
```

## Architecture
Key architectural decisions and patterns.

## Code Style
- Use type hints everywhere
- Prefer composition over inheritance
- Keep functions under 20 lines

## Common Mistakes to Avoid
- Don't use `datetime.now()` - use `datetime.utcnow()`
- Always handle the empty list case
- Remember to close database connections

## Testing Requirements
- All new code must have tests
- Minimum 80% coverage
- Use fixtures for database tests
```

### Best Practices

1. **Check into Git**: Share with the whole team
2. **Update Frequently**: Multiple times per week
3. **Add Mistakes**: When Claude does something wrong, document it
4. **Code Review Integration**: Tag @.claude in PRs to update guidelines

### GitHub Action for PR Reviews

```yaml
# .github/workflows/claude-review.yml
name: Claude Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Claude Review
        # When reviewer tags @.claude, update CLAUDE.md
```

---

## Slash Commands

### Purpose

Save repetitive prompting by creating reusable workflows.

### Location

```
.claude/commands/
├── commit-push-pr.md
├── run-tests.md
├── fix-types.md
└── review-code.md
```

### Example: /commit-push-pr

```markdown
<!-- .claude/commands/commit-push-pr.md -->
# Commit, Push, and Create PR

## Pre-computed Context
```bash
git status
git diff --cached
git log -3 --oneline
```

## Instructions
1. Review the staged changes above
2. Write a descriptive commit message following conventional commits
3. Commit the changes
4. Push to the current branch
5. Create a PR with:
   - Clear title
   - Description of changes
   - Testing notes
```

### Example: /run-tests

```markdown
<!-- .claude/commands/run-tests.md -->
# Run Tests and Fix Failures

## Pre-computed Context
```bash
git diff --name-only HEAD~1 | grep -E '\.(py|ts)$'
```

## Instructions
1. Identify changed files from above
2. Run relevant tests:
   - Python: `pytest tests/unit/ -v`
   - TypeScript: `npm test`
3. If tests fail:
   - Analyze the failure
   - Fix the issue
   - Re-run to verify
4. Report results
```

### Example: /fix-types

```markdown
<!-- .claude/commands/fix-types.md -->
# Fix Type Errors

## Instructions
1. Run type checker:
   ```bash
   pyright
   ```
2. For each error:
   - Understand the type mismatch
   - Fix with proper typing (avoid `Any` unless necessary)
   - Re-run to verify
3. Continue until all errors are resolved
```

### Inline Bash for Pre-computation

Commands can include bash that runs before the prompt:

```markdown
<!-- .claude/commands/review-recent.md -->
# Review Recent Changes

## Context
```bash
git log -5 --oneline
git diff HEAD~1
```

## Instructions
Review the recent changes and provide feedback on:
- Code quality
- Potential bugs
- Performance concerns
- Test coverage
```

---

## Subagents

### Purpose

Delegate specialized tasks to focused subagents, keeping the main thread clean.

### Common Subagent Types

| Subagent | Purpose |
|----------|---------|
| `code-simplifier` | Reduce complexity, remove duplication |
| `verify-app` | End-to-end verification |
| `build-validator` | Ensure builds pass |
| `code-architect` | Design decisions |
| `test-writer` | Generate comprehensive tests |

### Example: Verification Subagent

```markdown
<!-- .claude/commands/verify.md -->
# Verify Changes

Launch a subagent to verify the current changes work correctly.

## Subagent Instructions
1. Identify what was changed
2. Run the appropriate verification:
   - Unit tests for logic changes
   - Integration tests for API changes
   - Build for structure changes
3. If verification fails, report the issue
4. Do NOT fix issues - just report them
```

### Example: Code Simplifier Subagent

```markdown
<!-- .claude/commands/simplify.md -->
# Simplify Code

Launch a subagent to simplify the specified code.

## Subagent Instructions
1. Analyze the code for:
   - Unnecessary complexity
   - Duplication
   - Dead code
   - Over-abstraction
2. Propose simplifications
3. Implement approved changes
4. Verify tests still pass
```

---

## Hooks

### Purpose

Automate repetitive tasks like formatting, linting, and verification.

### Hook Types

| Hook | Trigger |
|------|---------|
| `PreToolUse` | Before a tool runs |
| `PostToolUse` | After a tool completes |
| `Stop` | When Claude stops |

### Configuration Location

```
.claude/settings.json
```

### Example: Auto-Format on Edit

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "ruff format $FILE || true"
          }
        ]
      }
    ]
  }
}
```

### Example: Run Tests After Changes

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "pytest tests/unit/ -x -q 2>/dev/null || echo 'Tests failed'"
          }
        ]
      }
    ]
  }
}
```

### Example: Type Check on Save

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "pyright --outputjson 2>/dev/null | head -20 || true"
          }
        ]
      }
    ]
  }
}
```

### The "Final 10%" Problem

> "A PostToolUse hook handles the final 10% of code formatting, preventing CI errors while letting Claude generate quality code initially."

Use hooks to catch:
- Formatting issues
- Import sorting
- Trailing whitespace
- Line length violations

---

## Permissions Strategy

### Avoid Dangerous Mode

Never use `--dangerously-skip-permissions`. Instead:

### Pre-Allow Safe Commands

```json
// .claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(pytest *)",
      "Bash(pyright *)",
      "Bash(ruff *)",
      "Bash(npm run *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(grep *)",
      "Bash(find *)"
    ]
  }
}
```

### Pattern-Based Permissions

```json
{
  "permissions": {
    "allow": [
      "Bash(bun run build:*)",
      "Bash(bun run test:*)",
      "Bash(bun run lint:*)"
    ]
  }
}
```

### Using /permissions Command

```
/permissions add Bash(pytest *)
/permissions add Bash(pyright)
/permissions list
```

### Benefits

- Claude runs autonomously without babysitting every command
- Safe commands execute without prompts
- Dangerous commands still require approval
- Team consistency via checked-in settings

---

## MCP Servers

### Purpose

Extend Claude's capabilities with external tools.

### Configuration

```json
// .mcp.json
{
  "servers": {
    "slack": {
      "command": "mcp-slack",
      "env": {
        "SLACK_TOKEN": "${SLACK_TOKEN}"
      }
    },
    "sentry": {
      "command": "mcp-sentry",
      "env": {
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}"
      }
    },
    "bigquery": {
      "command": "mcp-bigquery",
      "env": {
        "GOOGLE_PROJECT": "my-project"
      }
    }
  }
}
```

### Common MCP Integrations

| MCP | Capability |
|-----|------------|
| **Slack** | Post messages, read channels |
| **Sentry** | Retrieve error logs |
| **BigQuery** | Run SQL queries |
| **GitHub** | Manage issues, PRs |
| **Linear** | Track tasks |

### On-Demand Tool Loading

Tools load only when invoked, avoiding context bloat:

```json
{
  "servers": {
    "database": {
      "command": "mcp-postgres",
      "lazy": true
    }
  }
}
```

---

## Session Forking

### Purpose

Experiment with alternatives without losing your main work.

### Commands

```bash
# Fork current session
claude --continue --fork-session

# In the forked session, press Esc twice to rewind
# Then branch from any earlier message
```

### Use Cases

1. **Prototyping**: Try different approaches
2. **A/B Testing**: Compare implementations
3. **Recovery**: Branch from before a mistake
4. **Parallel Exploration**: Investigate multiple solutions

### Example Workflow

```
Main Session:
├── Implement feature A
├── Add tests
└── [Fork here]
    ├── Branch 1: Try approach X
    └── Branch 2: Try approach Y
        └── [This worked better - merge back]
```

---

## Long-Running Tasks

### The Challenge

Extended autonomous execution requires:
- Deterministic exit conditions
- Progress monitoring
- Error recovery

### Strategy 1: Verification Agents

Launch a background agent to verify completion:

```markdown
<!-- Verification agent prompt -->
Monitor the build process:
1. Check build status every 30 seconds
2. When build completes:
   - If success: Report "Build passed"
   - If failure: Analyze logs and report issues
3. Do not attempt fixes - just report
```

### Strategy 2: Stop Hooks

Define exit conditions that automatically resume Claude:

```json
{
  "hooks": {
    "Stop": [
      {
        "condition": "tests_passing",
        "action": "continue"
      },
      {
        "condition": "coverage_threshold",
        "threshold": 80,
        "action": "continue"
      }
    ]
  }
}
```

### Strategy 3: Ralph Wiggum Plugin

For truly autonomous, multi-hour loops:

```bash
# Install the plugin
claude plugins install ralph-wiggum

# Run with autonomous mode
claude --permission-mode=dontAsk
```

> Boris achieved "~42 hours straight" of uninterrupted execution using Stop hooks.

### Best Practices

1. **Define Hard Exit Conditions**: Passing tests, coverage thresholds
2. **Use Sandboxes**: Isolate long-running tasks
3. **Monitor Progress**: Check in periodically
4. **Set Timeouts**: Prevent infinite loops

---

## Verification - The Force Multiplier

### The Core Principle

> **"Give Claude a way to verify its work. If Claude has that feedback loop, it will 2-3x the quality of the final result."**

### Verification Methods by Domain

| Domain | Verification Method |
|--------|---------------------|
| **Backend** | Unit tests, integration tests, API tests |
| **Frontend** | Browser testing, visual regression |
| **Mobile** | Simulator testing |
| **Data** | Query validation, data integrity checks |
| **DevOps** | Deployment verification, health checks |

### Example: Test-Driven Verification

```markdown
# Verification Workflow

1. Write/modify code
2. Run tests: `pytest tests/unit/ -v`
3. If tests fail:
   - Analyze failure
   - Fix the issue
   - Re-run tests
4. Continue until all tests pass
5. Run type checker: `pyright`
6. Fix any type errors
7. Run linter: `ruff check .`
8. Fix any lint errors
9. Final verification: full test suite
```

### Example: Output Comparison Verification

```markdown
# Output Verification Workflow

1. Generate output for test input
2. Compare against expected output:
   ```bash
   diff expected_output.txt actual_output.txt
   ```
3. If differences exist:
   - Analyze the discrepancy
   - Determine if it's a bug or expected change
   - Fix or update expected output
4. Continue until outputs match
```

### Example: Browser Verification

Boris's team uses a Chrome extension to test changes:

```markdown
# Browser Verification

1. Make changes to frontend code
2. Open browser to test page
3. Verify:
   - Functionality works as expected
   - UI renders correctly
   - No console errors
4. Iterate until solid
```

### Building Verification into Workflows

Create a verification slash command:

```markdown
<!-- .claude/commands/verify-all.md -->
# Complete Verification

Run all verification steps:

1. **Type Checking**
   ```bash
   pyright
   ```

2. **Linting**
   ```bash
   ruff check .
   ```

3. **Unit Tests**
   ```bash
   pytest tests/unit/ -v
   ```

4. **Integration Tests**
   ```bash
   pytest tests/integration/ -v
   ```

5. **Output Verification**
   ```bash
   python scripts/verify_outputs.py
   ```

Report any failures and fix them before proceeding.
```

---

## Context Window Management

### Monitoring Context Usage

```bash
/context
```

This shows what's consuming your context window:
- Recent messages
- File contents
- Tool outputs
- MCP tools loaded

### Common Context Bloaters

1. **Large log outputs**
2. **Unnecessary file reads**
3. **Verbose tool responses**
4. **Too many MCP tools loaded**

### Mitigation Strategies

1. **Auto-compact**: Recent updates suppress noisy output
2. **Lazy tool loading**: Load MCP tools on-demand
3. **Selective file reading**: Read only what's needed
4. **Output truncation**: Limit verbose command output

### Best Practices

```bash
# Good: Read specific lines
Read file.py lines 50-100

# Bad: Read entire large file
Read file.py

# Good: Targeted grep
grep "error" --include="*.log" | head -20

# Bad: Dump all logs
cat *.log
```

---

## Quick Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `claude` | Start new session |
| `claude --continue` | Continue previous session |
| `claude --continue --fork-session` | Fork current session |
| `claude --teleport` | Sync with web session |
| `Shift+Tab` (x2) | Enter Plan Mode |
| `/context` | Check context usage |
| `/permissions` | Manage command permissions |

### Essential Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Institutional memory |
| `.claude/settings.json` | Permissions, hooks |
| `.claude/commands/*.md` | Slash commands |
| `.mcp.json` | MCP server config |

### The Golden Rule

> **"Give Claude a way to verify its work."**

This single principle, consistently applied, will dramatically improve your results.

---

## Further Reading

- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Boris Cherny's Original Thread](https://x.com/bcherny/status/2007179832300581177)
- [Claude Code Power Tips](https://www.storminthecastle.com/posts/claude_tips/)
- [How Boris Uses Claude Code](https://paddo.dev/blog/how-boris-uses-claude-code/)
