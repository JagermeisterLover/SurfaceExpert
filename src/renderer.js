// Import constants
import { surfaceTypes, colorscales } from './constants/surfaceTypes.js';
import { sampleSurfaces } from './constants/sampleData.js';

// Import icons
import { PlusIcon, MinusIcon } from './components/icons.js';

// Import utilities
import { formatValue, degreesToDMS } from './utils/formatters.js';
import { calculateSurfaceValues, calculateSagOnly, getBestFitSphereParams } from './utils/calculations.js';

// Import components
import SummaryView from './components/SummaryView.js';
import DataView from './components/DataView.js';
import PropertiesPanel from './components/PropertiesPanel.js';
import { PropertySection, PropertyRow } from './components/PropertySection.js';

// Import dialogs
import SettingsModal from './components/dialogs/SettingsModal.js';
import ZMXImportDialog from './components/dialogs/ZMXImportDialog.js';
import ConversionDialog from './components/dialogs/ConversionDialog.js';
import ConversionResultsDialog from './components/dialogs/ConversionResultsDialog.js';

const { useState, useEffect, useRef } = React;

// Main App Component
const OpticalSurfaceAnalyzer = () => {
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

    useEffect(() => {
        if (!selectedSurface) return;
        if (plotRef.current && activeTab !== 'summary' && activeSubTab === '3d') {
            create3DPlot();
        } else if (plotRef.current && activeTab !== 'summary' && activeSubTab === '2d') {
            create2DContour();
        } else if (plotRef.current && activeTab !== 'summary' && activeSubTab === 'cross') {
            createCrossSection();
        }
    }, [selectedSurface, activeTab, activeSubTab]);

    const generatePlotData = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const size = 60;
        const x = [], y = [], z = [];

        // Create a centered grid from -maxHeight to +maxHeight
        for (let i = 0; i < size; i++) {
            const xi = -maxHeight + (i * (2 * maxHeight)) / (size - 1);
            const row = [];
            for (let j = 0; j < size; j++) {
                const yj = -maxHeight + (j * (2 * maxHeight)) / (size - 1);
                const r = Math.sqrt(xi * xi + yj * yj);

                // Set to null if outside the annular region (r < minHeight or r > maxHeight)
                if (r < minHeight || r > maxHeight) {
                    row.push(null);
                } else {
                    // For non-rotationally symmetric surfaces (Zernike, Irregular), pass x,y coordinates; for others use r
                    const values = (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike')
                        ? calculateSurfaceValues(r, selectedSurface, xi, yj)
                        : calculateSurfaceValues(r, selectedSurface);
                    let val = 0;
                    if (activeTab === 'sag') val = values.sag;
                    else if (activeTab === 'slope') val = values.slope;
                    else if (activeTab === 'asphericity') val = values.asphericity;
                    else if (activeTab === 'aberration') val = values.aberration;
                    row.push(val);
                }
            }
            z.push(row);
        }

        return { z, size, minHeight, maxHeight };
    };

    // Listen to menu actions from main process
    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onMenuAction((action) => {
                handleMenuAction(action);
            });
        }
    }, []);

    const handleMenuAction = async (action) => {
        if (action === 'add-surface') {
            await addSurface();
        } else if (action === 'remove-surface' && selectedSurface) {
            await removeSurface();
        } else if (action === 'settings') {
            setShowSettings(true);
        } else if (action === 'recalculate') {
            // Force re-render by updating the active tab
            setActiveTab(activeTab);
        } else if (action === 'import-zmx') {
            await handleImportZMX();
        }
    };

    const handleImportZMX = async () => {
        if (window.electronAPI && window.electronAPI.importZMX) {
            const result = await window.electronAPI.importZMX();
            if (result.success) {
                setZmxSurfaces(result.surfaces);
                setShowZMXImport(true);
            } else if (result.error) {
                alert(`Error importing ZMX file: ${result.error}`);
            }
        }
    };

    const handleImportSelectedSurfaces = (selectedIndices) => {
        // Add selected surfaces to the current folder
        const newSurfaces = selectedIndices.map(index => {
            const zmxSurface = zmxSurfaces[index];
            return {
                id: Date.now() + Math.random(),
                name: zmxSurface.name || `Surface ${index + 1}`,
                type: zmxSurface.type,
                color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
                parameters: zmxSurface.parameters
            };
        });

        const updatedFolders = folders.map(folder =>
            folder.id === selectedFolder.id
                ? { ...folder, surfaces: [...folder.surfaces, ...newSurfaces] }
                : folder
        );

        setFolders(updatedFolders);
        if (newSurfaces.length > 0) {
            setSelectedSurface(newSurfaces[0]);
        }
        setShowZMXImport(false);
    };

    const create3DPlot = () => {
        const { z, size, minHeight, maxHeight } = generatePlotData();

        const data = [{
            z: z,
            type: 'surface',
            colorscale: colorscale,
            showscale: true,
            colorbar: {
                title: {
                    text: activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
                    side: 'right'
                },
                titlefont: { color: '#e0e0e0' },
                tickfont: { color: '#e0e0e0' }
            }
        }];

        const layout = {
            scene: {
                xaxis: { title: 'X (mm)', color: '#e0e0e0', gridcolor: '#454545', zerolinecolor: '#656565' },
                yaxis: { title: 'Y (mm)', color: '#e0e0e0', gridcolor: '#454545', zerolinecolor: '#656565' },
                zaxis: { title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${activeTab === 'slope' ? 'rad' : 'mm'})`, color: '#e0e0e0', gridcolor: '#454545', zerolinecolor: '#656565' },
                bgcolor: '#2b2b2b'
            },
            paper_bgcolor: '#2b2b2b',
            plot_bgcolor: '#2b2b2b',
            margin: { l: 0, r: 0, t: 0, b: 0 },
            font: { color: '#e0e0e0' }
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        };

        Plotly.newPlot(plotRef.current, data, layout, config);
    };

    const create2DContour = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const size = 100;

        // Generate grid data
        const gridData = [];
        for (let i = 0; i < size; i++) {
            const xi = -maxHeight + (i * (2 * maxHeight)) / (size - 1);
            const row = [];
            for (let j = 0; j < size; j++) {
                const yj = -maxHeight + (j * (2 * maxHeight)) / (size - 1);
                const r = Math.sqrt(xi * xi + yj * yj);

                if (r >= minHeight && r <= maxHeight) {
                    // For non-rotationally symmetric surfaces (Zernike, Irregular), pass x,y coordinates; for others use r
                    const values = (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike')
                        ? calculateSurfaceValues(r, selectedSurface, xi, yj)
                        : calculateSurfaceValues(r, selectedSurface);
                    let val = 0;
                    if (activeTab === 'sag') val = values.sag;
                    else if (activeTab === 'slope') val = values.slope;
                    else if (activeTab === 'asphericity') val = values.asphericity;
                    else if (activeTab === 'aberration') val = values.aberration;
                    row.push(val);
                } else {
                    row.push(null);
                }
            }
            gridData.push(row);
        }

        // Convert grid to scatter points with color mapping
        const x = [], y = [], color = [], hovertext = [];
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (gridData[i][j] !== null) {
                    const xi = -maxHeight + (i * (2 * maxHeight)) / (size - 1);
                    const yj = -maxHeight + (j * (2 * maxHeight)) / (size - 1);
                    x.push(xi);
                    y.push(yj);
                    color.push(gridData[i][j]);
                    hovertext.push(`X: ${xi.toFixed(2)}<br>Y: ${yj.toFixed(2)}<br>${activeTab}: ${gridData[i][j].toFixed(6)}`);
                }
            }
        }

        const zMin = Math.min(...color);
        const zMax = Math.max(...color);
        const unit = activeTab === 'slope' ? 'rad' : 'mm';

        const data = [{
            x, y,
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 6,
                color,
                colorscale: colorscale,
                showscale: true,
                cmin: zMin,
                cmax: zMax,
                colorbar: {
                    title: `${activeTab}<br>(${unit})`,
                    thickness: 15,
                    len: 0.7
                }
            },
            text: hovertext,
            hoverinfo: 'text',
            showlegend: false
        }];

        const layout = {
            title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} False Color Map`,
            xaxis: { title: 'X (mm)', scaleanchor: 'y', scaleratio: 1 },
            yaxis: { title: 'Y (mm)', scaleanchor: 'x', scaleratio: 1 },
            paper_bgcolor: c.panel,
            plot_bgcolor: c.bg,
            font: { color: c.text },
            margin: { l: 60, r: 120, t: 60, b: 60 }
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        };

        Plotly.newPlot(plotRef.current, data, layout, config);
    };

    const createCrossSection = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const step = parseFloat(selectedSurface.parameters['Step']) || 1;
        const x = [], y = [];
        const unit = activeTab === 'slope' ? 'rad' : 'mm';

        // Plot from -maxHeight to +maxHeight (diameter) using step
        // Build array of r values, ensuring we always include minHeight and maxHeight
        const rValues = [];
        for (let r = -maxHeight; r < maxHeight; r += step) {
            rValues.push(r);
        }
        // Always include maxHeight endpoint
        if (rValues[rValues.length - 1] !== maxHeight) {
            rValues.push(maxHeight);
        }

        for (const r of rValues) {
            x.push(r);

            const absR = Math.abs(r);
            if (absR >= minHeight && absR <= maxHeight) {
                // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
                let values;
                if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                    const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
                    const scanAngleRad = scanAngle * Math.PI / 180;
                    const xCoord = r * Math.cos(scanAngleRad);
                    const yCoord = r * Math.sin(scanAngleRad);
                    values = calculateSurfaceValues(absR, selectedSurface, xCoord, yCoord);
                } else {
                    values = calculateSurfaceValues(absR, selectedSurface);
                }
                let val = 0;
                if (activeTab === 'sag') val = values.sag;
                else if (activeTab === 'slope') val = values.slope;
                else if (activeTab === 'asphericity') val = values.asphericity;
                else if (activeTab === 'aberration') val = values.aberration;
                y.push(val);
            } else {
                y.push(null);
            }
        }

        const data = [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#4a90e2', width: 2 }
        }];

        const layout = {
            xaxis: { title: 'Radial Distance (mm)', zeroline: true },
            yaxis: {
                title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})`,
                // For sag tab, maintain 1:1 aspect ratio with radial distance
                scaleanchor: activeTab === 'sag' ? 'x' : undefined,
                scaleratio: activeTab === 'sag' ? 1 : undefined
            },
            paper_bgcolor: '#353535',
            plot_bgcolor: '#2b2b2b',
            font: { color: '#e0e0e0' },
            margin: { l: 60, r: 20, t: 20, b: 60 }
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false
        };

        Plotly.newPlot(plotRef.current, data, layout, config);
    };

    const updateSurfaceName = async (newName) => {
        if (!selectedSurface || !selectedFolder) return;

        const oldName = selectedSurface.name;
        const updatedSurface = { ...selectedSurface, name: newName };

        // Delete old file if name changed
        if (oldName !== newName && window.electronAPI && window.electronAPI.deleteSurface) {
            await window.electronAPI.deleteSurface(selectedFolder.name, oldName);
        }

        // Save with new name
        if (window.electronAPI && window.electronAPI.saveSurface) {
            await window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }

        const updatedFolders = folders.map(f => ({
            ...f,
            surfaces: f.surfaces.map(s =>
                s.id === selectedSurface.id ? updatedSurface : s
            )
        }));
        setFolders(updatedFolders);
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
        if (window.electronAPI && window.electronAPI.saveSurface) {
            await window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }

        const updatedFolders = folders.map(f => ({
            ...f,
            surfaces: f.surfaces.map(s =>
                s.id === selectedSurface.id ? updatedSurface : s
            )
        }));
        setFolders(updatedFolders);
    };

    const updateParameter = async (param, value) => {
        if (!selectedSurface || !selectedFolder) return;

        const updatedSurface = {
            ...selectedSurface,
            parameters: { ...selectedSurface.parameters, [param]: value }
        };

        // Save to disk
        if (window.electronAPI && window.electronAPI.saveSurface) {
            await window.electronAPI.saveSurface(selectedFolder.name, updatedSurface);
        }

        const updatedFolders = folders.map(f => ({
            ...f,
            surfaces: f.surfaces.map(s =>
                s.id === selectedSurface.id ? updatedSurface : s
            )
        }));
        setFolders(updatedFolders);
        setSelectedSurface(updatedSurface);
    };

    const addSurface = async () => {
        if (!selectedFolder) return;

        const newId = Date.now();
        const colors = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6'];
        const newSurface = {
            id: newId,
            name: `Surface ${newId}`,
            type: 'Sphere',
            color: colors[newId % colors.length],
            parameters: {
                'Radius': '100.0',
                'Min Height': '0',
                'Max Height': '20.0',
                'Step': '1'
            }
        };

        // Save to disk
        if (window.electronAPI && window.electronAPI.saveSurface) {
            await window.electronAPI.saveSurface(selectedFolder.name, newSurface);
        }

        const updatedFolders = folders.map(f =>
            f.id === selectedFolder.id
                ? { ...f, surfaces: [...f.surfaces, newSurface] }
                : f
        );
        setFolders(updatedFolders);
        setSelectedSurface(newSurface);
    };

    const removeSurface = async () => {
        if (!selectedSurface || !selectedFolder) return;

        const folder = folders.find(f => f.id === selectedFolder.id);
        if (!folder || folder.surfaces.length === 0) return;

        // Delete from disk
        if (window.electronAPI && window.electronAPI.deleteSurface) {
            await window.electronAPI.deleteSurface(selectedFolder.name, selectedSurface.name);
        }

        const updatedFolders = folders.map(f => {
            if (f.id === selectedFolder.id) {
                const filtered = f.surfaces.filter(s => s.id !== selectedSurface.id);
                return { ...f, surfaces: filtered };
            }
            return f;
        });

        setFolders(updatedFolders);

        // Select another surface
        const updatedFolder = updatedFolders.find(f => f.id === selectedFolder.id);
        if (updatedFolder && updatedFolder.surfaces.length > 0) {
            setSelectedSurface(updatedFolder.surfaces[0]);
        } else {
            setSelectedSurface(null);
        }
    };

    const addFolder = async (name) => {
        if (!name || !name.trim()) return;

        // Create folder on disk
        if (window.electronAPI && window.electronAPI.createFolder) {
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
        if (window.electronAPI && window.electronAPI.deleteFolder) {
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
        if (window.electronAPI && window.electronAPI.renameFolder) {
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
        setFolders(folders.map(f =>
            f.id === folderId ? { ...f, expanded: !f.expanded } : f
        ));
    };

    const colors = {
        bg: '#2b2b2b',
        panel: '#353535',
        border: '#454545',
        text: '#e0e0e0',
        textDim: '#a0a0a0',
        accent: '#4a90e2',
        hover: '#454545'
    };
    const c = colors;

    return React.createElement('div', {
        style: {
            width: '100vw',
            height: '100vh',
            backgroundColor: c.bg,
            color: c.text,
            display: 'flex',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            overflow: 'hidden'
        },
        onClick: () => setContextMenu(null)
    },
        // Dialogs
        showSettings && React.createElement(SettingsModal, {
            colorscale,
            setColorscale,
            onClose: () => setShowSettings(false),
            c
        }),

        showZMXImport && React.createElement(ZMXImportDialog, {
            zmxSurfaces,
            onImport: handleImportSelectedSurfaces,
            onClose: () => setShowZMXImport(false),
            c
        }),

        showConvert && React.createElement(ConversionDialog, {
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

        showConvertResults && React.createElement(ConversionResultsDialog, {
            convertResults,
            folders,
            selectedFolder,
            setFolders,
            setSelectedSurface,
            onClose: () => setShowConvertResults(false),
            c
        }),

        // Input dialog
        inputDialog && React.createElement('div', {
            style: {
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            },
            onClick: () => setInputDialog(null)
        },
            React.createElement('div', {
                style: {
                    backgroundColor: c.panel,
                    border: `1px solid ${c.border}`,
                    borderRadius: '8px',
                    padding: '24px',
                    minWidth: '400px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
                },
                onClick: (e) => e.stopPropagation()
            },
                React.createElement('h3', { style: { marginBottom: '16px', fontSize: '16px' } }, inputDialog.title),
                React.createElement('input', {
                    type: 'text',
                    value: inputDialog.value,
                    onChange: (e) => setInputDialog({ ...inputDialog, value: e.target.value }),
                    onKeyDown: (e) => {
                        if (e.key === 'Enter') {
                            inputDialog.onConfirm(inputDialog.value);
                            setInputDialog(null);
                        } else if (e.key === 'Escape') {
                            setInputDialog(null);
                        }
                    },
                    autoFocus: true,
                    style: {
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: c.bg,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        color: c.text,
                        fontSize: '14px',
                        marginBottom: '16px'
                    }
                }),
                React.createElement('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' } },
                    React.createElement('button', {
                        onClick: () => setInputDialog(null),
                        style: {
                            padding: '8px 16px',
                            backgroundColor: c.panel,
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            color: c.text,
                            cursor: 'pointer',
                            fontSize: '14px'
                        }
                    }, 'Cancel'),
                    React.createElement('button', {
                        onClick: () => {
                            inputDialog.onConfirm(inputDialog.value);
                            setInputDialog(null);
                        },
                        style: {
                            padding: '8px 16px',
                            backgroundColor: c.accent,
                            border: 'none',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }
                    }, 'OK')
                )
            )
        ),

        // Context menu
        contextMenu && React.createElement('div', {
            style: {
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                backgroundColor: c.panel,
                border: `1px solid ${c.border}`,
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                zIndex: 1000,
                minWidth: '150px'
            },
            onClick: (e) => e.stopPropagation()
        },
            contextMenu.items.map((item, idx) =>
                item.type === 'separator' ?
                    React.createElement('div', {
                        key: idx,
                        style: {
                            height: '1px',
                            backgroundColor: c.border,
                            margin: '4px 0'
                        }
                    }) :
                    React.createElement('div', {
                        key: idx,
                        onClick: () => {
                            item.onClick();
                            setContextMenu(null);
                        },
                        style: {
                            padding: '8px 12px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            backgroundColor: c.panel
                        },
                        onMouseEnter: (e) => e.target.style.backgroundColor = c.hover,
                        onMouseLeave: (e) => e.target.style.backgroundColor = c.panel
                    }, item.label)
            )
        ),

        // Left Panel - Surface List
        React.createElement('div', {
            style: {
                width: '260px',
                backgroundColor: c.panel,
                borderRight: `1px solid ${c.border}`,
                display: 'flex',
                flexDirection: 'column'
            }
        },
            // Header
            React.createElement('div', {
                style: {
                    padding: '12px',
                    borderBottom: `1px solid ${c.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }
            },
                React.createElement('div', { style: { fontSize: '13px', fontWeight: 'bold' } }, 'Surfaces'),
                React.createElement('div', { style: { display: 'flex', gap: '4px' } },
                    React.createElement('button', {
                        onClick: () => {
                            setInputDialog({
                                title: 'New Folder',
                                value: 'New Folder',
                                onConfirm: (name) => addFolder(name)
                            });
                        },
                        style: {
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            color: c.text,
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        },
                        title: 'New Folder'
                    },
                        React.createElement('svg', {
                            width: "12",
                            height: "12",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2"
                        },
                            React.createElement('path', { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" })
                        )
                    ),
                    React.createElement('button', {
                        onClick: addSurface,
                        style: {
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            color: c.text,
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        },
                        title: 'Add Surface'
                    },
                        React.createElement(PlusIcon)
                    )
                )
            ),

            // Folder list
            React.createElement('div', {
                style: {
                    flex: 1,
                    overflow: 'auto'
                }
            },
                folders.map(folder =>
                    React.createElement('div', { key: folder.id },
                        // Folder header
                        React.createElement('div', {
                            style: {
                                padding: '8px 12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                backgroundColor: selectedFolder?.id === folder.id ? c.hover : 'transparent'
                            },
                            onClick: () => {
                                toggleFolderExpanded(folder.id);
                                setSelectedFolder(folder);
                            },
                            onContextMenu: (e) => {
                                e.preventDefault();
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    items: [
                                        {
                                            label: 'Rename',
                                            onClick: () => {
                                                setInputDialog({
                                                    title: 'Rename Folder',
                                                    value: folder.name,
                                                    onConfirm: (name) => renameFolder(folder.id, name)
                                                });
                                            }
                                        },
                                        { type: 'separator' },
                                        {
                                            label: 'Delete',
                                            onClick: () => {
                                                if (confirm(`Delete folder "${folder.name}"?`)) {
                                                    removeFolder(folder.id);
                                                }
                                            }
                                        }
                                    ]
                                });
                            }
                        },
                            React.createElement('span', {
                                style: {
                                    fontSize: '12px',
                                    transform: folder.expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s'
                                }
                            }, '▶'),
                            React.createElement('svg', {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "2"
                            },
                                React.createElement('path', { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" })
                            ),
                            React.createElement('span', { style: { fontSize: '13px', flex: 1 } }, folder.name)
                        ),

                        // Folder surfaces
                        folder.expanded && folder.surfaces.map(surface =>
                            React.createElement('div', {
                                key: surface.id,
                                onClick: () => {
                                    setSelectedSurface(surface);
                                    setSelectedFolder(folder);
                                },
                                style: {
                                    padding: '8px 12px 8px 36px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedSurface?.id === surface.id ? c.accent : 'transparent',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                },
                                onMouseEnter: (e) => {
                                    if (selectedSurface?.id !== surface.id) {
                                        e.currentTarget.style.backgroundColor = c.hover;
                                    }
                                },
                                onMouseLeave: (e) => {
                                    if (selectedSurface?.id !== surface.id) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }
                            },
                                React.createElement('div', {
                                    style: {
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '2px',
                                        backgroundColor: surface.color,
                                        flexShrink: 0
                                    }
                                }),
                                React.createElement('div', {
                                    style: {
                                        flex: 1,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }
                                }, surface.name),
                                React.createElement('div', {
                                    style: {
                                        fontSize: '11px',
                                        color: c.textDim,
                                        flexShrink: 0
                                    }
                                }, surface.type)
                            )
                        )
                    )
                )
            )
        ),

        // Center Panel - Visualization
        React.createElement('div', {
            style: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }
        },
            // Main Tabs
            React.createElement('div', {
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
                    React.createElement('div', {
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
            activeTab !== 'summary' && React.createElement('div', {
                style: {
                    display: 'flex',
                    backgroundColor: c.bg,
                    borderBottom: `1px solid ${c.border}`,
                    gap: '2px',
                    padding: '4px 8px'
                }
            },
                ['3d', '2d', 'cross', 'data'].map(subTab =>
                    React.createElement('div', {
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
            React.createElement('div', { style: { flex: 1, overflow: 'auto', backgroundColor: c.bg } },
                !selectedSurface ?
                    React.createElement('div', {
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
                        React.createElement('div', { style: { fontSize: '48px' } }, '📊'),
                        React.createElement('div', null, 'Select a surface or create a new one')
                    ) :
                activeTab === 'summary' ?
                    React.createElement(SummaryView, { selectedSurface, c }) :
                activeSubTab === 'data' ?
                    React.createElement(DataView, { activeTab, selectedSurface, c }) :
                    React.createElement('div', { ref: plotRef, style: { width: '100%', height: '100%' } })
            )
        ),

        // Right Panel - Properties
        React.createElement(PropertiesPanel, {
            selectedSurface,
            updateSurfaceName,
            updateSurfaceType,
            updateParameter,
            onConvert: () => setShowConvert(true),
            c
        })
    );
};

ReactDOM.render(React.createElement(OpticalSurfaceAnalyzer), document.getElementById('root'));
