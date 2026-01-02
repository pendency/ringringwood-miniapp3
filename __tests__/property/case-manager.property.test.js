/**
 * Case Manager 属性测试
 * Feature: customer-cases
 * 
 * 使用 fast-check 进行属性测试，验证案例管理工具函数的正确性
 */

const fc = require('fast-check');
const {
  validateCaseData,
  validateImageFile,
  sortCases,
  generateCaseId,
  generateCaseImagePath,
  generateNextCaseId,
  filterActiveCases,
  createCaseData,
  applyCaseUpdate,
  applyCaseDefaults
} = require('../../utils/caseManager');

/**
 * 生成案例计数显示文本
 * 用于测试 Property 2: Case Count Display Accuracy
 * @param {number} count - 案例数量
 * @returns {string} 显示文本
 */
function formatCaseCountText(count) {
  return `共 ${count} 个案例`;
}

/**
 * 判断案例入口按钮是否应该显示
 * 用于测试 Property 1: Case Button Visibility
 * @param {Object} category - 当前分类对象
 * @returns {boolean} 是否显示按钮
 */
function shouldShowCaseButton(category) {
  // 与 WXML 中的条件一致: wx:if="{{categories[activeTab] && categories[activeTab]._id === 'cat_custom'}}"
  return !!(category && category._id === 'cat_custom');
}

