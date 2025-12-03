const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Always use portable mode: store userData next to the exe
// This works for restricted environments where AppData is not writable
const isPackaged = app.isPackaged;

// Get the directory where the exe is located
// For portable builds, we want the folder containing the .exe
let exeDir;
if (isPackaged) {
  // In packaged mode, process.execPath points to the .exe
  // For portable builds, this is the actual user-facing .exe location
  // For NSIS installs, this is also correct (in Program Files)
  exeDir = path.dirname(process.execPath);

  // IMPORTANT: For portable builds, the .exe is at the root level
  // For NSIS/installer builds, the .exe is also at the root of installation
  // Both should work correctly with dirname(process.execPath)
} else {
  // Development mode - use project directory
  exeDir = app.getAppPath();
}

const portableDataDir = path.join(exeDir, 'SurfaceExpertData');

// Initialize logging - write to both console and file
const logFile = path.join(exeDir, 'SurfaceExpert-debug.log');
const logMessages = []; // Buffer messages until we can write them
let logFileReady = false;

const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage); // Always log to console
  logMessages.push(logMessage + '\n');

  // Try to write immediately if log file is ready
  if (logFileReady) {
    try {
      fs.appendFileSync(logFile, logMessage + '\n', 'utf-8');
    } catch (err) {
      console.error(`Failed to append to log: ${err.message}`);
    }
  }
};

// Function to flush buffered log messages
const flushLog = () => {
  if (logMessages.length > 0 && !logFileReady) {
    try {
      fs.writeFileSync(logFile, logMessages.join(''), 'utf-8');
      logFileReady = true;
      console.log(`✅ Log file created: ${logFile}`);
    } catch (err) {
      console.error(`❌ Failed to create log file: ${err.message}`);
      // Try to ensure directory exists
      try {
        const logDir = path.dirname(logFile);
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
          fs.writeFileSync(logFile, logMessages.join(''), 'utf-8');
          logFileReady = true;
          console.log(`✅ Log file created after mkdir: ${logFile}`);
        }
      } catch (err2) {
        console.error(`❌ Still failed to create log file: ${err2.message}`);
      }
    }
  }
};

log('=== SurfaceExpert Startup ===');
log(`Packaged: ${isPackaged}`);
log(`process.execPath: ${process.execPath}`);
log(`Executable directory: ${exeDir}`);
log(`Target data directory: ${portableDataDir}`);
log(`Log file path: ${logFile}`);

// Ensure the portable data directory exists BEFORE setting userData path
// Do this synchronously before app.whenReady()
log('=== Creating Portable Data Directory ===');
try {
  // Check if parent directory is writable
  const parentDir = path.dirname(portableDataDir);
  log(`Parent directory: ${parentDir}`);
  log(`Parent exists: ${fs.existsSync(parentDir)}`);

  if (!fs.existsSync(portableDataDir)) {
    log(`Creating directory: ${portableDataDir}`);
    fs.mkdirSync(portableDataDir, { recursive: true });
    log(`✅ Created portable data directory: ${portableDataDir}`);
  } else {
    log(`✅ Portable data directory already exists: ${portableDataDir}`);
  }

  // Verify the directory was actually created and is writable
  if (fs.existsSync(portableDataDir)) {
    log(`✅ Directory exists after creation attempt`);
    const stats = fs.statSync(portableDataDir);
    log(`   Is directory: ${stats.isDirectory()}`);

    // Test write permissions
    const testFile = path.join(portableDataDir, '.write-test');
    fs.writeFileSync(testFile, 'test', 'utf-8');
    fs.unlinkSync(testFile);
    log(`✅ Directory is writable: ${portableDataDir}`);
  } else {
    log(`❌ Directory does not exist after creation attempt!`);
  }
} catch (err) {
  log(`❌ Failed to create/verify portable data directory: ${err.message}`);
  log(`   Error code: ${err.code}`);
  log(`   Error name: ${err.name}`);
  log(`   Error stack: ${err.stack}`);

  // Try to get more details about the failure
  try {
    const parentDir = path.dirname(portableDataDir);
    const parentStats = fs.statSync(parentDir);
    log(`   Parent dir permissions: ${parentStats.mode.toString(8)}`);
  } catch (parentErr) {
    log(`   Could not stat parent directory: ${parentErr.message}`);
  }
}

