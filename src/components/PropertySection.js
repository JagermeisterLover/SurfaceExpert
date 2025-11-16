const PropertySection = ({ title, children, c }) => (
    React.createElement('div', { style: { marginBottom: '14px' } },
        React.createElement('div', {
            style: {
                fontSize: '11px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                color: c.textDim,
                marginBottom: '8px',
                letterSpacing: '0.5px'
            }
        }, title),
        children
    )
);

const PropertyRow = ({ label, value, editable, c }) => (
    React.createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontSize: '12px'
        }
    },
        React.createElement('span', { style: { color: c.textDim } }, label + ':'),
        editable ?
            React.createElement('input', {
                type: 'text',
                defaultValue: value,
                style: {
                    width: '110px',
                    padding: '4px 6px',
                    backgroundColor: c.bg,
                    color: c.text,
                    border: `1px solid ${c.border}`,
                    borderRadius: '3px',
                    fontSize: '12px',
                    textAlign: 'right'
                }
            }) :
            React.createElement('span', { style: { fontWeight: '500', fontSize: '12px' } }, value)
    )
);

// Export both components using ES6 modules
export { PropertySection, PropertyRow };
