const { useState, useEffect, useRef } = React;

// Surface type definitions with their parameters
const surfaceTypes = {
    'Sphere': ['Radius', 'Min Height', 'Max Height'],
    'Even Asphere': ['Radius', 'Conic Constant', 'A4', 'A6', 'A8', 'A10', 'A12', 'A14', 'A16', 'A18', 'A20', 'Min Height', 'Max Height'],
    'Odd Asphere': ['Radius', 'Conic Constant', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20', 'Min Height', 'Max Height'],
    'Zernike': ['Radius', 'Conic Constant', 'Extrapolate', 'Norm Radius', 'Number of Terms', 'A2', 'A4', 'A6', 'A8', 'A10', 'A12', 'A14', 'A16', 'Decenter X', 'Decenter Y', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9', 'Z10', 'Z11', 'Z12', 'Z13', 'Z14', 'Z15', 'Z16', 'Z17', 'Z18', 'Z19', 'Z20', 'Z21', 'Z22', 'Z23', 'Z24', 'Z25', 'Z26', 'Z27', 'Z28', 'Z29', 'Z30', 'Z31', 'Z32', 'Z33', 'Z34', 'Z35', 'Z36', 'Z37', 'Scan Angle', 'X Coordinate', 'Y Coordinate', 'Min Height', 'Max Height'],
    'Irregular': ['Radius', 'Conic Constant', 'Decenter X', 'Decenter Y', 'Tilt X', 'Tilt Y', 'Spherical', 'Astigmatism', 'Coma', 'Angle', 'Scan Angle', 'X Coordinate', 'Y Coordinate', 'Min Height', 'Max Height'],
    'Opal Un U': ['Radius', 'e2', 'H', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'Min Height', 'Max Height'],
    'Opal Un Z': ['Radius', 'e2', 'H', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'Min Height', 'Max Height'],
    'Poly': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'Min Height', 'Max Height']
};

// Sample surface data
const sampleSurfaces = [
    {
        id: 1,
        name: 'Spherical Surface',
        type: 'Sphere',
        color: '#4a90e2',
        parameters: {
            'Radius': '100.0',
            'Min Height': '0',
            'Max Height': '25.0'
        }
    }
];

// Icon components
const PlusIcon = () => (
    React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
        React.createElement('line', { x1: "12", y1: "5", x2: "12", y2: "19" }),
        React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12" })
    )
);

const MinusIcon = () => (
    React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
        React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12" })
    )
);

// Available colorscales for plots
const colorscales = [
    'Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis',
    'Blues', 'Greens', 'Greys', 'Oranges', 'Reds',
    'Rainbow', 'Jet', 'Hot', 'Cool', 'Spring',
    'Summer', 'Autumn', 'Winter', 'RdBu', 'RdYlBu'
];

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
            const parsedSurfaces = ZMXParser.parse(result.content);
            setZmxSurfaces(parsedSurfaces);
            setShowZMXImport(true);
        } catch (error) {
            alert('Error parsing ZMX file: ' + error.message);
        }
    };

    const handleImportSelectedSurfaces = (selectedIndices) => {
        if (!selectedFolder) return;

        const colors = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
        const allSurfaces = folders.flatMap(f => f.surfaces);
        let nextId = allSurfaces.length > 0 ? Math.max(...allSurfaces.map(s => s.id)) + 1 : 1;

        const newSurfaces = selectedIndices.map((index, i) => {
            const zmxSurface = zmxSurfaces[index];
            const color = colors[(nextId + i) % colors.length];
            return ZMXParser.convertToAppSurface(zmxSurface, nextId + i, color);
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

    const create3DPlot = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const size = 60;
        const unit = activeTab === 'slope' ? 'rad' : 'mm';

        // Create coordinate arrays
        const x = [], y = [];
        for (let i = 0; i < size; i++) {
            x.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
            y.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
        }

        // Generate full grid data for 3D plot
        const z = [];
        const validValues = [];

        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                const xi = x[i];
                const yj = y[j];
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
                    validValues.push(val);
                } else {
                    row.push(null);
                }
            }
            z.push(row);
        }

        const zMin = Math.min(...validValues);
        const zMax = Math.max(...validValues);

        const data = [{
            x: x,
            y: y,
            z: z,
            type: 'surface',
            colorscale: colorscale,
            showscale: true,
            contours: {
                z: {
                    show: true,
                    usecolormap: true,
                    highlightcolor: "#42f462",
                    project: { z: true }
                }
            }
        }];

        const layout = {
            scene: {
                camera: {
                    eye: { x: 1.5, y: 1.5, z: 1.5 }
                },
                xaxis: { title: 'X (mm)', range: [-maxHeight, maxHeight] },
                yaxis: { title: 'Y (mm)', range: [-maxHeight, maxHeight] },
                zaxis: { title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})`, range: [zMin, zMax] },
                bgcolor: '#2b2b2b',
                // For sag tab, use manual aspect ratio to maintain 1:1 scale for X:Y
                // For other tabs, use cube mode for uniform scaling
                aspectmode: activeTab === 'sag' ? 'manual' : 'cube',
                aspectratio: activeTab === 'sag' ? { x: 1, y: 1, z: (zMax - zMin) / (2 * maxHeight) } : undefined
            },
            paper_bgcolor: '#353535',
            plot_bgcolor: '#353535',
            font: { color: '#e0e0e0' },
            margin: { l: 0, r: 0, t: 0, b: 0 }
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
                    const x = r * Math.cos(scanAngleRad);
                    const y = r * Math.sin(scanAngleRad);
                    values = calculateSurfaceValues(absR, selectedSurface, x, y);
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
            fontFamily: 'Segoe UI, Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        onClick: () => setContextMenu(null)
    },
        // Settings Modal
        showSettings && React.createElement(SettingsModal, {
            colorscale,
            setColorscale,
            onClose: () => setShowSettings(false),
            c
        }),
        // ZMX Import Dialog
        showZMXImport && React.createElement(ZMXImportDialog, {
            zmxSurfaces,
            onImport: handleImportSelectedSurfaces,
            onClose: () => setShowZMXImport(false),
            c
        }),
        // Conversion Dialog
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
        // Conversion Results Dialog
        showConvertResults && React.createElement(ConversionResultsDialog, {
            convertResults,
            folders,
            selectedFolder,
            setFolders,
            setSelectedSurface,
            onClose: () => setShowConvertResults(false),
            c
        }),
        // Context Menu
        contextMenu && React.createElement('div', {
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
                React.createElement('div', {
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
                React.createElement('div', {
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
                React.createElement('div', {
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
        inputDialog && React.createElement('div', {
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
            React.createElement('div', {
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
                React.createElement('h3', {
                    style: {
                        margin: '0 0 16px 0',
                        color: c.text,
                        fontSize: '16px',
                        fontWeight: '500'
                    }
                }, inputDialog.title),
                React.createElement('input', {
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
                React.createElement('div', {
                    style: {
                        display: 'flex',
                        gap: '8px',
                        marginTop: '16px',
                        justifyContent: 'flex-end'
                    }
                },
                    React.createElement('button', {
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
                    React.createElement('button', {
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
        React.createElement('div', { style: { display: 'flex', flex: 1, overflow: 'hidden' } },
            // Left Panel - Surfaces
            React.createElement('div', {
                style: {
                    width: '220px',
                    backgroundColor: c.panel,
                    borderRight: `1px solid ${c.border}`,
                    display: 'flex',
                    flexDirection: 'column'
                }
            },
                React.createElement('div', {
                    style: {
                        padding: '12px',
                        borderBottom: `1px solid ${c.border}`,
                        fontSize: '13px',
                        fontWeight: 'bold'
                    }
                }, 'Surfaces'),
                React.createElement('div', { style: { flex: 1, overflow: 'auto', padding: '4px' } },
                    folders.map(folder =>
                        React.createElement('div', { key: folder.id, style: { marginBottom: '4px' } },
                            // Folder header
                            React.createElement('div', {
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
                                React.createElement('span', { style: { fontSize: '10px', userSelect: 'none' } },
                                    folder.expanded ? '▼' : '▶'
                                ),
                                React.createElement('span', { style: { flex: 1 } }, folder.name),
                                React.createElement('span', {
                                    style: { fontSize: '10px', color: c.textDim }
                                }, `(${folder.surfaces.length})`)
                            ),
                            // Folder surfaces
                            folder.expanded && React.createElement('div', { style: { paddingLeft: '16px' } },
                                folder.surfaces.map(surface =>
                                    React.createElement('div', {
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
                                        React.createElement('div', {
                                            style: {
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '2px',
                                                backgroundColor: surface.color,
                                                flexShrink: 0
                                            }
                                        }),
                                        React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                                            React.createElement('div', {
                                                style: { fontSize: '12px', fontWeight: '500', marginBottom: '1px' }
                                            }, surface.name),
                                            React.createElement('div', {
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
                React.createElement('div', {
                    style: {
                        padding: '8px',
                        borderTop: `1px solid ${c.border}`,
                        display: 'flex',
                        gap: '6px',
                        fontSize: '12px'
                    }
                },
                    React.createElement('button', {
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
                    React.createElement('button', {
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
            React.createElement('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
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
        )
    );
};

// Helper function to format values
const formatValue = (value) => {
    if (!isFinite(value) || isNaN(value)) return '0';
    const absValue = Math.abs(value);
    // Treat very small values as zero (floating-point precision threshold)
    if (absValue < 1e-10) return '0';
    if (absValue >= 0.0000001) {
        return value.toFixed(7);
    } else {
        return value.toExponential(5);
    }
};

// Helper function to convert degrees to DMS format
const degreesToDMS = (angle) => {
    const sign = angle < 0 ? -1 : 1;
    angle = Math.abs(angle);

    const degrees = Math.floor(angle);
    const fraction = angle - degrees;
    const minutes = Math.floor(fraction * 60);
    const seconds = (fraction * 60 - minutes) * 60;

    const signStr = sign < 0 ? "-" : "";
    return `${signStr}${degrees}° ${minutes}' ${seconds.toFixed(3)}"`;
};

