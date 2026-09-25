

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }


  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
    this.stats.sets++;
    return value;
  }


  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  
  del(key) {
    const deleted = this.store.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  
  delByPattern(pattern) {
    let count = 0;
    const regex = new RegExp('^' + pattern.replace('*', '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
        this.stats.deletes++;
      }
    }
    return count;
  }

  
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetchFn();
    this.set(key, freshData, ttlSeconds);
    return freshData;
  }

  
  flush() {
    this.store.clear();
  }

  
  getMetrics() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0
      ? Number(((this.stats.hits / totalRequests) * 100).toFixed(2))
      : 0;

    return {
      size: this.store.size,
      ...this.stats,
      hitRate: `${hitRate}%`
    };
  }
}

module.exports = new MemoryCache();
