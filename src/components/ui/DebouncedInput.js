const { createElement: h } = React;
const { useState, useEffect, useRef } = React;

/**
 * DebouncedInput - Input component that prevents UI freezing during typing
 * Maintains local state and only propagates changes on blur or Enter key
 *
 * Features:
 * - Local state prevents re-renders from interrupting typing
 * - Press Enter to save and move to next input (if onEnterKey provided)
 * - Immediate save on blur
 * - No auto-save while typing - user stays in control
 */
const DebouncedInput = ({ value, onChange, onBlur, onEnterKey, debounceMs = 500, style, ...props }) => {
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const isNavigatingRef = useRef(false);

    // Update local value when prop value changes (external update)
    // but only if the input is not currently focused (being edited by user)
    useEffect(() => {
        if (!isFocused) {
            setLocalValue(value);
        }
    }, [value, isFocused]);

    const handleFocus = (e) => {
        setIsFocused(true);
    };

    const handleChange = (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        // No auto-save - only save on blur or Enter
    };

    const handleBlur = (e) => {
        // If we're navigating via Enter key, don't process blur
        // The navigation will handle focus transition
        if (isNavigatingRef.current) {
            isNavigatingRef.current = false;
            return;
        }

        setIsFocused(false);

        // Immediately propagate the change on blur
        if (onChange && localValue !== value) {
            onChange(localValue);
        }

        // Call the onBlur callback if provided
        if (onBlur) {
            onBlur(e);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Set flag to prevent blur from interfering
            isNavigatingRef.current = true;

            // Immediately propagate the change
            if (onChange && localValue !== value) {
                onChange(localValue);
            }

            // Mark as unfocused (we're leaving this input)
            setIsFocused(false);

            // Call onEnterKey callback if provided
            if (onEnterKey) {
                onEnterKey(e);
            }
        }
    };

    return h('input', {
        ...props,
        type: 'text',
        value: localValue,
        onFocus: handleFocus,
        onChange: handleChange,
        onBlur: handleBlur,
        onKeyDown: handleKeyDown,
        style: style
    });
};

export { DebouncedInput };
