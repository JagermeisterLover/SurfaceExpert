// NormalizeUnZDialog - Dialog for normalizing Opal Un Z surface to new H value

const { createElement: h } = React;
const { useState } = React;

/**
 * Normalize UnZ Dialog Component
 * @param {Object} props
 * @param {number} props.currentH - Current H value
 * @param {Function} props.onConfirm - Callback with new H value
 * @param {Function} props.onCancel - Callback to close dialog
 * @param {Object} props.c - Color scheme object
 * @param {Object} props.t - Localization strings
 */
export const NormalizeUnZDialog = ({ currentH, onConfirm, onCancel, c, t }) => {
    const [newH, setNewH] = useState(currentH.toString());
    const [error, setError] = useState('');

    const handleConfirm = () => {
        const value = parseFloat(newH);
        if (isNaN(value) || value <= 0) {
            setError(t.dialogs.normalizeUnZ.errorPositive || 'Please enter a positive number');
            return;
        }
        if (value === currentH) {
            setError(t.dialogs.normalizeUnZ.errorDifferent || 'New H value must be different from current H');
            return;
        }
        onConfirm(value);
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
        },
        onClick: (e) => {
            if (e.target === e.currentTarget) onCancel();
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
            }, t.dialogs.normalizeUnZ.title),

            h('div', {
                style: {
                    marginBottom: '8px',
                    fontSize: '13px',
                    color: c.textDim
                }
            }, `${t.dialogs.normalizeUnZ.currentH}: ${currentH}`),

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
                }, t.dialogs.normalizeUnZ.newH),
                h('input', {
                    type: 'number',
                    value: newH,
                    onChange: (e) => {
                        setNewH(e.target.value);
                        setError('');
                    },
                    onKeyDown: (e) => {
                        if (e.key === 'Enter') handleConfirm();
                        if (e.key === 'Escape') onCancel();
                    },
                    step: '0.001',
                    min: '0.001',
                    autoFocus: true,
                    style: {
                        width: '100%',
                        padding: '10px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${error ? '#e74c3c' : c.border}`,
                        borderRadius: '4px',
                        fontSize: '13px'
                    }
                }),
                error && h('div', {
                    style: {
                        color: '#e74c3c',
                        fontSize: '12px',
                        marginTop: '6px'
                    }
                }, error)
            ),

            h('div', {
                style: {
                    fontSize: '12px',
                    color: c.textDim,
                    marginBottom: '20px',
                    lineHeight: '1.5'
                }
            }, t.dialogs.normalizeUnZ.help),

            h('div', {
                style: {
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end'
                }
            },
                h('button', {
                    onClick: onCancel,
                    style: {
                        padding: '10px 20px',
                        backgroundColor: c.bg,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                    }
                }, t.dialogs.normalizeUnZ.cancel),
                h('button', {
                    onClick: handleConfirm,
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
                }, t.dialogs.normalizeUnZ.normalize)
            )
        )
    );
};
