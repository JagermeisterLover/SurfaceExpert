// Icon components
export const PlusIcon = () => (
    React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
        React.createElement('line', { x1: "12", y1: "5", x2: "12", y2: "19" }),
        React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12" })
    )
);

export const MinusIcon = () => (
    React.createElement('svg', { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" },
        React.createElement('line', { x1: "5", y1: "12", x2: "19", y2: "12" })
    )
);
