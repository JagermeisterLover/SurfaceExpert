const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

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
    show: false
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

  createMenu();
  setupIpcHandlers();
}

function setupIpcHandlers() {
  // Get app directory path for storing surfaces
  const surfacesDir = path.join(__dirname, '..', 'surfaces');

  // Ensure surfaces directory exists
  if (!fs.existsSync(surfacesDir)) {
    fs.mkdirSync(surfacesDir, { recursive: true });
  }

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
      }

      // Sanitize surface name for filename
      const sanitizedName = surface.name.replace(/[<>:"/\\|?*]/g, '_');
      const filePath = path.join(folderPath, `${sanitizedName}.json`);

      fs.writeFileSync(filePath, JSON.stringify(surface, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
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
      const content = fs.readFileSync(filePath, 'utf-8');
      return { canceled: false, content, filePath };
    } catch (error) {
      return { canceled: true, error: error.message };
    }
  });

  // Handler for running surface conversion
  ipcMain.handle('run-conversion', async (event, surfaceData, settings) => {
    const { spawn } = require('child_process');
    const tempDir = path.join(__dirname, '..');

    try {
      // Write surface data to temp file
      const dataContent = surfaceData.map(p => `${p.r}\t${p.z}`).join('\n');
      fs.writeFileSync(path.join(tempDir, 'tempsurfacedata.txt'), dataContent);

      // Write settings to file (temporary, will be deleted after reading)
      const settingsContent = Object.keys(settings).map(key => `${key}=${settings[key]}`).join('\n');
      fs.writeFileSync(path.join(tempDir, 'ConvertSettings.txt'), settingsContent);

      // Spawn Python process
      const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
      const scriptPath = path.join(__dirname, 'surfaceFitter.py');

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
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Surface',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-surface');
          }
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-action', 'open');
          }
        },
        {
          label: 'Import from ZMX...',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow.webContents.send('menu-action', 'import-zmx');
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow.webContents.send('menu-action', 'save-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Surface',
      submenu: [
        {
          label: 'Add Surface',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            mainWindow.webContents.send('menu-action', 'add-surface');
          }
        },
        {
          label: 'Remove Surface',
          accelerator: 'Delete',
          click: () => {
            mainWindow.webContents.send('menu-action', 'remove-surface');
          }
        },
        { type: 'separator' },
        {
          label: 'Duplicate Surface',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('menu-action', 'duplicate-surface');
          }
        }
      ]
    },
    {
      label: 'Reports',
      submenu: [
        {
          label: 'Export HTML Report...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export-html-report');
          }
        },
        {
          label: 'Export PDF Report...',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export-pdf-report');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-action', 'open-settings');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            mainWindow.webContents.send('menu-action', 'documentation');
          }
        },
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('menu-action', 'about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

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
