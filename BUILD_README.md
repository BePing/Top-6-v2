# Build Process Documentation

This document describes the improved build process for the Top-6 application, including Rollup bundling, Docker containerization, and CI/CD pipeline.

## Overview

The build process has been enhanced with:
- **esbuild**: Fast JavaScript/TypeScript bundler optimized for Node.js applications
- **Docker**: Multi-stage containerization for production deployment
- **GitHub Actions**: Automated CI/CD pipeline with security scanning
- **Multi-platform support**: AMD64 and ARM64 architectures

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn package manager

## Build Commands

### Development Build
```bash
# Install dependencies
npm install

# Development build with watch mode
npm run build:watch

# Single development build
npm run build:esbuild
```

### Production Build
```bash
# Production build (minified, optimized)
npm run build:release

# Clean and rebuild
npm run clean && npm run build:release
```

### Docker Commands
```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Build for GitHub Container Registry
npm run docker:build:ghcr

# Push to GitHub Container Registry
npm run docker:push:ghcr
```

## esbuild Configuration

The esbuild configuration provides:

- **TypeScript compilation** with source maps
- **CommonJS output** for Node.js compatibility
- **External dependencies** handling for Node.js modules
- **Production optimization** with built-in minification
- **Fast bundling** optimized for Node.js applications

### Key Features
- Tree-shaking for unused code elimination
- Source map generation for debugging
- External dependency management
- Production/development environment switching
- Extremely fast build times (10-100x faster than alternatives)

## Docker Configuration

### Multi-stage Build
1. **Builder stage**: Installs dependencies and builds the application
2. **Production stage**: Creates minimal runtime image with only production dependencies

### Security Features
- Non-root user execution
- Health checks
- Minimal attack surface
- Alpine Linux base for smaller footprint

### Environment Variables
- `NODE_ENV`: Controls build optimization and runtime behavior
- Configurable through Docker Compose or runtime environment

## Docker Compose

### Production Service
```bash
docker-compose up top-6
```
- Runs on port 3000
- Production-optimized build
- Health monitoring
- Persistent volume mounts

### Development Service
```bash
docker-compose up top-6-dev
```
- Runs on port 3001
- Source code mounting for hot reload
- Development dependencies
- Watch mode for automatic rebuilds

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) includes:

1. **Test Job**
   - Code checkout
   - Dependency installation
   - Linting and testing
   - Build verification

2. **Build and Push Job**
   - Docker image building
   - Multi-platform support (AMD64/ARM64)
   - GitHub Container Registry push
   - Automatic tagging

3. **Security Scan Job**
   - Trivy vulnerability scanning
   - SARIF output for GitHub Security tab
   - Container image analysis

### Trigger Conditions
- Push to main/develop branches
- Tag releases (v*)
- Pull requests to main/develop

### Registry Integration
- Automatic login to GitHub Container Registry
- Image metadata extraction
- Semantic versioning support
- Branch-based tagging

## Build Artifacts

### Output Structure
```
dist/
├── main.js              # Main application bundle
├── main.js.map         # Source map (development)
└── functions.js        # Functions entry point
```

### Docker Images
- `top-6:latest` - Local development
- `ghcr.io/<repo>:latest` - Production registry
- `ghcr.io/<repo>:<tag>` - Versioned releases

## Environment Configuration

### Development
- Source maps enabled
- Watch mode available
- Hot reload support
- Debug information preserved

### Production
- Code minification
- Tree shaking optimization
- Source maps disabled
- Performance optimized

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check TypeScript compilation errors
   - Verify dependency installation
   - Ensure Node.js version compatibility

2. **Docker Build Issues**
   - Clear Docker cache: `docker system prune -a`
   - Check .dockerignore exclusions
   - Verify multi-stage build targets

3. **CI/CD Failures**
   - Review GitHub Actions logs
   - Check repository permissions
   - Verify secrets configuration

### Debug Commands
```bash
# Check build output
npm run build:rollup -- --verbose

# Docker build with detailed output
docker build --progress=plain -t top-6:debug .

# Container inspection
docker exec -it top-6-app sh
```

## Performance Optimization

### Build Optimizations
- Tree shaking for unused code elimination
- External dependency management
- Source map generation control
- Built-in minification for production builds
- Extremely fast bundling with esbuild

### Runtime Optimizations
- Alpine Linux base image
- Multi-stage build reduction
- Layer caching optimization
- Health check monitoring

## Security Considerations

### Container Security
- Non-root user execution
- Minimal attack surface
- Regular vulnerability scanning
- Base image updates

### Build Security
- Dependency vulnerability checking
- Source code integrity
- Environment isolation
- Secret management

## Monitoring and Maintenance

### Health Checks
- Application readiness verification
- Automatic restart on failure
- Performance monitoring
- Resource usage tracking

### Update Process
1. Update source code
2. Rebuild Docker image
3. Deploy new container
4. Verify health status
5. Monitor performance metrics

## Support and Resources

- [esbuild Documentation](https://esbuild.github.io/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
