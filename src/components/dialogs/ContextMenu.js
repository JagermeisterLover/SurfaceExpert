// ContextMenu component - Right-click context menu for folders and surfaces

const { createElement: h } = React;

export const ContextMenu = ({
    contextMenu,
    setContextMenu,
    folders,
    renameFolder,
    removeFolder,
    removeSurface,
    setInputDialog,
    c
}) => {
    if (!contextMenu) return null;

    return h('div', {
        style: {
            position: 'fixed',
            left: contextMenu.x + 'px',
            top: contextMenu.y + 'px',
            backgroundColor: c.panel,
            border: `1px solid ${c.border}`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10000,
            minWidth: '160px',
            overflow: 'hidden'
        },
        onClick: (e) => e.stopPropagation()
    },
        contextMenu.type === 'folder' ? [
            h('div', {
                key: 'rename',
                style: {
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    borderBottom: `1px solid ${c.border}`
                },
                onClick: (e) => {
                    e.stopPropagation();
                    const targetId = contextMenu.target.id;
                    const targetName = contextMenu.target.name;
                    setContextMenu(null);
                    setInputDialog({
                        title: 'Rename Folder',
                        defaultValue: targetName,
                        onConfirm: (name) => {
                            if (name && name.trim()) {
                                renameFolder(targetId, name.trim());
                            }
                            setInputDialog(null);
                        },
                        onCancel: () => setInputDialog(null)
                    });
                },
                onMouseEnter: (e) => e.currentTarget.style.backgroundColor = c.hover,
                onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
            }, 'Rename'),
            h('div', {
                key: 'delete',
                style: {
                    padding: '10px 16px',
                    cursor: folders.length > 1 ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    color: folders.length > 1 ? '#e94560' : c.textDim
                },
                onClick: () => {
                    if (folders.length > 1 && confirm(`Delete folder "${contextMenu.target.name}"?`)) {
                        removeFolder(contextMenu.target.id);
                    }
                    setContextMenu(null);
                },
                onMouseEnter: (e) => {
                    if (folders.length > 1) e.currentTarget.style.backgroundColor = c.hover;
                },
                onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
            }, 'Delete Folder')
        ] : [
            h('div', {
                key: 'delete',
                style: {
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#e94560'
                },
                onClick: () => {
                    removeSurface();
                    setContextMenu(null);
                },
                onMouseEnter: (e) => e.currentTarget.style.backgroundColor = c.hover,
                onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
            }, 'Delete Surface')
        ]
    );
};
