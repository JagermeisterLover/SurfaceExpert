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
import { surfaceTypes, universalParameters, sampleSurfaces, colorscales, colors } from './constants/surfaceTypes.js';

// Utilities
import { formatValue, degreesToDMS } from './utils/formatters.js';
import { calculateSurfaceValues, calculateSagOnly, getBestFitSphereParams, calculateSurfaceMetrics } from './utils/calculations.js';
import { generateReportData } from './utils/reportGenerator.js';

// UI Components
import { PropertySection } from './components/ui/PropertySection.js';
import { PropertyRow } from './components/ui/PropertyRow.js';
import { DebouncedInput } from './components/ui/DebouncedInput.js';

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

// Plot Components
import { create3DPlot } from './components/plots/Plot3D.js';
import { create2DContour } from './components/plots/Plot2DContour.js';
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
    const [colorscale, setColorscale] = useState('Viridis');
    const [wavelength, setWavelength] = useState(632.8); // Reference wavelength in nm for RMS/PV calculations
    const [contextMenu, setContextMenu] = useState(null);
    const [inputDialog, setInputDialog] = useState(null);
    const plotRef = useRef(null);
    const propertiesPanelRef = useRef(null);
    const scrollPositionRef = useRef(0);
    const selectedSurfaceRef = useRef(null);  // Ref to always access latest selectedSurface in closures

    // Update ref whenever selectedSurface changes
    useEffect(() => {
        selectedSurfaceRef.current = selectedSurface;
    }, [selectedSurface]);

    // ============================================
    // DATA LOADING
    // ============================================

    // Load folders on mount
    useEffect(() => {
        loadFoldersFromDisk();
    }, []);

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
        if (plotRef.current && activeTab !== 'summary' && activeSubTab === '3d') {
            create3DPlot(plotRef, selectedSurface, activeTab, colorscale);
        } else if (plotRef.current && activeTab !== 'summary' && activeSubTab === '2d') {
            create2DContour(plotRef, selectedSurface, activeTab, colorscale, colors);
        } else if (plotRef.current && activeTab !== 'summary' && activeSubTab === 'cross') {
            createCrossSection(plotRef, selectedSurface, activeTab);
        }
    }, [selectedSurface, activeTab, activeSubTab, colorscale]);

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
            // Add more handlers as needed
        }
    };

    // ============================================
    // ZMX IMPORT HANDLING
    // ============================================

    const handleImportZMX = async () => {
        if (!window.electronAPI || !window.electronAPI.openZMXDialog) {
            alert('File dialog not available');
            return;
        }

        const result = await window.electronAPI.openZMXDialog();

        if (result.canceled) {
            if (result.error) {
                alert('Error opening file: ' + result.error);
            }
            return;
        }

        try {
            const parsedSurfaces = window.ZMXParser.parse(result.content);
            setZmxSurfaces(parsedSurfaces);
            setShowZMXImport(true);
        } catch (error) {
            alert('Error parsing ZMX file: ' + error.message);
        }
    };

    const handleImportSelectedSurfaces = (selectedIndices) => {
        // If no folder exists, create a default one
        let targetFolder = selectedFolder;
        let currentFolders = folders;

        if (!targetFolder) {
            const defaultFolder = {
                id: 'default',
                name: 'My Surfaces',
                expanded: true,
                surfaces: []
            };
            currentFolders = [defaultFolder];
            targetFolder = defaultFolder;
        }

        const colorOptions = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
        const allSurfaces = currentFolders.flatMap(f => f.surfaces);
        let nextId = allSurfaces.length > 0 ? Math.max(...allSurfaces.map(s => s.id)) + 1 : 1;

        // Helper to generate unique surface name
        const getUniqueName = (baseName) => {
            const existingNames = new Set(allSurfaces.map(s => s.name));
            if (!existingNames.has(baseName)) return baseName;

            let counter = 1;
            let newName = `${baseName} (${counter})`;
            while (existingNames.has(newName)) {
                counter++;
                newName = `${baseName} (${counter})`;
            }
            return newName;
        };

        const newSurfaces = selectedIndices.map((index, i) => {
            const zmxSurface = zmxSurfaces[index];
            const color = colorOptions[(nextId + i) % colorOptions.length];
            const surface = window.ZMXParser.convertToAppSurface(zmxSurface, nextId + i, color);

            // Ensure unique name
            surface.name = getUniqueName(surface.name);
            return surface;
        });

        const updated = currentFolders.map(f =>
            f.id === targetFolder.id
                ? { ...f, surfaces: [...f.surfaces, ...newSurfaces] }
                : f
        );
        setFolders(updated);
        setSelectedFolder(targetFolder);
        setShowZMXImport(false);

        if (newSurfaces.length > 0) {
            setSelectedSurface(newSurfaces[0]);
        }
    };

    // ============================================
    // REPORT GENERATION
    // ============================================

    const handleExportHTMLReport = async () => {
        // Use ref to access latest value (important for menu actions)
        const surface = selectedSurfaceRef.current;
        console.log('handleExportHTMLReport called, surface:', surface);

        if (!surface) {
            alert('Please select a surface from the list to generate a report.\n\nClick on a surface in the left sidebar to select it.');
            return;
        }

        if (!window.electronAPI || !window.electronAPI.saveHTMLReport) {
            alert('Report export not available - please check Electron API');
            return;
        }

        try {
            console.log('Generating report for surface:', surface.name);

            // Generate plot data for the report
            const plotData = generateReportPlotData(surface);

            // Calculate summary metrics
            const summaryMetrics = calculateSurfaceMetrics(surface, wavelength);

            // Generate report data with plot images
            const reportData = await generateReportData(
                surface,
                plotData,
                summaryMetrics
            );

            // Sanitize surface name for filename
            const sanitizedName = surface.name.replace(/[<>:"/\\|?*]/g, '_');

            // Save HTML report via Electron dialog
            const result = await window.electronAPI.saveHTMLReport(reportData.html, sanitizedName);

            // Only show error alerts, success opens folder automatically
            if (!result.canceled && !result.success) {
                alert('Error saving report: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error generating report: ' + error.message);
            console.error('Report generation error:', error);
        }
    };

    const handleExportPDFReport = async () => {
        // Use ref to access latest value (important for menu actions)
        const surface = selectedSurfaceRef.current;
        console.log('handleExportPDFReport called, surface:', surface);

        if (!surface) {
            alert('Please select a surface from the list to generate a report.\n\nClick on a surface in the left sidebar to select it.');
            return;
        }

        if (!window.electronAPI || !window.electronAPI.generatePDFReport) {
            alert('PDF export not available - please check Electron API');
            return;
        }

        try {
            console.log('Generating PDF report for surface:', surface.name);

            // Generate plot data for the report
            const plotData = generateReportPlotData(surface);

            // Calculate summary metrics
            const summaryMetrics = calculateSurfaceMetrics(surface, wavelength);

            // Generate report data with plot images
            const reportData = await generateReportData(
                surface,
                plotData,
                summaryMetrics
            );

            // Sanitize surface name for filename
            const sanitizedName = surface.name.replace(/[<>:"/\\|?*]/g, '_');

            // Generate and save PDF report via Electron
            const result = await window.electronAPI.generatePDFReport(reportData.html, sanitizedName);

            // Only show error alerts, success opens folder automatically
            if (!result.canceled && !result.success) {
                alert('Error saving PDF: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error generating PDF: ' + error.message);
            console.error('PDF generation error:', error);
        }
    };

    // Helper function to generate plot data for reports
    const generateReportPlotData = (surface) => {
        const minHeight = parseFloat(surface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(surface.parameters['Max Height']) || 25;
        const step = parseFloat(surface.parameters['Step']) || 1;

        const rValues = [];
        const sagValues = [];
        const slopeValues = [];
        const asphericityValues = [];
        const aberrationValues = [];
        const angleValues = [];

        for (let r = minHeight; r <= maxHeight; r += step) {
            // For non-rotationally symmetric surfaces, use scan angle
            let values;
            if (surface.type === 'Irregular' || surface.type === 'Zernike') {
                const scanAngle = parseFloat(surface.parameters['Scan Angle']) || 0;
                const scanAngleRad = scanAngle * Math.PI / 180;
                const x = r * Math.cos(scanAngleRad);
                const y = r * Math.sin(scanAngleRad);
                values = calculateSurfaceValues(r, surface, x, y);
            } else {
                values = calculateSurfaceValues(r, surface);
            }

            rValues.push(r);
            sagValues.push(values.sag);
            slopeValues.push(values.slope);
            asphericityValues.push(values.asphericity);
            aberrationValues.push(values.aberration);
            angleValues.push(values.angle);
        }

        return {
            rValues,
            sagValues,
            slopeValues,
            asphericityValues,
            aberrationValues,
            angleValues
        };
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
            let currentIndex = -1;
            for (let i = 0; i < inputs.length; i++) {
                const input = inputs[i];
                const container = input.parentElement;
                const label = container?.querySelector('label');
                if (label?.textContent?.trim() === currentParam) {
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

        // Delete folder on disk
        if (window.electronAPI) {
            const result = await window.electronAPI.deleteFolder(folder.name);
            if (!result.success) {
                alert(result.error || 'Failed to delete folder');
                return;
            }
        }

        const filtered = folders.filter(f => f.id !== folderId);
        setFolders(filtered);
        if (selectedFolder && selectedFolder.id === folderId) {
            setSelectedFolder(filtered[0]);
            if (filtered[0].surfaces.length > 0) {
                setSelectedSurface(filtered[0].surfaces[0]);
            } else {
                setSelectedSurface(null);
            }
        }
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
    // PROPERTIES PANEL COMPONENT
    // ============================================

    const PropertiesPanel = ({ selectedSurface, updateSurfaceName, updateSurfaceType, updateParameter, onConvert, c }) => {
        // Local state for surface name to avoid interrupting typing
        const [localName, setLocalName] = React.useState(selectedSurface?.name || '');

        // Update local name when selected surface changes
        React.useEffect(() => {
            if (selectedSurface) {
                setLocalName(selectedSurface.name);
            }
        }, [selectedSurface?.id]);

        if (!selectedSurface) {
            return h('div', {
                style: {
                    width: '300px',
                    backgroundColor: c.panel,
                    borderLeft: `1px solid ${c.border}`,
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: c.textDim,
                    fontSize: '13px'
                }
            }, 'No surface selected');
        }

        // Calculate metrics for display using shared utility function
        const rawMetrics = calculateSurfaceMetrics(selectedSurface, wavelength);
        const metrics = {
            paraxialFNum: formatValue(rawMetrics.paraxialFNum),
            workingFNum: formatValue(rawMetrics.workingFNum),
            maxSag: formatValue(rawMetrics.maxSag) + ' mm',
            maxSlope: formatValue(rawMetrics.maxSlope) + ' rad',
            maxAngle: formatValue(rawMetrics.maxAngle) + ' °',
            maxAngleDMS: degreesToDMS(rawMetrics.maxAngle),
            maxAsphericity: formatValue(rawMetrics.maxAsphericity) + ' mm',
            maxAsphGradient: formatValue(rawMetrics.maxAsphGradient) + ' /mm',
            bestFitSphere: formatValue(rawMetrics.bestFitSphere) + ' mm',
            rmsError: rawMetrics.rmsError !== null ? {
                mm: formatValue(rawMetrics.rmsError.mm) + ' mm',
                waves: formatValue(rawMetrics.rmsError.waves) + ' λ'
            } : null,
            pvError: rawMetrics.pvError !== null ? {
                mm: formatValue(rawMetrics.pvError.mm) + ' mm',
                waves: formatValue(rawMetrics.pvError.waves) + ' λ'
            } : null
        };

        return h('div', {
            ref: propertiesPanelRef,
            onScroll: handlePropertiesPanelScroll,
            style: {
                width: '320px',
                backgroundColor: c.panel,
                borderLeft: `1px solid ${c.border}`,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto'
            }
        },
            h('div', {
                style: {
                    padding: '12px',
                    borderBottom: `1px solid ${c.border}`,
                    fontSize: '13px',
                    fontWeight: 'bold'
                }
            }, 'Properties'),

            h('div', { style: { padding: '12px' } },
                // Basic Properties
                h(PropertySection, { title: "Basic", c },
                    h('div', { style: { marginBottom: '8px' } },
                        h('label', {
                            style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                        }, 'Name'),
                        h('input', {
                            type: 'text',
                            value: localName,
                            onChange: (e) => setLocalName(e.target.value),
                            onBlur: (e) => {
                                if (e.target.value !== selectedSurface.name) {
                                    updateSurfaceName(e.target.value);
                                }
                            },
                            onKeyDown: (e) => {
                                if (e.key === 'Enter') {
                                    e.target.blur();
                                }
                            },
                            style: {
                                width: '100%',
                                padding: '6px 8px',
                                backgroundColor: c.bg,
                                color: c.text,
                                border: `1px solid ${c.border}`,
                                borderRadius: '3px',
                                fontSize: '13px'
                            }
                        })
                    ),

                    h('div', { style: { marginBottom: '8px' } },
                        h('label', {
                            style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                        }, 'Type'),
                        h('select', {
                            value: selectedSurface.type,
                            onChange: (e) => updateSurfaceType(e.target.value),
                            style: {
                                width: '100%',
                                padding: '6px 8px',
                                backgroundColor: c.bg,
                                color: c.text,
                                border: `1px solid ${c.border}`,
                                borderRadius: '3px',
                                fontSize: '13px',
                                cursor: 'pointer'
                            }
                        },
                            Object.keys(surfaceTypes).map(type =>
                                h('option', { key: type, value: type }, type)
                            )
                        )
                    )
                ),

                // Parameters
                h(PropertySection, { title: "Parameters", c },
                    h('div', {
                        style: {
                            padding: '10px',
                            backgroundColor: c.bg,
                            borderRadius: '4px',
                            marginBottom: '12px',
                            border: `1px solid ${c.border}`
                        }
                    },
                        h('div', {
                            style: {
                                fontSize: '11px',
                                fontWeight: '600',
                                color: c.textDim,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                            }
                        }, 'Universal'),
                        universalParameters[selectedSurface.type].map(param => (
                            selectedSurface.parameters[param] !== undefined &&
                            h('div', { key: param, style: { marginBottom: '8px' } },
                                h('label', {
                                    style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                                }, param),
                                h(DebouncedInput, {
                                    value: selectedSurface.parameters[param] || '0',
                                    onChange: (value) => updateParameter(param, value),
                                    onEnterKey: () => handleEnterKeyNavigation(param),
                                    debounceMs: 300,
                                    style: {
                                        width: '100%',
                                        padding: '6px 8px',
                                        backgroundColor: c.panel,
                                        color: c.text,
                                        border: `1px solid ${c.border}`,
                                        borderRadius: '3px',
                                        fontSize: '13px',
                                        textAlign: 'right'
                                    }
                                })
                            )
                        ))
                    ),

                    // Scan & Coordinates box for non-rotationally symmetric surfaces
                    (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') &&
                    h('div', {
                        style: {
                            padding: '10px',
                            backgroundColor: c.bg,
                            borderRadius: '4px',
                            marginBottom: '12px',
                            border: `1px solid ${c.border}`
                        }
                    },
                        h('div', {
                            style: {
                                fontSize: '11px',
                                fontWeight: '600',
                                color: c.textDim,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                            }
                        }, 'Scan & Coordinates'),
                        ['Scan Angle', 'X Coordinate', 'Y Coordinate'].map(param => (
                            selectedSurface.parameters[param] !== undefined &&
                            h('div', { key: param, style: { marginBottom: '8px' } },
                                h('label', {
                                    style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                                }, param),
                                h(DebouncedInput, {
                                    value: selectedSurface.parameters[param] || '0',
                                    onChange: (value) => updateParameter(param, value),
                                    onEnterKey: () => handleEnterKeyNavigation(param),
                                    debounceMs: 300,
                                    style: {
                                        width: '100%',
                                        padding: '6px 8px',
                                        backgroundColor: c.panel,
                                        color: c.text,
                                        border: `1px solid ${c.border}`,
                                        borderRadius: '3px',
                                        fontSize: '13px',
                                        textAlign: 'right'
                                    }
                                })
                            )
                        ))
                    ),

                    surfaceTypes[selectedSurface.type].filter(param => {
                        // Filter out scan & coordinate parameters (they have their own box)
                        if (['Scan Angle', 'X Coordinate', 'Y Coordinate'].includes(param)) return false;

                        // For Zernike surfaces, only show Z1-ZN based on "Number of Terms"
                        if (selectedSurface.type === 'Zernike' && param.match(/^Z\d+$/)) {
                            const zNum = parseInt(param.substring(1));
                            const numTerms = parseInt(selectedSurface.parameters['Number of Terms']) || 0;
                            return zNum <= numTerms;
                        }

                        return true;
                    }).map(param =>
                        h('div', { key: param, style: { marginBottom: '8px' } },
                            h('label', {
                                style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                            }, param),
                            h(DebouncedInput, {
                                value: selectedSurface.parameters[param] || '0',
                                onChange: (value) => updateParameter(param, value),
                                onEnterKey: () => handleEnterKeyNavigation(param),
                                debounceMs: 300,
                                style: {
                                    width: '100%',
                                    padding: '6px 8px',
                                    backgroundColor: c.bg,
                                    color: c.text,
                                    border: `1px solid ${c.border}`,
                                    borderRadius: '3px',
                                    fontSize: '13px',
                                    textAlign: 'right'
                                }
                            })
                        )
                    )
                ),

                // Calculated Metrics
                h(PropertySection, { title: "Calculated Metrics", c },
                    // F/# only for rotationally symmetric surfaces
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Paraxial F/#", value: metrics.paraxialFNum, editable: false, c }),
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Working F/#", value: metrics.workingFNum, editable: false, c }),
                    h(PropertyRow, { label: "Max Sag", value: metrics.maxSag, editable: false, c }),
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Max Slope", value: metrics.maxSlope, editable: false, c }),
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Max Angle", value: metrics.maxAngle, editable: false, c }),
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Max Angle DMS", value: metrics.maxAngleDMS, editable: false, c }),
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Max Asphericity", value: metrics.maxAsphericity, editable: false, c }),
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Max Asph. Gradient", value: metrics.maxAsphGradient, editable: false, c }),
                    selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: "Best Fit Sphere", value: metrics.bestFitSphere, editable: false, c }),
                    // RMS and P-V error for Zernike and Irregular surfaces
                    (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.rmsError && h(PropertyRow, { label: "RMS Error (mm)", value: metrics.rmsError.mm, editable: false, c }),
                    (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.rmsError && h(PropertyRow, { label: "RMS Error (waves)", value: metrics.rmsError.waves, editable: false, c }),
                    (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.pvError && h(PropertyRow, { label: "P-V Error (mm)", value: metrics.pvError.mm, editable: false, c }),
                    (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.pvError && h(PropertyRow, { label: "P-V Error (waves)", value: metrics.pvError.waves, editable: false, c })
                ),

                // Quick Actions
                h(PropertySection, { title: "Quick Actions", c },
                    h('button', {
                        onClick: onConvert,
                        style: {
                            width: '100%',
                            padding: '8px',
                            marginBottom: '6px',
                            backgroundColor: c.hover,
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }
                    }, 'Convert'),
                    h('button', {
                        onClick: handleExportHTMLReport,
                        style: {
                            width: '100%',
                            padding: '8px',
                            marginBottom: '6px',
                            backgroundColor: c.accent,
                            color: 'white',
                            border: `1px solid ${c.accent}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }
                    }, 'Generate HTML Report'),
                    h('button', {
                        onClick: handleExportPDFReport,
                        style: {
                            width: '100%',
                            padding: '8px',
                            backgroundColor: c.accent,
                            color: 'white',
                            border: `1px solid ${c.accent}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }
                    }, 'Generate PDF Report')
                )
            )
        );
    };

    // ============================================
    // RENDER
    // ============================================

    const c = colors;

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
        // Settings Modal
        showSettings && h(SettingsModal, {
            colorscale,
            setColorscale,
            wavelength,
            setWavelength,
            onClose: () => setShowSettings(false),
            c
        }),
        // ZMX Import Dialog
        showZMXImport && h(ZMXImportDialog, {
            zmxSurfaces,
            onImport: handleImportSelectedSurfaces,
            onClose: () => setShowZMXImport(false),
            c
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
            c
        }),
        // Conversion Results Dialog
        showConvertResults && h(ConversionResultsDialog, {
            convertResults,
            folders,
            selectedFolder,
            setFolders,
            setSelectedSurface,
            onClose: () => setShowConvertResults(false),
            c
        }),
        // Input Dialog (for rename/new folder)
        h(InputDialog, {
            inputDialog,
            c
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
                            title: 'Rename Folder',
                            defaultValue: targetName,
                            validate: (name) => {
                                if (!name || !name.trim()) {
                                    return 'Folder name cannot be empty';
                                }
                                // Allow same name (no change) but check for conflicts with other folders
                                if (name.trim() !== targetName && folders.some(f => f.name === name.trim())) {
                                    return 'A folder with this name already exists';
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
                }, 'Rename'),
                h('div', {
                    key: 'delete',
                    style: {
                        padding: '10px 16px',
                        cursor: folders.length > 1 ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        color: folders.length > 1 ? '#e94560' : c.textDim
                    },
                    onClick: () => {
                        if (folders.length > 1 && confirm(`Delete folder "${contextMenu.target.name}"?`)) {
                            removeFolder(contextMenu.target.id);
                        }
                        setContextMenu(null);
                    },
                    onMouseEnter: (e) => {
                        if (folders.length > 1) e.currentTarget.style.backgroundColor = c.hover;
                    },
                    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
                }, 'Delete Folder')
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
                }, 'Delete Surface')
            ]
        ),
        // Main Content Area
        h('div', { style: { display: 'flex', flex: 1, overflow: 'hidden' } },
            // Left Panel - Surfaces
            h('div', {
                style: {
                    width: '220px',
                    backgroundColor: c.panel,
                    borderRight: `1px solid ${c.border}`,
                    display: 'flex',
                    flexDirection: 'column'
                }
            },
                h('div', {
                    style: {
                        padding: '12px',
                        borderBottom: `1px solid ${c.border}`,
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }
                },
                    h('span', null, 'Surfaces'),
                    selectedSurfaces.length > 0 && h('button', {
                        onClick: removeSelectedSurfaces,
                        title: `Delete ${selectedSurfaces.length} surface(s)`,
                        style: {
                            padding: '4px 8px',
                            backgroundColor: '#e94560',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'normal'
                        }
                    }, `Delete (${selectedSurfaces.length})`)
                ),
                h('div', { style: { flex: 1, overflow: 'auto', padding: '4px' } },
                    folders.map(folder =>
                        h('div', { key: folder.id, style: { marginBottom: '4px' } },
                            // Folder header
                            h('div', {
                                style: {
                                    padding: '8px',
                                    backgroundColor: selectedFolder?.id === folder.id ? c.hover : 'transparent',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                },
                                onClick: () => {
                                    toggleFolderExpanded(folder.id);
                                    setSelectedFolder(folder);
                                },
                                onContextMenu: (e) => {
                                    e.preventDefault();
                                    setSelectedFolder(folder);
                                    setContextMenu({
                                        x: e.clientX,
                                        y: e.clientY,
                                        type: 'folder',
                                        target: folder
                                    });
                                }
                            },
                                h('span', { style: { fontSize: '10px', userSelect: 'none' } },
                                    folder.expanded ? '▼' : '▶'
                                ),
                                h('span', { style: { flex: 1 } }, folder.name),
                                h('span', {
                                    style: { fontSize: '10px', color: c.textDim }
                                }, `(${folder.surfaces.length})`)
                            ),
                            // Folder surfaces
                            folder.expanded && h('div', { style: { paddingLeft: '16px' } },
                                folder.surfaces.map(surface => {
                                    const isSelected = selectedSurface?.id === surface.id;
                                    const isMultiSelected = selectedSurfaces.includes(surface.id);
                                    const bgColor = isMultiSelected ? c.accent : (isSelected ? c.hover : 'transparent');

                                    return h('div', {
                                        key: surface.id,
                                        onClick: (e) => handleSurfaceClick(e, surface, folder),
                                        onContextMenu: (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSelectedSurface(surface);
                                            setSelectedFolder(folder);
                                            setContextMenu({
                                                x: e.clientX,
                                                y: e.clientY,
                                                type: 'surface',
                                                target: surface,
                                                folder: folder
                                            });
                                        },
                                        style: {
                                            padding: '8px',
                                            marginTop: '2px',
                                            backgroundColor: bgColor,
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'background-color 0.2s',
                                            border: isMultiSelected ? `2px solid ${c.accent}` : 'none'
                                        },
                                        onMouseEnter: (e) => {
                                            if (!isSelected && !isMultiSelected) {
                                                e.currentTarget.style.backgroundColor = c.border;
                                            }
                                        },
                                        onMouseLeave: (e) => {
                                            if (!isSelected && !isMultiSelected) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                        }
                                    },
                                        h('div', {
                                            style: {
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '2px',
                                                backgroundColor: surface.color,
                                                flexShrink: 0
                                            }
                                        }),
                                        h('div', { style: { flex: 1, minWidth: 0 } },
                                            h('div', {
                                                style: { fontSize: '12px', fontWeight: '500', marginBottom: '1px' }
                                            }, surface.name),
                                            h('div', {
                                                style: { fontSize: '10px', color: c.textDim }
                                            }, surface.type)
                                        )
                                    );
                                })
                            )
                        )
                    )
                ),
                // Add buttons
                h('div', {
                    style: {
                        padding: '8px',
                        borderTop: `1px solid ${c.border}`,
                        display: 'flex',
                        gap: '6px',
                        fontSize: '12px'
                    }
                },
                    h('button', {
                        onClick: (e) => {
                            e.stopPropagation();
                            setInputDialog({
                                title: 'New Folder',
                                defaultValue: 'New Folder',
                                validate: (name) => {
                                    if (!name || !name.trim()) {
                                        return 'Folder name cannot be empty';
                                    }
                                    if (folders.some(f => f.name === name.trim())) {
                                        return 'A folder with this name already exists';
                                    }
                                    return '';
                                },
                                onConfirm: (name) => {
                                    if (name && name.trim()) {
                                        addFolder(name.trim());
                                    }
                                    setInputDialog(null);
                                },
                                onCancel: () => setInputDialog(null)
                            });
                        },
                        style: {
                            flex: 1,
                            padding: '8px',
                            backgroundColor: c.panel,
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }
                    }, '+ Folder'),
                    h('button', {
                        onClick: addSurface,
                        disabled: !selectedFolder,
                        style: {
                            flex: 1,
                            padding: '8px',
                            backgroundColor: selectedFolder ? c.accent : c.border,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedFolder ? 'pointer' : 'not-allowed',
                            fontSize: '12px',
                            fontWeight: '500'
                        }
                    }, '+ Surface')
                )
            ),

            // Center Panel - Visualization
            h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
                // Main Tabs
                h('div', {
                    style: {
                        display: 'flex',
                        backgroundColor: c.panel,
                        borderBottom: `1px solid ${c.border}`,
                        gap: '2px',
                        padding: '8px 8px 0 8px'
                    }
                },
                    (selectedSurface && (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike')
                        ? ['summary', 'sag']  // Non-rotationally symmetric surfaces only support sag
                        : ['summary', 'sag', 'slope', 'asphericity', 'aberration']
                    ).map(tab =>
                        h('div', {
                            key: tab,
                            onClick: () => {
                                setActiveTab(tab);
                                if (tab !== 'summary') setActiveSubTab('3d');
                            },
                            style: {
                                padding: '8px 16px',
                                cursor: 'pointer',
                                backgroundColor: activeTab === tab ? c.bg : 'transparent',
                                borderTopLeftRadius: '4px',
                                borderTopRightRadius: '4px',
                                borderBottom: activeTab === tab ? 'none' : `1px solid ${c.border}`,
                                fontSize: '13px',
                                fontWeight: activeTab === tab ? '600' : '400',
                                color: activeTab === tab ? c.text : c.textDim,
                                transition: 'all 0.2s'
                            },
                            onMouseEnter: (e) => {
                                if (activeTab !== tab) {
                                    e.currentTarget.style.backgroundColor = c.hover;
                                }
                            },
                            onMouseLeave: (e) => {
                                if (activeTab !== tab) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }
                        }, tab.charAt(0).toUpperCase() + tab.slice(1))
                    )
                ),

                // Sub-tabs for non-summary tabs
                activeTab !== 'summary' && h('div', {
                    style: {
                        display: 'flex',
                        backgroundColor: c.bg,
                        borderBottom: `1px solid ${c.border}`,
                        gap: '2px',
                        padding: '4px 8px'
                    }
                },
                    ['3d', '2d', 'cross', 'data'].map(subTab =>
                        h('div', {
                            key: subTab,
                            onClick: () => setActiveSubTab(subTab),
                            style: {
                                padding: '6px 12px',
                                cursor: 'pointer',
                                backgroundColor: activeSubTab === subTab ? c.panel : 'transparent',
                                borderRadius: '3px',
                                fontSize: '12px',
                                fontWeight: activeSubTab === subTab ? '500' : '400',
                                color: activeSubTab === subTab ? c.text : c.textDim,
                                transition: 'all 0.2s'
                            },
                            onMouseEnter: (e) => {
                                if (activeSubTab !== subTab) {
                                    e.currentTarget.style.backgroundColor = c.hover;
                                }
                            },
                            onMouseLeave: (e) => {
                                if (activeSubTab !== subTab) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }
                        }, subTab === '3d' ? '3D View' :
                            subTab === '2d' ? '2D Contour' :
                                subTab === 'cross' ? 'Cross-Section' : 'Data')
                    )
                ),

                // Content Area
                h('div', { style: { flex: 1, overflow: 'auto', backgroundColor: c.bg } },
                    !selectedSurface ?
                        h('div', {
                            style: {
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '12px',
                                color: c.textDim,
                                fontSize: '14px'
                            }
                        },
                            h('div', { style: { fontSize: '48px' } }, '📊'),
                            h('div', null, 'Select a surface or create a new one')
                        ) :
                        activeTab === 'summary' ?
                            h(SummaryView, { selectedSurface, wavelength, c }) :
                            activeSubTab === 'data' ?
                                h(DataView, { activeTab, selectedSurface, c }) :
                                h('div', { ref: plotRef, style: { width: '100%', height: '100%' } })
                )
            ),

            // Right Panel - Properties
            h(PropertiesPanel, {
                selectedSurface,
                updateSurfaceName,
                updateSurfaceType,
                updateParameter,
                onConvert: () => setShowConvert(true),
                c
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
