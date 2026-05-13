export const availableLocales = [
  { code: 'en', name: 'English' }
];

const en = {
  menu: {
    file: 'File',
    view: 'View',
    tools: 'Tools',
    help: 'Help',
    reload: 'Reload',
    toggleDevTools: 'Toggle DevTools',
    toggleFullscreen: 'Toggle Fullscreen',
    settings: 'Settings',
    documentation: 'Documentation',
    about: 'About'
  },
  surfaces: {
    title: 'Items',
    delete: 'Delete',
    addItem: 'Add Item',
    addFolder: 'Add Folder'
  },
  settings: {
    title: 'Settings',
    colorTheme: 'Color Theme',
    language: 'Language'
  },
  dialogs: {
    contextMenu: {
      rename: 'Rename',
      renameFolder: 'Rename Folder',
      deleteFolder: 'Delete Folder',
      deleteItem: 'Delete Item'
    },
    folder: {
      folderNameEmpty: 'Folder name cannot be empty',
      folderExists: 'A folder with this name already exists'
    }
  }
};

const locales = { en };

export function getLocale(code) {
  return locales[code] || locales['en'];
}

export function getCurrentLocale() {
  try {
    return localStorage.getItem('locale') || 'en';
  } catch (_) {
    return 'en';
  }
}

export function saveLocale(code) {
  try {
    localStorage.setItem('locale', code);
  } catch (_) {}
}
