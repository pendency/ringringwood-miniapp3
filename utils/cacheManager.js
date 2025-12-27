/**
 * 缓存管理器
 * 提供数据缓存功能，支持缓存过期刷新机制
 * Requirements: 9.3, 9.4
 */

const CACHE_KEYS = {
  CATEGORIES: 'cache_categories',
  PRODUCTS_PREFIX: 'cache_products_',
  HOT_PRODUCTS: 'cache_hot_products',
  NEW_PRODUCTS: 'cache_new_products',
  BANNERS: 'cache_banners'
};

// 默认缓存过期时间（毫秒）
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5分钟

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheDuration = DEFAULT_CACHE_DURATION;
  }

  /**
   * 生成缓存键
   * @param {string} prefix - 缓存键前缀
   * @param {string} suffix - 缓存键后缀
   * @returns {string} 完整的缓存键
   */
  generateKey(prefix, suffix = '') {
    return suffix ? `${prefix}${suffix}` : prefix;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   * @param {number} duration - 缓存时长（毫秒），默认5分钟
   */
  set(key, data, duration = this.cacheDuration) {
    const cacheItem = {
      data: data,
      timestamp: Date.now(),
      expireAt: Date.now() + duration
    };

    // 内存缓存
    this.memoryCache.set(key, cacheItem);

    // 本地存储缓存
    try {
      wx.setStorageSync(key, cacheItem);
    } catch (error) {
      console.warn('[CacheManager] 本地存储缓存失败:', error);
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存的数据，如果过期或不存在则返回null
   */
  get(key) {
    // 优先从内存缓存获取
    let cacheItem = this.memoryCache.get(key);

    // 内存缓存不存在，尝试从本地存储获取
    if (!cacheItem) {
      try {
        cacheItem = wx.getStorageSync(key);
        if (cacheItem) {
          // 恢复到内存缓存
          this.memoryCache.set(key, cacheItem);
        }
      } catch (error) {
        console.warn('[CacheManager] 读取本地存储缓存失败:', error);
        return null;
      }
    }

    if (!cacheItem) {
      return null;
    }

    // 检查是否过期
    if (this.isExpired(cacheItem)) {
      this.remove(key);
      return null;
    }

    return cacheItem.data;
  }

  /**
   * 检查缓存是否过期
   * @param {object} cacheItem - 缓存项
   * @returns {boolean} 是否过期
   */
  isExpired(cacheItem) {
    if (!cacheItem || !cacheItem.expireAt) {
      return true;
    }
    return Date.now() > cacheItem.expireAt;
  }

  /**
   * 检查缓存是否存在且有效
   * @param {string} key - 缓存键
   * @returns {boolean} 缓存是否有效
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * 移除缓存
   * @param {string} key - 缓存键
   */
  remove(key) {
    this.memoryCache.delete(key);
    try {
      wx.removeStorageSync(key);
    } catch (error) {
      console.warn('[CacheManager] 移除本地存储缓存失败:', error);
    }
  }

  /**
   * 清除所有缓存
   */
  clearAll() {
    this.memoryCache.clear();
    
    // 清除所有以cache_开头的本地存储
    try {
      const keys = wx.getStorageInfoSync().keys;
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          wx.removeStorageSync(key);
        }
      });
    } catch (error) {
      console.warn('[CacheManager] 清除本地存储缓存失败:', error);
    }
  }

  /**
   * 清除过期缓存
   */
  clearExpired() {
    // 清除内存中的过期缓存
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }

    // 清除本地存储中的过期缓存
    try {
      const keys = wx.getStorageInfoSync().keys;
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          const item = wx.getStorageSync(key);
          if (this.isExpired(item)) {
            wx.removeStorageSync(key);
          }
        }
      });
    } catch (error) {
      console.warn('[CacheManager] 清除过期缓存失败:', error);
    }
  }

  /**
   * 设置缓存过期时间
   * @param {number} duration - 缓存时长（毫秒）
   */
  setCacheDuration(duration) {
    this.cacheDuration = duration;
  }

  /**
   * 获取缓存统计信息
   * @returns {object} 缓存统计
   */
  getStats() {
    let localStorageCount = 0;
    try {
      const keys = wx.getStorageInfoSync().keys;
      localStorageCount = keys.filter(k => k.startsWith('cache_')).length;
    } catch (error) {
      console.warn('[CacheManager] 获取缓存统计失败:', error);
    }

    return {
      memoryCacheCount: this.memoryCache.size,
      localStorageCacheCount: localStorageCount,
      cacheDuration: this.cacheDuration
    };
  }
}

// 创建单例实例
const cacheManager = new CacheManager();

// 将缓存键常量挂载到实例上，方便访问
cacheManager.KEYS = CACHE_KEYS;

module.exports = cacheManager;
