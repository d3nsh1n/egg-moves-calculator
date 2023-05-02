export const a = 5;
declare global {
    interface Map<K, V> {
        getOrCreate(key: K, valueIfMissing: V): V;
    }
}

Map.prototype.getOrCreate = function <K, V>(key: K, valueIfMissing: V): V {
    const existing = this.get(key);
    if (existing === undefined) {
        this.set(key, valueIfMissing);
        return this.get(key);
    } else {
        return existing;
    }
};
