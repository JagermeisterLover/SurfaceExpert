// DataView component - Displays tabular data for a selected metric
// Shows radial coordinate vs. selected value (sag, slope, asphericity, aberration)

import { calculateSurfaceValues } from '../../utils/calculations.js';
import { formatValue } from '../../utils/formatters.js';
import { parseNumber } from '../../utils/numberParsing.js';

const { createElement: h } = React;

export const DataView = ({ activeTab, selectedSurface, c, t }) => {
    if (!selectedSurface) return null;

    const generateTabData = () => {
        const minHeight = parseNumber(selectedSurface.parameters['Min Height']);
        const maxHeight = parseNumber(selectedSurface.parameters['Max Height']);
        const step = parseNumber(selectedSurface.parameters['Step']);
        const data = [];

        for (let r = minHeight; r < maxHeight; r += step) {
            // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
            let values;
            if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                const scanAngle = parseNumber(selectedSurface.parameters['Scan Angle']);
                const scanAngleRad = scanAngle * Math.PI / 180;
                const x = r * Math.cos(scanAngleRad);
                const y = r * Math.sin(scanAngleRad);
                values = calculateSurfaceValues(r, selectedSurface, x, y);
            } else {
                values = calculateSurfaceValues(r, selectedSurface);
            }

            let value = 0;
            if (activeTab === 'sag') value = values.sag;
            else if (activeTab === 'slope') value = values.slope;
            else if (activeTab === 'asphericity') value = values.asphericity;
            else if (activeTab === 'aberration') value = values.aberration;

            data.push({
                r: r.toFixed(7),
                value: formatValue(value)
            });
        }

        // Always include maxHeight
        let values;
        if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
            const scanAngle = parseNumber(selectedSurface.parameters['Scan Angle']);
            const scanAngleRad = scanAngle * Math.PI / 180;
            const x = maxHeight * Math.cos(scanAngleRad);
            const y = maxHeight * Math.sin(scanAngleRad);
            values = calculateSurfaceValues(maxHeight, selectedSurface, x, y);
        } else {
            values = calculateSurfaceValues(maxHeight, selectedSurface);
        }
        let value = 0;
        if (activeTab === 'sag') value = values.sag;
        else if (activeTab === 'slope') value = values.slope;
        else if (activeTab === 'asphericity') value = values.asphericity;
        else if (activeTab === 'aberration') value = values.aberration;
        data.push({
            r: maxHeight.toFixed(7),
            value: formatValue(value)
        });

        return data;
    };

    const data = generateTabData();
    const columnName = t.visualization.tabs[activeTab] || activeTab;
    const unit = activeTab === 'slope' ? t.summary.units.rad : t.summary.units.mm;

    return h('div', { style: { padding: '20px' } },
        h('h3', { style: { marginBottom: '20px', fontSize: '16px' } },
            `${t.dataView.title} - ${columnName}`
        ),
        h('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
            }
        },
            h('thead', null,
                h('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, t.visualization.radialCoordinate),
                    h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${columnName} (${unit})`)
                )
            ),
            h('tbody', null,
                data.map((row, idx) =>
                    h('tr', { key: idx, style: { borderBottom: `1px solid ${c.border}` } },
                        h('td', { style: { padding: '8px', textAlign: 'right' } }, row.r),
                        h('td', { style: { padding: '8px', textAlign: 'right' } }, row.value)
                    )
                )
            )
        )
    );
};