// Set userData path AFTER creating the directory
// This ensures all subsequent file operations use the correct path
log('=== Setting userData Path ===');
app.setPath('userData', portableDataDir);
log(`✅ userData path set to: ${portableDataDir}`);
log(`   Actual path: ${app.getPath('userData')}`);

// Flush log immediately after directory setup
flushLog();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#2b2b2b',
    show: false,
    icon: path.join(__dirname, '..', 'icons', process.platform === 'win32' ? 'IconInvertedNoBGGlow.ico' : 'IconInvertedNoBGGlow.png'),
    frame: false,
    titleBarStyle: 'hidden'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Listen for maximize/unmaximize events and notify renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized');
  });

  createMenu();
  setupIpcHandlers();
}

function setupIpcHandlers() {
  // Get app directory path for storing surfaces and settings
  // Use userData directory which is persistent and user-writable
  // This works correctly for both portable and installed versions
  const userDataPath = app.getPath('userData');

  const surfacesDir = path.join(userDataPath, 'surfaces');
  const settingsPath = path.join(userDataPath, 'settings.json');

  log('=== Storage Paths ===');
  log(`App packaged: ${app.isPackaged}`);
  log(`User Data Path: ${userDataPath}`);
  log(`Surfaces directory: ${surfacesDir}`);
  log(`Settings path: ${settingsPath}`);
  log('====================');

  // Window control handlers
  ipcMain.on('window-control', (event, action) => {
    switch (action) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'maximize':
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });

  // Toggle DevTools
  ipcMain.on('toggle-devtools', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  });

  // Open external URLs
  ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
  });

  // Get app version (works in asar-packed builds)
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Check for updates from GitHub releases
  ipcMain.handle('check-for-updates', async () => {
    const https = require('https');
    const currentVersion = app.getVersion();

    return new Promise((resolve) => {
      const options = {
        hostname: 'api.github.com',
        path: '/repos/JagermeisterLover/SurfaceExpert/releases/latest',
        method: 'GET',
        headers: {
          'User-Agent': 'SurfaceExpert',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              console.error('Failed to check for updates:', res.statusCode);
              resolve(null);
              return;
            }

            const release = JSON.parse(data);
            const latestVersion = release.tag_name.replace(/^v/, '');
            const current = currentVersion.split('.').map(Number);
            const latest = latestVersion.split('.').map(Number);

            let isNewer = false;
            for (let i = 0; i < 3; i++) {
              if (latest[i] > current[i]) {
                isNewer = true;
                break;
              }
              if (latest[i] < current[i]) break;
            }

            if (isNewer) {
              resolve({
                available: true,
                currentVersion: currentVersion,
                latestVersion: latestVersion,
                releaseDate: release.published_at,
                releaseNotes: release.body || '',
                downloadUrl: 'https://github.com/JagermeisterLover/SurfaceExpert/releases',
                releasesUrl: `https://github.com/JagermeisterLover/SurfaceExpert/releases/tag/${release.tag_name}`
              });
            } else {
              resolve({ available: false, currentVersion: currentVersion });
            }
          } catch (error) {
            console.error('Error parsing update response:', error);
            resolve(null);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error checking for updates:', error);
        resolve(null);
      });

      req.end();
    });
  });

  // Ensure surfaces directory exists
  if (!fs.existsSync(surfacesDir)) {
    try {
      fs.mkdirSync(surfacesDir, { recursive: true });
      log(`✅ Created surfaces directory: ${surfacesDir}`);
    } catch (err) {
      log(`❌ Failed to create surfaces directory: ${err.message}`);
    }
  } else {
    log(`✅ Surfaces directory exists: ${surfacesDir}`);
  }

  // Handler for loading settings from disk
  ipcMain.handle('load-settings', async () => {
    try {
      if (fs.existsSync(settingsPath)) {
        const content = fs.readFileSync(settingsPath, 'utf-8');
        return {
          success: true,
          settings: JSON.parse(content)
        };
      } else {
        // Return default settings if file doesn't exist
        return {
          success: true,
          settings: {
            colorscale: 'Jet',
            wavelength: 632.8,
            gridSize3D: 129,
            gridSize2D: 129,
            theme: 'Dark Gray (Default)'
          }
        };
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      return {
        success: false,
        error: err.message,
        settings: {
          colorscale: 'Jet',
          wavelength: 632.8,
          gridSize3D: 129,
          gridSize2D: 129,
          theme: 'Dark Gray (Default)'
        }
      };
    }
  });

  // Handler for saving settings to disk
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      log(`💾 Saving settings to: ${settingsPath}`);
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      log('✅ Settings saved successfully');
      return { success: true };
    } catch (err) {
      log(`❌ Error saving settings: ${err.message}`);
      return {
        success: false,
        error: err.message
      };
    }
  });

  // Handler for loading folder structure from disk
  ipcMain.handle('load-folders', async () => {
    try {
      const folders = [];

      // Read all subdirectories in surfaces folder
      const entries = fs.readdirSync(surfacesDir, { withFileTypes: true });
      const folderDirs = entries.filter(e => e.isDirectory());

      if (folderDirs.length === 0) {
        // Create default folder if none exist
        const defaultFolderPath = path.join(surfacesDir, 'My Surfaces');
        fs.mkdirSync(defaultFolderPath, { recursive: true });
        return {
          success: true,
          folders: [{
            id: 'My Surfaces',
            name: 'My Surfaces',
            expanded: true,
            surfaces: []
          }]
        };
      }

      // Load each folder and its surfaces
      for (const folderDir of folderDirs) {
        const folderPath = path.join(surfacesDir, folderDir.name);
        const surfaces = [];

        // Read all JSON files in this folder
        const files = fs.readdirSync(folderPath);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        for (const jsonFile of jsonFiles) {
          try {
            const filePath = path.join(folderPath, jsonFile);
            const content = fs.readFileSync(filePath, 'utf-8');
            const surface = JSON.parse(content);
            surfaces.push(surface);
          } catch (err) {
            console.error(`Error loading ${jsonFile}:`, err);
          }
        }

        folders.push({
          id: folderDir.name,
          name: folderDir.name,
          expanded: true,
          surfaces: surfaces
        });
      }

      return { success: true, folders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler for saving a single surface
  ipcMain.handle('save-surface', async (event, folderName, surface) => {
    try {
      const folderPath = path.join(surfacesDir, folderName);

      // Ensure folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        log(`✅ Created folder: ${folderPath}`);
      }

      // Sanitize surface name for filename
      const sanitizedName = surface.name.replace(/[<>:"/\\|?*]/g, '_');
      const filePath = path.join(folderPath, `${sanitizedName}.json`);

      log(`💾 Saving surface to: ${filePath}`);
      fs.writeFileSync(filePath, JSON.stringify(surface, null, 2), 'utf-8');
      log('✅ Surface saved successfully');
      return { success: true };
    } catch (error) {
      log(`❌ Error saving surface: ${error.message}`);
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting a surface
  ipcMain.handle('delete-surface', async (event, folderName, surfaceName) => {
    try {
      const sanitizedName = surfaceName.replace(/[<>:"/\\|?*]/g, '_');
      const filePath = path.join(surfacesDir, folderName, `${sanitizedName}.json`);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler for creating a folder
  ipcMain.handle('create-folder', async (event, folderName) => {
    try {
      const folderPath = path.join(surfacesDir, folderName);

      if (fs.existsSync(folderPath)) {
        return { success: false, error: 'Folder already exists' };
      }

      fs.mkdirSync(folderPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler for renaming a folder
  ipcMain.handle('rename-folder', async (event, oldName, newName) => {
    try {
      const oldPath = path.join(surfacesDir, oldName);
      const newPath = path.join(surfacesDir, newName);

      if (!fs.existsSync(oldPath)) {
        return { success: false, error: 'Folder does not exist' };
      }

      if (fs.existsSync(newPath)) {
        return { success: false, error: 'Target folder name already exists' };
      }

      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler for deleting a folder
  ipcMain.handle('delete-folder', async (event, folderName) => {
    try {
      const folderPath = path.join(surfacesDir, folderName);

      if (!fs.existsSync(folderPath)) {
        return { success: false, error: 'Folder does not exist' };
      }

      // Delete folder and all its contents
      fs.rmSync(folderPath, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler for opening ZMX file dialog
  ipcMain.handle('open-zmx-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Zemax Files', extensions: ['zmx', 'ZMX'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return { canceled: true };
    }

    try {
      const filePath = result.filePaths[0];
      // Read file as buffer first to support UTF-8, UTF-16, and ANSI encodings
      const buffer = fs.readFileSync(filePath);

      let content;

      // Check for UTF-16 LE BOM (FF FE)
      if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        content = buffer.toString('utf16le');
      }
      // Check for UTF-16 BE BOM (FE FF)
      else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        // Node.js doesn't have native utf16be, so we swap bytes manually
        const utf16leBuffer = Buffer.from(buffer);
        for (let i = 0; i < utf16leBuffer.length; i += 2) {
          const temp = utf16leBuffer[i];
          utf16leBuffer[i] = utf16leBuffer[i + 1];
          utf16leBuffer[i + 1] = temp;
        }
        content = utf16leBuffer.toString('utf16le');
      }
      // Try UTF-8
      else {
        content = buffer.toString('utf-8');

        // Check if UTF-8 decoding produced replacement characters (indicating invalid UTF-8)
        if (content.includes('\uFFFD')) {
          // Fall back to latin1 (ANSI encoding)
          content = buffer.toString('latin1');
        }
      }

      return { canceled: false, content, filePath };
    } catch (error) {
      return { canceled: true, error: error.message };
    }
  });

  // Handler for running surface conversion
  ipcMain.handle('run-conversion', async (event, surfaceData, settings) => {
    const { spawn } = require('child_process');
    // Use userData directory for temp files (works in portable mode next to exe)
    const tempDir = userDataPath;

    try {
      // Write surface data to temp file
      const dataContent = surfaceData.map(p => `${p.r}\t${p.z}`).join('\n');
      fs.writeFileSync(path.join(tempDir, 'tempsurfacedata.txt'), dataContent);

      // Write settings to file (temporary, will be deleted after reading)
      const settingsContent = Object.keys(settings).map(key => `${key}=${settings[key]}`).join('\n');
      fs.writeFileSync(path.join(tempDir, 'ConvertSettings.txt'), settingsContent);

      // Spawn Python process
      const pythonPath = process.platform === 'win32' ? 'python' : 'python3';

      // Handle Python script path for asar packaging
      let scriptPath;
      if (app.isPackaged) {
        // Extract Python script to userData directory for asar-packed builds
        const extractedScriptPath = path.join(userDataPath, 'surfaceFitter.py');
        const originalScriptPath = path.join(__dirname, 'surfaceFitter.py');

        // Copy script if it doesn't exist or is outdated
        if (!fs.existsSync(extractedScriptPath)) {
          fs.copyFileSync(originalScriptPath, extractedScriptPath);
        }
        scriptPath = extractedScriptPath;
      } else {
        // Development mode - use script directly
        scriptPath = path.join(__dirname, 'surfaceFitter.py');
      }

      return new Promise((resolve, reject) => {
        const python = spawn(pythonPath, [scriptPath], {
          cwd: tempDir
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        python.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Python script failed: ${stderr}`));
            return;
          }

          try {
            // Read fit report
            const fitReportPath = path.join(tempDir, 'FitReport.txt');
            const fitReportContent = fs.readFileSync(fitReportPath, 'utf-8');
            const fitReport = parseFitReport(fitReportContent);

            // Read metrics
            const metricsPath = path.join(tempDir, 'FitMetrics.txt');
            const metricsContent = fs.readFileSync(metricsPath, 'utf-8');
            const metrics = parseMetrics(metricsContent);

            // Read deviations
            const deviationsPath = path.join(tempDir, 'FitDeviations.txt');
            const deviations = fs.readFileSync(deviationsPath, 'utf-8');

            // Delete temporary files
            fs.unlinkSync(path.join(tempDir, 'ConvertSettings.txt'));
            fs.unlinkSync(fitReportPath);
            fs.unlinkSync(metricsPath);
            fs.unlinkSync(deviationsPath);
            fs.unlinkSync(path.join(tempDir, 'tempsurfacedata.txt'));

            resolve({
              success: true,
              fitReport,
              metrics,
              deviations,
              stdout
            });
          } catch (error) {
            reject(new Error(`Failed to read results: ${error.message}`));
          }
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Handler for saving conversion results
  ipcMain.handle('save-conversion-results', async (event, folderName, surfaceName, results) => {
    const surfacesDir = path.join(__dirname, '..', 'surfaces');
    const folderPath = path.join(surfacesDir, folderName);

    try {
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const sanitizedName = surfaceName.replace(/[<>:"/\\|?*]/g, '_');
      const filePath = path.join(folderPath, `${sanitizedName}_FitResults.txt`);

      // Merge all results into a single file
      const combinedContent = [
        '=== FIT REPORT ===',
        results.fitReportContent,
        '',
        '=== FIT METRICS ===',
        results.metricsContent,
        '',
        '=== FIT DEVIATIONS ===',
        results.deviations
      ].join('\n');

      fs.writeFileSync(filePath, combinedContent);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler for saving HTML report
  ipcMain.handle('save-html-report', async (event, htmlContent, suggestedName) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save HTML Report',
        defaultPath: `${suggestedName}_Report.html`,
        filters: [
          { name: 'HTML Files', extensions: ['html'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return { canceled: true };
      }

      fs.writeFileSync(result.filePath, htmlContent, 'utf-8');

      // Open the folder containing the file
      shell.showItemInFolder(result.filePath);

      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handler for generating PDF from HTML
  ipcMain.handle('generate-pdf-report', async (event, htmlContent, suggestedName) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save PDF Report',
        defaultPath: `${suggestedName}_Report.pdf`,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) {
        return { canceled: true };
      }

      // Create a hidden window to load HTML and print to PDF
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Load HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Print to PDF
      const pdfData = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        margins: {
          top: 0.5,
          bottom: 0.5,
          left: 0.5,
          right: 0.5
        }
      });

      // Close the window
      printWindow.close();

      // Save PDF
      fs.writeFileSync(result.filePath, pdfData);

      // Open the folder containing the file
      shell.showItemInFolder(result.filePath);

      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

function parseFitReport(content) {
  const report = {};
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('=')) {
      const [key, value] = line.split('=');
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (trimmedKey === 'Type') {
        report[trimmedKey] = trimmedValue;
      } else {
        report[trimmedKey] = parseFloat(trimmedValue);
      }
    }
  }

  return report;
}

function parseMetrics(content) {
  const metrics = {};
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('=')) {
      const [key, value] = line.split('=');
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();

      if (trimmedValue === 'True') {
        metrics[trimmedKey] = true;
      } else if (trimmedValue === 'False') {
        metrics[trimmedKey] = false;
      } else {
        const numValue = parseFloat(trimmedValue);
        metrics[trimmedKey] = isNaN(numValue) ? trimmedValue : numValue;
      }
    }
  }

  return metrics;
}

function createMenu() {
  // Remove the default menu bar - we'll create a custom one in the renderer
  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  log('=== App Ready ===');
  log(`Final userData path: ${app.getPath('userData')}`);
  log(`SurfaceExpertData exists: ${fs.existsSync(portableDataDir)}`);
  if (fs.existsSync(portableDataDir)) {
    try {
      const stats = fs.statSync(portableDataDir);
      log(`SurfaceExpertData is directory: ${stats.isDirectory()}`);
      log(`SurfaceExpertData permissions: ${stats.mode.toString(8)}`);
    } catch (err) {
      log(`Error getting directory stats: ${err.message}`);
    }
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
