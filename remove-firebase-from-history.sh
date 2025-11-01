#!/bin/bash
# Script to remove firebase_sdk.json from git history
# WARNING: This rewrites git history. All collaborators will need to re-clone or rebase.

set -e

echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  If you've already pushed this repository, you'll need to force push:"
echo "⚠️  git push --force-with-lease origin main"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo "Removing firebase_sdk.json from git history..."

# Remove file from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch firebase_sdk.json" \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "✅ Done! firebase_sdk.json has been removed from git history."
echo ""
echo "Next steps:"
echo "1. Verify the file is gone: git log --all --full-history -- firebase_sdk.json"
echo "2. Clean up backup refs: git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin"
echo "3. Force garbage collection: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
echo "4. If pushed to remote: git push --force-with-lease origin <branch-name>"

