# Documentation Maintenance Guide

> **Scope:** Rules for keeping /docs in sync with code changes. **Rendering context:** N/A **Last updated:** 2026-05-10

## Overview

This project follows a documentation-as-code policy. Every meaningful code change must be reflected in the appropriate `/docs/` file before a task is considered complete.

## Decision Tree

When you make a code change, walk through this checklist:

1. **Did you add, remove, or rename a file?**
   → Update `docs/architecture/folder-structure.md` and `docs/overview.md` directory map.

2. **Did you change a component's props or behavior?**
   → Update `docs/ui/component-library.md` and the relevant module doc in `docs/modules/`.

3. **Did you add or modify an AI flow?**
   → Update `docs/api/ai-flows.md` and the owning module doc.

4. **Did you change data processing logic?**
   → Update `docs/api/data-utilities.md` and `docs/architecture/data-flow.md`.

5. **Did you add or change state management?**
   → Update `docs/state/client-state.md`.

6. **Did you change the layout, routing, or rendering strategy?**
   → Update `docs/architecture/rendering-strategy.md`, `docs/ui/layout-system.md`.

7. **Did you add or change environment variables?**
   → Update `docs/infra/environment.md`.

8. **Did you change theming, styles, or CSS variables?**
   → Update `docs/ui/theming.md`.

9. **Did you change the build or deployment config?**
   → Update `docs/infra/build-and-deploy.md`.

10. **Did you change error handling or validation?**
    → Update the owning module doc.

## Commit Checklist

Before marking a task complete:

- [ ] Walked through the decision tree above
- [ ] Updated every identified doc file
- [ ] Used correct format: title, scope, rendering context, overview, sections, related docs
- [ ] Used agent annotations where appropriate (AGENT NOTE, AGENT SEE, AGENT AVOID)
- [ ] No file exceeds 200 lines
- [ ] All file paths are exact and verifiable
- [ ] Output a DOCS UPDATED summary listing every file changed

## File Size Rule

If a doc file would exceed 200 lines, split it into numbered parts:
- `auth.md` → `auth-part1.md`, `auth-part2.md`

## Format Template

Every doc file must follow this structure:

```
# [Title]

> **Scope:** [One sentence] **Rendering context:** [Server | Client | Isomorphic | N/A] **Last updated:** [YYYY-MM-DD]

## Overview
[2-4 sentence summary]

## [Section 1]
...

## Related Docs
- [path] — [why]
```

## Agent Annotations

Use these inline tags throughout all docs:

- `AGENT NOTE: <constraint or gotcha>` — Non-obvious rule AI must follow
- `AGENT SEE: <path#section>` — Cross-reference to related doc
- `AGENT OWNER: <module or file>` — Assigns responsibility
- `AGENT AVOID: <anti-pattern>` — Warns against common mistakes

## Related Docs

- [docs/overview.md] — Project index