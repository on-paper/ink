---
description: Create a new release with automatic versioning, changelog updates, and git tagging
argument-hint: <major|minor|patch> [from-commit] [to-commit]
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# Release Command

Create a new release with the specified version bump type. This command will:
1. Bump the version in package.json
2. Generate a changelog entry from recent commits
3. Create and push a git tag
4. Prepare a release commit

## Usage Examples:
- `/release patch` - Create a patch release with all recent commits
- `/release minor abc123 def456` - Create a minor release with commits from abc123 to def456
- `/release major HEAD~10 HEAD` - Create a major release with last 10 commits

## Steps:

1. Parse the arguments to determine version type and commit range
2. Read current version from package.json
3. Calculate new version based on type (major/minor/patch)
4. Fetch commits in the specified range (or recent commits if no range specified)
5. Categorize commits into features, fixes, and other changes
6. Update changelog.json with new entry: summarize everything that has been done, be concise and user-facing. Those changelogs should make the user feel cared for.
7. Update package.json version
8. Create a git commit with the changes
9. Create a git tag for the new version
10. Show summary and next steps

Arguments provided: $ARGUMENTS

Please execute the release process according to the version type and commit range specified.