const { createElement: h } = React;
const { useState, useEffect, useRef } = React;

/**
 * DebouncedInput - Input component that debounces onChange events
 * Prevents UI freezing when typing by maintaining local state and only
 * propagating changes after user stops typing or on blur
 *
 * Features:
 * - Debounced updates to prevent UI freezing
 * - Press Enter to move to next input (if onEnterKey provided)
 * - Immediate save on blur
 */
const DebouncedInput = ({ value, onChange, onBlur, onEnterKey, debounceMs = 500, style, ...props }) => {
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const timeoutRef = useRef(null);

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

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout to call onChange after debounce delay
        timeoutRef.current = setTimeout(() => {
            if (onChange) {
                onChange(newValue);
            }
        }, debounceMs);
    };

    const handleBlur = (e) => {
        setIsFocused(false);

        // Clear any pending timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

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

            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Immediately propagate the change
            if (onChange && localValue !== value) {
                onChange(localValue);
            }

            // Call onEnterKey callback if provided
            if (onEnterKey) {
                onEnterKey(e);
            }
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

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
