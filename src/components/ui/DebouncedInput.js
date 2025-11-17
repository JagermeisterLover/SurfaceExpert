const { createElement: h } = React;
const { useState, useEffect, useRef } = React;

/**
 * DebouncedInput - Input component that debounces onChange events
 * Prevents UI freezing when typing by maintaining local state and only
 * propagating changes after user stops typing or on blur
 */
const DebouncedInput = ({ value, onChange, onBlur, debounceMs = 500, style, ...props }) => {
    const [localValue, setLocalValue] = useState(value);
    const timeoutRef = useRef(null);

    // Update local value when prop value changes (external update)
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

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
        onChange: handleChange,
        onBlur: handleBlur,
        style: style
    });
};

export { DebouncedInput };
