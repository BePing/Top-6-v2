# Release Please Configuration

This project uses [Release Please](https://github.com/googleapis/release-please) to automate releases and Docker image publishing to GitHub Container Registry (GHCR).

## How It Works

1. **Commit with Conventional Commits**: Use conventional commit messages
2. **Release PR Creation**: Release Please automatically creates/updates a release PR
3. **Merge Release PR**: When merged, triggers automated release and Docker build
4. **Docker Images Published**: Multi-platform images pushed to GHCR

## Conventional Commits

Use these prefixes for your commit messages:

- `feat:` - New features (triggers minor version bump)
- `fix:` - Bug fixes (triggers patch version bump)
- `feat!:` or `fix!:` - Breaking changes (triggers major version bump)

**Examples:**
```bash
git commit -m "feat: add Excel export functionality"
git commit -m "fix: resolve Docker container startup issue"
git commit -m "feat!: migrate to Node.js 20 (breaking change)"
```

## Docker Images

After each release, images are available at:

```bash
# Pull latest release
docker pull ghcr.io/florentcardoen/top-6-v2:latest

# Pull specific version
docker pull ghcr.io/florentcardoen/top-6-v2:v2.6.0

# Run with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

**Platforms:** linux/amd64, linux/arm64