# Commit, Push, and Create PR

Commit current changes, push to remote, and create a pull request.

## Pre-computed Context
```bash
git status --short
git diff --cached --stat
git log -3 --oneline
git branch --show-current
```

## Instructions

1. Review the changes shown above

2. Run quality checks first:
   ```bash
   ./scripts/post_session.sh --quick
   ```
   - If checks fail, DO NOT proceed - fix issues first

3. Stage all relevant changes:
   ```bash
   git add -A
   ```

4. Create a descriptive commit message following conventional commits:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `test:` for test additions
   - `refactor:` for code restructuring
   - `docs:` for documentation

5. Commit with the message

6. Push to current branch:
   ```bash
   git push -u origin $(git branch --show-current)
   ```

7. Create PR using `gh pr create`:
   - Title: Brief description of changes
   - Body: Summary, test plan, any notes

Report the PR URL when complete.
