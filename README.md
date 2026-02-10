# jungle-rpg

## Git push without conflicts

Use the helper script:

```bash
./scripts/sync-and-push.sh origin work
```

What it does:
1. checks that remote exists,
2. fetches latest commits,
3. rebases your branch on top of remote branch,
4. pushes with upstream setup.

If remote is not configured yet:

```bash
git remote add origin <your-github-repo-url>
```

