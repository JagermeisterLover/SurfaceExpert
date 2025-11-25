// ZMXImportDialog component - ZMX file import dialog with surface selection table

const { useState } = React;
const { createElement: h } = React;

export const ZMXImportDialog = ({ zmxSurfaces, onImport, onClose, c, t }) => {
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
            alert(t.dialogs.zmxImport.errorNoSelection || 'Please select at least one surface to import');
            return;
        }
        onImport(selectedIndices);
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
                width: '800px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                border: `1px solid ${c.border}`
            }
        },
            // Header
            h('h2', {
                style: {
                    marginTop: 0,
                    marginBottom: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: c.text
                }
            }, t.dialogs.zmxImport.title),

            h('p', {
                style: {
                    marginTop: 0,
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: c.textDim
                }
            }, t.dialogs.zmxImport.foundSurfaces.replace('{count}', zmxSurfaces.length)),

            // Select/Deselect All buttons
            h('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px'
                }
            },
                h('button', {
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
                }, t.dialogs.zmxImport.selectAll),
                h('button', {
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
                }, t.dialogs.zmxImport.deselectAll)
            ),

            // Surface list
            h('div', {
                style: {
                    flex: 1,
                    overflow: 'auto',
                    border: `1px solid ${c.border}`,
                    borderRadius: '4px',
                    marginBottom: '20px'
                }
            },
                h('table', {
                    style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '12px'
                    }
                },
                    h('thead', null,
                        h('tr', {
                            style: {
                                backgroundColor: c.bg,
                                borderBottom: `2px solid ${c.border}`,
                                position: 'sticky',
                                top: 0
                            }
                        },
                            h('th', { style: { padding: '10px', textAlign: 'center', width: '60px', color: c.textDim } }, t.dialogs.zmxImport.select),
                            h('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, '#'),
                            h('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, t.dialogs.zmxImport.type),
                            h('th', { style: { padding: '10px', textAlign: 'right', color: c.textDim } }, t.dialogs.zmxImport.radius),
                            h('th', { style: { padding: '10px', textAlign: 'right', color: c.textDim } }, t.dialogs.zmxImport.diameter),
                            h('th', { style: { padding: '10px', textAlign: 'right', color: c.textDim } }, t.dialogs.zmxImport.conic),
                            h('th', { style: { padding: '10px', textAlign: 'center', color: c.textDim } }, t.dialogs.zmxImport.params)
                        )
                    ),
                    h('tbody', null,
                        zmxSurfaces.map((surface, index) => {
                            const summary = window.ZMXParser.getSurfaceSummary(surface);
                            const isSelected = selectedIndices.includes(index);

                            return h('tr', {
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
                                h('td', { style: { padding: '10px', textAlign: 'center' } },
                                    h('input', {
                                        type: 'checkbox',
                                        checked: isSelected,
                                        onChange: () => toggleSurface(index),
                                        style: { cursor: 'pointer' }
                                    })
                                ),
                                h('td', { style: { padding: '10px' } }, summary.number),
                                h('td', { style: { padding: '10px' } }, summary.type),
                                h('td', { style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace' } }, summary.radius),
                                h('td', { style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace' } }, summary.diameter),
                                h('td', { style: { padding: '10px', textAlign: 'right', fontFamily: 'monospace' } }, summary.conic),
                                h('td', { style: { padding: '10px', textAlign: 'center' } }, summary.parameterCount)
                            );
                        })
                    )
                )
            ),

            // Footer buttons
            h('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end'
                }
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
                }, t.dialogs.zmxImport.cancel),
                h('button', {
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
                }, t.dialogs.zmxImport.importButton.replace('{count}', selectedIndices.length))
            )
        )
    );
};
