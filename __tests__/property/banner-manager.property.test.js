/**
 * Banner Manager 属性测试
 * Feature: banner-management
 * 
 * 使用 fast-check 进行属性测试，验证轮播图管理工具函数的正确性
 */

const fc = require('fast-check');
const {
  generateBannerFilename,
  validateBannerData,
  sortBanners,
  validateProductId,
  generateBannerId,
  applyBannerDefaults,
  createBannerData,
  applyBannerUpdate
} = require('../../utils/bannerManager');

describe('Banner Manager Property Tests', () => {
  /**
   * Property 1: Banner Filename Format
   * For any timestamp and file extension, the generated banner filename 
   * SHALL match the pattern `banner_{timestamp}.{extension}` where timestamp is a positive integer.
   * 
   * Feature: banner-management, Property 1: Banner Filename Format
   * Validates: Requirements 1.2
   */
  describe('Property 1: Banner Filename Format', () => {
    test('生成的文件名应匹配 banner_{timestamp}.{extension} 格式', () => {
      fc.assert(
        fc.property(
          // 生成正整数时间戳
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          // 生成有效的文件扩展名（不含点号）
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 10 }),
          (timestamp, extension) => {
            const filename = generateBannerFilename(extension, timestamp);
            
            // 验证文件名格式
            const pattern = /^banner_(\d+)\.([a-z]+)$/;
            const match = filename.match(pattern);
            
            // 必须匹配格式
            if (!match) return false;
            
            // 时间戳部分必须是正整数
            const extractedTimestamp = parseInt(match[1], 10);
            if (extractedTimestamp <= 0) return false;
            
            // 时间戳应与输入一致
            if (extractedTimestamp !== timestamp) return false;
            
            // 扩展名应与输入一致
            if (match[2] !== extension) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('扩展名带点号时应正确处理', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 10 }),
          (timestamp, extension) => {
            // 测试带点号的扩展名
            const filenameWithDot = generateBannerFilename('.' + extension, timestamp);
            const filenameWithoutDot = generateBannerFilename(extension, timestamp);
            
            // 两种方式应生成相同的文件名
            return filenameWithDot === filenameWithoutDot;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('不提供时间戳时应使用当前时间', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 1, maxLength: 10 }),
          (extension) => {
            const before = Date.now();
            const filename = generateBannerFilename(extension);
            const after = Date.now();
            
            // 验证文件名格式
            const pattern = /^banner_(\d+)\.([a-z]+)$/;
            const match = filename.match(pattern);
            
            if (!match) return false;
            
            const extractedTimestamp = parseInt(match[1], 10);
            
            // 时间戳应在调用前后的时间范围内
            return extractedTimestamp >= before && extractedTimestamp <= after;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Banner Sorting Order
   * For any list of banners, when sorted, banners with lower `order` values 
   * SHALL appear before banners with higher `order` values. 
   * When `order` values are equal, banners with earlier `createTime` SHALL appear first.
   * 
   * Feature: banner-management, Property 4: Banner Sorting Order
   * Validates: Requirements 5.2, 6.2, 6.4
   */
  describe('Property 4: Banner Sorting Order', () => {
    test('排序后 order 值小的应在前面', () => {
      fc.assert(
        fc.property(
          // 生成随机轮播图列表
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              order: fc.integer({ min: 0, max: 1000 }),
              createTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (banners) => {
            const sorted = sortBanners(banners);
            
            // 验证排序结果
            for (let i = 1; i < sorted.length; i++) {
              const prev = sorted[i - 1];
              const curr = sorted[i];
              
              const prevOrder = prev.order !== undefined ? prev.order : 999;
              const currOrder = curr.order !== undefined ? curr.order : 999;
              
              // order 值小的应在前面
              if (prevOrder > currOrder) {
                return false;
              }
              
              // order 相同时，createTime 早的应在前面
              if (prevOrder === currOrder) {
                const prevTime = prev.createTime ? new Date(prev.createTime).getTime() : 0;
                const currTime = curr.createTime ? new Date(curr.createTime).getTime() : 0;
                if (prevTime > currTime) {
                  return false;
                }
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('排序不应改变原数组', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              order: fc.integer({ min: 0, max: 1000 })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (banners) => {
            const original = JSON.stringify(banners);
            sortBanners(banners);
            const afterSort = JSON.stringify(banners);
            
            // 原数组不应被修改
            return original === afterSort;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('排序后元素数量应保持不变', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              order: fc.integer({ min: 0, max: 1000 })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (banners) => {
            const sorted = sortBanners(banners);
            return sorted.length === banners.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('没有 order 字段时应使用默认值 999', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              createTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.integer({ min: 0, max: 998 }),
          (bannersWithoutOrder, explicitOrder) => {
            // 添加一个有明确 order 的 banner
            const bannerWithOrder = {
              _id: 'banner_with_order',
              order: explicitOrder,
              createTime: new Date()
            };
            
            const allBanners = [...bannersWithoutOrder, bannerWithOrder];
            const sorted = sortBanners(allBanners);
            
            // 有明确 order (< 999) 的 banner 应该排在没有 order 的 banner 前面
            const indexWithOrder = sorted.findIndex(b => b._id === 'banner_with_order');
            
            // 所有没有 order 的 banner 应该在有 order 的 banner 后面
            for (let i = 0; i < indexWithOrder; i++) {
              if (sorted[i].order === undefined || sorted[i].order === null) {
                // 如果前面有没有 order 的 banner，说明排序有问题
                // 但实际上没有 order 的 banner 默认是 999，所以如果 explicitOrder < 999，
                // 有 order 的 banner 应该在前面
                if (explicitOrder < 999) {
                  return false;
                }
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Product ID Validation
   * For any product ID provided for a banner, if the ID is non-empty, 
   * it SHALL match a valid product ID format (alphanumeric with optional underscores and hyphens).
   * 
   * Feature: banner-management, Property 7: Product ID Validation
   * Validates: Requirements 7.3
   */
  describe('Property 7: Product ID Validation', () => {
    test('有效的产品ID应通过验证', () => {
      fc.assert(
        fc.property(
          // 生成有效的产品ID（字母数字、下划线、连字符）
          fc.stringOf(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'),
            { minLength: 1, maxLength: 100 }
          ),
          (productId) => {
            return validateProductId(productId) === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空字符串应通过验证（productId 是可选的）', () => {
      expect(validateProductId('')).toBe(true);
      expect(validateProductId(null)).toBe(true);
      expect(validateProductId(undefined)).toBe(true);
    });

    test('包含特殊字符的产品ID应不通过验证', () => {
      fc.assert(
        fc.property(
          // 生成包含特殊字符的字符串
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
            // 确保字符串包含至少一个非法字符
            return /[^a-zA-Z0-9_-]/.test(s);
          }),
          (invalidProductId) => {
            return validateProductId(invalidProductId) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('超长的产品ID应不通过验证', () => {
      fc.assert(
        fc.property(
          // 生成超过100字符的有效字符组成的字符串
          fc.stringOf(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'),
            { minLength: 101, maxLength: 200 }
          ),
          (longProductId) => {
            return validateProductId(longProductId) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('非字符串类型应不通过验证', () => {
      expect(validateProductId(123)).toBe(false);
      expect(validateProductId({})).toBe(false);
      expect(validateProductId([])).toBe(false);
      expect(validateProductId(true)).toBe(false);
    });
  });

  /**
   * Property 2: Banner Data Completeness
   * For any valid banner input, the created banner record SHALL contain all required fields:
   * `_id`, `image`, `title`, `subtitle`, `order`, `status`, `productId`, `createTime`, `updateTime`.
   * 
   * Feature: banner-management, Property 2: Banner Data Completeness
   * Validates: Requirements 2.1
   */
  describe('Property 2: Banner Data Completeness', () => {
    const requiredFields = ['_id', 'image', 'title', 'subtitle', 'order', 'status', 'productId', 'createTime', 'updateTime'];

    test('创建的轮播图数据应包含所有必需字段', () => {
      fc.assert(
        fc.property(
          // 生成随机的轮播图输入数据
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined }),
            productId: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(input, bannerId, timestamp);
            
            // 验证所有必需字段都存在
            for (const field of requiredFields) {
              if (!(field in bannerData)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('创建的轮播图数据字段类型应正确', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined }),
            productId: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(input, bannerId, timestamp);
            
            // 验证字段类型
            if (typeof bannerData._id !== 'string') return false;
            if (typeof bannerData.image !== 'string') return false;
            if (typeof bannerData.title !== 'string') return false;
            if (typeof bannerData.subtitle !== 'string') return false;
            if (typeof bannerData.order !== 'number') return false;
            if (typeof bannerData.status !== 'number') return false;
            if (typeof bannerData.productId !== 'string') return false;
            if (!(bannerData.createTime instanceof Date)) return false;
            if (!(bannerData.updateTime instanceof Date)) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('未提供可选字段时应使用默认值', () => {
      fc.assert(
        fc.property(
          // 只提供必填字段 image
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (image, idNumber, timestamp) => {
            const input = { image };
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(input, bannerId, timestamp);
            
            // 验证默认值
            if (bannerData.title !== '轮播图') return false;
            if (bannerData.subtitle !== '') return false;
            if (bannerData.order !== 999) return false;
            if (bannerData.status !== 1) return false;
            if (bannerData.productId !== '') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Banner ID Format
   * For any newly created banner, the generated ID SHALL match the pattern `banner_{number}` 
   * where number is a positive integer.
   * 
   * Feature: banner-management, Property 3: Banner ID Format
   * Validates: Requirements 2.2
   */
  describe('Property 3: Banner ID Format', () => {
    test('生成的轮播图ID应匹配 banner_{number} 格式', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (number) => {
            const bannerId = generateBannerId(number);
            
            // 验证ID格式
            const pattern = /^banner_(\d+)$/;
            const match = bannerId.match(pattern);
            
            if (!match) return false;
            
            // 提取的数字应与输入一致
            const extractedNumber = parseInt(match[1], 10);
            return extractedNumber === number;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('轮播图ID中的数字应为正整数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (number) => {
            const bannerId = generateBannerId(number);
            
            const pattern = /^banner_(\d+)$/;
            const match = bannerId.match(pattern);
            
            if (!match) return false;
            
            const extractedNumber = parseInt(match[1], 10);
            return extractedNumber > 0 && Number.isInteger(extractedNumber);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('创建的轮播图数据中的_id应匹配banner_{number}格式', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(input, bannerId, timestamp);
            
            // 验证_id字段格式
            const pattern = /^banner_(\d+)$/;
            return pattern.test(bannerData._id);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: Default Order Value
   * For any new banner created without an explicit order value, the `order` field SHALL be set to 999.
   * 
   * Feature: banner-management, Property 5: Default Order Value
   * Validates: Requirements 6.3
   */
  describe('Property 5: Default Order Value', () => {
    test('未提供 order 时应默认为 999', () => {
      fc.assert(
        fc.property(
          // 生成不含 order 字段的轮播图输入数据
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined }),
            productId: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            // 确保 input 没有 order 字段
            const inputWithoutOrder = { ...input };
            delete inputWithoutOrder.order;
            
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(inputWithoutOrder, bannerId, timestamp);
            
            // 验证 order 默认值为 999
            return bannerData.order === 999;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('applyBannerDefaults 应将未提供的 order 设为 999', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined }),
            productId: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined })
          }),
          (input) => {
            // 确保 input 没有 order 字段
            const inputWithoutOrder = { ...input };
            delete inputWithoutOrder.order;
            
            const result = applyBannerDefaults(inputWithoutOrder);
            
            // 验证 order 默认值为 999
            return result.order === 999;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('提供 order 时应使用提供的值', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            order: fc.integer({ min: 0, max: 1000 })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(input, bannerId, timestamp);
            
            // 验证 order 使用提供的值
            return bannerData.order === input.order;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('order 为 0 时应保留 0 而不是使用默认值', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            const inputWithZeroOrder = { ...input, order: 0 };
            
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(inputWithZeroOrder, bannerId, timestamp);
            
            // 验证 order 为 0 时保留 0
            return bannerData.order === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Optional Product ID
   * For any banner, the `productId` field SHALL accept both empty string and valid product ID values.
   * 
   * Feature: banner-management, Property 8: Optional Product ID
   * Validates: Requirements 7.1, 7.2
   */
  describe('Property 8: Optional Product ID', () => {
    test('空字符串 productId 应通过验证', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (input) => {
            // 设置空字符串 productId
            const inputWithEmptyProductId = { ...input, productId: '' };
            
            const validation = validateBannerData(inputWithEmptyProductId);
            
            // 空字符串 productId 应通过验证
            return validation.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('有效的 productId 应通过验证', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          // 生成有效的产品ID
          fc.stringOf(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'),
            { minLength: 1, maxLength: 100 }
          ),
          (input, validProductId) => {
            const inputWithValidProductId = { ...input, productId: validProductId };
            
            const validation = validateBannerData(inputWithValidProductId);
            
            // 有效的 productId 应通过验证
            return validation.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('undefined productId 应通过验证', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (input) => {
            // 不设置 productId（undefined）
            const inputWithoutProductId = { ...input };
            delete inputWithoutProductId.productId;
            
            const validation = validateBannerData(inputWithoutProductId);
            
            // undefined productId 应通过验证
            return validation.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('null productId 应通过验证', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (input) => {
            // 设置 null productId
            const inputWithNullProductId = { ...input, productId: null };
            
            const validation = validateBannerData(inputWithNullProductId);
            
            // null productId 应通过验证
            return validation.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('创建的轮播图数据应正确存储 productId', () => {
      fc.assert(
        fc.property(
          fc.record({
            image: fc.string({ minLength: 1, maxLength: 200 })
          }),
          // 生成有效的产品ID或空字符串
          fc.oneof(
            fc.constant(''),
            fc.stringOf(
              fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'),
              { minLength: 1, maxLength: 50 }
            )
          ),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, productId, idNumber, timestamp) => {
            const inputWithProductId = { ...input, productId };
            
            const bannerId = generateBannerId(idNumber);
            const bannerData = createBannerData(inputWithProductId, bannerId, timestamp);
            
            // 验证 productId 被正确存储
            return bannerData.productId === productId;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Update Preserves Unchanged Fields
   * For any banner update operation, fields not included in the update payload 
   * SHALL remain unchanged in the resulting banner record.
   * 
   * Feature: banner-management, Property 6: Update Preserves Unchanged Fields
   * Validates: Requirements 3.3
   */
  describe('Property 6: Update Preserves Unchanged Fields', () => {
    test('更新操作应保留未更新的字段', () => {
      fc.assert(
        fc.property(
          // 生成完整的现有轮播图数据
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.string({ minLength: 0, maxLength: 50 }),
            subtitle: fc.string({ minLength: 0, maxLength: 100 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1),
            productId: fc.string({ minLength: 0, maxLength: 50 }),
            createTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            updateTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
          }),
          // 生成部分更新数据（只包含部分字段）
          fc.record({
            title: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
            subtitle: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (existingBanner, partialUpdate) => {
            // 过滤掉 undefined 的字段，模拟只传递部分字段的更新
            const updatePayload = {};
            if (partialUpdate.title !== undefined) updatePayload.title = partialUpdate.title;
            if (partialUpdate.subtitle !== undefined) updatePayload.subtitle = partialUpdate.subtitle;
            if (partialUpdate.order !== undefined) updatePayload.order = partialUpdate.order;
            if (partialUpdate.status !== undefined) updatePayload.status = partialUpdate.status;
            
            const updatedBanner = applyBannerUpdate(existingBanner, updatePayload);
            
            // 验证未更新的字段保持不变
            // _id 应保持不变
            if (updatedBanner._id !== existingBanner._id) return false;
            
            // image 未在更新中，应保持不变
            if (updatedBanner.image !== existingBanner.image) return false;
            
            // productId 未在更新中，应保持不变
            if (updatedBanner.productId !== existingBanner.productId) return false;
            
            // createTime 应保持不变
            if (updatedBanner.createTime.getTime() !== existingBanner.createTime.getTime()) return false;
            
            // 验证更新的字段被正确更新
            if (partialUpdate.title !== undefined && updatedBanner.title !== partialUpdate.title) return false;
            if (partialUpdate.subtitle !== undefined && updatedBanner.subtitle !== partialUpdate.subtitle) return false;
            if (partialUpdate.order !== undefined && updatedBanner.order !== partialUpdate.order) return false;
            if (partialUpdate.status !== undefined && updatedBanner.status !== partialUpdate.status) return false;
            
            // 验证未更新的可选字段保持不变
            if (partialUpdate.title === undefined && updatedBanner.title !== existingBanner.title) return false;
            if (partialUpdate.subtitle === undefined && updatedBanner.subtitle !== existingBanner.subtitle) return false;
            if (partialUpdate.order === undefined && updatedBanner.order !== existingBanner.order) return false;
            if (partialUpdate.status === undefined && updatedBanner.status !== existingBanner.status) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空更新负载应保留所有原始字段', () => {
      fc.assert(
        fc.property(
          // 生成完整的现有轮播图数据
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.string({ minLength: 0, maxLength: 50 }),
            subtitle: fc.string({ minLength: 0, maxLength: 100 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1),
            productId: fc.string({ minLength: 0, maxLength: 50 }),
            createTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            updateTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
          }),
          (existingBanner) => {
            // 空更新负载
            const updatePayload = {};
            
            const updatedBanner = applyBannerUpdate(existingBanner, updatePayload);
            
            // 验证所有原始字段保持不变（除了 updateTime）
            if (updatedBanner._id !== existingBanner._id) return false;
            if (updatedBanner.image !== existingBanner.image) return false;
            if (updatedBanner.title !== existingBanner.title) return false;
            if (updatedBanner.subtitle !== existingBanner.subtitle) return false;
            if (updatedBanner.order !== existingBanner.order) return false;
            if (updatedBanner.status !== existingBanner.status) return false;
            if (updatedBanner.productId !== existingBanner.productId) return false;
            if (updatedBanner.createTime.getTime() !== existingBanner.createTime.getTime()) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('更新单个字段应只改变该字段', () => {
      fc.assert(
        fc.property(
          // 生成完整的现有轮播图数据
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.string({ minLength: 0, maxLength: 50 }),
            subtitle: fc.string({ minLength: 0, maxLength: 100 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1),
            productId: fc.string({ minLength: 0, maxLength: 50 }),
            createTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            updateTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
          }),
          // 生成新的 title 值
          fc.string({ minLength: 1, maxLength: 50 }),
          (existingBanner, newTitle) => {
            // 只更新 title
            const updatePayload = { title: newTitle };
            
            const updatedBanner = applyBannerUpdate(existingBanner, updatePayload);
            
            // 验证 title 被更新
            if (updatedBanner.title !== newTitle) return false;
            
            // 验证其他字段保持不变
            if (updatedBanner._id !== existingBanner._id) return false;
            if (updatedBanner.image !== existingBanner.image) return false;
            if (updatedBanner.subtitle !== existingBanner.subtitle) return false;
            if (updatedBanner.order !== existingBanner.order) return false;
            if (updatedBanner.status !== existingBanner.status) return false;
            if (updatedBanner.productId !== existingBanner.productId) return false;
            if (updatedBanner.createTime.getTime() !== existingBanner.createTime.getTime()) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('更新 image 字段应只改变 image', () => {
      fc.assert(
        fc.property(
          // 生成完整的现有轮播图数据
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            image: fc.string({ minLength: 1, maxLength: 200 }),
            title: fc.string({ minLength: 0, maxLength: 50 }),
            subtitle: fc.string({ minLength: 0, maxLength: 100 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1),
            productId: fc.string({ minLength: 0, maxLength: 50 }),
            createTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
            updateTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
          }),
          // 生成新的 image 值
          fc.string({ minLength: 1, maxLength: 200 }),
          (existingBanner, newImage) => {
            // 只更新 image
            const updatePayload = { image: newImage };
            
            const updatedBanner = applyBannerUpdate(existingBanner, updatePayload);
            
            // 验证 image 被更新
            if (updatedBanner.image !== newImage) return false;
            
            // 验证其他字段保持不变
            if (updatedBanner._id !== existingBanner._id) return false;
            if (updatedBanner.title !== existingBanner.title) return false;
            if (updatedBanner.subtitle !== existingBanner.subtitle) return false;
            if (updatedBanner.order !== existingBanner.order) return false;
            if (updatedBanner.status !== existingBanner.status) return false;
            if (updatedBanner.productId !== existingBanner.productId) return false;
            if (updatedBanner.createTime.getTime() !== existingBanner.createTime.getTime()) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
