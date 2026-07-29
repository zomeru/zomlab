# Changesets

This directory contains auto-generated changeset files.

See [Changesets docs](https://github.com/changesets/changesets) for usage.

**Workflow:**
1. Make your changes
2. Run `bun run changeset` to describe the change
3. Commit the generated markdown file
4. On release, run `bun run version:packages` to consume all changesets, bump versions, and update changelogs
