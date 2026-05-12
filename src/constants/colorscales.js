// Available colorscales for plots
// Built-in colorscales from Plotly.js 3.3.0
// Note: Plotly.js colorscale names are case-sensitive - use exact capitalization

export const colorscales = [
    // Custom
    'Zygo',

    // Perceptually Uniform Sequential
    'Viridis',
    'Cividis',

    // Sequential - Single Hue
    'Blues',
    'Greens',
    'Greys',
    'Reds',
    'YlGnBu',
    'YlOrRd',

    // Sequential - Multi Hue
    'Bluered',
    'Jet',
    'Hot',
    'Blackbody',
    'Earth',
    'Electric',
    'Portland',
    'Rainbow',

    // Diverging
    'RdBu',
    'Picnic'
];

// Zygo colorscale: interferogram-style gradient (blue → green → yellow → red)
// Blue occupies 0.00–0.25 (~25% of range); remaining stops compressed into 0.25–1.00
const ZYGO_COLORSCALE = [
    [0.000, '#0000ff'],
    [0.125, '#0003fc'],
    [0.200, '#003ac5'],
    [0.299, '#007887'],
    [0.348, '#00cb34'],
    [0.397, '#00ea15'],
    [0.446, '#00f906'],
    [0.495, '#7aff00'],
    [0.544, '#cdff00'],
    [0.593, '#fff500'],
    [0.642, '#ffcc00'],
    [0.691, '#ff8100'],
    [0.720, '#ff6600'],
    [0.750, '#ff4300'],
    [0.799, '#ff3500'],
    [0.848, '#ff0400'],
    [0.897, '#ff1f1f'],
    [0.949, '#ff5d5d'],
    [1.000, '#ff6565']
];

/**
 * Resolve a colorscale name to the value Plotly accepts.
 * Built-in names are passed through as strings.
 * 'Zygo' is resolved to its array definition.
 * @param {string} name - colorscale name from the colorscales list
 * @returns {string|Array} - string name or [[pos, color], ...] array
 */
export const resolveColorscale = (name) => {
    if (name === 'Zygo') return ZYGO_COLORSCALE;
    return name;
};

