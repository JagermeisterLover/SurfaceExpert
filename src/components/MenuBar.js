/**
 * Modern custom menu bar component
 * Replaces the default OS menu bar with a modern, integrated design
 */

export function MenuBar({ c, onMenuAction, t }) {
  const [openMenu, setOpenMenu] = React.useState(null);
  const [menuPosition, setMenuPosition] = React.useState({ x: 0, y: 0 });

  // Menu structure (using translation object)
  const menus = {
    [t.menu.file]: [
      { label: t.menu.importZMX, action: 'import-zmx', shortcut: 'Ctrl+I' }
    ],
    [t.menu.reports]: [
      { label: t.menu.exportHTMLReport, action: 'export-html-report', shortcut: 'Ctrl+E' },
      { label: t.menu.exportPDFReport, action: 'export-pdf-report', shortcut: 'Ctrl+P' }
    ],
    [t.menu.view]: [
      { label: t.menu.reload, action: 'reload', shortcut: 'Ctrl+R' },
      { label: t.menu.toggleDevTools, action: 'toggle-devtools', shortcut: 'Ctrl+Shift+I' },
      { type: 'separator' },
      { label: t.menu.toggleFullscreen, action: 'toggleFullscreen', shortcut: 'F11' }
    ],
    [t.menu.tools]: [
      { label: t.menu.settings, action: 'open-settings', shortcut: 'Ctrl+,' }
    ],
    [t.menu.help]: [
      { label: t.menu.documentation, action: 'documentation' },
      { label: t.menu.checkForUpdates || 'Check for Updates', action: 'check-for-updates' },
      { type: 'separator' },
      { label: t.menu.about, action: 'about' }
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
    } else if (action === 'toggle-devtools') {
      if (window.electronAPI && window.electronAPI.toggleDevTools) {
        window.electronAPI.toggleDevTools();
      }
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
      height: '56px',
      backgroundColor: c.panel,
      borderBottom: `1px solid ${c.border}`,
      padding: '0 12px',
      gap: '4px',
      position: 'relative',
      userSelect: 'none',
      WebkitAppRegion: 'drag' // Make draggable on Windows
    }
  },
    // App icon and name
    React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginRight: '12px',
        WebkitAppRegion: 'no-drag'
      }
    },
      // Icon
      React.createElement('img', {
        src: '../icons/IconInvertedNoBGGlow.png',
        alt: 'SurfaceExpert',
        style: {
          width: '36px',
          height: '36px',
          objectFit: 'contain'
        }
      }),
      // Program name
      React.createElement('span', {
        style: {
          fontSize: '16px',           // Slightly larger for hierarchy
          fontWeight: '600',          // Bolder
          color: c.text,
          // Prioritize Inter, then nice system fonts
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: '-0.5px',    // Tighter tracking looks more professional
          textShadow: '0 1px 2px rgba(0,0,0,0.2)' // Subtle depth
        }
      }, 'SurfaceExpert')
    ),

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