// Cache for best fit sphere parameters to avoid recalculation
const bfsCache = new Map();

// Helper function to get or calculate best fit sphere parameters
const getBestFitSphereParams = (surface) => {
    const cacheKey = JSON.stringify(surface.parameters);

    if (bfsCache.has(cacheKey)) {
        return bfsCache.get(cacheKey);
    }

    const parseParam = (name) => parseFloat(surface.parameters[name]) || 0;
    const minHeight = parseParam('Min Height');
    const maxHeight = parseParam('Max Height');

    // Calculate sag at min and max heights
    const zmin = calculateSagOnly(minHeight, surface);
    const zmax = calculateSagOnly(maxHeight, surface);

    let params;
    if (minHeight === 0) {
        const R3 = SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, zmax);
        const R = surface.type !== 'Poly' ? parseParam('Radius') : 0;
        params = { method: 'R3', R3, R };
    } else {
        const result = SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, zmin, zmax);
        params = { method: 'R4', ...result };
    }

    bfsCache.set(cacheKey, params);
    return params;
};

// Helper function to calculate only sag (no asphericity or aberration to avoid recursion)
const calculateSagOnly = (r, surface) => {
    const params = surface.parameters;
    const parseParam = (name) => parseFloat(params[name]) || 0;
    let sag = 0;

    try {
        if (surface.type === 'Sphere') {
            const R = parseParam('Radius');
            sag = SurfaceCalculations.calculateSphereSag(r, R);
        } else if (surface.type === 'Even Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8'), A10 = parseParam('A10');
            const A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16'), A18 = parseParam('A18'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
        } else if (surface.type === 'Odd Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            const A13 = parseParam('A13'), A14 = parseParam('A14'), A15 = parseParam('A15'), A16 = parseParam('A16'), A17 = parseParam('A17');
            const A18 = parseParam('A18'), A19 = parseParam('A19'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
        } else if (surface.type === 'Opal Un U') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6');
            const A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            sag = SurfaceCalculations.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        } else if (surface.type === 'Opal Un Z') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        } else if (surface.type === 'Poly') {
            const A1 = parseParam('A1'), A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5');
            const A6 = parseParam('A6'), A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10');
            const A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculatePolySag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        }
    } catch (e) {
        // Silent fail
    }

    return sag;
};

