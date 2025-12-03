const { useState } = React;
const { createElement: h } = React;

export const ConversionResultsDialog = ({ convertResults, folders, selectedFolder, setFolders, setSelectedSurface, onClose, c, t }) => {
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [saveResults, setSaveResults] = useState(true);

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
                'Max Height': originalSurface.parameters['Max Height'],
                'Step': originalSurface.parameters['Step'] || '1.0'
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
                'Max Height': originalSurface.parameters['Max Height'],
                'Step': originalSurface.parameters['Step'] || '1.0'
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
                'Max Height': originalSurface.parameters['Max Height'],
                'Step': originalSurface.parameters['Step'] || '1.0'
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
                'Max Height': originalSurface.parameters['Max Height'],
                'Step': originalSurface.parameters['Step'] || '1.0'
            };
        } else if (type === 'OP' || type === 'Poly') {
            // OP = Opal Polynomial, Poly = Poly (Auto-Normalized)
            // Both create Poly surface type in the application
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
                'Max Height': originalSurface.parameters['Max Height'],
                'Step': originalSurface.parameters['Step'] || '1.0'
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

        // Save the surface immediately to disk
        if (window.electronAPI && window.electronAPI.saveSurface) {
            await window.electronAPI.saveSurface(selectedFolder.name, newSurface);
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
                width: '700px',
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
            }, t.dialogs.conversionResults.title),

            // Metrics table
            h('table', {
                style: {
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    marginBottom: '20px'
                }
            },
                h('thead', null,
                    h('tr', {
                        style: { borderBottom: `2px solid ${c.border}` }
                    },
                        h('th', {
                            style: { padding: '10px', textAlign: 'left', color: c.textDim }
                        }, t.dialogs.conversionResults.metric),
                        h('th', {
                            style: { padding: '10px', textAlign: 'right', color: c.textDim }
                        }, t.dialogs.conversionResults.value)
                    )
                ),
                h('tbody', null,
                    convertResults && convertResults.metrics && Object.keys(convertResults.metrics).map((key, idx) =>
                        h('tr', {
                            key: idx,
                            style: { borderBottom: `1px solid ${c.border}` }
                        },
                            h('td', {
                                style: { padding: '10px', color: c.text }
                            }, key.replace(/_/g, ' ')),
                            h('td', {
                                style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: c.text }
                            }, String(convertResults.metrics[key]))
                        )
                    ),
                    // Add max deviation row
                    h('tr', {
                        key: 'max-deviation',
                        style: { borderBottom: `1px solid ${c.border}`, backgroundColor: c.bg }
                    },
                        h('td', {
                            style: { padding: '10px', color: c.text, fontWeight: 'bold' }
                        }, t.dialogs.conversionResults.maxSagDeviation),
                        h('td', {
                            style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: c.text, fontWeight: 'bold' }
                        }, `${maxDeviation.toExponential(6)} ${t?.summary?.units?.mm || 'mm'}`)
                    )
                )
            ),

            // Save checkbox
            h('div', {
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
                h('input', {
                    type: 'checkbox',
                    id: 'save-results-checkbox',
                    checked: saveResults,
                    onChange: (e) => setSaveResults(e.target.checked),
                    style: { cursor: 'pointer' }
                }),
                h('label', {
                    htmlFor: 'save-results-checkbox',
                    style: { color: c.text, fontSize: '13px', cursor: 'pointer' }
                }, t.dialogs.conversionResults.saveResults)
            ),

            // Action buttons
            h('div', {
                style: { display: 'flex', justifyContent: 'space-between', gap: '10px' }
            },
                h('button', {
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
                }, t.dialogs.conversionResults.viewResults),
                h('div', {
                    style: { display: 'flex', gap: '10px' }
                },
                h('button', {
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
                }, t.buttons.close),
                h('button', {
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
                }, t.dialogs.conversionResults.addToSurfaces)
                )
            ),

            // Details dialog
            showDetailsDialog && h('div', {
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
                h('div', {
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
                    h('h2', {
                        style: {
                            marginTop: 0,
                            marginBottom: '20px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: c.text
                        }
                    }, t.dialogs.conversionResults.detailedResults),

                    // Fit Report section
                    h('h3', {
                        style: {
                            marginTop: '20px',
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: c.textDim
                        }
                    }, t.dialogs.conversionResults.fitReport),
                    h('pre', {
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
                    h('h3', {
                        style: {
                            marginTop: '20px',
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: c.textDim
                        }
                    }, t.dialogs.conversionResults.fitMetrics),
                    h('pre', {
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
                    h('h3', {
                        style: {
                            marginTop: '20px',
                            marginBottom: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: c.textDim
                        }
                    }, t.dialogs.conversionResults.fitDeviations),
                    h('pre', {
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
                    h('div', {
                        style: { display: 'flex', justifyContent: 'flex-end' }
                    },
                        h('button', {
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
                        }, t.buttons.close)
                    )
                )
            )
        )
    );
};
