// InputDialog component - Generic text input dialog for rename/new folder operations

const { createElement: h } = React;

export const InputDialog = ({ inputDialog, c, t }) => {
    if (!inputDialog) return null;

    const [value, setValue] = React.useState(inputDialog.defaultValue || '');
    const [error, setError] = React.useState('');

    // Validate input if validation function provided
    React.useEffect(() => {
        if (inputDialog.validate) {
            const validationError = inputDialog.validate(value);
            setError(validationError || '');
        } else {
            setError('');
        }
    }, [value, inputDialog.validate]);

    // Also validate on mount
    React.useEffect(() => {
        if (inputDialog.validate) {
            const validationError = inputDialog.validate(inputDialog.defaultValue || '');
            setError(validationError || '');
        }
    }, []);

    const isValid = !error && value.trim().length > 0;

    return h('div', {
        style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001
        },
        onClick: () => inputDialog.onCancel()
    },
        h('div', {
            style: {
                backgroundColor: c.panel,
                border: `1px solid ${c.border}`,
                borderRadius: '8px',
                padding: '20px',
                minWidth: '400px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            },
            onClick: (e) => e.stopPropagation()
        },
            h('h3', {
                style: {
                    margin: '0 0 16px 0',
                    color: c.text,
                    fontSize: '16px',
                    fontWeight: '500'
                }
            }, inputDialog.title),
            h('input', {
                type: 'text',
                value: value,
                onChange: (e) => setValue(e.target.value),
                autoFocus: true,
                onKeyDown: (e) => {
                    if (e.key === 'Enter' && isValid) {
                        inputDialog.onConfirm(value);
                    } else if (e.key === 'Escape') {
                        inputDialog.onCancel();
                    }
                },
                style: {
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: c.bg,
                    color: c.text,
                    border: `1px solid ${error ? '#e94560' : c.border}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                }
            }),
            error && h('div', {
                style: {
                    color: '#e94560',
                    fontSize: '12px',
                    marginTop: '8px'
                }
            }, error),
            h('div', {
                style: {
                    display: 'flex',
                    gap: '8px',
                    marginTop: '16px',
                    justifyContent: 'flex-end'
                }
            },
                h('button', {
                    onClick: () => inputDialog.onCancel(),
                    style: {
                        padding: '8px 16px',
                        backgroundColor: c.panel,
                        color: c.text,
                        border: `1px solid ${c.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }
                }, t.dialogs.input.cancel),
                h('button', {
                    onClick: () => {
                        if (isValid) {
                            inputDialog.onConfirm(value);
                        }
                    },
                    disabled: !isValid,
                    style: {
                        padding: '8px 16px',
                        backgroundColor: isValid ? c.accent : c.border,
                        color: isValid ? '#fff' : c.textDim,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isValid ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        opacity: isValid ? 1 : 0.5
                    }
                }, t.dialogs.input.ok)
            )
        )
    );
};
