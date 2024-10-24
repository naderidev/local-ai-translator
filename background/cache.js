export function createCache(limit) {
    const data = new Map();
    const keys = [];
    return {
        set(key, value) {
            if (data.has(key)) {
                return;
            }
            data.set(key, value);
            keys.push(key);
            if (keys.length > limit) {
                const key = keys.shift();
                data.delete(key);
            }
        },
        get(key) {
            return data.get(key);
        },
    };
}