// Helper function to calculate all values for a given r
const calculateSurfaceValues = (r, surface, x = null, y = null) => {
    const params = surface.parameters;
    const parseParam = (name) => parseFloat(params[name]) || 0;

    let sag = 0, slope = 0, asphericity = 0, aberration = 0;

    try {
        if (surface.type === 'Sphere') {
            const R = parseParam('Radius');
            sag = SurfaceCalculations.calculateSphereSag(r, R);
            slope = SurfaceCalculations.calculateSphereSlope(r, R);
        } else if (surface.type === 'Even Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8'), A10 = parseParam('A10');
            const A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16'), A18 = parseParam('A18'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
            slope = SurfaceCalculations.calculateEvenAsphereSlope(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
        } else if (surface.type === 'Odd Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            const A13 = parseParam('A13'), A14 = parseParam('A14'), A15 = parseParam('A15'), A16 = parseParam('A16'), A17 = parseParam('A17');
            const A18 = parseParam('A18'), A19 = parseParam('A19'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
            slope = SurfaceCalculations.calculateOddAsphereSlope(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
        } else if (surface.type === 'Zernike') {
            // Zernike surface requires x,y coordinates (non-rotationally symmetric)
            // Only sag is calculated for Zernike surfaces
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const normRadius = parseParam('Norm Radius');
            const dx = parseParam('Decenter X'), dy = parseParam('Decenter Y');

            // Collect aspheric coefficients
            const A2 = parseParam('A2'), A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8');
            const A10 = parseParam('A10'), A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16');

            // Collect all Zernike coefficients (Z1-Z37)
            const coeffs = {};
            for (let i = 1; i <= 37; i++) {
                coeffs[`Z${i}`] = parseParam(`Z${i}`);
            }

            // Use provided x,y or default to (r, 0) for radial calculations
            const xCoord = x !== null ? x : r;
            const yCoord = y !== null ? y : 0;

            sag = SurfaceCalculations.calculateZernikeSag(xCoord, yCoord, R, k, normRadius, dx, dy, A2, A4, A6, A8, A10, A12, A14, A16, coeffs);
            // No slope, asphericity, aberration for Zernike surfaces
            return { sag, slope: 0, asphericity: 0, aberration: 0, angle: 0 };
        } else if (surface.type === 'Irregular') {
            // Irregular surface requires x,y coordinates (non-rotationally symmetric)
            // Only sag is calculated for Irregular surfaces
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const dx = parseParam('Decenter X'), dy = parseParam('Decenter Y');
            const tiltX = parseParam('Tilt X'), tiltY = parseParam('Tilt Y');
            const Zs = parseParam('Spherical'), Za = parseParam('Astigmatism'), Zc = parseParam('Coma');
            const angle = parseParam('Angle');
            const maxHeight = parseParam('Max Height');

            // Use provided x,y or default to (r, 0) for radial calculations
            const xCoord = x !== null ? x : r;
            const yCoord = y !== null ? y : 0;

            sag = SurfaceCalculations.calculateIrregularSag(xCoord, yCoord, R, k, dx, dy, tiltX, tiltY, Zs, Za, Zc, angle, maxHeight);
            // No slope, asphericity, aberration for Irregular surfaces
            return { sag, slope: 0, asphericity: 0, aberration: 0, angle: 0 };
        } else if (surface.type === 'Opal Un U') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6');
            const A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            sag = SurfaceCalculations.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
            slope = SurfaceCalculations.calculateOpalUnUSlope(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        } else if (surface.type === 'Opal Un Z') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
            slope = SurfaceCalculations.calculateOpalUnZSlope(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        } else if (surface.type === 'Poly') {
            const A1 = parseParam('A1'), A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5');
            const A6 = parseParam('A6'), A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10');
            const A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculatePolySag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
            slope = SurfaceCalculations.calculatePolySlope(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        }

        // Calculate asphericity using cached BFS parameters
        const bfsParams = getBestFitSphereParams(surface);

        if (bfsParams.method === 'R3') {
            asphericity = SurfaceCalculations.calculateAsphericityForR3(r, sag, bfsParams.R3, bfsParams.R);
        } else {
            asphericity = SurfaceCalculations.calculateAsphericityForR4(r, sag, bfsParams.R4, bfsParams.zm, bfsParams.rm, bfsParams.g, bfsParams.Lz);
        }

        // Calculate aberration
        const R = surface.type !== 'Poly' ? parseParam('Radius') : 0;
        aberration = SurfaceCalculations.calculateAberrationOfNormals(sag, r, slope, R);

    } catch (e) {
        // Silent fail for calculation errors
    }

    // Calculate angle from slope
    const angle = Math.atan(slope) * (180 / Math.PI); // Convert to degrees

    return { sag, slope, asphericity, aberration, angle };
};

// Helper Components
const SummaryView = ({ selectedSurface, c }) => {
    if (!selectedSurface) return null;

    // Generate data table for summary
    const generateDataTable = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const step = parseFloat(selectedSurface.parameters['Step']) || 1;
        const data = [];

        for (let r = minHeight; r < maxHeight; r += step) {
            // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
            let values;
            if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
                const scanAngleRad = scanAngle * Math.PI / 180;
                const x = r * Math.cos(scanAngleRad);
                const y = r * Math.sin(scanAngleRad);
                values = calculateSurfaceValues(r, selectedSurface, x, y);
            } else {
                values = calculateSurfaceValues(r, selectedSurface);
            }
            data.push({
                r: r.toFixed(7),
                sag: formatValue(values.sag),
                slope: formatValue(values.slope),
                angle: formatValue(values.angle),
                angleDMS: degreesToDMS(values.angle),
                asphericity: formatValue(values.asphericity),
                aberration: formatValue(values.aberration)
            });
        }

        // Always include maxHeight
        let values;
        if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
            const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
            const scanAngleRad = scanAngle * Math.PI / 180;
            const x = maxHeight * Math.cos(scanAngleRad);
            const y = maxHeight * Math.sin(scanAngleRad);
            values = calculateSurfaceValues(maxHeight, selectedSurface, x, y);
        } else {
            values = calculateSurfaceValues(maxHeight, selectedSurface);
        }
        data.push({
            r: maxHeight.toFixed(7),
            sag: formatValue(values.sag),
            slope: formatValue(values.slope),
            angle: formatValue(values.angle),
            angleDMS: degreesToDMS(values.angle),
            asphericity: formatValue(values.asphericity),
            aberration: formatValue(values.aberration)
        });

        return data;
    };

    const dataTable = generateDataTable();

    // Calculate max values
    const maxSag = Math.max(...dataTable.map(row => parseFloat(row.sag)));
    const maxSlope = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.slope))));
    const maxAngle = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.angle))));
    const maxAsphericity = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.asphericity))));
    const maxAberration = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.aberration))));

    // Calculate best fit sphere
    const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
    const sagAtMax = calculateSurfaceValues(maxHeight, selectedSurface).sag;
    let bestFitSphere = 0;

    if (minHeight === 0) {
        bestFitSphere = SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, sagAtMax);
    } else {
        const sagAtMin = calculateSurfaceValues(minHeight, selectedSurface).sag;
        const result = SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, sagAtMin, sagAtMax);
        bestFitSphere = result.R4;
    }

    // Calculate max asphericity gradient
    let maxAsphGradient = 0;
    if (dataTable.length > 1) {
        for (let i = 1; i < dataTable.length; i++) {
            const dr = parseFloat(dataTable[i].r) - parseFloat(dataTable[i-1].r);
            const dAsph = Math.abs(parseFloat(dataTable[i].asphericity) - parseFloat(dataTable[i-1].asphericity));
            const gradient = dAsph / dr;
            if (gradient > maxAsphGradient) maxAsphGradient = gradient;
        }
    }

    // Calculate F/# (paraxial and working)
    const R = parseFloat(selectedSurface.parameters['Radius']) || 0;
    const paraxialFNum = R !== 0 ? Math.abs(R / (2 * maxHeight)) : 0;
    const workingFNum = maxSlope !== 0 ? 1 / (2 * maxSlope) : 0;

    // Calculate single-point sag for non-rotationally symmetric surfaces
    const isNonRotSymmetric = selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular';
    let singlePointSag = null;
    let xCoord = 0, yCoord = 0;
    if (isNonRotSymmetric) {
        xCoord = parseFloat(selectedSurface.parameters['X Coordinate']) || 0;
        yCoord = parseFloat(selectedSurface.parameters['Y Coordinate']) || 0;
        const r = Math.sqrt(xCoord * xCoord + yCoord * yCoord);
        const values = calculateSurfaceValues(r, selectedSurface, xCoord, yCoord);
        singlePointSag = values.sag;
    }

    return React.createElement('div', { style: { padding: '20px' } },
        // Single-point sag section for non-rotationally symmetric surfaces
        isNonRotSymmetric && React.createElement('div', { style: { marginBottom: '30px' } },
            React.createElement('h3', { style: { marginBottom: '15px', fontSize: '16px' } }, 'Single Point Calculation'),
            React.createElement('table', {
                style: {
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    marginBottom: '10px',
                    backgroundColor: c.panel,
                    border: `2px solid ${c.accent}`
                }
            },
                React.createElement('thead', null,
                    React.createElement('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                        React.createElement('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, 'Coordinate'),
                        React.createElement('th', { style: { padding: '10px', textAlign: 'right' } }, 'Value'),
                        React.createElement('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, 'Unit')
                    )
                ),
                React.createElement('tbody', null,
                    React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '10px' } }, 'X Coordinate'),
                        React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(xCoord)),
                        React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    ),
                    React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '10px' } }, 'Y Coordinate'),
                        React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(yCoord)),
                        React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    ),
                    React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}`, backgroundColor: c.hover } },
                        React.createElement('td', { style: { padding: '10px', fontWeight: 'bold' } }, 'Sag at (X, Y)'),
                        React.createElement('td', { style: { padding: '10px', textAlign: 'right', fontWeight: 'bold' } }, formatValue(singlePointSag)),
                        React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    )
                )
            )
        ),
        React.createElement('h3', { style: { marginBottom: '20px', fontSize: '16px' } }, 'Surface Summary'),
        React.createElement('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                marginBottom: '30px'
            }
        },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, 'Property'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'right' } }, 'Value'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, 'Unit')
                )
            ),
            React.createElement('tbody', null,
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Height Range'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } },
                        `${selectedSurface.parameters['Min Height']} - ${selectedSurface.parameters['Max Height']}`
                    ),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Paraxial F/#'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(paraxialFNum)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Working F/#'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(workingFNum)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Sag'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSag)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Slope'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSlope)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'rad')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Angle'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAngle)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '°')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Angle DMS'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, degreesToDMS(maxAngle)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Asphericity'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphericity)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Asph. Gradient'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphGradient)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '/mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Best Fit Sphere'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(bestFitSphere)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Aberration'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAberration)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                )
            )
        ),

        // Detailed data table
        React.createElement('h3', { style: { marginBottom: '15px', marginTop: '20px', fontSize: '16px' } }, 'Detailed Analysis'),
        React.createElement('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
            }
        },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Height (mm)'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Sag (mm)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Slope (rad)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle (°)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle DMS'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Asphericity (mm)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Aberration (mm)')
                )
            ),
            React.createElement('tbody', null,
                dataTable.map((row, idx) =>
                    React.createElement('tr', { key: idx, style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.r),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.sag),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.slope),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.angle),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.angleDMS),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.asphericity),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.aberration)
                    )
                )
            )
        )
    );
};

const DataView = ({ activeTab, selectedSurface, c }) => {
    if (!selectedSurface) return null;

    const generateTabData = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const step = parseFloat(selectedSurface.parameters['Step']) || 1;
        const data = [];

        for (let r = minHeight; r < maxHeight; r += step) {
            // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
            let values;
            if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
                const scanAngleRad = scanAngle * Math.PI / 180;
                const x = r * Math.cos(scanAngleRad);
                const y = r * Math.sin(scanAngleRad);
                values = calculateSurfaceValues(r, selectedSurface, x, y);
            } else {
                values = calculateSurfaceValues(r, selectedSurface);
            }

            let value = 0;
            if (activeTab === 'sag') value = values.sag;
            else if (activeTab === 'slope') value = values.slope;
            else if (activeTab === 'asphericity') value = values.asphericity;
            else if (activeTab === 'aberration') value = values.aberration;

            data.push({
                r: r.toFixed(7),
                value: formatValue(value)
            });
        }

        // Always include maxHeight
        let values;
        if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
            const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
            const scanAngleRad = scanAngle * Math.PI / 180;
            const x = maxHeight * Math.cos(scanAngleRad);
            const y = maxHeight * Math.sin(scanAngleRad);
            values = calculateSurfaceValues(maxHeight, selectedSurface, x, y);
        } else {
            values = calculateSurfaceValues(maxHeight, selectedSurface);
        }
        let value = 0;
        if (activeTab === 'sag') value = values.sag;
        else if (activeTab === 'slope') value = values.slope;
        else if (activeTab === 'asphericity') value = values.asphericity;
        else if (activeTab === 'aberration') value = values.aberration;
        data.push({
            r: maxHeight.toFixed(7),
            value: formatValue(value)
        });

        return data;
    };

    const data = generateTabData();
    const columnName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    const unit = activeTab === 'slope' ? 'rad' : 'mm';

    return React.createElement('div', { style: { padding: '20px' } },
        React.createElement('h3', { style: { marginBottom: '20px', fontSize: '16px' } },
            `${columnName} Data`
        ),
        React.createElement('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
            }
        },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Radial Coordinate (mm)'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${columnName} (${unit})`)
                )
            ),
            React.createElement('tbody', null,
                data.map((row, idx) =>
                    React.createElement('tr', { key: idx, style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.r),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.value)
                    )
                )
            )
        )
    );
};

