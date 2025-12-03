const { useState } = React;
const { createElement: h } = React;

// Import calculateSurfaceValues from utils
import { calculateSurfaceValues } from '../../utils/calculations.js';
import { parseNumber } from '../../utils/numberParsing.js';

const ConversionDialog = ({ selectedSurface, folders, selectedFolder, setFolders, setSelectedSurface, setShowConvert, setShowConvertResults, setConvertResults, c, t }) => {
    const [targetType, setTargetType] = useState('1'); // 1=Even Asphere, 2=Odd Asphere, 3=Opal UnZ, 4=Opal UnU, 5=Opal Poly, 6=Poly (normalized)
    const [algorithm, setAlgorithm] = useState('leastsq');
    const [radius, setRadius] = useState(selectedSurface.parameters['Radius'] || '100');
    const [conicVariable, setConicVariable] = useState(true);
    const [conicValue, setConicValue] = useState('0');
    const [e2Variable, setE2Variable] = useState(true);
    const [e2Value, setE2Value] = useState('1');
    const [hValue, setHValue] = useState('1');
    const [hInternal, setHInternal] = useState(''); // For Poly type 6 - auto if empty
    const [useCoeffs, setUseCoeffs] = useState(true);
    const [numCoeffs, setNumCoeffs] = useState(3);
    const [isRunning, setIsRunning] = useState(false);

    const getMaxCoeffs = () => {
        if (targetType === '1') return 9; // A4-A20 (9 terms)
        if (targetType === '2') return 18; // A3-A20 (18 terms)
        if (targetType === '3') return 11; // A3-A13 (11 terms)
        if (targetType === '4') return 11; // A2-A12 (11 terms)
        if (targetType === '5') return 11; // A3-A13 (11 terms)
        if (targetType === '6') return 11; // A3-A13 (11 terms, A1=2*R, A2=e2-1)
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
            const minHeight = parseNumber(selectedSurface.parameters['Min Height']);
            const maxHeight = parseNumber(selectedSurface.parameters['Max Height']);
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

            // Add H_internal for Poly type 6 if specified
            if (targetType === '6' && hInternal.trim() !== '') {
                settings.H_internal = hInternal;
            }

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

    return h('div', {
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
        h('div', {
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
            h('h2', {
                style: {
                    marginTop: 0,
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: c.text
                }
            }, t.dialogs.conversion.title),

            // Algorithm selection
            h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, t.dialogs.conversion.optimizationAlgorithm),
                h('select', {
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
                    h('option', { value: 'leastsq' }, t.dialogs.conversion.algorithms.leastsq),
                    h('option', { value: 'least_squares' }, t.dialogs.conversion.algorithms.least_squares),
                    h('option', { value: 'nelder' }, t.dialogs.conversion.algorithms.nelder),
                    h('option', { value: 'powell' }, t.dialogs.conversion.algorithms.powell)
                )
            ),

            // Target surface type
            h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, t.dialogs.conversion.targetSurfaceType),
                h('select', {
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
                    h('option', { value: '1' }, t.surfaceTypes['Even Asphere']),
                    h('option', { value: '2' }, t.surfaceTypes['Odd Asphere']),
                    h('option', { value: '3' }, t.surfaceTypes['Opal Un Z']),
                    h('option', { value: '4' }, t.surfaceTypes['Opal Un U']),
                    h('option', { value: '5' }, 'Poly'),
                    h('option', { value: '6' }, 'Poly (Auto-Normalized)')
                )
            ),

            // Radius parameter
            h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, t.dialogs.conversion.radiusFixed),
                h('input', {
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
            ['1', '2'].includes(targetType) && h('div', { style: { marginBottom: '20px' } },
                h('div', {
                    style: { display: 'flex', alignItems: 'center', marginBottom: '8px' }
                },
                    h('input', {
                        type: 'checkbox',
                        checked: conicVariable,
                        onChange: (e) => setConicVariable(e.target.checked),
                        style: { marginRight: '8px' }
                    }),
                    h('label', {
                        style: {
                            fontSize: '13px',
                            fontWeight: '600',
                            color: c.textDim
                        }
                    }, t.dialogs.conversion.conicConstantVariable)
                ),
                !conicVariable && h('input', {
                    type: 'text',
                    value: conicValue,
                    onChange: (e) => setConicValue(e.target.value),
                    placeholder: t.dialogs.conversion.fixedConicValue,
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
            ['3', '4', '5', '6'].includes(targetType) && h('div', { style: { marginBottom: '20px' } },
                h('div', {
                    style: { display: 'flex', alignItems: 'center', marginBottom: '8px' }
                },
                    h('input', {
                        type: 'checkbox',
                        checked: e2Variable,
                        onChange: (e) => setE2Variable(e.target.checked),
                        style: { marginRight: '8px' }
                    }),
                    h('label', {
                        style: {
                            fontSize: '13px',
                            fontWeight: '600',
                            color: c.textDim
                        }
                    }, t.dialogs.conversion.e2ParameterVariable)
                ),
                !e2Variable && h('input', {
                    type: 'text',
                    value: e2Value,
                    onChange: (e) => setE2Value(e.target.value),
                    placeholder: t.dialogs.conversion.fixedE2Value,
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
            ['3', '4'].includes(targetType) && h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, t.dialogs.conversion.normalizationFactorH),
                h('input', {
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

            // H_internal parameter for Poly type 6 (optional - auto if empty)
            targetType === '6' && h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim
                    }
                }, 'Internal Normalization H (optional - auto if empty)'),
                h('input', {
                    type: 'text',
                    value: hInternal,
                    onChange: (e) => setHInternal(e.target.value),
                    placeholder: 'Auto-calculated from data range',
                    style: {
                        width: '100%',
                        padding: '8px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                }),
                h('div', {
                    style: {
                        fontSize: '11px',
                        color: c.textDim,
                        marginTop: '6px',
                        fontStyle: 'italic'
                    }
                }, 'Improves numerical conditioning. Leave empty for automatic calculation.')
            ),

            // Higher order coefficients
            h('div', { style: { marginBottom: '20px' } },
                h('div', {
                    style: { display: 'flex', alignItems: 'center', marginBottom: '12px' }
                },
                    h('input', {
                        type: 'checkbox',
                        checked: useCoeffs,
                        onChange: (e) => setUseCoeffs(e.target.checked),
                        style: { marginRight: '8px' }
                    }),
                    h('label', {
                        style: {
                            fontSize: '13px',
                            fontWeight: '600',
                            color: c.textDim
                        }
                    }, t.dialogs.conversion.useHigherOrderCoeffs)
                ),
                useCoeffs && h('div', null,
                    h('label', {
                        style: {
                            display: 'block',
                            fontSize: '12px',
                            marginBottom: '8px',
                            color: c.textDim
                        }
                    }, `${t.dialogs.conversion.numberOfCoeffs}: ${numCoeffs}`),
                    h('input', {
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
            h('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: '24px'
                }
            },
                h('button', {
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
                }, t.dialogs.conversion.cancel),
                h('button', {
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
                }, isRunning ? t.dialogs.conversion.converting : t.dialogs.conversion.convert)
            )
        )
    );
};

export { ConversionDialog };
