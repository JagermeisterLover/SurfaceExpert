/**
 * Update notification dialog component
 * Displays available update information with download link
 */

export function UpdateDialog({ c, t, updateInfo, onClose, onDownload }) {
  const { createElement: h } = React;

  if (!updateInfo || !updateInfo.available) {
    return null;
  }

  // Translation texts with fallbacks
  const texts = {
    title: t?.update?.title || 'Update Available',
    currentVersion: t?.update?.currentVersion || 'Current Version',
    latestVersion: t?.update?.latestVersion || 'Latest Version',
    released: t?.update?.released || 'Released',
    whatsNew: t?.update?.whatsNew || 'What\'s New',
    later: t?.update?.later || 'Later',
    download: t?.update?.download || 'Download Update'
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return h('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    },
    onClick: onClose
  },
    h('div', {
      style: {
        backgroundColor: c.panel,
        border: `1px solid ${c.border}`,
        borderRadius: '12px',
        padding: '32px',
        minWidth: '500px',
        maxWidth: '600px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      },
      onClick: (e) => e.stopPropagation()
    },
      // Title with icon
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          marginBottom: '16px'
        }
      },
        h('div', {
          style: {
            fontSize: '32px',
            marginRight: '12px'
          }
        }, '🎉'),
        h('h2', {
          style: {
            margin: 0,
            color: c.text,
            fontSize: '24px',
            fontWeight: '600',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }
        }, texts.title)
      ),

      // Version info
      h('div', {
        style: {
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: c.bg,
          borderRadius: '8px',
          border: `1px solid ${c.border}`
        }
      },
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }
        },
          h('span', {
            style: {
              color: c.textDim,
              fontSize: '14px'
            }
          }, `${texts.currentVersion}:`),
          h('span', {
            style: {
              color: c.text,
              fontSize: '14px',
              fontWeight: '600'
            }
          }, `v${updateInfo.currentVersion}`)
        ),
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between'
          }
        },
          h('span', {
            style: {
              color: c.textDim,
              fontSize: '14px'
            }
          }, `${texts.latestVersion}:`),
          h('span', {
            style: {
              color: '#4ade80',
              fontSize: '14px',
              fontWeight: '600'
            }
          }, `v${updateInfo.latestVersion}`)
        )
      ),

      // Release date
      h('div', {
        style: {
          color: c.textDim,
          fontSize: '13px',
          marginBottom: '16px'
        }
      }, `${texts.released}: ${formatDate(updateInfo.releaseDate)}`),

      // Release notes preview
      updateInfo.releaseNotes && h('div', {
        style: {
          marginBottom: '24px'
        }
      },
        h('div', {
          style: {
            color: c.text,
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }
        }, `${texts.whatsNew}:`),
        h('div', {
          style: {
            color: c.textDim,
            fontSize: '13px',
            maxHeight: '150px',
            overflowY: 'auto',
            padding: '12px',
            backgroundColor: c.bg,
            borderRadius: '6px',
            border: `1px solid ${c.border}`,
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }
        }, updateInfo.releaseNotes.substring(0, 500) + (updateInfo.releaseNotes.length > 500 ? '...' : ''))
      ),

      // Divider
      h('div', {
        style: {
          height: '1px',
          backgroundColor: c.border,
          margin: '24px 0'
        }
      }),

      // Action buttons
      h('div', {
        style: {
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }
      },
        // Later button
        h('button', {
          onClick: onClose,
          style: {
            padding: '10px 24px',
            backgroundColor: c.bg,
            color: c.text,
            border: `1px solid ${c.border}`,
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transition: 'background-color 0.15s'
          },
          onMouseEnter: (e) => {
            e.target.style.backgroundColor = c.hover;
          },
          onMouseLeave: (e) => {
            e.target.style.backgroundColor = c.bg;
          }
        }, texts.later),

        // Download button
        h('button', {
          onClick: onDownload,
          style: {
            padding: '10px 24px',
            backgroundColor: c.accent,
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: 'system-ui, -apple-system, sans-serif',
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
    )
  );
}
