import { getPalette } from './constants/colorPalettes.js';
import { getLocale, getCurrentLocale, saveLocale } from './constants/locales.js';
import { MessageNotification } from './components/ui/MessageNotification.js';
import { TitleBar } from './components/TitleBar.js';
import { MenuBar } from './components/MenuBar.js';
import { PropertiesPanel } from './components/panels/PropertiesPanel.js';
import { SurfacesPanel } from './components/panels/SurfacesPanel.js';
import { VisualizationPanel } from './components/panels/VisualizationPanel.js';
import { SettingsModal } from './components/dialogs/SettingsModal.js';
import { InputDialog } from './components/dialogs/InputDialog.js';
import { AboutDialog } from './components/dialogs/AboutDialog.js';

const { createElement: h } = React;
const { useState, useEffect } = React;

const App = () => {
    const [folders, setFolders] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [lastClickedItem, setLastClickedItem] = useState(null);
    const [activeTab, setActiveTab] = useState('Overview');
    const [showSettings, setShowSettings] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [theme, setTheme] = useState('Dark Gray (Default)');
    const [locale, setLocaleState] = useState(getCurrentLocale());
    const [contextMenu, setContextMenu] = useState(null);
    const [inputDialog, setInputDialog] = useState(null);
    const [messageNotification, setMessageNotification] = useState(null);

    const t = getLocale(locale);
    const c = getPalette(theme);

    const setLocale = (newLocale) => {
        setLocaleState(newLocale);
        saveLocale(newLocale);
    };

    useEffect(() => {
        loadFoldersFromDisk();
        loadSettingsFromDisk();
    }, []);

    useEffect(() => {
        saveSettingsToDisk();
    }, [theme, locale]);

    const loadFoldersFromDisk = async () => {
        if (window.electronAPI && window.electronAPI.loadFolders) {
            const result = await window.electronAPI.loadFolders();
            if (result.success) {
                setFolders(result.folders);
                if (result.folders.length > 0 && (result.folders[0].items || []).length > 0) {
                    setSelectedItem(result.folders[0].items[0]);
                    setSelectedFolder(result.folders[0]);
                } else if (result.folders.length > 0) {
                    setSelectedFolder(result.folders[0]);
                }
            }
        } else {
            const defaultFolder = { id: 'My Items', name: 'My Items', expanded: true, items: [] };
            setFolders([defaultFolder]);
            setSelectedFolder(defaultFolder);
        }
    };

    const loadSettingsFromDisk = async () => {
        if (window.electronAPI && window.electronAPI.loadSettings) {
            const result = await window.electronAPI.loadSettings();
            if (result.success && result.settings) {
                if (result.settings.theme) setTheme(result.settings.theme);
                if (result.settings.locale) setLocaleState(result.settings.locale);
            }
        }
    };

    const saveSettingsToDisk = async () => {
        if (window.electronAPI && window.electronAPI.saveSettings) {
            await window.electronAPI.saveSettings({ theme, locale });
        }
    };

    const addItem = async () => {
        if (!selectedFolder) return;
        const newItem = { id: Date.now().toString(), name: `Item ${Date.now()}`, data: {} };
        const updatedFolders = folders.map(f =>
            f.id === selectedFolder.id ? { ...f, items: [...(f.items || []), newItem] } : f
        );
        setFolders(updatedFolders);
        setSelectedItem(newItem);
        if (window.electronAPI && window.electronAPI.saveItem) {
            await window.electronAPI.saveItem(selectedFolder.name, newItem);
        }
    };

    const removeSelectedItems = async () => {
        const toRemove = selectedItems.length > 0 ? selectedItems : (selectedItem ? [selectedItem] : []);
        if (toRemove.length === 0) return;
        const updatedFolders = folders.map(folder => ({
            ...folder,
            items: (folder.items || []).filter(item => !toRemove.find(r => r.id === item.id))
        }));
        setFolders(updatedFolders);
        setSelectedItem(null);
        setSelectedItems([]);
        if (window.electronAPI && window.electronAPI.deleteItem) {
            for (const item of toRemove) {
                const folder = folders.find(f => (f.items || []).some(s => s.id === item.id));
                if (folder) await window.electronAPI.deleteItem(folder.name, item.name);
            }
        }
    };

    const addFolder = async () => {
        setInputDialog({
            title: 'New Folder',
            defaultValue: 'New Folder',
            validate: (name) => {
                if (!name || !name.trim()) return t.dialogs.folder.folderNameEmpty;
                if (folders.some(f => f.name.toLowerCase() === name.trim().toLowerCase())) return t.dialogs.folder.folderExists;
                return '';
            },
            onConfirm: async (name) => {
                if (name && name.trim()) {
                    const newFolder = { id: name.trim(), name: name.trim(), expanded: true, items: [] };
                    setFolders(prev => [...prev, newFolder]);
                    setSelectedFolder(newFolder);
                    if (window.electronAPI && window.electronAPI.createFolder) {
                        await window.electronAPI.createFolder(name.trim());
                    }
                }
                setInputDialog(null);
            },
            onCancel: () => setInputDialog(null)
        });
    };

    const renameFolder = async (folderId, newName) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;
        const oldName = folder.name;
        setFolders(folders.map(f => f.id === folderId ? { ...f, id: newName, name: newName } : f));
        if (selectedFolder?.id === folderId) setSelectedFolder({ ...folder, id: newName, name: newName });
        if (window.electronAPI && window.electronAPI.renameFolder) {
            await window.electronAPI.renameFolder(oldName, newName);
        }
    };

    const removeFolder = async (folderId) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;
        const updatedFolders = folders.filter(f => f.id !== folderId);
        setFolders(updatedFolders);
        if (selectedFolder?.id === folderId) {
            setSelectedFolder(updatedFolders[0] || null);
            setSelectedItem(null);
        }
        if (window.electronAPI && window.electronAPI.deleteFolder) {
            await window.electronAPI.deleteFolder(folder.name);
        }
    };

    const toggleFolderExpanded = (folderId) => {
        setFolders(folders.map(f => f.id === folderId ? { ...f, expanded: !f.expanded } : f));
    };

    const handleItemClick = (item, folder, event) => {
        setSelectedFolder(folder);
        if (event && event.ctrlKey) {
            setSelectedItems(prev =>
                prev.find(s => s.id === item.id) ? prev.filter(s => s.id !== item.id) : [...prev, item]
            );
            setSelectedItem(item);
        } else if (event && event.shiftKey && lastClickedItem) {
            const allItems = folders.flatMap(f => f.items || []);
            const lastIdx = allItems.findIndex(s => s.id === lastClickedItem.id);
            const currIdx = allItems.findIndex(s => s.id === item.id);
            const [start, end] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
            setSelectedItems(allItems.slice(start, end + 1));
            setSelectedItem(item);
        } else {
            setSelectedItem(item);
            setSelectedItems([item]);
            setLastClickedItem(item);
        }
    };

    const handleMenuAction = (action) => {
        if (action === 'open-settings') setShowSettings(true);
        else if (action === 'about') setShowAbout(true);
    };

    useEffect(() => {
        if (contextMenu) {
            const close = () => setContextMenu(null);
            document.addEventListener('click', close);
            return () => document.removeEventListener('click', close);
        }
    }, [contextMenu]);

    return h('div', {
        style: {
            display: 'flex', flexDirection: 'column', height: '100vh',
            backgroundColor: c.bg, color: c.text,
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }
    },
        h(TitleBar, { c }),
        h(MenuBar, { c, onMenuAction: handleMenuAction, t }),
        h('div', { style: { display: 'flex', flex: 1, overflow: 'hidden' } },
            h(SurfacesPanel, {
                folders, selectedFolder, selectedItem, selectedItems,
                handleItemClick, setSelectedFolder, toggleFolderExpanded,
                addItem, removeSelectedItems, setContextMenu, setInputDialog, addFolder, c, t
            }),
            h(VisualizationPanel, { activeTab, setActiveTab, c }),
            h(PropertiesPanel, { selectedItem, c })
        ),
        showSettings && h(SettingsModal, {
            theme, setTheme, locale, setLocale, onClose: () => setShowSettings(false), c, t
        }),
        showAbout && h(AboutDialog, { c, onClose: () => setShowAbout(false) }),
        h(InputDialog, { inputDialog, c, t }),
        contextMenu && h('div', {
            style: {
                position: 'fixed', left: contextMenu.x + 'px', top: contextMenu.y + 'px',
                backgroundColor: c.panel, border: `1px solid ${c.border}`,
                borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 10000, minWidth: '160px', overflow: 'hidden'
            },
            onClick: (e) => e.stopPropagation()
        },
            contextMenu.type === 'folder' ? [
                h('div', {
                    key: 'rename',
                    style: { padding: '10px 16px', cursor: 'pointer', fontSize: '13px', borderBottom: `1px solid ${c.border}` },
                    onClick: (e) => {
                        e.stopPropagation();
                        const { id: targetId, name: targetName } = contextMenu.target;
                        setContextMenu(null);
                        setInputDialog({
                            title: t.dialogs.contextMenu.renameFolder,
                            defaultValue: targetName,
                            validate: (name) => {
                                if (!name || !name.trim()) return t.dialogs.folder.folderNameEmpty;
                                if (name.trim().toLowerCase() !== targetName.toLowerCase() &&
                                    folders.some(f => f.name.toLowerCase() === name.trim().toLowerCase()))
                                    return t.dialogs.folder.folderExists;
                                return '';
                            },
                            onConfirm: (name) => {
                                if (name && name.trim()) renameFolder(targetId, name.trim());
                                setInputDialog(null);
                            },
                            onCancel: () => setInputDialog(null)
                        });
                    },
                    onMouseEnter: (e) => e.currentTarget.style.backgroundColor = c.hover,
                    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
                }, t.dialogs.contextMenu.rename),
                h('div', {
                    key: 'delete',
                    style: {
                        padding: '10px 16px',
                        cursor: folders.length > 1 ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        color: folders.length > 1 ? '#e94560' : c.textDim
                    },
                    onClick: () => {
                        if (folders.length > 1) removeFolder(contextMenu.target.id);
                        setContextMenu(null);
                    },
                    onMouseEnter: (e) => { if (folders.length > 1) e.currentTarget.style.backgroundColor = c.hover; },
                    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
                }, t.dialogs.contextMenu.deleteFolder)
            ] : [
                h('div', {
                    key: 'delete',
                    style: { padding: '10px 16px', cursor: 'pointer', fontSize: '13px', color: '#e94560' },
                    onClick: () => { removeSelectedItems(); setContextMenu(null); },
                    onMouseEnter: (e) => e.currentTarget.style.backgroundColor = c.hover,
                    onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
                }, t.dialogs.contextMenu.deleteItem)
            ]
        ),
        messageNotification && h(MessageNotification, {
            c,
            message: messageNotification.message,
            type: messageNotification.type,
            onClose: () => setMessageNotification(null)
        })
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(App, null));
