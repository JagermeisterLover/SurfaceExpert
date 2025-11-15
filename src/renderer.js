const { useState, useEffect, useRef } = React;

// Surface type definitions with their parameters
const surfaceTypes = {
    'Sphere': ['Radius', 'Min Height', 'Max Height'],
    'Even Asphere': ['Radius', 'Conic Constant', 'A4', 'A6', 'A8', 'A10', 'A12', 'A14', 'A16', 'A18', 'A20', 'Min Height', 'Max Height'],
    'Odd Asphere': ['Radius', 'Conic Constant', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20', 'Min Height', 'Max Height'],
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

// Main App Component
const OpticalSurfaceAnalyzer = () => {
    const [surfaces, setSurfaces] = useState(sampleSurfaces);
    const [selectedSurface, setSelectedSurface] = useState(sampleSurfaces[0]);
    const [activeTab, setActiveTab] = useState('summary');
    const [activeSubTab, setActiveSubTab] = useState('3d');
    const plotRef = useRef(null);

    // Update selected surface when it changes in the list
    useEffect(() => {
        const updated = surfaces.find(s => s.id === selectedSurface.id);
        if (updated) {
            setSelectedSurface(updated);
        }
    }, [surfaces]);

    useEffect(() => {
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
                    const values = calculateSurfaceValues(r, selectedSurface);
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

    const handleMenuAction = (action) => {
        switch (action) {
            case 'add-surface':
                addSurface();
                break;
            case 'remove-surface':
                removeSurface();
                break;
            // Add more handlers as needed
        }
    };

    const create3DPlot = () => {
        const plotData = generatePlotData();
        const unit = activeTab === 'slope' ? 'rad' : 'mm';

        const data = [{
            z: plotData.z,
            type: 'surface',
            colorscale: 'Viridis',
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
                xaxis: { title: 'X (mm)' },
                yaxis: { title: 'Y (mm)' },
                zaxis: { title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})` },
                bgcolor: '#2b2b2b'
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
        const plotData = generatePlotData();
        const size = plotData.size;
        const x = [], y = [];

        // Create centered coordinate arrays from -maxHeight to +maxHeight
        for (let i = 0; i < size; i++) {
            x.push(-plotData.maxHeight + (i * (2 * plotData.maxHeight)) / (size - 1));
            y.push(-plotData.maxHeight + (i * (2 * plotData.maxHeight)) / (size - 1));
        }

        const data = [{
            x: x,
            y: y,
            z: plotData.z,
            type: 'contour',
            colorscale: 'Viridis',
            showscale: true,
            contours: {
                coloring: 'heatmap'
            }
        }];

        const layout = {
            xaxis: { title: 'X (mm)' },
            yaxis: { title: 'Y (mm)' },
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

    const createCrossSection = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const points = 100;
        const x = [], y = [];
        const unit = activeTab === 'slope' ? 'rad' : 'mm';

        for (let i = 0; i < points; i++) {
            const r = minHeight + (i * (maxHeight - minHeight)) / (points - 1);
            x.push(r);
            const values = calculateSurfaceValues(r, selectedSurface);

            let val = 0;
            if (activeTab === 'sag') val = values.sag;
            else if (activeTab === 'slope') val = values.slope;
            else if (activeTab === 'asphericity') val = values.asphericity;
            else if (activeTab === 'aberration') val = values.aberration;
            y.push(val);
        }

        const data = [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#4a90e2', width: 2 }
        }];

        const layout = {
            xaxis: { title: 'Radial Distance (mm)' },
            yaxis: { title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})` },
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

    const updateSurfaceName = (newName) => {
        const updated = surfaces.map(s =>
            s.id === selectedSurface.id ? { ...s, name: newName } : s
        );
        setSurfaces(updated);
    };

    const updateSurfaceType = (newType) => {
        const newParams = {};
        surfaceTypes[newType].forEach(param => {
            newParams[param] = selectedSurface.parameters[param] || '0';
        });

        const updated = surfaces.map(s =>
            s.id === selectedSurface.id ? { ...s, type: newType, parameters: newParams } : s
        );
        setSurfaces(updated);
    };

    const updateParameter = (param, value) => {
        const updated = surfaces.map(s =>
            s.id === selectedSurface.id ? {
                ...s,
                parameters: { ...s.parameters, [param]: value }
            } : s
        );
        setSurfaces(updated);
    };

    const addSurface = () => {
        const newId = Math.max(...surfaces.map(s => s.id)) + 1;
        const colors = ['#4a90e2', '#e94560', '#2ecc71', '#f39c12', '#9b59b6'];
        const newSurface = {
            id: newId,
            name: `Surface ${newId}`,
            type: 'Sphere',
            color: colors[newId % colors.length],
            parameters: {
                'Radius': '100.0',
                'Min Height': '0',
                'Max Height': '20.0'
            }
        };
        setSurfaces([...surfaces, newSurface]);
        setSelectedSurface(newSurface);
    };

    const removeSurface = () => {
        if (surfaces.length <= 1) return;

        const filtered = surfaces.filter(s => s.id !== selectedSurface.id);
        setSurfaces(filtered);
        setSelectedSurface(filtered[0]);
    };

    const classifySurfaceShape = () => {
        const radius = parseFloat(selectedSurface.parameters['Radius']) || 0;

        if (selectedSurface.type === 'Sphere') {
            if (radius > 0) return 'Concave Sphere';
            if (radius < 0) return 'Convex Sphere';
            return 'Flat';
        }

        if (selectedSurface.type === 'Poly' || selectedSurface.type === 'Opal Un U' || selectedSurface.type === 'Opal Un Z') {
            return selectedSurface.type;
        }

        const conicConstant = parseFloat(selectedSurface.parameters['Conic Constant']);
        let curvature = radius > 0 ? 'Concave' : radius < 0 ? 'Convex' : 'Flat';
        let shape = '';

        if (!isNaN(conicConstant)) {
            if (conicConstant === 0) {
                shape = 'Sphere';
            } else if (conicConstant === -1) {
                shape = 'Parabola';
            } else if (conicConstant > -1 && conicConstant < 0) {
                shape = 'Ellipsoid';
            } else if (conicConstant < -1) {
                shape = 'Hyperbola';
            } else if (conicConstant > 0) {
                shape = 'Oblate Ellipsoid';
            }
        } else {
            shape = selectedSurface.type;
        }

        return `${curvature} ${shape}`;
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
        }
    },
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
                React.createElement('div', { style: { flex: 1, overflow: 'auto', padding: '8px' } },
                    surfaces.map(surface =>
                        React.createElement('div', {
                            key: surface.id,
                            onClick: () => setSelectedSurface(surface),
                            style: {
                                padding: '10px',
                                marginBottom: '4px',
                                backgroundColor: selectedSurface.id === surface.id ? c.hover : 'transparent',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background-color 0.2s'
                            },
                            onMouseEnter: (e) => {
                                if (selectedSurface.id !== surface.id) {
                                    e.currentTarget.style.backgroundColor = c.border;
                                }
                            },
                            onMouseLeave: (e) => {
                                if (selectedSurface.id !== surface.id) {
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
                            React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                                React.createElement('div', {
                                    style: { fontSize: '13px', fontWeight: '500', marginBottom: '2px' }
                                }, surface.name),
                                React.createElement('div', {
                                    style: { fontSize: '11px', color: c.textDim }
                                }, surface.type)
                            )
                        )
                    )
                ),
                React.createElement('div', {
                    style: {
                        padding: '8px',
                        borderTop: `1px solid ${c.border}`,
                        display: 'flex',
                        gap: '8px'
                    }
                },
                    React.createElement('button', {
                        onClick: addSurface,
                        style: {
                            flex: 1,
                            padding: '8px',
                            backgroundColor: c.accent,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }
                    }, React.createElement(PlusIcon), ' Add'),
                    React.createElement('button', {
                        onClick: removeSurface,
                        style: {
                            flex: 1,
                            padding: '8px',
                            backgroundColor: c.hover,
                            color: c.text,
                            border: `1px solid ${c.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                        }
                    }, React.createElement(MinusIcon), ' Remove')
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
                    ['summary', 'sag', 'slope', 'asphericity', 'aberration'].map(tab =>
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
                classifySurfaceShape,
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
const calculateSurfaceValues = (r, surface) => {
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
    // Generate data table for summary
    const generateDataTable = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const steps = 20;
        const data = [];

        for (let i = 0; i <= steps; i++) {
            const r = minHeight + (maxHeight - minHeight) * i / steps;
            const values = calculateSurfaceValues(r, selectedSurface);
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

    return React.createElement('div', { style: { padding: '20px' } },
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
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Paraxial F/#'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(paraxialFNum)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Working F/#'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(workingFNum)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Sag'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSag)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Slope'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSlope)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'rad')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Angle'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAngle)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '°')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Angle DMS'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, degreesToDMS(maxAngle)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Asphericity'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphericity)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Asph. Gradient'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphGradient)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '/mm')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Best Fit Sphere'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(bestFitSphere)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
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
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Slope (rad)'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle (°)'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle DMS'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Asphericity (mm)'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Aberration (mm)')
                )
            ),
            React.createElement('tbody', null,
                dataTable.map((row, idx) =>
                    React.createElement('tr', { key: idx, style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.r),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.sag),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.slope),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.angle),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.angleDMS),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.asphericity),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.aberration)
                    )
                )
            )
        )
    );
};

const DataView = ({ activeTab, selectedSurface, c }) => {
    const generateTabData = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const steps = 30;
        const data = [];

        for (let i = 0; i <= steps; i++) {
            const r = minHeight + (maxHeight - minHeight) * i / steps;
            const values = calculateSurfaceValues(r, selectedSurface);

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

const PropertiesPanel = ({ selectedSurface, updateSurfaceName, updateSurfaceType, updateParameter, classifySurfaceShape, c }) => {
    // Calculate metrics for display
    const calculateMetrics = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const R = parseFloat(selectedSurface.parameters['Radius']) || 0;

        const steps = 20;
        let maxSag = 0, maxSlope = 0, maxAngle = 0, maxAsphericity = 0, maxAberration = 0;
        let maxAsphGradient = 0;
        const values = [];

        for (let i = 0; i <= steps; i++) {
            const r = minHeight + (maxHeight - minHeight) * i / steps;
            const v = calculateSurfaceValues(r, selectedSurface);
            values.push({ r, ...v });
            maxSag = Math.max(maxSag, v.sag);
            maxSlope = Math.max(maxSlope, Math.abs(v.slope));
            maxAngle = Math.max(maxAngle, Math.abs(v.angle));
            maxAsphericity = Math.max(maxAsphericity, Math.abs(v.asphericity));
            maxAberration = Math.max(maxAberration, Math.abs(v.aberration));
        }

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
                ),

                React.createElement(PropertyRow, {
                    label: "Shape Classification",
                    value: classifySurfaceShape(),
                    editable: false,
                    c
                })
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
                    ['Radius', 'Min Height', 'Max Height'].map(param => (
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

                surfaceTypes[selectedSurface.type].filter(param =>
                    !['Radius', 'Min Height', 'Max Height'].includes(param)
                ).map(param =>
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

// Render the app
ReactDOM.render(React.createElement(OpticalSurfaceAnalyzer), document.getElementById('root'));
