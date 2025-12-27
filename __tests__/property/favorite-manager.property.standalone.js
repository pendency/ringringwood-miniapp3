/**
 * Favorite Manager 属性测试 - 独立版本
 * Feature: wechat-miniprogram-product-sales
 * 
 * 不依赖外部测试框架，使用简单的属性测试实现
 * Property 3: 收藏添加后可查询
 * Property 4: 收藏移除后不可查询
 * Validates: Requirements 4.1, 4.2
 */

// 简单的属性测试框架实现
class PropertyTester {
  constructor(numRuns = 100) {
    this.numRuns = numRuns;
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }

  // 生成随机字符串
  randomString(minLength = 1, maxLength = 50) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 运行属性测试
  runProperty(name, generator, property) {
    console.log(`\n运行测试: ${name}`);
    let failures = [];
    
    for (let i = 0; i < this.numRuns; i++) {
      const input = generator();
      try {
        const result = property(input);
        if (!result) {
          failures.push({ run: i + 1, input, error: '属性返回 false' });
        }
      } catch (error) {
        failures.push({ run: i + 1, input, error: error.message });
      }
    }

    if (failures.length === 0) {
      console.log(`  ✓ 通过 (${this.numRuns} 次运行)`);
      this.passed++;
      this.results.push({ name, status: 'passed' });
    } else {
      console.log(`  ✗ 失败 (${failures.length}/${this.numRuns} 次失败)`);
      console.log(`  第一个失败案例:`, JSON.stringify(failures[0], null, 2));
      this.failed++;
      this.results.push({ name, status: 'failed', failures });
    }
  }

  // 打印总结
  summary() {
    console.log('\n========== 测试总结 ==========');
    console.log(`通过: ${this.passed}`);
    console.log(`失败: ${this.failed}`);
    console.log(`总计: ${this.passed + this.failed}`);
    return this.failed === 0;
  }
}

// 加载测试用 Favorite Manager
const { TestFavoriteManager } = require('../utils/test-favorite-manager.js');

// 运行测试
function runTests() {
  const tester = new PropertyTester(100);

  console.log('========== Favorite Manager 属性测试 ==========');
  console.log('Feature: wechat-miniprogram-product-sales');
  console.log('Property 3: 收藏添加后可查询');
  console.log('Validates: Requirements 4.1');

  /**
   * Property 3: 收藏添加后可查询
   * For any 产品ID，添加到收藏后，调用isFavorite应返回true
   * Validates: Requirements 4.1
   */
  tester.runProperty(
    'Property 3: 收藏添加后可查询 - 添加收藏后isFavorite应返回true',
    () => ({ productId: tester.randomString(1, 50) }),
    (input) => {
      // 每次测试创建新的实例，确保状态隔离
      const favoriteManager = new TestFavoriteManager();
      
      // 确保初始状态未收藏
      favoriteManager.clearFavorites();
      
      // 添加收藏
      const addResult = favoriteManager.addFavorite(input.productId);
      
      // 验证添加成功
      if (!addResult) {
        return false;
      }
      
      // 验证isFavorite返回true
      return favoriteManager.isFavorite(input.productId) === true;
    }
  );

  /**
   * Property 4: 收藏移除后不可查询
   * For any 已收藏的产品ID，移除收藏后，调用isFavorite应返回false
   * Validates: Requirements 4.2
   */
  tester.runProperty(
    'Property 4: 收藏移除后不可查询 - 移除收藏后isFavorite应返回false',
    () => ({ productId: tester.randomString(1, 50) }),
    (input) => {
      // 每次测试创建新的实例，确保状态隔离
      const favoriteManager = new TestFavoriteManager();
      
      // 确保初始状态干净
      favoriteManager.clearFavorites();
      
      // 先添加收藏
      const addResult = favoriteManager.addFavorite(input.productId);
      if (!addResult) {
        return false;
      }
      
      // 验证已收藏
      if (!favoriteManager.isFavorite(input.productId)) {
        return false;
      }
      
      // 移除收藏
      const removeResult = favoriteManager.removeFavorite(input.productId);
      if (!removeResult) {
        return false;
      }
      
      // 验证isFavorite返回false
      return favoriteManager.isFavorite(input.productId) === false;
    }
  );

  return tester.summary();
}

// 执行测试
const success = runTests();
process.exit(success ? 0 : 1);
