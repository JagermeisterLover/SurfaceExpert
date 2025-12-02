/**
 * AfterPack Hook - Explicitly set icon using rcedit
 * This ensures the installed .exe has the correct icon embedded
 */

const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

module.exports = async function(context) {
    // Only run for Windows builds
    if (context.electronPlatformName !== 'win32') {
        console.log('afterPack: Skipping icon fix (not Windows)');
        return;
    }

    const appOutDir = context.appOutDir;
    const exePath = path.join(appOutDir, `${context.packager.appInfo.productFilename}.exe`);
    const iconPath = path.join(context.packager.projectDir, 'icons', 'IconInvertedNoBGGlow.ico');

    console.log('afterPack: Setting icon with rcedit...');
    console.log('  Executable:', exePath);
    console.log('  Icon:', iconPath);

    try {
        // electron-builder includes rcedit-x64.exe in its dependencies
        // Find rcedit in node_modules
        const rcEditPath = path.join(
            context.packager.projectDir,
            'node_modules',
            'rcedit',
            'bin',
            'rcedit-x64.exe'
        );

        // Run rcedit to set the icon
        await execFileAsync(rcEditPath, [exePath, '--set-icon', iconPath]);

        console.log('afterPack: Icon successfully set!');
    } catch (error) {
        console.error('afterPack: Failed to set icon:', error.message);
        // Don't fail the build, just warn
        console.warn('afterPack: Continuing build despite icon error...');
    }
};
