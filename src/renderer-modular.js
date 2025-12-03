// ============================================
// SurfaceExpert - Modular Version
// ============================================
// Full application using ES6 modules
// Original: src/renderer.js (3,435 lines)
// Modular: Imports from 17 extracted modules

console.log('🚀🚀🚀 RENDERER-MODULAR.JS LOADED - VERSION WITH VALIDATION FIX 🚀🚀🚀');
console.log('📅 Build timestamp:', new Date().toISOString());

// ============================================
// MODULE IMPORTS
// ============================================

// Constants
import { surfaceTypes, universalParameters, sampleSurfaces, colors } from './constants/surfaceTypes.js';
import { colorscales } from './constants/colorscales.js';
import { getPalette } from './constants/colorPalettes.js';
import { getLocale, getCurrentLocale, saveLocale } from './constants/locales.js';

// Utilities
import { formatValue, degreesToDMS } from './utils/formatters.js';
import { calculateSurfaceValues, calculateSagOnly, getBestFitSphereParams, calculateSurfaceMetrics } from './utils/calculations.js';
import { generateReportData } from './utils/reportGenerator.js';
import { normalizeUnZ, convertPolyToUnZ, convertUnZToPoly, invertSurface } from './utils/surfaceTransformations.js';
import { exportHTMLReport, exportPDFReport } from './utils/reportHandlers.js';
import { handleZMXImport as zmxImportHandler, importSelectedSurfaces } from './utils/zmxImportHandlers.js';
import {
    handleInvertSurface as invertSurfaceHandler,
    handleNormalizeUnZConfirm as normalizeUnZConfirmHandler,
    handleConvertToUnZ as convertToUnZHandler,
    handleConvertToPoly as convertToPolyHandler,
    handleFastConvertToPoly as fastConvertToPolyHandler
} from './utils/surfaceOperationHandlers.js';
import { parseNumber } from './utils/numberParsing.js';

// UI Components
import { PropertySection } from './components/ui/PropertySection.js';
import { PropertyRow } from './components/ui/PropertyRow.js';
import { DebouncedInput } from './components/ui/DebouncedInput.js';
import { SurfaceActionButtons } from './components/ui/SurfaceActionButtons.js';
import { UpdateNotification } from './components/ui/UpdateNotification.js';
import { MessageNotification } from './components/ui/MessageNotification.js';
import { TitleBar } from './components/TitleBar.js';
import { MenuBar } from './components/MenuBar.js';

// Panel Components
import { PropertiesPanel } from './components/panels/PropertiesPanel.js';
import { SurfacesPanel } from './components/panels/SurfacesPanel.js';
import { VisualizationPanel } from './components/panels/VisualizationPanel.js';

// View Components
import { SummaryView } from './components/views/SummaryView.js';
import { DataView } from './components/views/DataView.js';

// Dialog Components
import { SettingsModal } from './components/dialogs/SettingsModal.js';
import { ContextMenu } from './components/dialogs/ContextMenu.js';
import { InputDialog } from './components/dialogs/InputDialog.js';
import { ZMXImportDialog } from './components/dialogs/ZMXImportDialog.js';
import { ConversionDialog } from './components/dialogs/ConversionDialog.js';
import { ConversionResultsDialog } from './components/dialogs/ConversionResultsDialog.js';
import { NormalizeUnZDialog } from './components/dialogs/NormalizeUnZDialog.js';
import { AboutDialog } from './components/dialogs/AboutDialog.js';

// Plot Components
import { create3DPlot } from './components/plots/Plot3D.js';
import { create2DHeatmap } from './components/plots/Plot2DHeatmap.js';
import { createCrossSection } from './components/plots/PlotCrossSection.js';

// ============================================
// REACT SETUP
// ============================================

const { createElement: h } = React;
const { useState, useEffect, useLayoutEffect, useRef } = React;

// ============================================
// MAIN APPLICATION COMPONENT
// ============================================

