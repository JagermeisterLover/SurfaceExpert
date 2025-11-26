/**
 * Update badge component (VS Code style)
 * Shows a small badge in the bottom-left corner when an update is available
 */

export function UpdateBadge({ c, t, updateInfo, onClick }) {
  const { createElement: h } = React;

  if (!updateInfo || !updateInfo.available) {
    return null;
  }

  const text = t?.update?.badgeText || 'Update available';

  return h('div', {
    onClick: onClick,
    style: {
      position: 'fixed',
      bottom: '8px',
      left: '8px',
      backgroundColor: c.accent,
      color: '#ffffff',
      padding: '8px 16px',
      borderRadius: '16px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none'
    },
    onMouseEnter: (e) => {
      e.target.style.transform = 'translateY(-2px)';
      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
    },
    onMouseLeave: (e) => {
      e.target.style.transform = 'translateY(0)';
      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    }
  },
    // Update icon
    h('span', {
      style: {
        fontSize: '16px'
      }
    }, '⬆️'),
    // Text
    h('span', null, `${text}: v${updateInfo.latestVersion}`)
  );
}
