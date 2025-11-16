// Utility helper functions
const formatValue = (value) => {
    if (!isFinite(value) || isNaN(value)) return '0';
    const absValue = Math.abs(value);
    // Treat very small values as zero (floating-point precision threshold)
    if (absValue < 1e-10) return '0';
    if (absValue >= 0.0000001) {
        return value.toFixed(7);
    } else {
        return value.toExponential(5);
    }
};

// Helper function to convert degrees to DMS format
const degreesToDMS = (angle) => {
    const sign = angle < 0 ? -1 : 1;
    angle = Math.abs(angle);

    const degrees = Math.floor(angle);
    const fraction = angle - degrees;
    const minutes = Math.floor(fraction * 60);
    const seconds = (fraction * 60 - minutes) * 60;

    const signStr = sign < 0 ? "-" : "";
    return `${signStr}${degrees}° ${minutes}' ${seconds.toFixed(3)}"`;
};
