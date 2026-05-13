const { createElement: h } = React;

export const PropertiesPanel = ({ selectedItem, c }) => {
    return h('div', {
        style: {
            width: '280px', backgroundColor: c.panel,
            borderLeft: `1px solid ${c.border}`,
            display: 'flex', flexDirection: 'column'
        }
    },
        h('div', {
            style: {
                padding: '12px', borderBottom: `1px solid ${c.border}`,
                fontSize: '13px', fontWeight: 'bold', color: c.text
            }
        }, 'Properties'),
        h('div', {
            style: {
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.textDim, fontSize: '13px', padding: '20px', textAlign: 'center'
            }
        },
            selectedItem
                ? h('div', null, `Selected: ${selectedItem.name}`)
                : h('div', null, 'No item selected')
        )
    );
};
