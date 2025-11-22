/**
 * Custom title bar component
 * Replaces the default OS title bar with minimize, maximize, and close buttons
 */

export function TitleBar({ c, onWindowControl }) {
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
    // Listen for maximize/unmaximize events from main process
    if (window.electronAPI) {
      if (window.electronAPI.onWindowMaximized) {
        window.electronAPI.onWindowMaximized(() => setIsMaximized(true));
      }
      if (window.electronAPI.onWindowUnmaximized) {
        window.electronAPI.onWindowUnmaximized(() => setIsMaximized(false));
      }
    }
  }, []);

  const handleMinimize = () => {
    onWindowControl('minimize');
  };

  const handleMaximize = () => {
    onWindowControl('maximize');
  };

  const handleClose = () => {
    onWindowControl('close');
  };

  return React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '32px',
      backgroundColor: c.bg,
      borderBottom: `1px solid ${c.border}`,
      WebkitAppRegion: 'drag',
      userSelect: 'none'
    }
  },
    // Left side - empty for now
    React.createElement('div', {
      style: { width: '48px' }
    }),

    // Center - Title
    React.createElement('div', {
      style: {
        fontSize: '13px',
        fontWeight: '500',
        color: c.text,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '0.3px'
      }
    }, 'SurfaceExpert'),

    // Right side - Window controls
    React.createElement('div', {
      style: {
        display: 'flex',
        height: '100%',
        WebkitAppRegion: 'no-drag'
      }
    },
      // Minimize button
      React.createElement('button', {
        onClick: handleMinimize,
        style: {
          width: '46px',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
          color: c.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s',
          outline: 'none'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = c.hover;
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
        }
      },
        // Minimize icon (horizontal line)
        React.createElement('svg', {
          width: '12',
          height: '12',
          viewBox: '0 0 12 12',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg'
        },
          React.createElement('path', {
            d: 'M0 6h12',
            stroke: 'currentColor',
            strokeWidth: '1'
          })
        )
      ),

      // Maximize/Restore button
      React.createElement('button', {
        onClick: handleMaximize,
        style: {
          width: '46px',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
          color: c.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s',
          outline: 'none'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = c.hover;
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
        }
      },
        // Maximize/Restore icon
        isMaximized
          ? // Restore icon (two overlapping squares)
            React.createElement('svg', {
              width: '12',
              height: '12',
              viewBox: '0 0 12 12',
              fill: 'none',
              xmlns: 'http://www.w3.org/2000/svg'
            },
              React.createElement('path', {
                d: 'M3 3v6h6V3H3z M3 2h6v1H3V2z M2 3h1v6H2V3z',
                fill: 'currentColor'
              })
            )
          : // Maximize icon (square)
            React.createElement('svg', {
              width: '12',
              height: '12',
              viewBox: '0 0 12 12',
              fill: 'none',
              xmlns: 'http://www.w3.org/2000/svg'
            },
              React.createElement('rect', {
                x: '2',
                y: '2',
                width: '8',
                height: '8',
                stroke: 'currentColor',
                strokeWidth: '1',
                fill: 'none'
              })
            )
      ),

      // Close button
      React.createElement('button', {
        onClick: handleClose,
        style: {
          width: '46px',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
          color: c.text,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.15s',
          outline: 'none'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = '#e81123';
          e.target.style.color = '#ffffff';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = c.text;
        }
      },
        // Close icon (X)
        React.createElement('svg', {
          width: '12',
          height: '12',
          viewBox: '0 0 12 12',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg'
        },
          React.createElement('path', {
            d: 'M1 1l10 10M11 1L1 11',
            stroke: 'currentColor',
            strokeWidth: '1',
            strokeLinecap: 'round'
          })
        )
      )
    )
  );
}
