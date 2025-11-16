import { formatValue, degreesToDMS } from '../utils/formatters.js';
import { calculateSurfaceValues } from '../utils/calculations.js';

const SummaryView = ({ selectedSurface, c }) => {
    if (!selectedSurface) return null;

    // Generate data table for summary
    const generateDataTable = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const step = parseFloat(selectedSurface.parameters['Step']) || 1;
        const data = [];

        for (let r = minHeight; r < maxHeight; r += step) {
            // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
            let values;
            if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
                const scanAngleRad = scanAngle * Math.PI / 180;
                const x = r * Math.cos(scanAngleRad);
                const y = r * Math.sin(scanAngleRad);
                values = calculateSurfaceValues(r, selectedSurface, x, y);
            } else {
                values = calculateSurfaceValues(r, selectedSurface);
            }
            data.push({
                r: r.toFixed(7),
                sag: formatValue(values.sag),
                slope: formatValue(values.slope),
                angle: formatValue(values.angle),
                angleDMS: degreesToDMS(values.angle),
                asphericity: formatValue(values.asphericity),
                aberration: formatValue(values.aberration)
            });
        }

        // Always include maxHeight
        let values;
        if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
            const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
            const scanAngleRad = scanAngle * Math.PI / 180;
            const x = maxHeight * Math.cos(scanAngleRad);
            const y = maxHeight * Math.sin(scanAngleRad);
            values = calculateSurfaceValues(maxHeight, selectedSurface, x, y);
        } else {
            values = calculateSurfaceValues(maxHeight, selectedSurface);
        }
        data.push({
            r: maxHeight.toFixed(7),
            sag: formatValue(values.sag),
            slope: formatValue(values.slope),
            angle: formatValue(values.angle),
            angleDMS: degreesToDMS(values.angle),
            asphericity: formatValue(values.asphericity),
            aberration: formatValue(values.aberration)
        });

        return data;
    };

    const dataTable = generateDataTable();

    // Calculate max values
    const maxSag = Math.max(...dataTable.map(row => parseFloat(row.sag)));
    const maxSlope = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.slope))));
    const maxAngle = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.angle))));
    const maxAsphericity = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.asphericity))));
    const maxAberration = Math.max(...dataTable.map(row => Math.abs(parseFloat(row.aberration))));

    // Calculate best fit sphere
    const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
    const sagAtMax = calculateSurfaceValues(maxHeight, selectedSurface).sag;
    let bestFitSphere = 0;

    if (minHeight === 0) {
        bestFitSphere = SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, sagAtMax);
    } else {
        const sagAtMin = calculateSurfaceValues(minHeight, selectedSurface).sag;
        const result = SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, sagAtMin, sagAtMax);
        bestFitSphere = result.R4;
    }

    // Calculate max asphericity gradient
    let maxAsphGradient = 0;
    if (dataTable.length > 1) {
        for (let i = 1; i < dataTable.length; i++) {
            const dr = parseFloat(dataTable[i].r) - parseFloat(dataTable[i-1].r);
            const dAsph = Math.abs(parseFloat(dataTable[i].asphericity) - parseFloat(dataTable[i-1].asphericity));
            const gradient = dAsph / dr;
            if (gradient > maxAsphGradient) maxAsphGradient = gradient;
        }
    }

    // Calculate F/# (paraxial and working)
    const R = parseFloat(selectedSurface.parameters['Radius']) || 0;
    const paraxialFNum = R !== 0 ? Math.abs(R / (2 * maxHeight)) : 0;
    const workingFNum = maxSlope !== 0 ? 1 / (2 * maxSlope) : 0;

    // Calculate single-point sag for non-rotationally symmetric surfaces
    const isNonRotSymmetric = selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular';
    let singlePointSag = null;
    let xCoord = 0, yCoord = 0;
    if (isNonRotSymmetric) {
        xCoord = parseFloat(selectedSurface.parameters['X Coordinate']) || 0;
        yCoord = parseFloat(selectedSurface.parameters['Y Coordinate']) || 0;
        const r = Math.sqrt(xCoord * xCoord + yCoord * yCoord);
        const values = calculateSurfaceValues(r, selectedSurface, xCoord, yCoord);
        singlePointSag = values.sag;
    }

    return React.createElement('div', { style: { padding: '20px' } },
        // Single-point sag section for non-rotationally symmetric surfaces
        isNonRotSymmetric && React.createElement('div', { style: { marginBottom: '30px' } },
            React.createElement('h3', { style: { marginBottom: '15px', fontSize: '16px' } }, 'Single Point Calculation'),
            React.createElement('table', {
                style: {
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    marginBottom: '10px',
                    backgroundColor: c.panel,
                    border: `2px solid ${c.accent}`
                }
            },
                React.createElement('thead', null,
                    React.createElement('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                        React.createElement('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, 'Coordinate'),
                        React.createElement('th', { style: { padding: '10px', textAlign: 'right' } }, 'Value'),
                        React.createElement('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, 'Unit')
                    )
                ),
                React.createElement('tbody', null,
                    React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '10px' } }, 'X Coordinate'),
                        React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(xCoord)),
                        React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    ),
                    React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '10px' } }, 'Y Coordinate'),
                        React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(yCoord)),
                        React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    ),
                    React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}`, backgroundColor: c.hover } },
                        React.createElement('td', { style: { padding: '10px', fontWeight: 'bold' } }, 'Sag at (X, Y)'),
                        React.createElement('td', { style: { padding: '10px', textAlign: 'right', fontWeight: 'bold' } }, formatValue(singlePointSag)),
                        React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    )
                )
            )
        ),
        React.createElement('h3', { style: { marginBottom: '20px', fontSize: '16px' } }, 'Surface Summary'),
        React.createElement('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                marginBottom: '30px'
            }
        },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, 'Property'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'right' } }, 'Value'),
                    React.createElement('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, 'Unit')
                )
            ),
            React.createElement('tbody', null,
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Height Range'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } },
                        `${selectedSurface.parameters['Min Height']} - ${selectedSurface.parameters['Max Height']}`
                    ),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Paraxial F/#'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(paraxialFNum)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Working F/#'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(workingFNum)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Sag'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSag)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Slope'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSlope)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'rad')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Angle'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAngle)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '°')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Angle DMS'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, degreesToDMS(maxAngle)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Asphericity'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphericity)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Asph. Gradient'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphGradient)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, '/mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Best Fit Sphere'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(bestFitSphere)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && React.createElement('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    React.createElement('td', { style: { padding: '10px' } }, 'Max Aberration'),
                    React.createElement('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAberration)),
                    React.createElement('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                )
            )
        ),

        // Detailed data table
        React.createElement('h3', { style: { marginBottom: '15px', marginTop: '20px', fontSize: '16px' } }, 'Detailed Analysis'),
        React.createElement('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
            }
        },
            React.createElement('thead', null,
                React.createElement('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Height (mm)'),
                    React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Sag (mm)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Slope (rad)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle (°)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle DMS'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Asphericity (mm)'),
                    !isNonRotSymmetric && React.createElement('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Aberration (mm)')
                )
            ),
            React.createElement('tbody', null,
                dataTable.map((row, idx) =>
                    React.createElement('tr', { key: idx, style: { borderBottom: `1px solid ${c.border}` } },
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.r),
                        React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.sag),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.slope),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.angle),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.angleDMS),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.asphericity),
                        !isNonRotSymmetric && React.createElement('td', { style: { padding: '8px', textAlign: 'right' } }, row.aberration)
                    )
                )
            )
        )
    );
};

export default SummaryView;
