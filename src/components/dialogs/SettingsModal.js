// SettingsModal component - Settings dialog for plot colorscale selection

import { colorscales } from '../../constants/surfaceTypes.js';

const { createElement: h } = React;

export const SettingsModal = ({ colorscale, setColorscale, wavelength, setWavelength, gridSize3D, setGridSize3D, gridSize2D, setGridSize2D, onClose, c }) => {
    // Grid size options (odd numbers only to ensure point at 0)
    // Capped at 257 to prevent application freezing
    const gridSizeOptions = [33, 65, 129, 257];

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
                width: '400px',
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
            }, 'Settings'),

            h('div', { style: { marginBottom: '20px' } },
                h('label', {
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
                h('select', {
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
                        h('option', { key: scale, value: scale }, scale)
                    )
                )
            ),

            h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }
                }, 'Reference Wavelength (nm)'),
                h('input', {
                    type: 'number',
                    value: wavelength,
                    onChange: (e) => setWavelength(parseFloat(e.target.value) || 632.8),
                    step: '0.1',
                    min: '100',
                    max: '10000',
                    style: {
                        width: '100%',
                        padding: '10px',
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
                        marginTop: '6px'
                    }
                }, 'Used for RMS/P-V error calculations (default: 632.8 nm HeNe laser)')
            ),

            h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }
                }, '3D Plot Grid Size'),
                h('select', {
                    value: gridSize3D,
                    onChange: (e) => setGridSize3D(parseInt(e.target.value)),
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
                    gridSizeOptions.map(size =>
                        h('option', { key: size, value: size }, `${size}×${size}`)
                    )
                ),
                h('div', {
                    style: {
                        fontSize: '11px',
                        color: c.textDim,
                        marginTop: '6px'
                    }
                }, `Grid resolution for 3D surface plots (${gridSize3D * gridSize3D} points total)`)
            ),

            h('div', { style: { marginBottom: '20px' } },
                h('label', {
                    style: {
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: c.textDim,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }
                }, '2D Plot Grid Size'),
                h('select', {
                    value: gridSize2D,
                    onChange: (e) => setGridSize2D(parseInt(e.target.value)),
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
                    gridSizeOptions.map(size =>
                        h('option', { key: size, value: size }, `${size}×${size}`)
                    )
                ),
                h('div', {
                    style: {
                        fontSize: '11px',
                        color: c.textDim,
                        marginTop: '6px'
                    }
                }, `Grid resolution for 2D contour plots (${gridSize2D * gridSize2D} points total)`)
            ),

            h('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end',
                    marginTop: '24px'
                }
            },
                h('button', {
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
    );
};
