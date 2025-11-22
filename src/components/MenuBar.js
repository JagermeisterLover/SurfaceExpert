/**
 * Modern custom menu bar component
 * Replaces the default OS menu bar with a modern, integrated design
 */

export function MenuBar({ c, onMenuAction }) {
  const [openMenu, setOpenMenu] = React.useState(null);
  const [menuPosition, setMenuPosition] = React.useState({ x: 0, y: 0 });

  // Menu structure
  const menus = {
    File: [
      { label: 'Import from ZMX...', action: 'import-zmx', shortcut: 'Ctrl+I' }
    ],
    Reports: [
      { label: 'Export HTML Report...', action: 'export-html-report', shortcut: 'Ctrl+E' },
      { label: 'Export PDF Report...', action: 'export-pdf-report', shortcut: 'Ctrl+P' }
    ],
    View: [
      { label: 'Reload', action: 'reload', shortcut: 'Ctrl+R' },
      { label: 'Toggle DevTools', action: 'toggleDevTools', shortcut: 'Ctrl+Shift+I' },
      { type: 'separator' },
      { label: 'Toggle Fullscreen', action: 'toggleFullscreen', shortcut: 'F11' }
    ],
    Tools: [
      { label: 'Settings...', action: 'open-settings', shortcut: 'Ctrl+,' }
    ],
    Help: [
      { label: 'Documentation', action: 'documentation' },
      { label: 'About', action: 'about' }
    ]
  };

  const handleMenuClick = (menuName, event) => {
    if (openMenu === menuName) {
      setOpenMenu(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setMenuPosition({ x: rect.left, y: rect.bottom });
      setOpenMenu(menuName);
    }
  };

  const handleItemClick = (action) => {
    setOpenMenu(null);
    if (action === 'reload') {
      window.location.reload();
    } else if (action === 'toggleDevTools') {
      // This won't work directly, need to add IPC handler
      onMenuAction('toggle-devtools');
    } else if (action === 'toggleFullscreen') {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        document.documentElement.requestFullscreen();
      }
    } else {
      onMenuAction(action);
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    if (openMenu) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('.menu-bar') && !e.target.closest('.menu-dropdown')) {
          setOpenMenu(null);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenu]);

  return React.createElement('div', {
    className: 'menu-bar',
    style: {
      display: 'flex',
      alignItems: 'center',
      height: '32px',
      backgroundColor: c.panel,
      borderBottom: `1px solid ${c.border}`,
      padding: '0 8px',
      gap: '4px',
      position: 'relative',
      userSelect: 'none',
      WebkitAppRegion: 'drag' // Make draggable on Windows
    }
  },
    // Menu items
    Object.keys(menus).map(menuName =>
      React.createElement('div', {
        key: menuName,
        style: {
          position: 'relative',
          WebkitAppRegion: 'no-drag' // Make clickable
        }
      },
        // Menu button
        React.createElement('button', {
          onClick: (e) => handleMenuClick(menuName, e),
          style: {
            padding: '4px 12px',
            backgroundColor: openMenu === menuName ? c.hover : 'transparent',
            color: c.text,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background-color 0.15s',
            outline: 'none'
          },
          onMouseEnter: (e) => {
            if (openMenu === null) {
              e.target.style.backgroundColor = c.hover;
            }
          },
          onMouseLeave: (e) => {
            if (openMenu !== menuName) {
              e.target.style.backgroundColor = 'transparent';
            }
          }
        }, menuName),

        // Dropdown menu
        openMenu === menuName && React.createElement('div', {
          className: 'menu-dropdown',
          style: {
            position: 'fixed',
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            backgroundColor: c.panel,
            border: `1px solid ${c.border}`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: '220px',
            padding: '4px',
            zIndex: 10000,
            animation: 'menuFadeIn 0.1s ease-out'
          }
        },
          menus[menuName].map((item, idx) =>
            item.type === 'separator'
              ? React.createElement('div', {
                  key: idx,
                  style: {
                    height: '1px',
                    backgroundColor: c.border,
                    margin: '4px 8px'
                  }
                })
              : React.createElement('div', {
                  key: idx,
                  onClick: () => handleItemClick(item.action),
                  style: {
                    padding: '8px 12px',
                    color: c.text,
                    fontSize: '13px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'background-color 0.15s'
                  },
                  onMouseEnter: (e) => {
                    e.target.style.backgroundColor = c.hover;
                  },
                  onMouseLeave: (e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }
                },
                  React.createElement('span', null, item.label),
                  item.shortcut && React.createElement('span', {
                    style: {
                      color: c.textDim,
                      fontSize: '11px',
                      marginLeft: '24px'
                    }
                  }, item.shortcut)
                )
          )
        )
      )
    )
  );
}
