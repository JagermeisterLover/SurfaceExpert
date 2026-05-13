const { createElement: h } = React;

export const VisualizationPanel = ({ activeTab, setActiveTab, c }) => {
    const tabs = ['Overview', 'Details', 'Analysis'];

    return h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
        h('div', {
            style: {
                display: 'flex', backgroundColor: c.panel,
                borderBottom: `1px solid ${c.border}`,
                gap: '2px', padding: '8px 8px 0 8px'
            }
        },
            tabs.map(tab =>
                h('div', {
                    key: tab,
                    onClick: () => setActiveTab(tab),
                    style: {
                        padding: '8px 16px', cursor: 'pointer',
                        backgroundColor: activeTab === tab ? c.bg : 'transparent',
                        borderTopLeftRadius: '4px', borderTopRightRadius: '4px',
                        borderBottom: activeTab === tab ? 'none' : `1px solid ${c.border}`,
                        fontSize: '13px',
                        fontWeight: activeTab === tab ? '600' : '400',
                        color: activeTab === tab ? c.text : c.textDim,
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => { if (activeTab !== tab) e.currentTarget.style.backgroundColor = c.hover; },
                    onMouseLeave: (e) => { if (activeTab !== tab) e.currentTarget.style.backgroundColor = 'transparent'; }
                }, tab)
            )
        ),
        h('div', {
            style: {
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.textDim, fontSize: '14px', flexDirection: 'column', gap: '12px'
            }
        },
            h('div', { style: { fontSize: '48px', opacity: 0.3 } }, '◻'),
            h('div', null, `${activeTab} — no content yet`)
        )
    );
};