const PropertiesPanel = ({ selectedSurface, updateSurfaceName, updateSurfaceType, updateParameter, onConvert, c }) => {
    if (!selectedSurface) {
        return React.createElement('div', {
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
            const dr = values[i].r - values[i-1].r;
            const dAsph = Math.abs(values[i].asphericity - values[i-1].asphericity);
            const gradient = dAsph / dr;
            if (gradient > maxAsphGradient) maxAsphGradient = gradient;
        }

        // Calculate best fit sphere
        const sagAtMax = calculateSurfaceValues(maxHeight, selectedSurface).sag;
        let bestFitSphere = 0;
        if (minHeight === 0) {
            bestFitSphere = SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, sagAtMax);
        } else {
            const sagAtMin = calculateSurfaceValues(minHeight, selectedSurface).sag;
            const result = SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, sagAtMin, sagAtMax);
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

    return React.createElement('div', {
        style: {
            width: '320px',
            backgroundColor: c.panel,
            borderLeft: `1px solid ${c.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
        }
    },
        React.createElement('div', {
            style: {
                padding: '12px',
                borderBottom: `1px solid ${c.border}`,
                fontSize: '13px',
                fontWeight: 'bold'
            }
        }, 'Properties'),

        React.createElement('div', { style: { padding: '12px' } },
            // Basic Properties
            React.createElement(PropertySection, { title: "Basic", c },
                React.createElement('div', { style: { marginBottom: '8px' } },
                    React.createElement('label', {
                        style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                    }, 'Name'),
                    React.createElement('input', {
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

                React.createElement('div', { style: { marginBottom: '8px' } },
                    React.createElement('label', {
                        style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                    }, 'Type'),
                    React.createElement('select', {
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
                            React.createElement('option', { key: type, value: type }, type)
                        )
                    )
                )
            ),

            // Parameters
            React.createElement(PropertySection, { title: "Parameters", c },
                React.createElement('div', {
                    style: {
                        padding: '10px',
                        backgroundColor: c.bg,
                        borderRadius: '4px',
                        marginBottom: '12px',
                        border: `1px solid ${c.border}`
                    }
                },
                    React.createElement('div', {
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
                        React.createElement('div', { key: param, style: { marginBottom: '8px' } },
                            React.createElement('label', {
                                style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                            }, param),
                            React.createElement('input', {
                                type: 'text',
                                value: selectedSurface.parameters[param] || '0',
                                onChange: (e) => updateParameter(param, e.target.value),
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
                React.createElement('div', {
                    style: {
                        padding: '10px',
                        backgroundColor: c.bg,
                        borderRadius: '4px',
                        marginBottom: '12px',
                        border: `1px solid ${c.border}`
                    }
                },
                    React.createElement('div', {
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
                        React.createElement('div', { key: param, style: { marginBottom: '8px' } },
                            React.createElement('label', {
                                style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                            }, param),
                            React.createElement('input', {
                                type: 'text',
                                value: selectedSurface.parameters[param] || '0',
                                onChange: (e) => updateParameter(param, e.target.value),
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
                    React.createElement('div', { key: param, style: { marginBottom: '8px' } },
                        React.createElement('label', {
                            style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                        }, param),
                        React.createElement('input', {
                            type: 'text',
                            value: selectedSurface.parameters[param] || '0',
                            onChange: (e) => updateParameter(param, e.target.value),
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
            React.createElement(PropertySection, { title: "Calculated Metrics", c },
                React.createElement(PropertyRow, { label: "Paraxial F/#", value: metrics.paraxialFNum, editable: false, c }),
                React.createElement(PropertyRow, { label: "Working F/#", value: metrics.workingFNum, editable: false, c }),
                React.createElement(PropertyRow, { label: "Max Sag", value: metrics.maxSag, editable: false, c }),
                React.createElement(PropertyRow, { label: "Max Slope", value: metrics.maxSlope, editable: false, c }),
                React.createElement(PropertyRow, { label: "Max Angle", value: metrics.maxAngle, editable: false, c }),
                React.createElement(PropertyRow, { label: "Max Angle DMS", value: metrics.maxAngleDMS, editable: false, c }),
                React.createElement(PropertyRow, { label: "Max Asphericity", value: metrics.maxAsphericity, editable: false, c }),
                React.createElement(PropertyRow, { label: "Max Asph. Gradient", value: metrics.maxAsphGradient, editable: false, c }),
                React.createElement(PropertyRow, { label: "Best Fit Sphere", value: metrics.bestFitSphere, editable: false, c })
            ),

            // Quick Actions
            React.createElement(PropertySection, { title: "Quick Actions", c },
                React.createElement('button', {
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
                React.createElement('button', {
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
                React.createElement('button', {
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

const PropertySection = ({ title, children, c }) => (
    React.createElement('div', { style: { marginBottom: '14px' } },
        React.createElement('div', {
            style: {
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: c.textDim,
                marginBottom: '8px',
                letterSpacing: '0.5px'
            }
        }, title),
        children
    )
);

const PropertyRow = ({ label, value, editable, c }) => (
    React.createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '12px'
        }
    },
        React.createElement('span', { style: { color: c.textDim } }, label + ':'),
        editable ?
            React.createElement('input', {
                type: 'text',
                defaultValue: value,
                style: {
                    width: '110px',
                    padding: '4px 6px',
                    backgroundColor: c.bg,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                    borderRadius: '3px',
                    fontSize: '12px',
                    textAlign: 'right'
                }
            }) :
            React.createElement('span', { style: { fontWeight: '500', fontSize: '12px' } }, value)
    )
);

const ZMXImportDialog = ({ zmxSurfaces, onImport, onClose, c }) => {
    const [selectedIndices, setSelectedIndices] = useState([]);

    const toggleSurface = (index) => {
        if (selectedIndices.includes(index)) {
            setSelectedIndices(selectedIndices.filter(i => i !== index));
        } else {
            setSelectedIndices([...selectedIndices, index]);
        }
    };

    const selectAll = () => {
        setSelectedIndices(zmxSurfaces.map((_, i) => i));
    };

    const deselectAll = () => {
        setSelectedIndices([]);
    };

    const handleImport = () => {
        if (selectedIndices.length === 0) {
            alert('Please select at least one surface to import');
            return;
        }
        onImport(selectedIndices);
    };

    return React.createElement('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }
    },
        React.createElement('div', {
            style: {
                backgroundColor: c.panel,
                borderRadius: '8px',
                padding: '24px',
                width: '800px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${c.border}`
            }
        },
            // Header
            React.createElement('h2', {
                style: {
                    marginTop: 0,
                    marginBottom: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: c.text
                }
            }, 'Import from ZMX'),

            React.createElement('p', {
                style: {
                    marginTop: 0,
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: c.textDim
                }
            }, `Found ${zmxSurfaces.length} surface${zmxSurfaces.length !== 1 ? 's' : ''}. Select surfaces to import:`),

            // Select/Deselect All buttons
            React.createElement('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px'
                }
            },
                React.createElement('button', {
                    onClick: selectAll,
                    style: {
                        padding: '8px 16px',
                        backgroundColor: c.hover,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }
                }, 'Select All'),
                React.createElement('button', {
                    onClick: deselectAll,
                    style: {
                        padding: '8px 16px',
                        backgroundColor: c.hover,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }
                }, 'Deselect All')
            ),

            // Surface list
            React.createElement('div', {
                style: {
                    flex: 1,
                    overflow: 'auto',
                    border: `1px solid ${c.border}`,
                    borderRadius: '4px',
                    marginBottom: '20px'
                }
            },
                React.createElement('table', {
                    style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '12px'
                    }
                },
                    React.createElement('thead', null,
                        React.createElement('tr', {
                            style: {
                                backgroundColor: c.bg,
                                borderBottom: `2px solid ${c.border}`,
                                position: 'sticky',
                                top: 0
                            }
                        },
                            React.createElement('th', { style: { padding: '10px', textAlign: 'center', width: '60px', color: c.textDim } }, 'Select'),
                            React.createElement('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, '#'),
                            React.createElement('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, 'Type'),
                            React.createElement('th', { style: { padding: '10px', textAlign: 'right', color: c.textDim } }, 'Radius (mm)'),
                            React.createElement('th', { style: { padding: '10px', textAlign: 'right', color: c.textDim } }, 'Diameter (mm)'),
                            React.createElement('th', { style: { padding: '10px', textAlign: 'right', color: c.textDim } }, 'Conic'),
                            React.createElement('th', { style: { padding: '10px', textAlign: 'center', color: c.textDim } }, 'Params')
                        )
                    ),
                    React.createElement('tbody', null,
                        zmxSurfaces.map((surface, index) => {
                            const summary = ZMXParser.getSurfaceSummary(surface);
                            const isSelected = selectedIndices.includes(index);

                            return React.createElement('tr', {
                                key: index,
                                onClick: () => toggleSurface(index),
                                style: {
                                    backgroundColor: isSelected ? c.hover : 'transparent',
                                    borderBottom: `1px solid ${c.border}`,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                },
                                onMouseEnter: (e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = c.bg;
                                    }
                                },
                                onMouseLeave: (e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }
                            },
                                React.createElement('td', { style: { padding: '10px', textAlign: 'center' } },
                                    React.createElement('input', {
                                        type: 'checkbox',
                                        checked: isSelected,
                                        onChange: () => toggleSurface(index),
                                        style: { cursor: 'pointer' }
                                    })
                                ),
                                React.createElement('td', { style: { padding: '10px' } }, summary.number),
                                React.createElement('td', { style: { padding: '10px' } }, summary.type),
                                React.createElement('td', { style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace' } }, summary.radius),
                                React.createElement('td', { style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace' } }, summary.diameter),
                                React.createElement('td', { style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace' } }, summary.conic),
                                React.createElement('td', { style: { padding: '10px', textAlign: 'center' } }, summary.parameterCount)
                            );
                        })
                    )
                )
            ),

            // Footer buttons
            React.createElement('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end'
                }
            },
                React.createElement('button', {
                    onClick: onClose,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.hover,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, 'Cancel'),
                React.createElement('button', {
                    onClick: handleImport,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, `Import ${selectedIndices.length} Surface${selectedIndices.length !== 1 ? 's' : ''}`)
            )
        )
    );
};

const ConversionDialog = ({ selectedSurface, folders, selectedFolder, setFolders, setSelectedSurface, setShowConvert, setShowConvertResults, setConvertResults, c }) => {
    const [targetType, setTargetType] = useState('1'); // 1=Even Asphere, 2=Odd Asphere, 3=Opal UnZ, 4=Opal UnU, 5=Poly
    const [algorithm, setAlgorithm] = useState('leastsq');
    const [radius, setRadius] = useState(selectedSurface.parameters['Radius'] || '100');
    const [conicVariable, setConicVariable] = useState(true);
    const [conicValue, setConicValue] = useState('0');
    const [e2Variable, setE2Variable] = useState(true);
    const [e2Value, setE2Value] = useState('1');
    const [hValue, setHValue] = useState('1');
    const [useCoeffs, setUseCoeffs] = useState(true);
    const [numCoeffs, setNumCoeffs] = useState(3);
    const [isRunning, setIsRunning] = useState(false);

    const getMaxCoeffs = () => {
        if (targetType === '1') return 9; // A4-A20 (9 terms)
        if (targetType === '2') return 18; // A3-A20 (18 terms)
        if (targetType === '3') return 11; // A3-A13 (11 terms)
        if (targetType === '4') return 11; // A2-A12 (11 terms)
        if (targetType === '5') return 11; // A3-A13 (11 terms)
        return 9;
    };

    const runConversion = async () => {
        if (!window.electronAPI || !window.electronAPI.runConversion) {
            alert('Conversion not available in this environment');
            return;
        }

        setIsRunning(true);

        try {
            // Generate surface data points
            const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
            const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
            const points = 100;
            const surfaceData = [];

            for (let i = 0; i <= points; i++) {
                const r = minHeight + (maxHeight - minHeight) * i / points;
                const values = calculateSurfaceValues(r, selectedSurface);
                surfaceData.push({ r, z: values.sag });
            }

            // Prepare conversion settings
            const settings = {
                SurfaceType: targetType,
                Radius: radius,
                H: hValue,
                e2_isVariable: e2Variable ? '1' : '0',
                e2: e2Value,
                conic_isVariable: conicVariable ? '1' : '0',
                conic: conicValue,
                TermNumber: useCoeffs ? String(numCoeffs) : '0',
                OptimizationAlgorithm: algorithm
            };

            // Call conversion via IPC
            const result = await window.electronAPI.runConversion(surfaceData, settings);

            if (result.success) {
                // Store result data including original surface info for later surface creation
                setConvertResults({
                    ...result,
                    originalSurface: selectedSurface
                });
                setShowConvert(false);
                setShowConvertResults(true);
            } else {
                alert('Conversion failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Conversion error: ' + error.message);
        } finally {
            setIsRunning(false);
        }
    };

    return React.createElement('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }
    },
        React.createElement('div', {
            style: {
                backgroundColor: c.panel,
                borderRadius: '8px',
                padding: '24px',
                width: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${c.border}`
            }
        },
            React.createElement('h2', {
                style: {
                    marginTop: 0,
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: c.text
                }
            }, 'Convert Surface'),

            // Algorithm selection
            React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, 'Optimization Algorithm'),
                React.createElement('select', {
                    value: algorithm,
                    onChange: (e) => setAlgorithm(e.target.value),
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                },
                    React.createElement('option', { value: 'leastsq' }, 'Least Squares (Levenberg-Marquardt)'),
                    React.createElement('option', { value: 'least_squares' }, 'Least Squares (Trust Region)'),
                    React.createElement('option', { value: 'nelder' }, 'Nelder-Mead'),
                    React.createElement('option', { value: 'powell' }, 'Powell')
                )
            ),

            // Target surface type
            React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, 'Target Surface Type'),
                React.createElement('select', {
                    value: targetType,
                    onChange: (e) => setTargetType(e.target.value),
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                },
                    React.createElement('option', { value: '1' }, 'Even Asphere'),
                    React.createElement('option', { value: '2' }, 'Odd Asphere'),
                    React.createElement('option', { value: '3' }, 'Opal UnZ'),
                    React.createElement('option', { value: '4' }, 'Opal UnU'),
                    React.createElement('option', { value: '5' }, 'Poly')
                )
            ),

            // Radius parameter
            React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, 'Radius (mm) - Fixed'),
                React.createElement('input', {
                    type: 'text',
                    value: radius,
                    onChange: (e) => setRadius(e.target.value),
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                })
            ),

            // Conic constant or e2 based on surface type
            ['1', '2'].includes(targetType) && React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('div', {
                    style: { display: 'flex', alignItems: 'center', marginBottom: '8px' }
                },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: conicVariable,
                        onChange: (e) => setConicVariable(e.target.checked),
                        style: { marginRight: '8px' }
                    }),
                    React.createElement('label', {
                        style: {
                            fontSize: '13px',
                            fontWeight: '600',
                            color: c.textDim
                        }
                    }, 'Conic Constant (Variable)')
                ),
                !conicVariable && React.createElement('input', {
                    type: 'text',
                    value: conicValue,
                    onChange: (e) => setConicValue(e.target.value),
                    placeholder: 'Fixed conic constant value',
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                })
            ),

            // e2 parameter for Opal and Poly types
            ['3', '4', '5'].includes(targetType) && React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('div', {
                    style: { display: 'flex', alignItems: 'center', marginBottom: '8px' }
                },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: e2Variable,
                        onChange: (e) => setE2Variable(e.target.checked),
                        style: { marginRight: '8px' }
                    }),
                    React.createElement('label', {
                        style: {
                            fontSize: '13px',
                            fontWeight: '600',
                            color: c.textDim
                        }
                    }, 'e2 Parameter (Variable)')
                ),
                !e2Variable && React.createElement('input', {
                    type: 'text',
                    value: e2Value,
                    onChange: (e) => setE2Value(e.target.value),
                    placeholder: 'Fixed e2 value',
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                })
            ),

            // H parameter for Opal types
            ['3', '4'].includes(targetType) && React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, 'Normalization Factor H'),
                React.createElement('input', {
                    type: 'text',
                    value: hValue,
                    onChange: (e) => setHValue(e.target.value),
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                })
            ),

            // Higher order coefficients
            React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('div', {
                    style: { display: 'flex', alignItems: 'center', marginBottom: '12px' }
                },
                    React.createElement('input', {
                        type: 'checkbox',
                        checked: useCoeffs,
                        onChange: (e) => setUseCoeffs(e.target.checked),
                        style: { marginRight: '8px' }
                    }),
                    React.createElement('label', {
                        style: {
                            fontSize: '13px',
                            fontWeight: '600',
                            color: c.textDim
                        }
                    }, 'Use Higher Order Coefficients')
                ),
                useCoeffs && React.createElement('div', null,
                    React.createElement('label', {
                        style: {
                            display: 'block',
                            fontSize: '12px',
                            marginBottom: '8px',
                            color: c.textDim
                        }
                    }, `Number of Coefficients: ${numCoeffs}`),
                    React.createElement('input', {
                        type: 'range',
                        min: 1,
                        max: getMaxCoeffs(),
                        value: numCoeffs,
                        onChange: (e) => setNumCoeffs(parseInt(e.target.value)),
                        style: {
                            width: '100%'
                        }
                    })
                )
            ),

            // Action buttons
            React.createElement('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: '24px'
                }
            },
                React.createElement('button', {
                    onClick: () => setShowConvert(false),
                    disabled: isRunning,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.hover,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        opacity: isRunning ? 0.5 : 1
                    }
                }, 'Cancel'),
                React.createElement('button', {
                    onClick: runConversion,
                    disabled: isRunning,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: isRunning ? c.textDim : c.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, isRunning ? 'Converting...' : 'Convert')
            )
        )
    );
};

const ConversionResultsDialog = ({ convertResults, folders, selectedFolder, setFolders, setSelectedSurface, onClose, c }) => {
    const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);
    const [saveResults, setSaveResults] = React.useState(true);

    // Calculate max deviation from deviations data
    const calculateMaxDeviation = () => {
        if (!convertResults || !convertResults.deviations) return 0;

        const lines = convertResults.deviations.split('\n');
        let maxDev = 0;

        for (const line of lines) {
            if (line.trim() && !line.includes('Height')) { // Skip header
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 4) {
                    const deviation = Math.abs(parseFloat(parts[3])); // 4th column is deviation
                    if (!isNaN(deviation)) {
                        maxDev = Math.max(maxDev, deviation);
                    }
                }
            }
        }

        return maxDev;
    };

    const maxDeviation = calculateMaxDeviation();

    const createSurfaceFromFitReport = (fitReport, originalSurface) => {
        const type = fitReport.Type;
        const colors = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];
        const allSurfaces = folders.flatMap(f => f.surfaces);
        const newId = allSurfaces.length > 0 ? Math.max(...allSurfaces.map(s => s.id)) + 1 : 1;
        const color = colors[newId % colors.length];
        let surfaceType, parameters;

        if (type === 'EA') {
            surfaceType = 'Even Asphere';
            parameters = {
                'Radius': String(fitReport.R),
                'Conic Constant': String(fitReport.k),
                'A4': String(fitReport.A4 || 0),
                'A6': String(fitReport.A6 || 0),
                'A8': String(fitReport.A8 || 0),
                'A10': String(fitReport.A10 || 0),
                'A12': String(fitReport.A12 || 0),
                'A14': String(fitReport.A14 || 0),
                'A16': String(fitReport.A16 || 0),
                'A18': String(fitReport.A18 || 0),
                'A20': String(fitReport.A20 || 0),
                'Min Height': originalSurface.parameters['Min Height'],
                'Max Height': originalSurface.parameters['Max Height']
            };
        } else if (type === 'OA') {
            surfaceType = 'Odd Asphere';
            parameters = {
                'Radius': String(fitReport.R),
                'Conic Constant': String(fitReport.k),
                'A3': String(fitReport.A3 || 0),
                'A4': String(fitReport.A4 || 0),
                'A5': String(fitReport.A5 || 0),
                'A6': String(fitReport.A6 || 0),
                'A7': String(fitReport.A7 || 0),
                'A8': String(fitReport.A8 || 0),
                'A9': String(fitReport.A9 || 0),
                'A10': String(fitReport.A10 || 0),
                'A11': String(fitReport.A11 || 0),
                'A12': String(fitReport.A12 || 0),
                'A13': String(fitReport.A13 || 0),
                'A14': String(fitReport.A14 || 0),
                'A15': String(fitReport.A15 || 0),
                'A16': String(fitReport.A16 || 0),
                'A17': String(fitReport.A17 || 0),
                'A18': String(fitReport.A18 || 0),
                'A19': String(fitReport.A19 || 0),
                'A20': String(fitReport.A20 || 0),
                'Min Height': originalSurface.parameters['Min Height'],
                'Max Height': originalSurface.parameters['Max Height']
            };
        } else if (type === 'OUZ') {
            surfaceType = 'Opal Un Z';
            parameters = {
                'Radius': String(fitReport.R),
                'e2': String(fitReport.e2),
                'H': String(fitReport.H),
                'A3': String(fitReport.A3 || 0),
                'A4': String(fitReport.A4 || 0),
                'A5': String(fitReport.A5 || 0),
                'A6': String(fitReport.A6 || 0),
                'A7': String(fitReport.A7 || 0),
                'A8': String(fitReport.A8 || 0),
                'A9': String(fitReport.A9 || 0),
                'A10': String(fitReport.A10 || 0),
                'A11': String(fitReport.A11 || 0),
                'A12': String(fitReport.A12 || 0),
                'A13': String(fitReport.A13 || 0),
                'Min Height': originalSurface.parameters['Min Height'],
                'Max Height': originalSurface.parameters['Max Height']
            };
        } else if (type === 'OUU') {
            surfaceType = 'Opal Un U';
            parameters = {
                'Radius': String(fitReport.R),
                'e2': String(fitReport.e2),
                'H': String(fitReport.H),
                'A2': String(fitReport.A2 || 0),
                'A3': String(fitReport.A3 || 0),
                'A4': String(fitReport.A4 || 0),
                'A5': String(fitReport.A5 || 0),
                'A6': String(fitReport.A6 || 0),
                'A7': String(fitReport.A7 || 0),
                'A8': String(fitReport.A8 || 0),
                'A9': String(fitReport.A9 || 0),
                'A10': String(fitReport.A10 || 0),
                'A11': String(fitReport.A11 || 0),
                'A12': String(fitReport.A12 || 0),
                'Min Height': originalSurface.parameters['Min Height'],
                'Max Height': originalSurface.parameters['Max Height']
            };
        } else if (type === 'OP') {
            surfaceType = 'Poly';
            parameters = {
                'A1': String(fitReport.A1),
                'A2': String(fitReport.A2),
                'A3': String(fitReport.A3 || 0),
                'A4': String(fitReport.A4 || 0),
                'A5': String(fitReport.A5 || 0),
                'A6': String(fitReport.A6 || 0),
                'A7': String(fitReport.A7 || 0),
                'A8': String(fitReport.A8 || 0),
                'A9': String(fitReport.A9 || 0),
                'A10': String(fitReport.A10 || 0),
                'A11': String(fitReport.A11 || 0),
                'A12': String(fitReport.A12 || 0),
                'A13': String(fitReport.A13 || 0),
                'Min Height': originalSurface.parameters['Min Height'],
                'Max Height': originalSurface.parameters['Max Height']
            };
        }

        return {
            id: newId,
            name: `${originalSurface.name} (Converted)`,
            type: surfaceType,
            color,
            parameters
        };
    };

    const handleAddSurface = async () => {
        const newSurface = createSurfaceFromFitReport(
            convertResults.fitReport,
            convertResults.originalSurface
        );

        if (!selectedFolder) return;

        // Save results if checkbox is checked
        if (saveResults && window.electronAPI && window.electronAPI.saveConversionResults) {
            // Reconstruct the file contents from convertResults
            const metricsContent = Object.keys(convertResults.metrics)
                .map(key => `${key} = ${convertResults.metrics[key]}`)
                .join('\n');

            const fitReportContent = Object.keys(convertResults.fitReport)
                .map(key => `${key}=${convertResults.fitReport[key]}`)
                .join('\n');

            await window.electronAPI.saveConversionResults(
                selectedFolder.name,
                newSurface.name,
                {
                    metricsContent,
                    fitReportContent,
                    deviations: convertResults.deviations
                }
            );
        }

        const updated = folders.map(f =>
            f.id === selectedFolder.id
                ? { ...f, surfaces: [...f.surfaces, newSurface] }
                : f
        );
        setFolders(updated);
        setSelectedSurface(newSurface);
        onClose();
    };

    return React.createElement('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }
    },
        React.createElement('div', {
            style: {
                backgroundColor: c.panel,
                borderRadius: '8px',
                padding: '24px',
                width: '700px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${c.border}`
            }
        },
            React.createElement('h2', {
                style: {
                    marginTop: 0,
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: c.text
                }
            }, 'Conversion Results'),

            // Metrics table
            React.createElement('table', {
                style: {
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    marginBottom: '20px'
                }
            },
                React.createElement('thead', null,
                    React.createElement('tr', {
                        style: { borderBottom: `2px solid ${c.border}` }
                    },
                        React.createElement('th', {
                            style: { padding: '10px', textAlign: 'left', color: c.textDim }
                        }, 'Metric'),
                        React.createElement('th', {
                            style: { padding: '10px', textAlign: 'right', color: c.textDim }
                        }, 'Value')
                    )
                ),
                React.createElement('tbody', null,
                    convertResults && convertResults.metrics && Object.keys(convertResults.metrics).map((key, idx) =>
                        React.createElement('tr', {
                            key: idx,
                            style: { borderBottom: `1px solid ${c.border}` }
                        },
                            React.createElement('td', {
                                style: { padding: '10px', color: c.text }
                            }, key.replace(/_/g, ' ')),
                            React.createElement('td', {
                                style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: c.text }
                            }, String(convertResults.metrics[key]))
                        )
                    ),
                    // Add max deviation row
                    React.createElement('tr', {
                        key: 'max-deviation',
                        style: { borderBottom: `1px solid ${c.border}`, backgroundColor: c.bg }
                    },
                        React.createElement('td', {
                            style: { padding: '10px', color: c.text, fontWeight: 'bold' }
                        }, 'Max Sag Deviation'),
                        React.createElement('td', {
                            style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: c.text, fontWeight: 'bold' }
                        }, maxDeviation.toExponential(6) + ' mm')
                    )
                )
            ),

            // Save checkbox
            React.createElement('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                    padding: '10px',
                    backgroundColor: c.bg,
                    borderRadius: '4px'
                }
            },
                React.createElement('input', {
                    type: 'checkbox',
                    id: 'save-results-checkbox',
                    checked: saveResults,
                    onChange: (e) => setSaveResults(e.target.checked),
                    style: { cursor: 'pointer' }
                }),
                React.createElement('label', {
                    htmlFor: 'save-results-checkbox',
                    style: { color: c.text, fontSize: '13px', cursor: 'pointer' }
                }, 'Save results to text files')
            ),

            // Action buttons
            React.createElement('div', {
                style: { display: 'flex', justifyContent: 'space-between', gap: '10px' }
            },
                React.createElement('button', {
                    onClick: () => setShowDetailsDialog(true),
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.hover,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, 'View Results'),
                React.createElement('div', {
                    style: { display: 'flex', gap: '10px' }
                },
                React.createElement('button', {
                    onClick: onClose,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.hover,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, 'Close'),
                React.createElement('button', {
                    onClick: handleAddSurface,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, 'Add to Surfaces')
                )
            ),

            // Details dialog
            showDetailsDialog && React.createElement('div', {
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001
                },
                onClick: () => setShowDetailsDialog(false)
            },
                React.createElement('div', {
                    style: {
                        backgroundColor: c.panel,
                        borderRadius: '8px',
                        padding: '24px',
                        width: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                        border: `1px solid ${c.border}`
                    },
                    onClick: (e) => e.stopPropagation()
                },
                    React.createElement('h2', {
                        style: {
                            marginTop: 0,
                            marginBottom: '20px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: c.text
                        }
                    }, 'Detailed Fit Results'),

                    // Fit Report section
                    React.createElement('h3', {
                        style: {
                            marginTop: '20px',
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: c.textDim
                        }
                    }, 'Fit Report'),
                    React.createElement('pre', {
                        style: {
                            backgroundColor: c.bg,
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: c.text,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            marginBottom: '20px'
                        }
                    }, Object.keys(convertResults.fitReport).map(key =>
                        `${key}=${convertResults.fitReport[key]}`
                    ).join('\n')),

                    // Fit Metrics section
                    React.createElement('h3', {
                        style: {
                            marginTop: '20px',
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: c.textDim
                        }
                    }, 'Fit Metrics'),
                    React.createElement('pre', {
                        style: {
                            backgroundColor: c.bg,
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: c.text,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            marginBottom: '20px'
                        }
                    }, Object.keys(convertResults.metrics).map(key =>
                        `${key} = ${convertResults.metrics[key]}`
                    ).join('\n')),

                    // Fit Deviations section
                    React.createElement('h3', {
                        style: {
                            marginTop: '20px',
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: c.textDim
                        }
                    }, 'Fit Deviations'),
                    React.createElement('pre', {
                        style: {
                            backgroundColor: c.bg,
                            padding: '10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            color: c.text,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            marginBottom: '20px',
                            maxHeight: '300px'
                        }
                    }, convertResults.deviations),

                    // Close button
                    React.createElement('div', {
                        style: { display: 'flex', justifyContent: 'flex-end' }
                    },
                        React.createElement('button', {
                            onClick: () => setShowDetailsDialog(false),
                            style: {
                                padding: '10px 20px',
                                backgroundColor: c.accent,
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                            }
                        }, 'Close')
                    )
                )
            )
        )
    );
};

const SettingsModal = ({ colorscale, setColorscale, onClose, c }) => (
    React.createElement('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }
    },
        React.createElement('div', {
            style: {
                backgroundColor: c.panel,
                borderRadius: '8px',
                padding: '24px',
                width: '400px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${c.border}`
            }
        },
            React.createElement('h2', {
                style: {
                    marginTop: 0,
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: c.text
                }
            }, 'Settings'),

            React.createElement('div', { style: { marginBottom: '20px' } },
                React.createElement('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }
                }, 'Plot Colorscale'),
                React.createElement('select', {
                    value: colorscale,
                    onChange: (e) => setColorscale(e.target.value),
                    style: {
                        width: '100%',
                        padding: '10px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }
                },
                    colorscales.map(scale =>
                        React.createElement('option', { key: scale, value: scale }, scale)
                    )
                )
            ),

            React.createElement('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: '24px'
                }
            },
                React.createElement('button', {
                    onClick: onClose,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.accent,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, 'Close')
            )
        )
    )
);

// Render the app
ReactDOM.render(React.createElement(OpticalSurfaceAnalyzer), document.getElementById('root'));
