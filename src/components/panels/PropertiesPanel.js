// ============================================
// PropertiesPanel Component
// ============================================
// Right sidebar panel showing surface properties and controls

import { surfaceTypes, universalParameters, zernikeNames } from '../../constants/surfaceTypes.js';
import { formatValue, degreesToDMS } from '../../utils/formatters.js';
import { calculateSurfaceMetrics } from '../../utils/calculations.js';
import { PropertySection } from '../ui/PropertySection.js';
import { PropertyRow } from '../ui/PropertyRow.js';
import { DebouncedInput } from '../ui/DebouncedInput.js';
import { SurfaceActionButtons } from '../ui/SurfaceActionButtons.js';

const { createElement: h } = React;

export const PropertiesPanel = ({
    selectedSurface,
    updateSurfaceName,
    updateSurfaceType,
    updateParameter,
    onConvert,
    onFastConvertToPoly,
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
}) => {
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
        }, t.properties.noSurfaceSelected);
    }

    // Calculate metrics for display using shared utility function
    const rawMetrics = calculateSurfaceMetrics(selectedSurface, wavelength);
    const metrics = {
        paraxialFNum: formatValue(rawMetrics.paraxialFNum),
        workingFNum: formatValue(rawMetrics.workingFNum),
        maxSag: `${formatValue(rawMetrics.maxSag)} ${t.summary.units.mm}`,
        maxSlope: `${formatValue(rawMetrics.maxSlope)} ${t.summary.units.rad}`,
        maxAngle: `${formatValue(rawMetrics.maxAngle)} ${t.summary.units.deg}`,
        maxAngleDMS: degreesToDMS(rawMetrics.maxAngle),
        maxAsphericity: `${formatValue(rawMetrics.maxAsphericity)} ${t.summary.units.mm}`,
        maxAsphGradient: `${formatValue(rawMetrics.maxAsphGradient)} ${t.summary.units.perMm}`,
        bestFitSphere: `${formatValue(rawMetrics.bestFitSphere)} ${t.summary.units.mm}`,
        rmsError: rawMetrics.rmsError !== null ? {
            mm: `${formatValue(rawMetrics.rmsError.mm)} ${t.summary.units.mm}`,
            waves: formatValue(rawMetrics.rmsError.waves) + ' λ'
        } : null,
        pvError: rawMetrics.pvError !== null ? {
            mm: `${formatValue(rawMetrics.pvError.mm)} ${t.summary.units.mm}`,
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
        }, t.properties.title),

        h('div', { style: { padding: '12px' } },
            // Basic Properties
            h(PropertySection, { title: t.properties.basic, c },
                h('div', { style: { marginBottom: '8px' } },
                    h('label', {
                        style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                    }, t.properties.name),
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
                    }, t.properties.type),
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
                            h('option', { key: type, value: type }, t.surfaceTypes[type] || type)
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
                    }, t.properties.universalParameters),
                    universalParameters[selectedSurface.type].map(param => (
                        selectedSurface.parameters[param] !== undefined &&
                        h('div', { key: param, style: { marginBottom: '8px' } },
                            h('label', {
                                style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                            }, t.parameters[param] || param),
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
                    }, t.properties.surfaceSpecificParameters),
                    ['Scan Angle', 'X Coordinate', 'Y Coordinate'].map(param => (
                        selectedSurface.parameters[param] !== undefined &&
                        h('div', { key: param, style: { marginBottom: '8px' } },
                            h('label', {
                                style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                            }, t.parameters[param] || param),
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
                }).map(param => {
                    // Get Zernike name if this is a Z parameter
                    const zernName = zernikeNames[param];
                    const labelText = zernName ? `${param} - ${zernName}` : (t.parameters[param] || param);

                    return h('div', { key: param, style: { marginBottom: '8px' } },
                        h('label', {
                            style: { fontSize: '12px', color: c.textDim, display: 'block', marginBottom: '4px' }
                        }, labelText),
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
                    );
                })
            ),

            // Calculated Metrics
            h(PropertySection, { title: t.properties.calculatedMetrics, c },
                // F/# only for rotationally symmetric surfaces
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: t.properties.paraxialFNum, value: metrics.paraxialFNum, editable: false, c }),
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: t.properties.workingFNum, value: metrics.workingFNum, editable: false, c }),
                h(PropertyRow, { label: t.properties.maxSag, value: metrics.maxSag, editable: false, c }),
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: t.properties.maxSlope, value: metrics.maxSlope, editable: false, c }),
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: t.properties.maxAngle, value: metrics.maxAngle, editable: false, c }),
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: `${t.properties.maxAngle} (DMS)`, value: metrics.maxAngleDMS, editable: false, c }),
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: t.properties.maxAsphericity, value: metrics.maxAsphericity, editable: false, c }),
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: t.properties.maxAsphGradient, value: metrics.maxAsphGradient, editable: false, c }),
                selectedSurface.type !== 'Zernike' && selectedSurface.type !== 'Irregular' && h(PropertyRow, { label: t.properties.bestFitSphere, value: metrics.bestFitSphere, editable: false, c }),
                // RMS and P-V error for Zernike and Irregular surfaces
                (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.rmsError && h(PropertyRow, { label: `${t.properties.rmsError} (mm)`, value: metrics.rmsError.mm, editable: false, c }),
                (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.rmsError && h(PropertyRow, { label: `${t.properties.rmsError} (waves)`, value: metrics.rmsError.waves, editable: false, c }),
                (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.pvError && h(PropertyRow, { label: `${t.properties.pvError} (mm)`, value: metrics.pvError.mm, editable: false, c }),
                (selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular') && metrics.pvError && h(PropertyRow, { label: `${t.properties.pvError} (waves)`, value: metrics.pvError.waves, editable: false, c })
            ),

            // Surface Transformation Actions
            h(SurfaceActionButtons, {
                surface: selectedSurface,
                onInvert: handleInvertSurface,
                onNormalizeUnZ: handleNormalizeUnZ,
                onConvertToUnZ: handleConvertToUnZ,
                onConvertToPoly: handleConvertToPoly,
                c,
                t
            }),

            // Quick Actions
            h(PropertySection, { title: t.properties.actions, c },
                h('button', {
                    onClick: onFastConvertToPoly,
                    disabled: fastConvertProgress !== null,
                    style: {
                        width: '100%',
                        padding: '8px',
                        marginBottom: '6px',
                        backgroundColor: fastConvertProgress !== null ? c.textDim : c.accent,
                        color: 'white',
                        border: `1px solid ${fastConvertProgress !== null ? c.textDim : c.accent}`,
                        borderRadius: '4px',
                        cursor: fastConvertProgress !== null ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        opacity: fastConvertProgress !== null ? 0.8 : 1
                    }
                }, fastConvertProgress ? `Converting... ${fastConvertProgress}` : (t.buttons.fastConvertToPoly || 'Fast Convert to Poly')),
                h('button', {
                    onClick: onConvert,
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
                }, t.buttons.convert),
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
                }, t.properties.exportHTML),
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
                }, t.properties.exportPDF)
            )
        )
    );
};
