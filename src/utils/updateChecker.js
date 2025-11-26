/**
 * Update Checker Utility
 * Checks GitHub releases for new versions
 */

const GITHUB_REPO = 'JagermeisterLover/SurfaceExpert';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_REPO}/releases`;

/**
 * Compare version strings (e.g., "2.7.0" vs "2.6.0")
 * @param {string} currentVersion - Current app version
 * @param {string} latestVersion - Latest version from GitHub
 * @returns {boolean} - True if latest version is newer
 */
export function isNewerVersion(currentVersion, latestVersion) {
  // Remove 'v' prefix if present
  const current = currentVersion.replace(/^v/, '').split('.').map(Number);
  const latest = latestVersion.replace(/^v/, '').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    if (latest[i] > current[i]) return true;
    if (latest[i] < current[i]) return false;
  }
  return false;
}

/**
 * Check for updates from GitHub releases
 * @param {string} currentVersion - Current app version
 * @returns {Promise<object>} - Update information or null
 */
export async function checkForUpdates(currentVersion) {
  try {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SurfaceExpert'
      }
    });

    if (!response.ok) {
      console.error('Failed to check for updates:', response.status);
      return null;
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');

    if (isNewerVersion(currentVersion, latestVersion)) {
      return {
        available: true,
        version: latestVersion,
        releaseDate: release.published_at,
        releaseNotes: release.body,
        downloadUrl: GITHUB_RELEASES_URL,
        assets: release.assets.map(asset => ({
          name: asset.name,
          size: asset.size,
          downloadUrl: asset.browser_download_url
        }))
      };
    }

    return { available: false };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return null;
  }
}

/**
 * Get the GitHub releases page URL
 * @returns {string} - GitHub releases URL
 */
export function getReleasesUrl() {
  return GITHUB_RELEASES_URL;
}
