// InputDialog component - Generic text input dialog for rename/new folder operations

const { createElement: h } = React;

export const InputDialog = ({ inputDialog, c }) => {
    if (!inputDialog) return null;

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
                defaultValue: inputDialog.defaultValue,
                autoFocus: true,
                onKeyDown: (e) => {
                    if (e.key === 'Enter') {
                        inputDialog.onConfirm(e.target.value);
                    } else if (e.key === 'Escape') {
                        inputDialog.onCancel();
                    }
                },
                style: {
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: c.bg,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                }
            }),
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
                }, 'Cancel'),
                h('button', {
                    onClick: (e) => {
                        const input = e.target.parentElement.parentElement.querySelector('input');
                        inputDialog.onConfirm(input.value);
                    },
                    style: {
                        padding: '8px 16px',
                        backgroundColor: c.accent,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                    }
                }, 'OK')
            )
        )
    );
};

export { InputDialog };
