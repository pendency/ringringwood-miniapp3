/**
 * Data Validator 模块单元测试
 * Feature: admin-management-system
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

const { validateCategory, validateProduct, validatePrice } = require('../../utils/dataValidator');

describe('Data Validator', () => {
  describe('validateCategory', () => {
    // Requirements 10.1: 验证分类名称不为空
    test('should return valid for valid category data', () => {
      const category = {
        name: '测试分类',
        description: '这是一个测试分类',
        order: 1,
        status: 1
      };
      const result = validateCategory(category);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return invalid when name is missing', () => {
      const category = {
        description: '这是一个测试分类'
      };
      const result = validateCategory(category);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分类名称不能为空');
    });

    test('should return invalid when name is empty string', () => {
      const category = {
        name: ''
      };
      const result = validateCategory(category);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分类名称不能为空');
    });

    test('should return invalid when name is whitespace only', () => {
      const category = {
        name: '   '
      };
      const result = validateCategory(category);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分类名称不能为空白字符');
    });

    test('should return invalid when input is not an object', () => {
      const result = validateCategory(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分类数据必须是一个对象');
    });

    test('should return invalid when status is not 0 or 1', () => {
      const category = {
        name: '测试分类',
        status: 2
      };
      const result = validateCategory(category);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('状态必须是0（禁用）或1（启用）');
    });

    test('should return valid with minimal required fields', () => {
      const category = {
        name: '测试分类'
      };
      const result = validateCategory(category);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateProduct', () => {
    // Requirements 10.2: 验证产品名称和分类不为空
    test('should return valid for valid product data', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001',
        description: '这是一个测试产品',
        price: 99.99,
        status: 1
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should return invalid when name is missing', () => {
      const product = {
        categoryId: 'cat_001'
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('产品名称不能为空');
    });

    test('should return invalid when categoryId is missing', () => {
      const product = {
        name: '测试产品'
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('产品分类不能为空');
    });

    test('should return invalid when both name and categoryId are missing', () => {
      const product = {
        description: '这是一个测试产品'
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('产品名称不能为空');
      expect(result.errors).toContain('产品分类不能为空');
    });

    test('should return invalid when input is not an object', () => {
      const result = validateProduct(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('产品数据必须是一个对象');
    });

    test('should return invalid when price is invalid', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001',
        price: 'invalid_price'
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('价格格式无效，请输入有效数字或"联系销售"');
    });

    test('should return valid when price is "联系销售"', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001',
        price: '联系销售'
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(true);
    });

    test('should return valid when price is "consult"', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001',
        price: 'consult'
      };
      const result = validateProduct(product);
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePrice', () => {
    // Requirements 10.3: 验证价格为有效数字或"联系销售"
    test('should return true for valid numeric price', () => {
      expect(validatePrice(99.99)).toBe(true);
      expect(validatePrice(0)).toBe(true);
      expect(validatePrice(100)).toBe(true);
    });

    test('should return true for valid string numeric price', () => {
      expect(validatePrice('99.99')).toBe(true);
      expect(validatePrice('0')).toBe(true);
      expect(validatePrice('100')).toBe(true);
    });

    test('should return true for "联系销售"', () => {
      expect(validatePrice('联系销售')).toBe(true);
    });

    test('should return true for "consult"', () => {
      expect(validatePrice('consult')).toBe(true);
    });

    test('should return true for empty/null/undefined price', () => {
      expect(validatePrice(undefined)).toBe(true);
      expect(validatePrice(null)).toBe(true);
      expect(validatePrice('')).toBe(true);
    });

    test('should return false for invalid string price', () => {
      expect(validatePrice('abc')).toBe(false);
      expect(validatePrice('invalid')).toBe(false);
    });

    test('should return false for negative price', () => {
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice('-10')).toBe(false);
    });
  });
});
