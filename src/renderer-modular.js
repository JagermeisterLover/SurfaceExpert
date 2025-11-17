// ============================================
// SurfaceExpert - Modular Version
// ============================================
// Full application using ES6 modules
// Original: src/renderer.js (3,435 lines)
// Modular: Imports from 17 extracted modules

// ============================================
// MODULE IMPORTS
// ============================================

// Constants
import { surfaceTypes, sampleSurfaces, colorscales, colors } from './constants/surfaceTypes.js';

// Utilities
import { formatValue, degreesToDMS } from './utils/formatters.js';
import { calculateSurfaceValues, calculateSagOnly, getBestFitSphereParams } from './utils/calculations.js';

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
const { useState, useEffect, useRef } = React;

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
    const [activeTab, setActiveTab] = useState('summary');
    const [activeSubTab, setActiveSubTab] = useState('3d');
    const [showSettings, setShowSettings] = useState(false);
    const [showZMXImport, setShowZMXImport] = useState(false);
    const [zmxSurfaces, setZmxSurfaces] = useState([]);
    const [showConvert, setShowConvert] = useState(false);
    const [showConvertResults, setShowConvertResults] = useState(false);
    const [convertResults, setConvertResults] = useState(null);
    const [colorscale, setColorscale] = useState('Viridis');
    const [contextMenu, setContextMenu] = useState(null);
    const [inputDialog, setInputDialog] = useState(null);
    const plotRef = useRef(null);

    // ============================================
    // DATA LOADING
    // ============================================

    // Load folders on mount
    useEffect(() => {
        loadFoldersFromDisk();
    }, []);

    const loadFoldersFromDisk = async () => {
        if (window.electronAPI && window.electronAPI.loadFolders) {
            const result = await window.electronAPI.loadFolders();
            if (result.success) {
                setFolders(result.folders);
                // Select first surface if available
                if (result.folders.length > 0 && result.folders[0].surfaces.length > 0) {
                    setSelectedSurface(result.folders[0].surfaces[0]);
                    setSelectedFolder(result.folders[0]);
                }
            }
        } else {
            // Fallback for development without Electron
            const defaultFolder = {
                id: 'default',
                name: 'My Surfaces',
                expanded: true,
                surfaces: sampleSurfaces
            };
            setFolders([defaultFolder]);
            setSelectedSurface(sampleSurfaces[0]);
            setSelectedFolder(defaultFolder);
        }
    };

    // Update selected surface when it changes in the folders
    useEffect(() => {
        if (!selectedSurface) return;
        for (const folder of folders) {
            const updated = folder.surfaces.find(s => s.id === selectedSurface.id);
            if (updated) {
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
        if (!selectedFolder) return;

        const colorOptions = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
        const allSurfaces = folders.flatMap(f => f.surfaces);
        let nextId = allSurfaces.length > 0 ? Math.max(...allSurfaces.map(s => s.id)) + 1 : 1;

        const newSurfaces = selectedIndices.map((index, i) => {
            const zmxSurface = zmxSurfaces[index];
            const color = colorOptions[(nextId + i) % colorOptions.length];
            return window.ZMXParser.convertToAppSurface(zmxSurface, nextId + i, color);
        });

        const updated = folders.map(f =>
            f.id === selectedFolder.id
                ? { ...f, surfaces: [...f.surfaces, ...newSurfaces] }
                : f
        );
        setFolders(updated);
        setShowZMXImport(false);

        if (newSurfaces.length > 0) {
            setSelectedSurface(newSurfaces[0]);
        }
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
        surfaceTypes[newType].forEach(param => {
            newParams[param] = selectedSurface.parameters[param] || '0';
        });
        // Preserve Step parameter
        newParams['Step'] = selectedSurface.parameters['Step'] || '1';

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

    const updateParameter = async (param, value) => {
        if (!selectedSurface || !selectedFolder) return;

        const updatedSurface = {
            ...selectedSurface,
            parameters: { ...selectedSurface.parameters, [param]: value }
        };

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

        // Select another surface
        const updatedFolder = updated.find(f => f.id === selectedFolder.id);
        if (updatedFolder && updatedFolder.surfaces.length > 0) {
            setSelectedSurface(updatedFolder.surfaces[0]);
        } else {
            setSelectedSurface(null);
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

        // Calculate metrics for display
        const calculateMetrics = () => {
            const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
            const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
            const step = parseFloat(selectedSurface.parameters['Step']) || 1;
            const R = parseFloat(selectedSurface.parameters['Radius']) || 0;

            let maxSag = 0, maxSlope = 0, maxAngle = 0, maxAsphericity = 0, maxAberration = 0;
            let maxAsphGradient = 0;
            const values = [];

            for (let r = minHeight; r < maxHeight; r += step) {
                const v = calculateSurfaceValues(r, selectedSurface);
                values.push({ r, ...v });
                // For sag, track the value with maximum absolute value (preserving sign)
                if (Math.abs(v.sag) > Math.abs(maxSag)) {
                    maxSag = v.sag;
                }
                maxSlope = Math.max(maxSlope, Math.abs(v.slope));
                maxAngle = Math.max(maxAngle, Math.abs(v.angle));
                maxAsphericity = Math.max(maxAsphericity, Math.abs(v.asphericity));
                maxAberration = Math.max(maxAberration, Math.abs(v.aberration));
            }

            // Always include maxHeight
            const vMax = calculateSurfaceValues(maxHeight, selectedSurface);
            values.push({ r: maxHeight, ...vMax });
            // For sag, track the value with maximum absolute value (preserving sign)
            if (Math.abs(vMax.sag) > Math.abs(maxSag)) {
                maxSag = vMax.sag;
            }
            maxSlope = Math.max(maxSlope, Math.abs(vMax.slope));
            maxAngle = Math.max(maxAngle, Math.abs(vMax.angle));
            maxAsphericity = Math.max(maxAsphericity, Math.abs(vMax.asphericity));
            maxAberration = Math.max(maxAberration, Math.abs(vMax.aberration));

            // Calculate max asphericity gradient
            for (let i = 1; i < values.length; i++) {
                const dr = values[i].r - values[i - 1].r;
                const dAsph = Math.abs(values[i].asphericity - values[i - 1].asphericity);
                const gradient = dAsph / dr;
                if (gradient > maxAsphGradient) maxAsphGradient = gradient;
            }

            // Calculate best fit sphere
            const sagAtMax = calculateSurfaceValues(maxHeight, selectedSurface).sag;
            let bestFitSphere = 0;
            if (minHeight === 0) {
                bestFitSphere = window.SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, sagAtMax);
            } else {
                const sagAtMin = calculateSurfaceValues(minHeight, selectedSurface).sag;
                const result = window.SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, sagAtMin, sagAtMax);
                bestFitSphere = result.R4;
            }

            // Calculate F/# (paraxial and working)
            const paraxialFNum = R !== 0 ? Math.abs(R / (2 * maxHeight)) : 0;
            const workingFNum = maxSlope !== 0 ? 1 / (2 * maxSlope) : 0;

            return {
                paraxialFNum: formatValue(paraxialFNum),
                workingFNum: formatValue(workingFNum),
                maxSag: formatValue(maxSag) + ' mm',
                maxSlope: formatValue(maxSlope) + ' rad',
                maxAngle: formatValue(maxAngle) + ' °',
                maxAngleDMS: degreesToDMS(maxAngle),
                maxAsphericity: formatValue(maxAsphericity) + ' mm',
                maxAsphGradient: formatValue(maxAsphGradient) + ' /mm',
                bestFitSphere: formatValue(bestFitSphere) + ' mm'
            };
        };

        const metrics = calculateMetrics();

        return h('div', {
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
                            value: selectedSurface.name,
                            onChange: (e) => updateSurfaceName(e.target.value),
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
                        ['Radius', 'Min Height', 'Max Height', 'Step'].map(param => (
                            selectedSurface.parameters[param] !== undefined &&
                            h('div', { key: param, style: { marginBottom: '8px' } },
                                h('label', {
                                    style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                                }, param),
                                h(DebouncedInput, {
                                    value: selectedSurface.parameters[param] || '0',
                                    onChange: (value) => updateParameter(param, value),
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
                        // Filter out universal parameters
                        if (['Radius', 'Min Height', 'Max Height'].includes(param)) return false;

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
                    h(PropertyRow, { label: "Paraxial F/#", value: metrics.paraxialFNum, editable: false, c }),
                    h(PropertyRow, { label: "Working F/#", value: metrics.workingFNum, editable: false, c }),
                    h(PropertyRow, { label: "Max Sag", value: metrics.maxSag, editable: false, c }),
                    h(PropertyRow, { label: "Max Slope", value: metrics.maxSlope, editable: false, c }),
                    h(PropertyRow, { label: "Max Angle", value: metrics.maxAngle, editable: false, c }),
                    h(PropertyRow, { label: "Max Angle DMS", value: metrics.maxAngleDMS, editable: false, c }),
                    h(PropertyRow, { label: "Max Asphericity", value: metrics.maxAsphericity, editable: false, c }),
                    h(PropertyRow, { label: "Max Asph. Gradient", value: metrics.maxAsphGradient, editable: false, c }),
                    h(PropertyRow, { label: "Best Fit Sphere", value: metrics.bestFitSphere, editable: false, c })
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
                    }, 'Recalculate'),
                    h('button', {
                        style: {
                            width: '100%',
                            padding: '8px',
                            backgroundColor: c.hover,
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }
                    }, 'Export Data')
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
        // Input Dialog
        inputDialog && h('div', {
            style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001
            },
            onClick: () => inputDialog.onCancel()
        },
            h('div', {
                style: {
                    backgroundColor: c.panel,
                    border: `1px solid ${c.border}`,
                    borderRadius: '8px',
                    padding: '20px',
                    minWidth: '400px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                },
                onClick: (e) => e.stopPropagation()
            },
                h('h3', {
                    style: {
                        margin: '0 0 16px 0',
                        color: c.text,
                        fontSize: '16px',
                        fontWeight: '500'
                    }
                }, inputDialog.title),
                h('input', {
                    type: 'text',
                    defaultValue: inputDialog.defaultValue,
                    autoFocus: true,
                    onKeyDown: (e) => {
                        if (e.key === 'Enter') {
                            inputDialog.onConfirm(e.target.value);
                        } else if (e.key === 'Escape') {
                            inputDialog.onCancel();
                        }
                    },
                    style: {
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }
                }),
                h('div', {
                    style: {
                        display: 'flex',
                        gap: '8px',
                        marginTop: '16px',
                        justifyContent: 'flex-end'
                    }
                },
                    h('button', {
                        onClick: () => inputDialog.onCancel(),
                        style: {
                            padding: '8px 16px',
                            backgroundColor: c.panel,
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }
                    }, 'Cancel'),
                    h('button', {
                        onClick: (e) => {
                            const input = e.target.parentElement.parentElement.querySelector('input');
                            inputDialog.onConfirm(input.value);
                        },
                        style: {
                            padding: '8px 16px',
                            backgroundColor: c.accent,
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }
                    }, 'OK')
                )
            )
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
                        fontWeight: 'bold'
                    }
                }, 'Surfaces'),
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
                                folder.surfaces.map(surface =>
                                    h('div', {
                                        key: surface.id,
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            setSelectedSurface(surface);
                                            setSelectedFolder(folder);
                                        },
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
                                            backgroundColor: selectedSurface?.id === surface.id ? c.hover : 'transparent',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'background-color 0.2s'
                                        },
                                        onMouseEnter: (e) => {
                                            if (selectedSurface?.id !== surface.id) {
                                                e.currentTarget.style.backgroundColor = c.border;
                                            }
                                        },
                                        onMouseLeave: (e) => {
                                            if (selectedSurface?.id !== surface.id) {
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
                                    )
                                )
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
                            h(SummaryView, { selectedSurface, c }) :
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
