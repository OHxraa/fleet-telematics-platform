/**
 * Performance Optimization & Monitoring
 * Query optimization, caching, and performance metrics
 */

const logger = require('../utils/logger');

/**
 * Performance monitor
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.slowQueryThreshold = 1000; // ms
  }

  /**
   * Track endpoint performance
   */
  trackEndpoint(method, path, duration, statusCode) {
    const key = `${method} ${path}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        requests: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0,
        lastCalled: null,
      });
    }

    const metric = this.metrics.get(key);
    metric.requests++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastCalled = new Date();

    if (statusCode >= 400) {
      metric.errors++;
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      logger.warn(`Slow query detected: ${key} (${duration}ms)`);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(endpoint = null) {
    if (endpoint) {
      return this.metrics.get(endpoint);
    }

    const all = {};
    for (const [key, value] of this.metrics) {
      all[key] = {
        ...value,
        avgDuration: Math.round(value.totalDuration / value.requests),
      };
    }

    return all;
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit = 10) {
    const sorted = Array.from(this.metrics.entries())
      .map(([key, value]) => ({
        endpoint: key,
        avgDuration: value.totalDuration / value.requests,
        maxDuration: value.maxDuration,
        requests: value.requests,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);

    return sorted;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.clear();
  }
}

/**
 * Query result caching
 */
class QueryCache {
  constructor(ttl = 300000) {
    // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Generate cache key
   */
  generateKey(query, params) {
    return `${query}:${JSON.stringify(params)}`;
  }

  /**
   * Get from cache
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check expiration
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   */
  set(key, data, ttl = this.ttl) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      createdAt: new Date(),
    });
  }

  /**
   * Clear specific cache
   */
  clear(keyPattern = null) {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }

    // Clear matching keys
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        expiresIn: value.expiresAt - Date.now(),
        age: Date.now() - value.createdAt.getTime(),
      })),
    };
  }
}

/**
 * Database query optimizer
 */
class QueryOptimizer {
  /**
   * Build optimized query
   */
  static buildOptimized(baseQuery, filters = {}, options = {}) {
    let query = baseQuery;
    const params = [];
    let paramCount = 1;

    // Add filters
    if (Object.keys(filters).length > 0) {
      const conditions = [];

      for (const [field, value] of Object.entries(filters)) {
        if (value !== null && value !== undefined) {
          conditions.push(`${field} = $${paramCount}`);
          params.push(value);
          paramCount++;
        }
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    // Add ordering
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }

    // Add limits
    if (options.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(options.limit);
      paramCount++;

      if (options.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(options.offset);
      }
    }

    return { query, params };
  }

  /**
   * Add index recommendations
   */
  static getIndexRecommendations(query) {
    const recommendations = [];

    if (query.includes('WHERE customer_id')) {
      recommendations.push('CREATE INDEX idx_customer_id ON table(customer_id)');
    }

    if (query.includes('WHERE status')) {
      recommendations.push('CREATE INDEX idx_status ON table(status)');
    }

    if (query.includes('ORDER BY created_at')) {
      recommendations.push('CREATE INDEX idx_created_at ON table(created_at DESC)');
    }

    return recommendations;
  }
}

/**
 * Batch operations optimizer
 */
class BatchOptimizer {
  /**
   * Batch insert
   */
  static buildBatchInsert(table, records) {
    if (records.length === 0) {
      return { query: '', params: [] };
    }

    const columns = Object.keys(records[0]);
    const placeholders = [];
    const params = [];
    let paramCount = 1;

    for (const record of records) {
      const values = [];
      for (const col of columns) {
        values.push(`$${paramCount}`);
        params.push(record[col]);
        paramCount++;
      }
      placeholders.push(`(${values.join(', ')})`);
    }

    const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;

    return { query, params };
  }

  /**
   * Batch update
   */
  static buildBatchUpdate(table, idField, records) {
    // Use CASE statement for efficient batch updates
    const ids = records.map(r => r[idField]);
    let query = `UPDATE ${table} SET `;

    const columnUpdates = [];
    let paramCount = 1;
    const params = [];

    const columns = Object.keys(records[0]).filter(col => col !== idField);

    for (const col of columns) {
      const cases = records.map(
        record => `WHEN $${paramCount} THEN $${paramCount + 1}`
      );
      paramCount += 2;
      columnUpdates.push(`${col} = CASE ${idField} ${cases.join(' ')} END`);
    }

    query += columnUpdates.join(', ');
    query += ` WHERE ${idField} IN (${ids.map(() => `$${paramCount++}`).join(', ')})`;

    return { query, params };
  }
}

/**
 * Memory usage monitor
 */
class MemoryMonitor {
  static getUsage() {
    const used = process.memoryUsage();

    return {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`, // Resident set size
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`,
    };
  }

  static isHighMemory(threshold = 500) {
    // 500MB threshold
    const used = process.memoryUsage();
    return used.heapUsed / 1024 / 1024 > threshold;
  }
}

/**
 * Response time middleware
 */
const responseTimeMiddleware = (monitor) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      monitor.trackEndpoint(req.method, req.path, duration, res.statusCode);
    });

    next();
  };
};

module.exports = {
  PerformanceMonitor,
  QueryCache,
  QueryOptimizer,
  BatchOptimizer,
  MemoryMonitor,
  responseTimeMiddleware,
};
