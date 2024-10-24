export function deepAssign(target, ...sources) {
    if (!target || typeof target !== "object") {
        return target;
    }
    sources.forEach((source) => {
        if (source && typeof source === "object") {
            Object.keys(source).forEach((key) => {
                const value = source[key];
                if (Array.isArray(value)) {
                    target[key] = [...value];
                } else if (typeof value === "object") {
                    target[key] = deepAssign(target[key] || {}, value);
                } else {
                    target[key] = value;
                }
            });
        }
    });
    return target;
}