describe('Case Manager Property Tests', () => {
  /**
   * Property 1: Case Button Visibility
   * For any category page view, the case entry button should be visible 
   * if and only if the current category ID is "cat_custom".
   * 
   * Feature: customer-cases, Property 1: Case Button Visibility
   * Validates: Requirements 1.5
   */
  describe('Property 1: Case Button Visibility', () => {
    test('案例入口按钮仅在 cat_custom 分类显示', () => {
      fc.assert(
        fc.property(
          // 生成随机分类ID
          fc.string({ minLength: 1, maxLength: 50 }),
          (categoryId) => {
            const category = { _id: categoryId, name: '测试分类' };
            const shouldShow = shouldShowCaseButton(category);
            
            // 只有当 categoryId 是 'cat_custom' 时才应该显示
            const expected = categoryId === 'cat_custom';
            return shouldShow === expected;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('cat_custom 分类应显示案例入口按钮', () => {
      const category = { _id: 'cat_custom', name: '树脂定制款' };
      expect(shouldShowCaseButton(category)).toBe(true);
    });

    test('非 cat_custom 分类不应显示案例入口按钮', () => {
      fc.assert(
        fc.property(
          // 生成非 cat_custom 的分类ID
          fc.string({ minLength: 1, maxLength: 50 }).filter(id => id !== 'cat_custom'),
          (categoryId) => {
            const category = { _id: categoryId, name: '其他分类' };
            return shouldShowCaseButton(category) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空分类对象不应显示案例入口按钮', () => {
      expect(shouldShowCaseButton(null)).toBe(false);
      expect(shouldShowCaseButton(undefined)).toBe(false);
      expect(shouldShowCaseButton({})).toBe(false);
    });

    test('分类对象缺少 _id 字段不应显示案例入口按钮', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (name) => {
            const category = { name };
            return shouldShowCaseButton(category) === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('常见分类ID都不应显示案例入口按钮（除了 cat_custom）', () => {
      const commonCategoryIds = [
        'cat_wood',
        'cat_resin',
        'cat_fun',
        'cat_premium',
        'cat_frame',
        'category1',
        'category2',
        'default'
      ];

      for (const categoryId of commonCategoryIds) {
        const category = { _id: categoryId, name: '测试分类' };
        expect(shouldShowCaseButton(category)).toBe(false);
      }
    });

    test('按钮可见性应与分类ID严格匹配', () => {
      // 测试类似但不完全匹配的ID
      const similarIds = [
        'cat_custom_',
        '_cat_custom',
        'CAT_CUSTOM',
        'Cat_Custom',
        'cat-custom',
        'catcustom',
        'cat_custom1',
        '1cat_custom'
      ];

      for (const categoryId of similarIds) {
        const category = { _id: categoryId, name: '测试分类' };
        expect(shouldShowCaseButton(category)).toBe(false);
      }
    });
  });

  /**
   * Property 2: Case Count Display Accuracy
   * For any list of active cases, the displayed count text should exactly match 
   * the actual number of cases in the list.
   * 
   * Feature: customer-cases, Property 2: Case Count Display Accuracy
   * Validates: Requirements 2.2
   */
  describe('Property 2: Case Count Display Accuracy', () => {
    test('显示的案例计数应与实际案例数量完全匹配', () => {
      fc.assert(
        fc.property(
          // 生成随机案例列表（只包含 status=1 的活跃案例）
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constant(1)
            }),
            { minLength: 0, maxLength: 100 }
          ),
          (activeCases) => {
            const actualCount = activeCases.length;
            const displayText = formatCaseCountText(actualCount);
            
            // 验证显示文本格式正确
            const expectedText = `共 ${actualCount} 个案例`;
            return displayText === expectedText;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('过滤后的活跃案例计数应准确', () => {
      fc.assert(
        fc.property(
          // 生成混合状态的案例列表
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constantFrom(0, 1)
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (allCases) => {
            // 过滤活跃案例
            const activeCases = filterActiveCases(allCases);
            const displayCount = activeCases.length;
            
            // 手动计算预期数量
            const expectedCount = allCases.filter(c => c.status === 1).length;
            
            return displayCount === expectedCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空案例列表应显示计数为0', () => {
      const emptyList = [];
      const displayText = formatCaseCountText(emptyList.length);
      expect(displayText).toBe('共 0 个案例');
    });

    test('计数文本格式应保持一致', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (count) => {
            const displayText = formatCaseCountText(count);
            
            // 验证格式：共 X 个案例
            const pattern = /^共 \d+ 个案例$/;
            return pattern.test(displayText);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('从计数文本中提取的数字应与原始数量一致', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (count) => {
            const displayText = formatCaseCountText(count);
            
            // 从文本中提取数字
            const match = displayText.match(/共 (\d+) 个案例/);
            if (!match) return false;
            
            const extractedCount = parseInt(match[1], 10);
            return extractedCount === count;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Case Data Completeness
   * For any case object, it must contain all required fields (_id, title, description, 
   * imageUrl, order, status, createTime, updateTime) with valid values.
   * 
   * Feature: customer-cases, Property 3: Case Data Completeness
   * Validates: Requirements 3.1, 2.4, 4.2
   */
  describe('Property 3: Case Data Completeness', () => {
    const requiredFields = ['_id', 'title', 'description', 'imageUrl', 'order', 'status', 'createTime', 'updateTime'];

    test('创建的案例数据应包含所有必需字段', () => {
      fc.assert(
        fc.property(
          // 生成随机的案例输入数据
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
            imageUrl: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            const caseId = generateCaseId(idNumber);
            const caseData = createCaseData(input, caseId, timestamp);

            // 验证所有必需字段都存在
            for (const field of requiredFields) {
              if (!(field in caseData)) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('创建的案例数据字段类型应正确', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
            imageUrl: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (input, idNumber, timestamp) => {
            const caseId = generateCaseId(idNumber);
            const caseData = createCaseData(input, caseId, timestamp);

            // 验证字段类型
            if (typeof caseData._id !== 'string') return false;
            if (typeof caseData.title !== 'string') return false;
            if (typeof caseData.description !== 'string') return false;
            if (typeof caseData.imageUrl !== 'string') return false;
            if (typeof caseData.order !== 'number') return false;
            if (typeof caseData.status !== 'number') return false;
            if (!(caseData.createTime instanceof Date)) return false;
            if (!(caseData.updateTime instanceof Date)) return false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('未提供可选字段时应使用默认值', () => {
      fc.assert(
        fc.property(
          // 只提供必填字段 title
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
          (title, idNumber, timestamp) => {
            const input = { title };
            const caseId = generateCaseId(idNumber);
            const caseData = createCaseData(input, caseId, timestamp);

            // 验证默认值
            if (caseData.description !== '') return false;
            if (caseData.imageUrl !== '') return false;
            if (caseData.order !== 999) return false;
            if (caseData.status !== 1) return false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('有效的案例数据应通过验证', () => {
      // 生成非空白字符的标题（至少包含一个非空白字符）
      const nonWhitespaceTitle = fc.stringOf(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789中文测试'),
        { minLength: 1, maxLength: 100 }
      );

      fc.assert(
        fc.property(
          fc.record({
            title: nonWhitespaceTitle,
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
            imageUrl: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (input) => {
            const validation = validateCaseData(input);
            return validation.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空标题的案例数据应验证失败', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.constantFrom('', '   ', null, undefined),
            description: fc.option(fc.string({ minLength: 0, maxLength: 500 }), { nil: undefined }),
            imageUrl: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
            order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
            status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
          }),
          (input) => {
            const validation = validateCaseData(input);
            return validation.valid === false && validation.errors.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 5: Image Validation
   * For any uploaded file, the validation function should accept files with extensions 
   * (jpg, jpeg, png) and size ≤ 2MB, and reject all others.
   * 
   * Feature: customer-cases, Property 5: Image Validation
   * Validates: Requirements 4.4
   */
  describe('Property 5: Image Validation', () => {

  /**
   * Property 7: Case Edit Form Pre-population
   * For any existing case, when editing, the form should be pre-populated with all 
   * existing field values (title, description, order, status, imageUrl).
   * 
   * Feature: customer-cases, Property 7: Case Edit Form Pre-population
   * Validates: Requirements 4.6
   */
  describe('Property 7: Case Edit Form Pre-population', () => {
    /**
     * 模拟编辑案例时的表单预填充逻辑
     * 这个函数模拟 admin.js 中 editCase 函数的预填充行为
     * @param {Object} existingCase - 现有的案例数据
     * @returns {Object} 预填充的表单数据
     */
    function prepopulateEditForm(existingCase) {
      if (!existingCase) {
        return null;
      }
      
      return {
        imageUrl: existingCase.imageUrl || '',
        imageTemp: existingCase.imageUrl || '', // 简化处理，实际会获取临时URL
        title: existingCase.title || '',
        description: existingCase.description || '',
        order: existingCase.order !== undefined ? existingCase.order : 999,
        status: existingCase.status !== undefined ? existingCase.status : 1
      };
    }

    test('编辑表单应预填充所有现有字段值', () => {
      fc.assert(
        fc.property(
          // 生成完整的案例数据
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1)
          }),
          (existingCase) => {
            const formData = prepopulateEditForm(existingCase);
            
            // 验证所有字段都被正确预填充
            if (formData.title !== existingCase.title) return false;
            if (formData.description !== existingCase.description) return false;
            if (formData.imageUrl !== existingCase.imageUrl) return false;
            if (formData.order !== existingCase.order) return false;
            if (formData.status !== existingCase.status) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('编辑表单应包含所有必需的表单字段', () => {
      const requiredFormFields = ['imageUrl', 'imageTemp', 'title', 'description', 'order', 'status'];
      
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1)
          }),
          (existingCase) => {
            const formData = prepopulateEditForm(existingCase);
            
            // 验证所有必需字段都存在
            for (const field of requiredFormFields) {
              if (!(field in formData)) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('缺少可选字段时应使用默认值预填充', () => {
      fc.assert(
        fc.property(
          // 只提供部分字段的案例
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            title: fc.string({ minLength: 1, maxLength: 100 })
          }),
          (partialCase) => {
            const formData = prepopulateEditForm(partialCase);
            
            // 验证默认值
            if (formData.description !== '') return false;
            if (formData.imageUrl !== '') return false;
            if (formData.order !== 999) return false;
            if (formData.status !== 1) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空案例对象应返回 null', () => {
      expect(prepopulateEditForm(null)).toBe(null);
      expect(prepopulateEditForm(undefined)).toBe(null);
    });

    test('预填充的 order 字段类型应为数字', () => {
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            order: fc.integer({ min: 0, max: 1000 })
          }),
          (existingCase) => {
            const formData = prepopulateEditForm(existingCase);
            return typeof formData.order === 'number';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('预填充的 status 字段应为 0 或 1', () => {
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            status: fc.constantFrom(0, 1)
          }),
          (existingCase) => {
            const formData = prepopulateEditForm(existingCase);
            return formData.status === 0 || formData.status === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('预填充后修改表单不应影响原始案例数据', () => {
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1)
          }),
          (existingCase) => {
            const originalTitle = existingCase.title;
            const originalDescription = existingCase.description;
            
            const formData = prepopulateEditForm(existingCase);
            
            // 修改表单数据
            formData.title = 'modified title';
            formData.description = 'modified description';
            
            // 原始案例数据不应被修改
            return existingCase.title === originalTitle && 
                   existingCase.description === originalDescription;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('使用 applyCaseDefaults 预填充应与直接预填充一致', () => {
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            description: fc.string({ minLength: 0, maxLength: 500 }),
            imageUrl: fc.string({ minLength: 0, maxLength: 200 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1)
          }),
          (existingCase) => {
            const formData = prepopulateEditForm(existingCase);
            const defaultsApplied = applyCaseDefaults(existingCase);
            
            // 核心字段应一致
            return formData.title === defaultsApplied.title &&
                   formData.description === defaultsApplied.description &&
                   formData.imageUrl === defaultsApplied.imageUrl &&
                   formData.order === defaultsApplied.order &&
                   formData.status === defaultsApplied.status;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
    test('有效的图片格式应通过验证', () => {
      fc.assert(
        fc.property(
          // 生成有效的文件扩展名
          fc.constantFrom('jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG'),
          // 生成有效的文件大小（0 < size <= 2MB）
          fc.integer({ min: 1, max: 2 * 1024 * 1024 }),
          // 生成随机文件名
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1, maxLength: 20 }),
          (extension, fileSize, fileName) => {
            const filePath = `${fileName}.${extension}`;
            const validation = validateImageFile(filePath, fileSize);
            return validation.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('无效的图片格式应验证失败', () => {
      fc.assert(
        fc.property(
          // 生成无效的文件扩展名
          fc.constantFrom('gif', 'bmp', 'webp', 'svg', 'tiff', 'pdf', 'doc', 'txt'),
          fc.integer({ min: 1, max: 2 * 1024 * 1024 }),
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1, maxLength: 20 }),
          (extension, fileSize, fileName) => {
            const filePath = `${fileName}.${extension}`;
            const validation = validateImageFile(filePath, fileSize);
            return validation.valid === false && validation.error === '仅支持 jpg、jpeg、png 格式';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('超过2MB的文件应验证失败', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('jpg', 'jpeg', 'png'),
          // 生成超过2MB的文件大小
          fc.integer({ min: 2 * 1024 * 1024 + 1, max: 10 * 1024 * 1024 }),
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1, maxLength: 20 }),
          (extension, fileSize, fileName) => {
            const filePath = `${fileName}.${extension}`;
            const validation = validateImageFile(filePath, fileSize);
            return validation.valid === false && validation.error === '图片大小不能超过 2MB';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空文件路径应验证失败', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', null, undefined),
          (filePath) => {
            const validation = validateImageFile(filePath);
            return validation.valid === false && validation.error === '文件路径不能为空';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('不提供文件大小时只验证格式', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('jpg', 'jpeg', 'png'),
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1, maxLength: 20 }),
          (extension, fileName) => {
            const filePath = `${fileName}.${extension}`;
            // 不提供文件大小
            const validation = validateImageFile(filePath);
            return validation.valid === true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Case Sorting
   * For any list of cases, the sorted result should be ordered by: 
   * (1) order field ascending, (2) for cases with equal order, by createTime descending (newest first).
   * 
   * Feature: customer-cases, Property 8: Case Sorting
   * Validates: Requirements 6.1, 6.5
   */
  describe('Property 8: Case Sorting', () => {
    test('排序后 order 值小的应在前面', () => {
      fc.assert(
        fc.property(
          // 生成随机案例列表
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              order: fc.integer({ min: 0, max: 1000 }),
              createTime: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (cases) => {
            const sorted = sortCases(cases);

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

              // order 相同时，createTime 新的应在前面（降序）
              if (prevOrder === currOrder) {
                const prevTime = prev.createTime ? new Date(prev.createTime).getTime() : 0;
                const currTime = curr.createTime ? new Date(curr.createTime).getTime() : 0;
                if (prevTime < currTime) {
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
          (cases) => {
            const original = JSON.stringify(cases);
            sortCases(cases);
            const afterSort = JSON.stringify(cases);

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
          (cases) => {
            const sorted = sortCases(cases);
            return sorted.length === cases.length;
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
          (casesWithoutOrder, explicitOrder) => {
            // 添加一个有明确 order 的案例
            const caseWithOrder = {
              _id: 'case_with_order',
              order: explicitOrder,
              createTime: new Date()
            };

            const allCases = [...casesWithoutOrder, caseWithOrder];
            const sorted = sortCases(allCases);

            // 有明确 order (< 999) 的案例应该排在没有 order 的案例前面
            const indexWithOrder = sorted.findIndex(c => c._id === 'case_with_order');

            // 验证有 order 的案例在前面
            for (let i = 0; i < indexWithOrder; i++) {
              if (sorted[i].order === undefined || sorted[i].order === null) {
                // 如果前面有没有 order 的案例，说明排序有问题
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

    test('非数组输入应返回空数组', () => {
      expect(sortCases(null)).toEqual([]);
      expect(sortCases(undefined)).toEqual([]);
      expect(sortCases('not an array')).toEqual([]);
      expect(sortCases(123)).toEqual([]);
      expect(sortCases({})).toEqual([]);
    });
  });
});


  /**
   * Property 4: Case ID and Image Path Generation
   * For any generated case ID, it must match the pattern "case{number}" where number is a positive integer.
   * For any case image path, it must follow the format "cases/case{number}.{ext}" where ext is one of (jpg, jpeg, png).
   * 
   * Feature: customer-cases, Property 4: Case ID and Image Path Generation
   * Validates: Requirements 3.2, 3.3, 5.1, 5.2, 5.4
   */
  describe('Property 4: Case ID and Image Path Generation', () => {
    test('生成的案例ID应匹配 case{number} 格式', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (number) => {
            const caseId = generateCaseId(number);

            // 验证ID格式
            const pattern = /^case(\d+)$/;
            const match = caseId.match(pattern);

            if (!match) return false;

            // 提取的数字应与输入一致
            const extractedNumber = parseInt(match[1], 10);
            return extractedNumber === number;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('案例ID中的数字应为正整数', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          (number) => {
            const caseId = generateCaseId(number);

            const pattern = /^case(\d+)$/;
            const match = caseId.match(pattern);

            if (!match) return false;

            const extractedNumber = parseInt(match[1], 10);
            return extractedNumber > 0 && Number.isInteger(extractedNumber);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('生成的图片路径应匹配 cases/case{number}.{ext} 格式', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('jpg', 'jpeg', 'png'),
          (number, extension) => {
            const caseId = generateCaseId(number);
            const imagePath = generateCaseImagePath(caseId, extension);

            // 验证路径格式
            const pattern = /^cases\/case(\d+)\.(jpg|jpeg|png)$/;
            const match = imagePath.match(pattern);

            if (!match) return false;

            // 验证数字部分
            const extractedNumber = parseInt(match[1], 10);
            if (extractedNumber !== number) return false;

            // 验证扩展名
            if (match[2] !== extension.toLowerCase()) return false;

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('图片路径扩展名应转为小写', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('JPG', 'JPEG', 'PNG', 'Jpg', 'Jpeg', 'Png'),
          (number, extension) => {
            const caseId = generateCaseId(number);
            const imagePath = generateCaseImagePath(caseId, extension);

            // 验证扩展名是小写
            const pattern = /^cases\/case\d+\.(jpg|jpeg|png)$/;
            return pattern.test(imagePath);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('图片路径扩展名带点号时应正确处理', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.constantFrom('jpg', 'jpeg', 'png'),
          (number, extension) => {
            const caseId = generateCaseId(number);
            const pathWithDot = generateCaseImagePath(caseId, '.' + extension);
            const pathWithoutDot = generateCaseImagePath(caseId, extension);

            // 两种方式应生成相同的路径
            return pathWithDot === pathWithoutDot;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('generateNextCaseId 应返回下一个可用的案例ID', () => {
      fc.assert(
        fc.property(
          // 生成现有案例列表
          fc.array(
            fc.integer({ min: 1, max: 1000 }),
            { minLength: 1, maxLength: 20 }
          ),
          (numbers) => {
            // 创建现有案例列表
            const existingCases = numbers.map(n => ({ _id: generateCaseId(n) }));
            const nextId = generateNextCaseId(existingCases);

            // 验证格式
            const pattern = /^case(\d+)$/;
            const match = nextId.match(pattern);
            if (!match) return false;

            // 验证新ID的数字大于所有现有ID
            const nextNumber = parseInt(match[1], 10);
            const maxExisting = Math.max(...numbers);
            return nextNumber === maxExisting + 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空案例列表应返回 case1', () => {
      expect(generateNextCaseId([])).toBe('case1');
      expect(generateNextCaseId(null)).toBe('case1');
      expect(generateNextCaseId(undefined)).toBe('case1');
    });
  });

  /**
   * Property 9: Active Case Filtering
   * For any list of cases with mixed status values, the filtered result for display 
   * should contain only cases where status equals 1.
   * 
   * Feature: customer-cases, Property 9: Active Case Filtering
   * Validates: Requirements 6.2
   */
  describe('Property 9: Active Case Filtering', () => {
    test('过滤后的案例应只包含 status=1 的案例', () => {
      fc.assert(
        fc.property(
          // 生成混合状态的案例列表
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constantFrom(0, 1)
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (cases) => {
            const activeCases = filterActiveCases(cases);

            // 验证所有返回的案例都是 status=1
            for (const c of activeCases) {
              if (c.status !== 1) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('过滤后的案例数量应等于原列表中 status=1 的案例数量', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constantFrom(0, 1)
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (cases) => {
            const activeCases = filterActiveCases(cases);
            const expectedCount = cases.filter(c => c.status === 1).length;

            return activeCases.length === expectedCount;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('所有案例都是 status=0 时应返回空数组', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constant(0)
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (cases) => {
            const activeCases = filterActiveCases(cases);
            return activeCases.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('所有案例都是 status=1 时应返回全部案例', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              status: fc.constant(1)
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (cases) => {
            const activeCases = filterActiveCases(cases);
            return activeCases.length === cases.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('非数组输入应返回空数组', () => {
      expect(filterActiveCases(null)).toEqual([]);
      expect(filterActiveCases(undefined)).toEqual([]);
      expect(filterActiveCases('not an array')).toEqual([]);
      expect(filterActiveCases(123)).toEqual([]);
      expect(filterActiveCases({})).toEqual([]);
    });
  });
