// SurfaceActionButtons - Action buttons for surface transformations
// Displays buttons at the bottom of properties panel based on surface type

const { createElement: h } = React;

/**
 * Surface Action Buttons Component
 * @param {Object} props
 * @param {Object} props.surface - Current surface object
 * @param {Function} props.onInvert - Callback for invert action
 * @param {Function} props.onNormalizeUnZ - Callback for normalize UnZ action
 * @param {Function} props.onConvertToUnZ - Callback for Poly → UnZ conversion
 * @param {Function} props.onConvertToPoly - Callback for UnZ → Poly conversion
 * @param {Object} props.c - Color scheme object
 */
export const SurfaceActionButtons = ({ surface, onInvert, onNormalizeUnZ, onConvertToUnZ, onConvertToPoly, onFlipX, onFlipY, onFlipZ, onRotate90CCW, onRotate90CW, onCopyCoefficients, c, t }) => {
    const buttonStyle = {
        padding: '8px 16px',
        backgroundColor: c.accent,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '600',
        marginRight: '8px',
        marginBottom: '8px'
    };

    const buttonHoverStyle = {
        ...buttonStyle,
        backgroundColor: '#3a7bc8'
    };

    return h('div', {
        style: {
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
        }
    },
        // Invert button - shown for all surfaces
        h('button', {
            onClick: onInvert,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.invert
        }, t.properties.invert),

        // Normalize to H button - shown only for Opal Un Z
        surface.type === 'Opal Un Z' && h('button', {
            onClick: onNormalizeUnZ,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.normalize
        }, t.properties.normalize),

        // Convert to UnZ button - shown only for Poly
        surface.type === 'Poly' && h('button', {
            onClick: onConvertToUnZ,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.convertToUnZ
        }, t.properties.convertToUnZ),

        // Flip and Copy buttons - shown only for Zernike
        surface.type === 'Zernike' && h('button', {
            onClick: onFlipX,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.flipX
        }, t.properties.flipX),

        surface.type === 'Zernike' && h('button', {
            onClick: onFlipY,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.flipY
        }, t.properties.flipY),

        surface.type === 'Zernike' && h('button', {
            onClick: onFlipZ,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.flipZ
        }, t.properties.flipZ),

        surface.type === 'Zernike' && h('button', {
            onClick: onRotate90CCW,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.rotate90CCW
        }, t.properties.rotate90CCW),

        surface.type === 'Zernike' && h('button', {
            onClick: onRotate90CW,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.rotate90CW
        }, t.properties.rotate90CW),

        surface.type === 'Zernike' && h('button', {
            onClick: onCopyCoefficients,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.copyCoefficients
        }, t.properties.copyCoefficients),

                // Convert to Poly button - shown only for Opal Un Z
        surface.type === 'Opal Un Z' && h('button', {
            onClick: onConvertToPoly,
            style: buttonStyle,
            onMouseEnter: (e) => e.target.style.backgroundColor = '#3a7bc8',
            onMouseLeave: (e) => e.target.style.backgroundColor = c.accent,
            title: t.properties.tooltips.convertToPoly
        }, t.properties.convertToPoly)
    );
};
