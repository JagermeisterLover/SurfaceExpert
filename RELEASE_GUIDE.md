# Release Guide for SurfaceExpert

## Automatic GitHub Releases

This project is configured to automatically build and release Windows executables via GitHub Actions.

## How It Works

### Regular Builds (Testing)
- **Triggers:** Push to `main` or `claude/**` branches
- **Action:** Builds the app and uploads artifacts
- **Result:** Artifacts available for 30 days in Actions tab
- **No release created**

### Release Builds (Production)
- **Triggers:** Push a version tag (e.g., `v2.7.2`, `v2.7.3`)
- **Action:** Builds the app, creates a GitHub release, uploads executables
- **Result:** Public release with downloadable installers

## Creating a New Release

### Step 1: Update version in package.json
```json
{
  "version": "2.7.3"
}
```

### Step 2: Commit the version change
```bash
git add package.json
git commit -m "Bump version to 2.7.3"
git push origin main
```

### Step 3: Create and push a version tag
```bash
# Create a tag matching the version
git tag v2.7.3

# Push the tag to GitHub
git push origin v2.7.3
```

### Step 4: Wait for the build
- Go to: `https://github.com/JagermeisterLover/SurfaceExpert/actions`
- Watch the "Build Windows App" workflow
- Build takes ~5 minutes

### Step 5: Release is ready!
- Go to: `https://github.com/JagermeisterLover/SurfaceExpert/releases`
- Your new release `v2.7.3` will be available with:
  - ✅ **SurfaceExpert Setup 2.7.3.exe** (NSIS installer)
  - ✅ **SurfaceExpert-2.7.3-Portable.exe** (Portable executable)

## What Gets Released

Every release includes two executables:

1. **NSIS Installer** (`SurfaceExpert Setup X.X.X.exe`)
   - Traditional Windows installer
   - Creates Start Menu shortcuts
   - Creates Desktop shortcut
   - Includes uninstaller
   - No admin rights required for per-user install

2. **Portable Executable** (`SurfaceExpert-X.X.X-Portable.exe`)
   - Standalone executable
   - No installation needed
   - Run directly from any location
   - Perfect for USB drives or restricted environments

## Quick Release Commands

```bash
# Bump version, commit, tag, and push in one go
VERSION="2.7.3"

# Update package.json version first, then:
git add package.json
git commit -m "Release v$VERSION"
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"
```

## Testing Before Release

To test builds without creating a release:
1. Push to any `claude/**` branch
2. Or manually trigger workflow from Actions tab
3. Download artifacts from the workflow run
4. Test the executables
5. If good, create a version tag for the release

## Notes

- Tags must start with `v` (e.g., `v2.7.3`, not `2.7.3`)
- Version in package.json should match tag (optional but recommended)
- Releases are public and visible to all GitHub users
- Old releases remain available indefinitely
- You can create draft releases first, then publish them manually

## Troubleshooting

**Build fails:**
- Check the Actions tab for error logs
- Ensure package-lock.json is in sync (`npm install` and commit)

**Release not created:**
- Verify tag starts with `v`
- Check if tag was pushed to GitHub: `git push origin --tags`
- Ensure workflow has `contents: write` permission

**Executables not attached to release:**
- Check if build step succeeded in Actions
- Verify `dist/*.exe` files were created
- Check Actions logs for upload errors
