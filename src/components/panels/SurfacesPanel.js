// ============================================
// SurfacesPanel Component
// ============================================
// Left sidebar panel showing folder tree and surface list

const { createElement: h } = React;

export const SurfacesPanel = ({
    folders,
    selectedFolder,
    selectedSurface,
    selectedSurfaces,
    handleSurfaceClick,
    setSelectedFolder,
    toggleFolderExpanded,
    addSurface,
    removeSelectedSurfaces,
    setContextMenu,
    setInputDialog,
    addFolder,
    c,
    t
}) => {
    return h('div', {
        style: {
            width: '220px',
            backgroundColor: c.panel,
            borderRight: `1px solid ${c.border}`,
            display: 'flex',
            flexDirection: 'column'
        }
    },
        h('div', {
            style: {
                padding: '12px',
                borderBottom: `1px solid ${c.border}`,
                fontSize: '13px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }
        },
            h('span', null, t.surfaces.title),
            selectedSurfaces.length > 0 && h('button', {
                onClick: removeSelectedSurfaces,
                title: `${t.surfaces.delete} ${selectedSurfaces.length}`,
                style: {
                    padding: '4px 8px',
                    backgroundColor: '#e94560',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'normal'
                }
            }, `Delete (${selectedSurfaces.length})`)
        ),
        h('div', { style: { flex: 1, overflow: 'auto', padding: '4px' } },
            folders.map(folder =>
                h('div', { key: folder.id, style: { marginBottom: '4px' } },
                    // Folder header
                    h('div', {
                        style: {
                            padding: '8px',
                            backgroundColor: selectedFolder?.id === folder.id ? c.accent : 'transparent',
                            color: selectedFolder?.id === folder.id ? '#ffffff' : c.text,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: selectedFolder?.id === folder.id ? `2px solid ${c.accent}` : '2px solid transparent',
                            transition: 'all 0.15s'
                        },
                        onClick: (e) => {
                            // Only select folder, don't toggle expansion
                            setSelectedFolder(folder);
                        },
                        onContextMenu: (e) => {
                            e.preventDefault();
                            setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                type: 'folder',
                                target: folder
                            });
                        }
                    },
                        h('span', {
                            style: { fontSize: '10px', userSelect: 'none', cursor: 'pointer' },
                            onClick: (e) => {
                                e.stopPropagation();
                                toggleFolderExpanded(folder.id);
                            }
                        },
                            folder.expanded ? '▼' : '▶'
                        ),
                        h('span', { style: { flex: 1 } }, folder.name),
                        h('span', {
                            style: {
                                fontSize: '10px',
                                color: selectedFolder?.id === folder.id ? 'rgba(255, 255, 255, 0.8)' : c.textDim
                            }
                        }, `(${folder.surfaces.length})`)
                    ),
                    // Folder surfaces
                    folder.expanded && h('div', { style: { paddingLeft: '16px' } },
                        folder.surfaces.map(surface => {
                            const isSelected = selectedSurface?.id === surface.id;
                            const isMultiSelected = selectedSurfaces.includes(surface.id);
                            const bgColor = isMultiSelected ? c.accent : (isSelected ? c.hover : 'transparent');

                            return h('div', {
                                key: surface.id,
                                onClick: (e) => handleSurfaceClick(e, surface, folder),
                                onContextMenu: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setContextMenu({
                                        x: e.clientX,
                                        y: e.clientY,
                                        type: 'surface',
                                        target: surface,
                                        folder: folder
                                    });
                                },
                                style: {
                                    padding: '8px',
                                    marginTop: '2px',
                                    backgroundColor: bgColor,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s',
                                    border: isMultiSelected ? `2px solid ${c.accent}` : 'none'
                                },
                                onMouseEnter: (e) => {
                                    if (!isSelected && !isMultiSelected) {
                                        e.currentTarget.style.backgroundColor = c.border;
                                    }
                                },
                                onMouseLeave: (e) => {
                                    if (!isSelected && !isMultiSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }
                            },
                                h('div', {
                                    style: {
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '2px',
                                        backgroundColor: surface.color,
                                        flexShrink: 0
                                    }
                                }),
                                h('div', { style: { flex: 1, minWidth: 0 } },
                                    h('div', {
                                        style: { fontSize: '12px', fontWeight: '500', marginBottom: '1px' }
                                    }, surface.name),
                                    h('div', {
                                        style: { fontSize: '10px', color: c.textDim }
                                    }, t.surfaceTypes[surface.type] || surface.type)
                                )
                            );
                        })
                    )
                )
            )
        ),
        // Add buttons
        h('div', {
            style: {
                padding: '8px',
                borderTop: `1px solid ${c.border}`,
                display: 'flex',
                gap: '6px',
                fontSize: '12px'
            }
        },
            h('button', {
                onClick: (e) => {
                    e.stopPropagation();
                    setInputDialog({
                        title: t.dialogs.folder.newFolder,
                        defaultValue: 'New Folder',
                        validate: (name) => {
                            if (!name || !name.trim()) {
                                return t.dialogs.folder.folderNameEmpty;
                            }
                            if (folders.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) {
                                return t.dialogs.folder.folderExists;
                            }
                            return '';
                        },
                        onConfirm: (name) => {
                            if (name && name.trim()) {
                                addFolder(name.trim());
                            }
                            setInputDialog(null);
                        },
                        onCancel: () => setInputDialog(null)
                    });
                },
                style: {
                    flex: 1,
                    padding: '8px',
                    backgroundColor: c.panel,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                }
            }, `${t.surfaces.newFolder}`),
            h('button', {
                onClick: addSurface,
                disabled: !selectedFolder,
                style: {
                    flex: 1,
                    padding: '8px',
                    backgroundColor: selectedFolder ? c.accent : c.border,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedFolder ? 'pointer' : 'not-allowed',
                    fontSize: '12px',
                    fontWeight: '500'
                }
            }, `${t.surfaces.newSurface}`)
        )
    );
};
