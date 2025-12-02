/**
 * Update notification component (VS Code style)
 * Non-modal notification that appears in the bottom-right corner
 * Shows when an update is available and can be dismissed
 */

export function UpdateNotification({ c, t, updateInfo, onClose, onDownload }) {
  const { createElement: h, useState, useEffect } = React;
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Slide in animation on mount
  useEffect(() => {
    if (updateInfo && updateInfo.available) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [updateInfo]);

  if (!updateInfo || !updateInfo.available) {
    return null;
  }

  // Translation texts with fallbacks
  const texts = {
    title: t?.update?.title || 'Update Available',
    currentVersion: t?.update?.currentVersion || 'Current',
    latestVersion: t?.update?.latestVersion || 'Latest',
    download: t?.update?.download || 'Download',
    releaseNotes: t?.update?.releaseNotes || 'Release Notes'
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 200);
  };

  const handleDownload = () => {
    onDownload();
    handleClose();
  };

  return h('div', {
    style: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      width: '380px',
      backgroundColor: c.panel,
      border: `1px solid ${c.border}`,
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      zIndex: 9999,
      transform: isClosing
        ? 'translateX(400px)'
        : isVisible
          ? 'translateX(0)'
          : 'translateX(400px)',
      opacity: isVisible && !isClosing ? 1 : 0,
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }
  },
    // Header with title and close button
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: `1px solid ${c.border}`,
        backgroundColor: c.bg
      }
    },
      // Title
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center'
        }
      },
        h('span', {
          style: {
            color: c.text,
            fontSize: '14px',
            fontWeight: '600'
          }
        }, texts.title)
      ),

      // Close button
      h('button', {
        onClick: handleClose,
        style: {
          background: 'none',
          border: 'none',
          color: c.textDim,
          cursor: 'pointer',
          padding: '4px 8px',
          fontSize: '18px',
          lineHeight: '1',
          borderRadius: '4px',
          transition: 'background-color 0.15s, color 0.15s'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = c.hover;
          e.target.style.color = c.text;
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = c.textDim;
        }
      }, '×')
    ),

    // Content
    h('div', {
      style: {
        padding: '16px'
      }
    },
      // Version comparison
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }
      },
        // Current version
        h('div', {
          style: {
            flex: 1,
            textAlign: 'center'
          }
        },
          h('div', {
            style: {
              fontSize: '11px',
              color: c.textDim,
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }
          }, texts.currentVersion),
          h('div', {
            style: {
              fontSize: '16px',
              color: c.text,
              fontWeight: '600',
              fontFamily: 'monospace'
            }
          }, `v${updateInfo.currentVersion}`)
        ),

        // Arrow
        h('div', {
          style: {
            color: c.textDim,
            fontSize: '18px'
          }
        }, '→'),

        // Latest version
        h('div', {
          style: {
            flex: 1,
            textAlign: 'center'
          }
        },
          h('div', {
            style: {
              fontSize: '11px',
              color: c.textDim,
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }
          }, texts.latestVersion),
          h('div', {
            style: {
              fontSize: '16px',
              color: '#4ade80',
              fontWeight: '600',
              fontFamily: 'monospace'
            }
          }, `v${updateInfo.latestVersion}`)
        )
      ),

      // Release notes preview (if available)
      updateInfo.releaseNotes && h('div', {
        style: {
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: c.bg,
          borderRadius: '4px',
          border: `1px solid ${c.border}`
        }
      },
        h('div', {
          style: {
            fontSize: '11px',
            color: c.textDim,
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }
        }, texts.releaseNotes),
        h('div', {
          style: {
            fontSize: '12px',
            color: c.textDim,
            maxHeight: '60px',
            overflowY: 'auto',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }
        }, updateInfo.releaseNotes.substring(0, 150) + (updateInfo.releaseNotes.length > 150 ? '...' : ''))
      ),

      // Action button
      h('button', {
        onClick: handleDownload,
        style: {
          width: '100%',
          padding: '8px 16px',
          backgroundColor: c.accent,
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'background-color 0.15s'
        },
        onMouseEnter: (e) => {
          e.target.style.backgroundColor = '#5ba0f2';
        },
        onMouseLeave: (e) => {
          e.target.style.backgroundColor = c.accent;
        }
      }, texts.download)
    )
  );
}
