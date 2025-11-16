import { surfaceTypes } from '../constants/surfaceTypes.js';
import { formatValue, degreesToDMS } from '../utils/formatters.js';
import { calculateSurfaceValues } from '../utils/calculations.js';
import { PropertySection, PropertyRow } from './PropertySection.js';

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

export default PropertiesPanel;
