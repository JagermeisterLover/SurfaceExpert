const { useState } = React;

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

// Export as default using ES6 modules
export default ZMXImportDialog;
