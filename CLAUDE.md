# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Repository Overview

This is a nascent repository with minimal initial scaffolding. As of the last update, the repository contains only:

- `README.md` — a bare placeholder header
- `CLAUDE.md` — this file

There is no application code, build tooling, or dependency configuration yet. The conventions below apply both to the current empty state and to future development as the project grows.

## Repository Structure

```
/
├── README.md       # Project overview (to be fleshed out)
└── CLAUDE.md       # AI assistant guidance (this file)
```

As the project develops, update this section to reflect the actual directory layout.

## Git Workflow

### Branches

- `master` — stable, production-ready code
- `claude/<session-id>` — branches created by AI-assisted sessions; always prefixed with `claude/`

### Commit Conventions

Write clear, imperative commit messages:

```
Add user authentication module
Fix null pointer in payment handler
Refactor database connection pool
```

- First line: 50 characters or fewer, imperative mood, no trailing period
- Blank line, then body if more context is needed
- Reference issue numbers where applicable: `Fixes #42`

### Push Process

Always push with tracking set:

```bash
git push -u origin <branch-name>
```

Never force-push to `master` without explicit permission.

## Development Guidelines for AI Assistants

### General Principles

1. **Read before modifying.** Always read a file before editing it. Understand existing code before suggesting changes.
2. **Minimal changes.** Only change what is directly requested or clearly necessary. Avoid scope creep.
3. **No speculative code.** Do not add error handling, abstractions, or features for hypothetical future requirements.
4. **No unnecessary files.** Prefer editing existing files over creating new ones. Do not create documentation unless asked.
5. **Security first.** Never introduce SQL injection, XSS, command injection, or other OWASP top-10 vulnerabilities.

### When Adding New Code

- Follow the language/framework conventions already present in the codebase (formatting, naming, file layout).
- Keep functions small and focused on a single responsibility.
- Do not add comments for self-evident code; only comment non-obvious logic.
- Do not add type annotations, docstrings, or tests to code you did not change.

### When the Project Grows

Update this file whenever:
- A new technology, language, or framework is introduced
- A build, test, or lint command is established
- A meaningful directory structure emerges
- Team conventions are agreed upon

## Commands (to be filled in)

Once tooling is established, document the key commands here. Example placeholders:

```bash
# Install dependencies
<command>

# Run tests
<command>

# Lint / format
<command>

# Build
<command>
```

## Key Conventions (to be filled in)

As the project develops, document language-specific style rules, naming conventions, and architectural decisions here.
