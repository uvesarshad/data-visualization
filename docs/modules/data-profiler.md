# Data Profiler Module

> **Scope:** Data profiler overlay. **Rendering context:** Client **Last updated:** 2026-05-10

## Overview

The Data Profiler is a toggleable overlay that shows detailed column-level statistics for the entire dataset, including distributions, types, and missing values.

## Key Components

### DataProfiler
- **Path:** `src/components/dashboard/DataProfiler.tsx`
- **Purpose:** Displays column-by-column data profile with statistics
- **Props:** `data`, `open`, `onClose`
- **Client-side:** Yes
- **Trigger:** Activity icon in sidebar toggles `showProfiler` state in page.tsx

## Related Docs

- [docs/api/data-utilities.md] — Statistics and metadata functions