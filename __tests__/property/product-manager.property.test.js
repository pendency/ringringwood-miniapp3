/**
 * Product Manager 属性测试
 * Feature: wechat-miniprogram-product-sales
 * 
 * 使用 fast-check 进行属性测试，验证产品管理模块的正确性
 */

const fc = require('fast-check');
const { TestProductManager } = require('../utils/test-product-manager.js');

describe('Product Manager Property Tests', () => {
  let productManager;
  let validCategoryIds;

  beforeEach(() => {
    productManager = new TestProductManager();
    validCategoryIds = productManager.getCategoryIds();
  });

  /**
   * Property 1: 分类筛选一致性
   * For any 分类ID和产品列表，当按该分类筛选产品时，返回的所有产品的categoryId都应等于筛选的分类ID
   * Validates: Requirements 2.2, 7.2
   */
  test('Property 1: 分类筛选一致性 - 所有返回产品的categoryId应等于筛选的分类ID', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validCategoryIds),
        (categoryId) => {
          const result = productManager.getProducts({ categoryId });
          
          // 所有返回的产品的categoryId都应该等于筛选的分类ID
          return result.products.every(product => product.categoryId === categoryId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: 分页结果数量约束
   * For any 分页请求，返回的产品数量应不超过请求的pageSize参数值
   * Validates: Requirements 2.3, 7.3
   */
  test('Property 2: 分页结果数量约束 - 返回产品数量不超过pageSize', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // pageSize
        fc.integer({ min: 1, max: 10 }), // page
        fc.option(fc.constantFrom(...validCategoryIds), { nil: undefined }), // categoryId (optional)
        (pageSize, page, categoryId) => {
          const options = { pageSize, page };
          if (categoryId) {
            options.categoryId = categoryId;
          }
          
          const result = productManager.getProducts(options);
          
          // 返回的产品数量不应超过pageSize
          return result.products.length <= pageSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6: 产品数据序列化round-trip
   * For any 有效的产品对象，JSON序列化后再反序列化，应产生等价的产品对象
   * Validates: Requirements 7.6
   */
  test('Property 6: 产品数据序列化round-trip - JSON序列化后反序列化应等价', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: productManager.products.length - 1 }),
        (productIndex) => {
          const originalProduct = productManager.products[productIndex];
          
          // 序列化然后反序列化
          const serialized = JSON.stringify(originalProduct);
          const deserialized = JSON.parse(serialized);
          
          // 验证关键字段相等
          return (
            deserialized._id === originalProduct._id &&
            deserialized.name === originalProduct.name &&
            deserialized.categoryId === originalProduct.categoryId &&
            deserialized.isHot === originalProduct.isHot &&
            deserialized.isNew === originalProduct.isNew &&
            deserialized.isRecommended === originalProduct.isRecommended &&
            JSON.stringify(deserialized.imageUrls) === JSON.stringify(originalProduct.imageUrls) &&
            JSON.stringify(deserialized.params) === JSON.stringify(originalProduct.params)
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