const OpticalSurfaceAnalyzer = () => {
    // ============================================
    // STATE MANAGEMENT
    // ============================================

    const [folders, setFolders] = useState([]);
    const [selectedSurface, setSelectedSurface] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedSurfaces, setSelectedSurfaces] = useState([]); // Multi-select state
    const [lastClickedSurface, setLastClickedSurface] = useState(null); // For shift-click range selection
    const [activeTab, setActiveTab] = useState('summary');
    const [activeSubTab, setActiveSubTab] = useState('3d');
    const [showSettings, setShowSettings] = useState(false);
    const [showZMXImport, setShowZMXImport] = useState(false);
    const [zmxSurfaces, setZmxSurfaces] = useState([]);
    const [showConvert, setShowConvert] = useState(false);
    const [showConvertResults, setShowConvertResults] = useState(false);
    const [convertResults, setConvertResults] = useState(null);
    const [colorscale, setColorscale] = useState('Jet');
    const [wavelength, setWavelength] = useState(632.8); // Reference wavelength in nm for RMS/PV calculations
    const [gridSize3D, setGridSize3D] = useState(129); // Grid size for 3D plots (odd number, max 257)
    const [gridSize2D, setGridSize2D] = useState(129); // Grid size for 2D plots (odd number, max 257)
    const [theme, setTheme] = useState('Dark Gray (Default)'); // Color theme
    const [locale, setLocaleState] = useState(getCurrentLocale()); // Application locale (en, ru, etc.)
    const [fastConvertThreshold, setFastConvertThreshold] = useState(0.000001); // Max deviation threshold for fast convert to poly (mm)
    const [fastConvertProgress, setFastConvertProgress] = useState(null); // Progress indicator for fast convert (e.g., 'A1+A2', 'A1-A5')
    const [contextMenu, setContextMenu] = useState(null);
    const [inputDialog, setInputDialog] = useState(null);
    const [showNormalizeUnZ, setShowNormalizeUnZ] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [updateInfo, setUpdateInfo] = useState(null);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const [messageNotification, setMessageNotification] = useState(null);
    const plotRef = useRef(null);
    const propertiesPanelRef = useRef(null);
    const scrollPositionRef = useRef(0);
    const selectedSurfaceRef = useRef(null);  // Ref to always access latest selectedSurface in closures

    // Update ref whenever selectedSurface changes
    useEffect(() => {
        selectedSurfaceRef.current = selectedSurface;
    }, [selectedSurface]);

    // Get translation object for current locale
    const t = getLocale(locale);

    // Locale setter that also saves to localStorage
    const setLocale = (newLocale) => {
        setLocaleState(newLocale);
        saveLocale(newLocale);
        saveSettingsToDisk(); // Also save to disk via Electron
    };

    // ============================================
    // DATA LOADING
    // ============================================

    // Load folders and settings on mount
    useEffect(() => {
        loadFoldersFromDisk();
        loadSettingsFromDisk();
        checkForUpdates();
    }, []);

    // Check for updates function
    const checkForUpdates = async (showDialogIfNone = false) => {
        try {
            if (window.electronAPI && window.electronAPI.checkForUpdates) {
                const update = await window.electronAPI.checkForUpdates();
                if (update && update.available) {
                    setUpdateInfo(update);
                    setShowUpdateNotification(true);
                } else if (showDialogIfNone) {
                    // If manually triggered and no update, show a modern notification
                    setMessageNotification({
                        message: t?.update?.noUpdates || 'You are using the latest version!',
                        type: 'success'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            if (showDialogIfNone) {
                setMessageNotification({
                    message: t?.update?.checkError || 'Failed to check for updates. Please try again later.',
                    type: 'error'
                });
            }
        }
    };

    // Preserve scroll position in properties panel during updates
    // Use useLayoutEffect to restore scroll synchronously before paint
    useLayoutEffect(() => {
        if (propertiesPanelRef.current) {
            propertiesPanelRef.current.scrollTop = scrollPositionRef.current;
        }
    }, [selectedSurface, folders]);

    // Track scroll position continuously
    const handlePropertiesPanelScroll = () => {
        if (propertiesPanelRef.current) {
            scrollPositionRef.current = propertiesPanelRef.current.scrollTop;
        }
    };

    const loadFoldersFromDisk = async () => {
        if (window.electronAPI && window.electronAPI.loadFolders) {
            const result = await window.electronAPI.loadFolders();
            if (result.success) {
                // Ensure all surfaces have Step parameter for backward compatibility
                const foldersWithStep = result.folders.map(folder => ({
                    ...folder,
                    surfaces: folder.surfaces.map(surface => ({
                        ...surface,
                        parameters: {
                            ...surface.parameters,
                            'Step': surface.parameters['Step'] || '1'
                        }
                    }))
                }));
                setFolders(foldersWithStep);
                // Select first surface if available
                if (foldersWithStep.length > 0 && foldersWithStep[0].surfaces.length > 0) {
                    setSelectedSurface(foldersWithStep[0].surfaces[0]);
                    setSelectedFolder(foldersWithStep[0]);
                }
            }
        } else {
            // Fallback for development without Electron
            const defaultFolder = {
                id: 'default',
                name: 'My Surfaces',
                expanded: true,
                surfaces: sampleSurfaces.map(surface => ({
                    ...surface,
                    parameters: {
                        ...surface.parameters,
                        'Step': surface.parameters['Step'] || '1'
                    }
                }))
            };
            setFolders([defaultFolder]);
            setSelectedSurface(defaultFolder.surfaces[0]);
            setSelectedFolder(defaultFolder);
        }
    };

    const loadSettingsFromDisk = async () => {
        if (window.electronAPI && window.electronAPI.loadSettings) {
            const result = await window.electronAPI.loadSettings();
            if (result.success && result.settings) {
                setColorscale(result.settings.colorscale || 'Jet');
                setWavelength(result.settings.wavelength || 632.8);
                setGridSize3D(result.settings.gridSize3D || 129);
                setGridSize2D(result.settings.gridSize2D || 129);
                setTheme(result.settings.theme || 'Dark Gray (Default)');
                setFastConvertThreshold(result.settings.fastConvertThreshold || 0.000001);
                if (result.settings.locale) {
                    setLocaleState(result.settings.locale);
                }
            }
        }
    };

    const saveSettingsToDisk = async () => {
        if (window.electronAPI && window.electronAPI.saveSettings) {
            const settings = {
                colorscale,
                wavelength,
                gridSize3D,
                gridSize2D,
                theme,
                locale,
                fastConvertThreshold
            };
            await window.electronAPI.saveSettings(settings);
        }
    };

    // Auto-save settings when they change
    useEffect(() => {
        saveSettingsToDisk();
    }, [colorscale, wavelength, gridSize3D, gridSize2D, theme, locale, fastConvertThreshold]);

    // Update selected surface when it changes in the folders
    useEffect(() => {
        if (!selectedSurface) return;
        for (const folder of folders) {
            const updated = folder.surfaces.find(s => s.id === selectedSurface.id);
            if (updated) {
                // Ensure Step parameter exists for backward compatibility
                if (updated.parameters['Step'] === undefined) {
                    updated.parameters['Step'] = '1';
                }
                setSelectedSurface(updated);
                break;
            }
        }
    }, [folders]);

    // ============================================
    // PLOT UPDATE EFFECTS
    // ============================================

    useEffect(() => {
        if (!selectedSurface) return;
        const c = getPalette(theme);
        if (plotRef.current && activeTab !== 'summary' && activeSubTab === '3d') {
            create3DPlot(plotRef, selectedSurface, activeTab, colorscale, gridSize3D, c, t);
        } else if (plotRef.current && activeTab !== 'summary' && activeSubTab === '2d') {
            create2DHeatmap(plotRef, selectedSurface, activeTab, colorscale, c, gridSize2D, t);
        } else if (plotRef.current && activeTab !== 'summary' && activeSubTab === 'cross') {
            createCrossSection(plotRef, selectedSurface, activeTab, c, t);
        }
    }, [selectedSurface, activeTab, activeSubTab, colorscale, gridSize3D, gridSize2D, theme]);

    // ============================================
    // MENU ACTIONS
    // ============================================

    // Listen to menu actions from main process
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onMenuAction((action) => {
                handleMenuAction(action);
            });
        }
    }, []);

    // Window control handler
    const handleWindowControl = (action) => {
        if (window.electronAPI && window.electronAPI.windowControl) {
            window.electronAPI.windowControl(action);
        }
    };

    const handleMenuAction = async (action) => {
        switch (action) {
            case 'add-surface':
                addSurface();
                break;
            case 'remove-surface':
                removeSurface();
                break;
            case 'open-settings':
                setShowSettings(true);
                break;
            case 'import-zmx':
                await handleImportZMX();
                break;
            case 'export-html-report':
                await handleExportHTMLReport();
                break;
            case 'export-pdf-report':
                await handleExportPDFReport();
                break;
            case 'toggle-devtools':
                // Handled directly in MenuBar component via IPC
                break;
            case 'documentation':
                console.log('Documentation requested');
                // TODO: Open documentation
                break;
            case 'about':
                setShowAbout(true);
                break;
            case 'check-for-updates':
                await checkForUpdates(true); // Show message if no updates
                break;
            // Add more handlers as needed
        }
    };

    // ============================================
    // ZMX IMPORT HANDLING
    // ============================================

    const handleImportZMX = async () => {
        await zmxImportHandler(setZmxSurfaces, setShowZMXImport);
    };

    const handleImportSelectedSurfaces = (selectedIndices) => {
        importSelectedSurfaces(
            selectedIndices,
            zmxSurfaces,
            folders,
            selectedFolder,
            setFolders,
            setSelectedFolder,
            setSelectedSurface,
            setShowZMXImport
        );
    };

    // ============================================
    // REPORT GENERATION
    // ============================================

    const handleExportHTMLReport = async () => {
        // Use ref to access latest value (important for menu actions)
        const surface = selectedSurfaceRef.current;
        await exportHTMLReport(surface, wavelength, colorscale, gridSize3D, gridSize2D, t);
    };

    const handleExportPDFReport = async () => {
        // Use ref to access latest value (important for menu actions)
        const surface = selectedSurfaceRef.current;
        await exportPDFReport(surface, wavelength, colorscale, gridSize3D, gridSize2D, t);
    };

    // ============================================
    // SURFACE TRANSFORMATION HANDLERS
    // ============================================

    const handleInvertSurface = () => {
        invertSurfaceHandler(selectedSurface, selectedFolder, folders, setFolders);
    };

    const handleNormalizeUnZ = () => {
        if (!selectedSurface || selectedSurface.type !== 'Opal Un Z') return;
        setShowNormalizeUnZ(true);
    };

    const handleNormalizeUnZConfirm = (newH) => {
        normalizeUnZConfirmHandler(
            newH,
            selectedSurface,
            selectedFolder,
            folders,
            setFolders,
            setShowNormalizeUnZ
        );
    };

    const handleConvertToUnZ = () => {
        convertToUnZHandler(selectedSurface, selectedFolder, folders, setFolders, setSelectedSurface);
    };

    const handleConvertToPoly = () => {
        convertToPolyHandler(selectedSurface, selectedFolder, folders, setFolders, setSelectedSurface);
    };

    const handleFastConvertToPoly = () => {
        fastConvertToPolyHandler(
            selectedSurface,
            selectedFolder,
            folders,
            setFolders,
            setSelectedSurface,
            setShowConvertResults,
            setConvertResults,
            fastConvertThreshold,
            setFastConvertProgress
        );
    };

    // ============================================
    // SURFACE CRUD OPERATIONS
    // ============================================

    const updateSurfaceName = async (newName) => {
        if (!selectedSurface || !selectedFolder) return;

        const oldName = selectedSurface.name;
        const updatedSurface = { ...selectedSurface, name: newName };

        // Delete old file if name changed
        if (oldName !== newName && window.electronAPI) {
            await window.electronAPI.deleteSurface(selectedFolder.name, oldName);
        }

        // Save with new name
        if (window.electronAPI) {
            await window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }

        const updated = folders.map(f => ({
            ...f,
            surfaces: f.surfaces.map(s =>
                s.id === selectedSurface.id ? updatedSurface : s
            )
        }));
        setFolders(updated);
        setSelectedSurface(updatedSurface);
    };

    const updateSurfaceType = async (newType) => {
        if (!selectedSurface || !selectedFolder) return;

        const newParams = {};

        // Initialize universal parameters (preserving existing values)
        universalParameters[newType].forEach(param => {
            newParams[param] = selectedSurface.parameters[param] || '0';
        });

        // Initialize surface-specific parameters (preserving existing values where possible)
        surfaceTypes[newType].forEach(param => {
            newParams[param] = selectedSurface.parameters[param] || '0';
        });

        const updatedSurface = { ...selectedSurface, type: newType, parameters: newParams };

        // Save to disk
        if (window.electronAPI) {
            await window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }

        const updated = folders.map(f => ({
            ...f,
            surfaces: f.surfaces.map(s =>
                s.id === selectedSurface.id ? updatedSurface : s
            )
        }));
        setFolders(updated);
        setSelectedSurface(updatedSurface);
    };

    const updateParameter = (param, value) => {
        if (!selectedSurface || !selectedFolder) return;

        const updatedSurface = {
            ...selectedSurface,
            parameters: { ...selectedSurface.parameters, [param]: value }
        };

        // Update state immediately for instant UI response
        const updated = folders.map(f => ({
            ...f,
            surfaces: f.surfaces.map(s =>
                s.id === selectedSurface.id ? updatedSurface : s
            )
        }));
        setFolders(updated);
        setSelectedSurface(updatedSurface);

        // Save to disk in background (non-blocking)
        if (window.electronAPI) {
            window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }
    };

    // Handle Enter key to navigate to next input field
    const handleEnterKeyNavigation = (currentParam) => {
        if (!propertiesPanelRef.current) return;

        // Defer focus to next frame to allow re-render from save to complete first
        // This prevents interruption when starting to type in the next input
        setTimeout(() => {
            if (!propertiesPanelRef.current) return;

            // Find all input elements in the properties panel
            const inputs = Array.from(propertiesPanelRef.current.querySelectorAll('input[type="text"]'));

            // Find the input for the current parameter by matching label text
            // Note: labels may include additional text (e.g., "Z1 - Piston"), so we check if label starts with param
            let currentIndex = -1;
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const container = input.parentElement;
                const label = container?.querySelector('label');
                const labelText = label?.textContent?.trim();
                // Check if label matches exactly or starts with param followed by space or separator
                // This handles both "Radius" and "Z1 - Piston" formats
                if (labelText === currentParam ||
                    labelText?.startsWith(currentParam + ' ') ||
                    labelText?.startsWith(currentParam + '\u00A0')) { // Also check for non-breaking space
                    currentIndex = i;
                    break;
                }
            }

            // Focus the next input if available
            if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
                inputs[currentIndex + 1].select(); // Select all text in the next input
            }
        }, 0);
    };

    const addSurface = async () => {
        if (!selectedFolder) return;

        const allSurfaces = folders.flatMap(f => f.surfaces);
        const newId = allSurfaces.length > 0 ? Math.max(...allSurfaces.map(s => s.id)) + 1 : 1;
        const colorOptions = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6'];
        const newSurface = {
            id: newId,
            name: `Surface ${newId}`,
            type: 'Sphere',
            color: colorOptions[newId % colorOptions.length],
            parameters: {
                'Radius': '100.0',
                'Min Height': '0',
                'Max Height': '20.0',
                'Step': '1'
            }
        };

        // Save to disk
        if (window.electronAPI) {
            await window.electronAPI.saveSurface(selectedFolder.name, newSurface);
        }

        const updated = folders.map(f =>
            f.id === selectedFolder.id
                ? { ...f, surfaces: [...f.surfaces, newSurface] }
                : f
        );
        setFolders(updated);
        setSelectedSurface(newSurface);
    };

    const removeSurface = async () => {
        if (!selectedSurface || !selectedFolder) return;

        const folder = folders.find(f => f.id === selectedFolder.id);
        if (!folder || folder.surfaces.length === 0) return;

        // Delete from disk
        if (window.electronAPI) {
            await window.electronAPI.deleteSurface(selectedFolder.name, selectedSurface.name);
        }

        const updated = folders.map(f => {
            if (f.id === selectedFolder.id) {
                const filtered = f.surfaces.filter(s => s.id !== selectedSurface.id);
                return { ...f, surfaces: filtered };
            }
            return f;
        });

        setFolders(updated);
        setSelectedSurfaces([]); // Clear multi-selection

        // Select another surface
        const updatedFolder = updated.find(f => f.id === selectedFolder.id);
        if (updatedFolder && updatedFolder.surfaces.length > 0) {
            setSelectedSurface(updatedFolder.surfaces[0]);
        } else {
            setSelectedSurface(null);
        }
    };

    const removeSelectedSurfaces = async () => {
        if (selectedSurfaces.length === 0 || !selectedFolder) return;

        const folder = folders.find(f => f.id === selectedFolder.id);
        if (!folder) return;

        // Delete all selected surfaces from disk
        if (window.electronAPI) {
            for (const surfaceId of selectedSurfaces) {
                const surface = folder.surfaces.find(s => s.id === surfaceId);
                if (surface) {
                    await window.electronAPI.deleteSurface(selectedFolder.name, surface.name);
                }
            }
        }

        const updated = folders.map(f => {
            if (f.id === selectedFolder.id) {
                const filtered = f.surfaces.filter(s => !selectedSurfaces.includes(s.id));
                return { ...f, surfaces: filtered };
            }
            return f;
        });

        setFolders(updated);
        setSelectedSurfaces([]); // Clear multi-selection

        // Select another surface
        const updatedFolder = updated.find(f => f.id === selectedFolder.id);
        if (updatedFolder && updatedFolder.surfaces.length > 0) {
            setSelectedSurface(updatedFolder.surfaces[0]);
        } else {
            setSelectedSurface(null);
        }
    };

    const handleSurfaceClick = (e, surface, folder) => {
        e.stopPropagation();
        setSelectedFolder(folder);

        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd+Click: Toggle selection
            if (selectedSurfaces.includes(surface.id)) {
                setSelectedSurfaces(selectedSurfaces.filter(id => id !== surface.id));
            } else {
                setSelectedSurfaces([...selectedSurfaces, surface.id]);
            }
            setLastClickedSurface(surface);
        } else if (e.shiftKey && lastClickedSurface) {
            // Shift+Click: Select range
            const folderSurfaces = folder.surfaces;
            const startIdx = folderSurfaces.findIndex(s => s.id === lastClickedSurface.id);
            const endIdx = folderSurfaces.findIndex(s => s.id === surface.id);

            if (startIdx !== -1 && endIdx !== -1) {
                const [minIdx, maxIdx] = [Math.min(startIdx, endIdx), Math.max(startIdx, endIdx)];
                const rangeIds = folderSurfaces.slice(minIdx, maxIdx + 1).map(s => s.id);
                setSelectedSurfaces([...new Set([...selectedSurfaces, ...rangeIds])]);
            }
        } else {
            // Regular click: Single selection
            setSelectedSurface(surface);
            setSelectedSurfaces([]);
            setLastClickedSurface(surface);
        }
    };

    // ============================================
    // FOLDER CRUD OPERATIONS
    // ============================================

    const addFolder = async (name) => {
        if (!name || !name.trim()) return;

        // Create folder on disk
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.createFolder(name);
                if (!result.success) {
                    alert(result.error || 'Failed to create folder');
                    return;
                }
            } catch (error) {
                alert('Error creating folder: ' + error.message);
                return;
            }
        }

        const newFolder = {
            id: name,
            name: name,
            expanded: true,
            surfaces: []
        };
        setFolders([...folders, newFolder]);
        setSelectedFolder(newFolder);
    };

    const removeFolder = async (folderId) => {
        if (folders.length <= 1) return;

        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;

        // Close any open dialogs first to prevent event conflicts
        setContextMenu(null);
        setInputDialog(null);

        // Delete folder on disk
        if (window.electronAPI) {
            const result = await window.electronAPI.deleteFolder(folder.name);
            if (!result.success) {
                console.error('Failed to delete folder:', result.error);
                return;
            }
        }

        const filtered = folders.filter(f => f.id !== folderId);
        setFolders(filtered);

        // Update selection
        if (selectedFolder && selectedFolder.id === folderId) {
            const nextFolder = filtered[0];
            setSelectedFolder(nextFolder);
            if (nextFolder.surfaces.length > 0) {
                setSelectedSurface(nextFolder.surfaces[0]);
            } else {
                setSelectedSurface(null);
            }
        }

        // Critical: Force complete focus reset to prevent input lock
        // This must happen after React finishes updating the DOM
        requestAnimationFrame(() => {
            // Blur any active element
            if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.blur();
            }

            // Remove any lingering focus from inputs
            const inputs = document.querySelectorAll('input, textarea, select, button');
            inputs.forEach(input => {
                if (input === document.activeElement) {
                    input.blur();
                }
            });

            // Reset focus to body
            document.body.tabIndex = -1;
            document.body.focus();
            document.body.removeAttribute('tabindex');
        });
    };

    const renameFolder = async (folderId, newName) => {
        if (!newName || !newName.trim()) return;

        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;

        // Rename folder on disk
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.renameFolder(folder.name, newName);
                if (!result.success) {
                    alert(result.error || 'Failed to rename folder');
                    return;
                }
            } catch (error) {
                alert('Error renaming folder: ' + error.message);
                return;
            }
        }

        const updated = folders.map(f =>
            f.id === folderId ? { ...f, id: newName, name: newName } : f
        );
        setFolders(updated);

        // Update selected folder if it was renamed
        if (selectedFolder && selectedFolder.id === folderId) {
            setSelectedFolder({ ...selectedFolder, id: newName, name: newName });
        }
    };

    const toggleFolderExpanded = (folderId) => {
        const updated = folders.map(f =>
            f.id === folderId ? { ...f, expanded: !f.expanded } : f
        );
        setFolders(updated);
    };

    // ============================================
    // RENDER HELPERS (removed - now in separate panel components)
    // ============================================

    // ============================================
    // RENDER
    // ============================================

    const c = getPalette(theme);

    return h('div', {
        style: {
            width: '100vw',
            height: '100vh',
            backgroundColor: c.bg,
            color: c.text,
            fontFamily: 'Segoe UI, Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        onClick: () => setContextMenu(null)
    },
        // Custom Title Bar
        h(TitleBar, {
            c,
            onWindowControl: handleWindowControl
        }),
        // Custom Menu Bar
        h(MenuBar, {
            c,
            onMenuAction: handleMenuAction,
            t
        }),
        // Settings Modal
        showSettings && h(SettingsModal, {
            colorscale,
            setColorscale,
            wavelength,
            setWavelength,
            gridSize3D,
            setGridSize3D,
            gridSize2D,
            setGridSize2D,
            theme,
            setTheme,
            locale,
            setLocale,
            fastConvertThreshold,
            setFastConvertThreshold,
            onClose: () => setShowSettings(false),
            c,
            t
        }),
        // ZMX Import Dialog
        showZMXImport && h(ZMXImportDialog, {
            zmxSurfaces,
            onImport: handleImportSelectedSurfaces,
            onClose: () => setShowZMXImport(false),
            c,
            t
        }),
        // Conversion Dialog
        showConvert && h(ConversionDialog, {
            selectedSurface,
            folders,
            selectedFolder,
            setFolders,
            setSelectedSurface,
            setShowConvert,
            setShowConvertResults,
            setConvertResults,
            c,
            t
        }),
        // Conversion Results Dialog
        showConvertResults && h(ConversionResultsDialog, {
            convertResults,
            folders,
            selectedFolder,
            setFolders,
            setSelectedSurface,
            onClose: () => setShowConvertResults(false),
            c,
            t
        }),
        // Normalize UnZ Dialog
        showNormalizeUnZ && selectedSurface && h(NormalizeUnZDialog, {
            currentH: parseNumber(selectedSurface.parameters.H),
            onConfirm: handleNormalizeUnZConfirm,
            onCancel: () => setShowNormalizeUnZ(false),
            c,
            t
        }),
        // About Dialog
        showAbout && h(AboutDialog, {
            c,
            onClose: () => setShowAbout(false)
        }),
        // Update Notification (VS Code style, non-modal)
        showUpdateNotification && h(UpdateNotification, {
            c,
            t,
            updateInfo,
            onClose: () => setShowUpdateNotification(false),
            onDownload: () => {
                if (window.electronAPI && window.electronAPI.openExternal) {
                    window.electronAPI.openExternal(updateInfo.downloadUrl);
                }
            }
        }),
        // Message Notification (info/success/error messages)
        messageNotification && h(MessageNotification, {
            c,
            message: messageNotification.message,
            type: messageNotification.type,
            onClose: () => setMessageNotification(null)
        }),
        // Input Dialog (for rename/new folder)
        h(InputDialog, {
            inputDialog,
            c,
            t
        }),
        // Context Menu
        contextMenu && h('div', {
            style: {
                position: 'fixed',
                left: contextMenu.x + 'px',
                top: contextMenu.y + 'px',
                backgroundColor: c.panel,
                border: `1px solid ${c.border}`,
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '160px',
                overflow: 'hidden'
            },
            onClick: (e) => e.stopPropagation()
        },
            contextMenu.type === 'folder' ? [
                h('div', {
                    key: 'rename',
                    style: {
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        borderBottom: `1px solid ${c.border}`
                    },
                    onClick: (e) => {
                        e.stopPropagation();
                        const targetId = contextMenu.target.id;
                        const targetName = contextMenu.target.name;
                        setContextMenu(null);
                        setInputDialog({
                            title: t.dialogs.contextMenu.renameFolder,
                            defaultValue: targetName,
                            validate: (name) => {
                                if (!name || !name.trim()) {
                                    return t.dialogs.folder.folderNameEmpty;
                                }
                                // Allow same name (no change) but check for conflicts with other folders (case-insensitive)
                                if (name.trim().toLowerCase() !== targetName.toLowerCase() &&
                                    folders.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) {
                                    return t.dialogs.folder.folderExists;
                                }
                                return '';
                            },
                            onConfirm: (name) => {
                                if (name && name.trim()) {
                                    renameFolder(targetId, name.trim());
                                }
                                setInputDialog(null);
                            },
                            onCancel: () => setInputDialog(null)
                        });
                    },
                    onMouseEnter: (e) => e.currentTarget.style.backgroundColor = c.hover,
                    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
                }, t.dialogs.contextMenu.rename),
                h('div', {
                    key: 'delete',
                    style: {
                        padding: '10px 16px',
                        cursor: folders.length > 1 ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        color: folders.length > 1 ? '#e94560' : c.textDim
                    },
                    onClick: () => {
                        if (folders.length > 1) {
                            removeFolder(contextMenu.target.id);
                        }
                        setContextMenu(null);
                    },
                    onMouseEnter: (e) => {
                        if (folders.length > 1) e.currentTarget.style.backgroundColor = c.hover;
                    },
                    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
                }, t.dialogs.contextMenu.deleteFolder)
            ] : [
                h('div', {
                    key: 'delete',
                    style: {
                        padding: '10px 16px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#e94560'
                    },
                    onClick: () => {
                        removeSurface();
                        setContextMenu(null);
                    },
                    onMouseEnter: (e) => e.currentTarget.style.backgroundColor = c.hover,
                    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
                }, t.dialogs.contextMenu.deleteSurface)
            ]
        ),
        // Main Content Area
        h('div', { style: { display: 'flex', flex: 1, overflow: 'hidden' } },
            // Left Panel - Surfaces
            h(SurfacesPanel, {
                folders,
                selectedFolder,
                selectedSurface,
                selectedSurfaces,
                handleSurfaceClick,
                setSelectedFolder,
                toggleFolderExpanded,
                addSurface,
                removeSelectedSurfaces,
                setContextMenu,
                setInputDialog,
                addFolder,
                c,
                t
            }),

            // Center Panel - Visualization
            h(VisualizationPanel, {
                selectedSurface,
                activeTab,
                setActiveTab,
                activeSubTab,
                setActiveSubTab,
                plotRef,
                wavelength,
                c,
                t
            }),

            // Right Panel - Properties
            h(PropertiesPanel, {
                selectedSurface,
                updateSurfaceName,
                updateSurfaceType,
                updateParameter,
                onConvert: () => setShowConvert(true),
                onFastConvertToPoly: handleFastConvertToPoly,
                fastConvertProgress,
                wavelength,
                propertiesPanelRef,
                scrollPositionRef,
                handlePropertiesPanelScroll,
                handleEnterKeyNavigation,
                handleExportHTMLReport,
                handleExportPDFReport,
                handleInvertSurface,
                handleNormalizeUnZ,
                handleConvertToUnZ,
                handleConvertToPoly,
                c,
                t
            })
        )
    );
};

// ============================================
// MOUNT APPLICATION
// ============================================

// Wait for DOM and all scripts to be ready before mounting
const mountApp = () => {
    console.log('📦 Mounting SurfaceExpert (Modular)...');

    // Check if dependencies are available
    if (typeof SurfaceCalculations === 'undefined') {
        console.error('❌ SurfaceCalculations not loaded!');
    }
    if (typeof ZMXParser === 'undefined') {
        console.error('❌ ZMXParser not loaded!');
    }
    if (typeof Plotly === 'undefined') {
        console.error('❌ Plotly not loaded!');
    }

    // Make sure globals are accessible
    window.SurfaceCalculations = window.SurfaceCalculations || SurfaceCalculations;
    window.ZMXParser = window.ZMXParser || ZMXParser;

    ReactDOM.render(h(OpticalSurfaceAnalyzer), document.getElementById('root'));
    console.log('✅ Application mounted successfully!');
};

// Wait for window load event (ensures all scripts have executed)
if (document.readyState === 'complete') {
    mountApp();
} else {
    window.addEventListener('load', mountApp);
}
