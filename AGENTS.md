# Guidelines for Codex Agents

This repository hosts multiple subprojects for the FreelanceShield platform including Solana programs, a React frontend, and a small Python backend located in `backend-python/`.

## Commit and PR style
- Keep commit messages concise and descriptive.
- PR descriptions must include a **Summary** of notable changes and a **Testing** section listing commands run.

## Required checks
When modifying or adding Python files under `backend-python/`, run the following commands before committing:

```bash
python -m pip install -r backend-python/requirements.txt
python -m py_compile backend-python/**/*.py
```

These ensure dependencies install and the code has no syntax errors.

