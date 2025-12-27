/**
 * Data Validator 属性测试
 * Feature: admin-management-system
 * 
 * 使用 fast-check 进行属性测试，验证数据验证模块的正确性
 */

const fc = require('fast-check');
const { validateCategory, validateProduct, validatePrice } = require('../../utils/dataValidator');

describe('Data Validator Property Tests', () => {
  /**
   * Property 8: 数据验证完整性
   * For any 缺少必填字段的输入数据，validateCategory和validateProduct应返回valid=false
   * Validates: Requirements 10.1, 10.2
   * 
   * Feature: admin-management-system, Property 8: 数据验证完整性
   */
  describe('Property 8: 数据验证完整性', () => {
    /**
     * 8.1: 分类数据缺少name字段时应返回invalid
     * Requirements 10.1: 验证分类名称不为空
     */
    test('分类数据缺少name字段时应返回invalid', () => {
      fc.assert(
        fc.property(
          // 生成不包含name字段的分类对象
          fc.record({
            description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.nat(), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined }),
            icon: fc.option(fc.string(), { nil: undefined }),
            image: fc.option(fc.string(), { nil: undefined })
          }),
          (categoryWithoutName) => {
            // 确保没有name字段
            delete categoryWithoutName.name;
            
            const result = validateCategory(categoryWithoutName);
            
            // 验证：缺少name字段时应返回invalid
            return result.valid === false && result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.2: 分类数据name为空字符串时应返回invalid
     * Requirements 10.1: 验证分类名称不为空
     */
    test('分类数据name为空字符串时应返回invalid', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.constant(''),
            description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.nat(), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (categoryWithEmptyName) => {
            const result = validateCategory(categoryWithEmptyName);
            
            // 验证：name为空字符串时应返回invalid
            return result.valid === false && result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.3: 分类数据name为纯空白字符时应返回invalid
     * Requirements 10.1: 验证分类名称不为空
     */
    test('分类数据name为纯空白字符时应返回invalid', () => {
      fc.assert(
        fc.property(
          // 生成纯空白字符串（1-10个空格/制表符）
          fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }),
          fc.record({
            description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.nat(), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (whitespaceOnly, otherFields) => {
            const category = { ...otherFields, name: whitespaceOnly };
            const result = validateCategory(category);
            
            // 验证：name为纯空白字符时应返回invalid
            return result.valid === false && result.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.4: 产品数据缺少name字段时应返回invalid
     * Requirements 10.2: 验证产品名称不为空
     */
    test('产品数据缺少name字段时应返回invalid', () => {
      fc.assert(
        fc.property(
          // 生成有效的categoryId
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.record({
            description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
            price: fc.option(fc.oneof(fc.nat(), fc.constant('联系销售')), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (categoryId, otherFields) => {
            const product = { ...otherFields, categoryId };
            // 确保没有name字段
            delete product.name;
            
            const result = validateProduct(product);
            
            // 验证：缺少name字段时应返回invalid
            return result.valid === false && 
                   result.errors.some(e => e.includes('产品名称'));
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.5: 产品数据缺少categoryId字段时应返回invalid
     * Requirements 10.2: 验证产品分类不为空
     */
    test('产品数据缺少categoryId字段时应返回invalid', () => {
      fc.assert(
        fc.property(
          // 生成有效的name
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.record({
            description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
            price: fc.option(fc.oneof(fc.nat(), fc.constant('联系销售')), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (name, otherFields) => {
            const product = { ...otherFields, name };
            // 确保没有categoryId字段
            delete product.categoryId;
            
            const result = validateProduct(product);
            
            // 验证：缺少categoryId字段时应返回invalid
            return result.valid === false && 
                   result.errors.some(e => e.includes('产品分类'));
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.6: 产品数据同时缺少name和categoryId时应返回invalid并包含两个错误
     * Requirements 10.2: 验证产品名称和分类不为空
     */
    test('产品数据同时缺少name和categoryId时应返回invalid并包含两个错误', () => {
      fc.assert(
        fc.property(
          fc.record({
            description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
            price: fc.option(fc.oneof(fc.nat(), fc.constant('联系销售')), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (productWithoutRequired) => {
            // 确保没有name和categoryId字段
            delete productWithoutRequired.name;
            delete productWithoutRequired.categoryId;
            
            const result = validateProduct(productWithoutRequired);
            
            // 验证：同时缺少两个必填字段时应返回invalid
            // 并且错误信息应包含两个必填字段的错误
            return result.valid === false && 
                   result.errors.some(e => e.includes('产品名称')) &&
                   result.errors.some(e => e.includes('产品分类'));
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.7: 非对象输入应返回invalid
     * Requirements 10.1, 10.2: 数据验证完整性
     */
    test('非对象输入应返回invalid', () => {
      fc.assert(
        fc.property(
          // 生成非对象值
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.array(fc.anything())
          ),
          (invalidInput) => {
            const categoryResult = validateCategory(invalidInput);
            const productResult = validateProduct(invalidInput);
            
            // 验证：非对象输入时两个验证函数都应返回invalid
            return categoryResult.valid === false && 
                   productResult.valid === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.8: 有效的分类数据应返回valid
     * 对比测试：确保有效数据能通过验证
     */
    test('有效的分类数据应返回valid', () => {
      fc.assert(
        fc.property(
          // 生成有效的非空非纯空白name
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.record({
            description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.nat(), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (validName, otherFields) => {
            const category = { ...otherFields, name: validName };
            const result = validateCategory(category);
            
            // 验证：有效数据应返回valid
            return result.valid === true && result.errors.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 8.9: 有效的产品数据应返回valid
     * 对比测试：确保有效数据能通过验证
     */
    test('有效的产品数据应返回valid', () => {
      fc.assert(
        fc.property(
          // 生成有效的非空非纯空白name
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          // 生成有效的非空非纯空白categoryId
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.record({
            description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
            price: fc.option(fc.oneof(fc.nat(), fc.constant('联系销售'), fc.constant('consult')), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (validName, validCategoryId, otherFields) => {
            const product = { ...otherFields, name: validName, categoryId: validCategoryId };
            const result = validateProduct(product);
            
            // 验证：有效数据应返回valid
            return result.valid === true && result.errors.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
