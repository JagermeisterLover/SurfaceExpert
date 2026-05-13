import { getPaletteNames } from '../../constants/colorPalettes.js';
import { availableLocales } from '../../constants/locales.js';

const { createElement: h } = React;

export const SettingsModal = ({ theme, setTheme, locale, setLocale, onClose, c, t }) => {
    return h('div', {
        style: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }
    },
        h('div', {
            style: {
                backgroundColor: c.panel, borderRadius: '8px', padding: '24px',
                width: '400px', maxHeight: '85vh', overflow: 'auto',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)', border: `1px solid ${c.border}`
            }
        },
            h('h2', { style: { marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: c.text } },
                t.settings.title),
            h('div', { style: { marginBottom: '20px' } },
                h('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: c.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' } },
                    t.settings.colorTheme),
                h('select', {
                    value: theme,
                    onChange: (e) => setTheme(e.target.value),
                    style: { width: '100%', padding: '10px', backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: '6px', fontSize: '13px' }
                },
                    getPaletteNames().map(name => h('option', { key: name, value: name }, name))
                )
            ),
            h('div', { style: { marginBottom: '20px' } },
                h('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: c.textDim, textTransform: 'uppercase', letterSpacing: '0.5px' } },
                    t.settings.language),
                h('select', {
                    value: locale,
                    onChange: (e) => setLocale(e.target.value),
                    style: { width: '100%', padding: '10px', backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: '6px', fontSize: '13px' }
                },
                    availableLocales.map(loc => h('option', { key: loc.code, value: loc.code }, loc.name))
                )
            ),
            h('div', { style: { display: 'flex', justifyContent: 'flex-end' } },
                h('button', {
                    onClick: onClose,
                    style: { padding: '10px 24px', backgroundColor: c.accent, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }
                }, 'Close')
            )
        )
    );
};
