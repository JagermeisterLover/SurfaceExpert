const { createElement: h } = React;

export const SurfacesPanel = ({
    folders, selectedFolder, selectedItem, selectedItems,
    handleItemClick, setSelectedFolder, toggleFolderExpanded,
    addItem, removeSelectedItems, setContextMenu, setInputDialog, addFolder, c, t
}) => {
    return h('div', {
        style: { width: '220px', backgroundColor: c.panel, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column' }
    },
        h('div', {
            style: {
                padding: '12px', borderBottom: `1px solid ${c.border}`,
                fontSize: '13px', fontWeight: 'bold',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }
        },
            h('span', null, t.surfaces.title),
            selectedItems.length > 0 && h('button', {
                onClick: removeSelectedItems,
                style: { padding: '4px 8px', backgroundColor: '#e94560', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }
            }, `Delete (${selectedItems.length})`)
        ),
        h('div', { style: { flex: 1, overflow: 'auto', padding: '4px' } },
            folders.map(folder =>
                h('div', { key: folder.id, style: { marginBottom: '4px' } },
                    h('div', {
                        style: {
                            padding: '8px', borderRadius: '4px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            fontSize: '12px', fontWeight: '600',
                            backgroundColor: selectedFolder?.id === folder.id ? c.accent : 'transparent',
                            color: selectedFolder?.id === folder.id ? '#ffffff' : c.text,
                            border: selectedFolder?.id === folder.id ? `2px solid ${c.accent}` : '2px solid transparent',
                            transition: 'all 0.15s'
                        },
                        onClick: (e) => { e.stopPropagation(); setSelectedFolder(folder); },
                        onContextMenu: (e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', target: folder });
                        }
                    },
                        h('span', {
                            onClick: (e) => { e.stopPropagation(); toggleFolderExpanded(folder.id); },
                            style: { fontSize: '10px', userSelect: 'none', opacity: 0.7 }
                        }, folder.expanded ? '▼' : '▶'),
                        h('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, folder.name),
                        h('span', { style: { opacity: 0.6, fontSize: '11px' } }, `(${(folder.items || []).length})`)
                    ),
                    folder.expanded && (folder.items || []).map(item =>
                        h('div', {
                            key: item.id,
                            onClick: (e) => handleItemClick(item, folder, e),
                            onContextMenu: (e) => {
                                e.preventDefault();
                                if (!selectedItems.find(s => s.id === item.id)) handleItemClick(item, folder, e);
                                setContextMenu({ x: e.clientX, y: e.clientY, type: 'item', target: item });
                            },
                            style: {
                                padding: '6px 8px 6px 24px', marginTop: '1px', borderRadius: '3px',
                                cursor: 'pointer', fontSize: '12px',
                                backgroundColor: selectedItems.find(s => s.id === item.id)
                                    ? c.accent + '44'
                                    : selectedItem?.id === item.id ? c.hover : 'transparent',
                                color: c.text,
                                border: selectedItem?.id === item.id ? `1px solid ${c.accent}` : '1px solid transparent',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                transition: 'all 0.1s'
                            }
                        }, item.name)
                    )
                )
            )
        ),
        h('div', {
            style: { padding: '8px', borderTop: `1px solid ${c.border}`, display: 'flex', gap: '4px' }
        },
            h('button', {
                onClick: addItem,
                disabled: !selectedFolder,
                title: t.surfaces.addItem,
                style: {
                    flex: 1, padding: '6px',
                    backgroundColor: selectedFolder ? c.accent : c.hover,
                    color: selectedFolder ? '#fff' : c.textDim,
                    border: 'none', borderRadius: '4px',
                    cursor: selectedFolder ? 'pointer' : 'not-allowed', fontSize: '12px'
                }
            }, '+ Item'),
            h('button', {
                onClick: addFolder,
                title: t.surfaces.addFolder,
                style: {
                    padding: '6px 10px', backgroundColor: c.hover, color: c.text,
                    border: `1px solid ${c.border}`, borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                }
            }, '📁')
        )
    );
};
