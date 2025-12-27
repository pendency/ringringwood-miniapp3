/**
 * Favorite Manager 属性测试
 * Feature: wechat-miniprogram-product-sales
 * 
 * 使用 fast-check 进行属性测试，验证收藏管理模块的正确性
 */

const fc = require('fast-check');
const { TestFavoriteManager } = require('../utils/test-favorite-manager.js');

describe('Favorite Manager Property Tests', () => {
  let favoriteManager;

  beforeEach(() => {
    // 每个测试前创建新的实例，确保状态隔离
    favoriteManager = new TestFavoriteManager();
  });

  /**
   * Property 3: 收藏添加后可查询
   * For any 产品ID，添加到收藏后，调用isFavorite应返回true
   * Validates: Requirements 4.1
   * 
   * Feature: wechat-miniprogram-product-sales, Property 3: 收藏添加后可查询
   */
  test('Property 3: 收藏添加后可查询 - 添加收藏后isFavorite应返回true', () => {
    fc.assert(
      fc.property(
        // 生成非空字符串作为产品ID
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (productId) => {
          // 确保初始状态未收藏
          favoriteManager.clearFavorites();
          
          // 添加收藏
          const addResult = favoriteManager.addFavorite(productId);
          
          // 验证添加成功
          if (!addResult) {
            return false;
          }
          
          // 验证isFavorite返回true
          return favoriteManager.isFavorite(productId) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: 收藏移除后不可查询
   * For any 已收藏的产品ID，移除收藏后，调用isFavorite应返回false
   * Validates: Requirements 4.2
   * 
   * Feature: wechat-miniprogram-product-sales, Property 4: 收藏移除后不可查询
   */
  test('Property 4: 收藏移除后不可查询 - 移除收藏后isFavorite应返回false', () => {
    fc.assert(
      fc.property(
        // 生成非空字符串作为产品ID
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        (productId) => {
          // 确保初始状态干净
          favoriteManager.clearFavorites();
          
          // 先添加收藏
          const addResult = favoriteManager.addFavorite(productId);
          if (!addResult) {
            return false;
          }
          
          // 验证已收藏
          if (!favoriteManager.isFavorite(productId)) {
            return false;
          }
          
          // 移除收藏
          const removeResult = favoriteManager.removeFavorite(productId);
          if (!removeResult) {
            return false;
          }
          
          // 验证isFavorite返回false
          return favoriteManager.isFavorite(productId) === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: 收藏数据持久化round-trip
   * For any 收藏列表，保存到本地存储后再读取，应得到等价的收藏列表
   * Validates: Requirements 4.4, 4.5
   * 
   * Feature: wechat-miniprogram-product-sales, Property 5: 收藏数据持久化round-trip
   */
  test('Property 5: 收藏数据持久化round-trip - 保存后读取应得到等价的收藏列表', () => {
    fc.assert(
      fc.property(
        // 生成唯一的产品ID数组（1-10个）
        fc.array(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          { minLength: 1, maxLength: 10 }
        ).map(arr => [...new Set(arr)]), // 确保ID唯一
        (productIds) => {
          // 确保初始状态干净
          favoriteManager.clearFavorites();
          
          // 添加所有产品到收藏
          for (const productId of productIds) {
            const addResult = favoriteManager.addFavorite(productId);
            if (!addResult) {
              return false;
            }
          }
          
          // 获取当前存储的收藏列表（模拟保存）
          const savedFavorites = favoriteManager.getFavorites();
          
          // 创建新实例，共享同一存储（模拟重新打开小程序）
          const newManager = new TestFavoriteManager();
          // 共享存储以模拟持久化
          newManager._storage = favoriteManager._storage;
          
          // 从存储加载收藏列表（模拟读取）
          const loadedFavorites = newManager.getFavorites();
          
          // 验证round-trip：保存的列表和加载的列表应等价
          // 1. 长度相同
          if (savedFavorites.length !== loadedFavorites.length) {
            return false;
          }
          
          // 2. 所有保存的ID都能在加载的列表中找到
          for (const id of savedFavorites) {
            if (!loadedFavorites.includes(id)) {
              return false;
            }
          }
          
          // 3. 所有加载的ID都能在保存的列表中找到
          for (const id of loadedFavorites) {
            if (!savedFavorites.includes(id)) {
              return false;
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: 收藏切换幂等性
   * For any 产品ID，连续两次调用toggleFavorite应恢复到初始状态
   * Validates: Requirements 4.1, 4.2
   * 
   * Feature: wechat-miniprogram-product-sales, Property 7: 收藏切换幂等性
   */
  test('Property 7: 收藏切换幂等性 - 连续两次toggleFavorite应恢复到初始状态', () => {
    fc.assert(
      fc.property(
        // 生成非空字符串作为产品ID
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        // 生成布尔值决定初始状态（true=已收藏，false=未收藏）
        fc.boolean(),
        (productId, initialFavorited) => {
          // 确保初始状态干净
          favoriteManager.clearFavorites();
          
          // 设置初始状态
          if (initialFavorited) {
            favoriteManager.addFavorite(productId);
          }
          
          // 记录初始收藏状态
          const initialStatus = favoriteManager.isFavorite(productId);
          
          // 第一次切换
          favoriteManager.toggleFavorite(productId);
          
          // 第二次切换
          favoriteManager.toggleFavorite(productId);
          
          // 验证：两次切换后应恢复到初始状态
          const finalStatus = favoriteManager.isFavorite(productId);
          
          return initialStatus === finalStatus;
        }
      ),
      { numRuns: 100 }
    );
  });
});
