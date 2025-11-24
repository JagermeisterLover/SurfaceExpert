// ============================================
// VisualizationPanel Component
// ============================================
// Center panel showing tabs, plots, and data views

import { SummaryView } from '../views/SummaryView.js';
import { DataView } from '../views/DataView.js';

const { createElement: h } = React;

export const VisualizationPanel = ({
    selectedSurface,
    activeTab,
    setActiveTab,
    activeSubTab,
    setActiveSubTab,
    plotRef,
    wavelength,
    c,
    t
}) => {
    return h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
        // Main Tabs
        h('div', {
            style: {
                display: 'flex',
                backgroundColor: c.panel,
                borderBottom: `1px solid ${c.border}`,
                gap: '2px',
                padding: '8px 8px 0 8px'
            }
        },
            (selectedSurface && (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike')
                ? ['summary', 'sag']  // Non-rotationally symmetric surfaces only support sag
                : ['summary', 'sag', 'slope', 'asphericity', 'aberration']
            ).map(tab =>
                h('div', {
                    key: tab,
                    onClick: () => {
                        setActiveTab(tab);
                        if (tab !== 'summary') setActiveSubTab('3d');
                    },
                    style: {
                        padding: '8px 16px',
                        cursor: 'pointer',
                        backgroundColor: activeTab === tab ? c.bg : 'transparent',
                        borderTopLeftRadius: '4px',
                        borderTopRightRadius: '4px',
                        borderBottom: activeTab === tab ? 'none' : `1px solid ${c.border}`,
                        fontSize: '13px',
                        fontWeight: activeTab === tab ? '600' : '400',
                        color: activeTab === tab ? c.text : c.textDim,
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        if (activeTab !== tab) {
                            e.currentTarget.style.backgroundColor = c.hover;
                        }
                    },
                    onMouseLeave: (e) => {
                        if (activeTab !== tab) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }
                }, t.visualization.tabs[tab])
            )
        ),

        // Sub-tabs for non-summary tabs
        activeTab !== 'summary' && h('div', {
            style: {
                display: 'flex',
                backgroundColor: c.bg,
                borderBottom: `1px solid ${c.border}`,
                gap: '2px',
                padding: '4px 8px'
            }
        },
            ['3d', '2d', 'cross', 'data'].map(subTab =>
                h('div', {
                    key: subTab,
                    onClick: () => setActiveSubTab(subTab),
                    style: {
                        padding: '6px 12px',
                        cursor: 'pointer',
                        backgroundColor: activeSubTab === subTab ? c.panel : 'transparent',
                        borderRadius: '3px',
                        fontSize: '12px',
                        fontWeight: activeSubTab === subTab ? '500' : '400',
                        color: activeSubTab === subTab ? c.text : c.textDim,
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        if (activeSubTab !== subTab) {
                            e.currentTarget.style.backgroundColor = c.hover;
                        }
                    },
                    onMouseLeave: (e) => {
                        if (activeSubTab !== subTab) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }
                    }
                }, subTab === 'cross' ? t.visualization.subtabs.crossSection : t.visualization.subtabs[subTab])
            )
        ),

        // Content Area
        h('div', { style: { flex: 1, overflow: 'auto', backgroundColor: c.bg } },
            !selectedSurface ?
                h('div', {
                    style: {
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '12px',
                        color: c.textDim,
                        fontSize: '16px'
                    }
                },
                    h('div', null, 'Select a surface or create a new one')
                ) :
                activeTab === 'summary' ?
                    h(SummaryView, { selectedSurface, wavelength, c, t }) :
                    activeSubTab === 'data' ?
                        h(DataView, { activeTab, selectedSurface, c, t }) :
                        h('div', { ref: plotRef, style: { width: '100%', height: '100%' } })
        )
    );
};
