// SettingsModal component - Settings dialog for plot colorscale selection

import { colorscales } from '../../constants/colorscales.js';
import { getPaletteNames } from '../../constants/colorPalettes.js';
import { availableLocales } from '../../constants/locales.js';

const { createElement: h } = React;

export const SettingsModal = ({ colorscale, setColorscale, wavelength, setWavelength, gridSize3D, setGridSize3D, gridSize2D, setGridSize2D, theme, setTheme, locale, setLocale, fastConvertThreshold, setFastConvertThreshold, onClose, c, t }) => {
    // Grid size options (odd numbers only to ensure point at 0)
    // Extended to 1025 for high-resolution plots
    // 2D plots use image-based rendering for performance with large grids
    const gridSizeOptions = [33, 65, 129, 257, 513, 1025];

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
                maxHeight: '85vh',
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
            }, t.settings.title),

            // Two-column layout
            h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginBottom: '20px'
                }
            },
                // Left column
                h('div', null,
                    // Color Theme
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
                        }, t.settings.colorTheme),
                        h('select', {
                            value: theme,
                            onChange: (e) => setTheme(e.target.value),
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
                            getPaletteNames().map(name =>
                                h('option', { key: name, value: name }, name)
                            )
                        )
                    ),

                    // Language
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
                        }, t.settings.language),
                        h('select', {
                            value: locale,
                            onChange: (e) => setLocale(e.target.value),
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
                            availableLocales.map(loc =>
                                h('option', { key: loc.code, value: loc.code }, loc.name)
                            )
                        )
                    ),

                    // Plot Colorscale
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
                        }, t.settings.plotColorscale),
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

                    // Grid Size 3D
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
                        }, t.settings.gridSize3D),
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
                        }, `${t.settings.gridSize3DHelp} (${gridSize3D * gridSize3D} ${t.settings.points})`)
                    ),

                    // Grid Size 2D
                    h('div', { style: { marginBottom: '0' } },
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
                        }, t.settings.gridSize2D),
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
                        }, `${t.settings.gridSize2DHelp} (${gridSize2D * gridSize2D} ${t.settings.points})`)
                    )
                ),

                // Right column
                h('div', null,
                    // Reference Wavelength
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
                        }, t.settings.referenceWavelength),
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
                        }, t.settings.wavelengthHelp)
                    ),

                    // Fast Convert Threshold
                    h('div', { style: { marginBottom: '0' } },
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
                        }, t.settings.fastConvertThreshold || 'Fast Convert Max Deviation Threshold'),
                        h('input', {
                            type: 'number',
                            value: fastConvertThreshold,
                            onChange: (e) => setFastConvertThreshold(parseFloat(e.target.value) || 0.000001),
                            step: '0.0000001',
                            min: '0.00000001',
                            max: '0.1',
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
                        }, t.settings.fastConvertThresholdHelp || 'Maximum sag deviation for automatic Poly conversion (mm). Default: 0.000001')
                    )
                )
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
                }, t.settings.close)
            )
        )
    );
};
