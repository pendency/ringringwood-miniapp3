/**
 * Category Image Upload 属性测试
 * Feature: category-image-upload
 * 
 * 使用 fast-check 进行属性测试，验证分类图片上传功能的正确性
 */

const fc = require('fast-check');

/**
 * 分类选择器数据处理函数
 * 模拟 admin.js 中的分类选择器逻辑
 */

// 生成分类选择器选项
function generateCategorySelectorOptions(categories) {
  if (!Array.isArray(categories)) {
    return [];
  }
  return categories.map(cat => ({
    value: cat._id,
    label: cat.name
  }));
}

// 处理分类选择变更
function handleCategorySelectChange(categories, selectedIndex) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return null;
  }
  if (selectedIndex < 0 || selectedIndex >= categories.length) {
    return null;
  }
  return categories[selectedIndex];
}

// 判断上传按钮是否应该启用
function shouldEnableUploadButton(selectedCategory) {
  return selectedCategory !== null && selectedCategory !== undefined;
}

// 获取上传按钮文本
function getUploadButtonText(category, type) {
  if (!category) {
    return type === 'icon' ? '上传图标' : '上传图片';
  }
  
  if (type === 'icon') {
    return category.icon ? '更换图标' : '上传图标';
  } else {
    return category.image ? '更换图片' : '上传图片';
  }
}

// 更新分类字段
function updateCategoryField(category, fieldType, newValue) {
  if (!category || !fieldType || !newValue) {
    return { success: false, error: '参数无效' };
  }
  
  if (fieldType !== 'icon' && fieldType !== 'image') {
    return { success: false, error: '无效的字段类型' };
  }
  
  const updatedCategory = { ...category };
  updatedCategory[fieldType] = newValue;
  
  return {
    success: true,
    category: updatedCategory
  };
}

// 生成错误信息
function generateErrorMessage(errorType) {
  const errorMessages = {
    'no_category': '请先选择分类',
    'upload_failed': '上传失败，请重试',
    'update_failed': '更新失败，请重试',
    'network_error': '网络连接失败，请检查网络后重试',
    'invalid_file': '无效的文件格式'
  };
  
  return errorMessages[errorType] || '操作失败，请重试';
}

describe('Category Image Upload Property Tests', () => {
  /**
   * Property 1: 分类选择器数据完整性
   * For any 分类列表，当分类选择器加载完成后，选择器中的选项数量应该等于分类列表的长度，
   * 且每个选项的名称应该与对应分类的名称一致。
   * 
   * Feature: category-image-upload, Property 1: 分类选择器数据完整性
   * Validates: Requirements 1.2, 2.2
   */
  describe('Property 1: 分类选择器数据完整性', () => {
    test('选择器选项数量应等于分类列表长度', () => {
      fc.assert(
        fc.property(
          // 生成随机分类列表
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
              icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
              image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
              order: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: undefined }),
              status: fc.option(fc.constantFrom(0, 1), { nil: undefined })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (categories) => {
            const options = generateCategorySelectorOptions(categories);
            
            // 选项数量应等于分类列表长度
            return options.length === categories.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('每个选项的名称应与对应分类的名称一致', () => {
      fc.assert(
        fc.property(
          // 生成随机分类列表
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
              icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
              image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (categories) => {
            const options = generateCategorySelectorOptions(categories);
            
            // 每个选项的名称应与对应分类的名称一致
            for (let i = 0; i < categories.length; i++) {
              if (options[i].label !== categories[i].name) {
                return false;
              }
              if (options[i].value !== categories[i]._id) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('选择分类后应返回正确的分类对象', () => {
      fc.assert(
        fc.property(
          // 生成随机分类列表
          fc.array(
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 50 }),
              description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
              icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
              image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (categories) => {
            // 随机选择一个索引
            const randomIndex = Math.floor(Math.random() * categories.length);
            const selectedCategory = handleCategorySelectChange(categories, randomIndex);
            
            // 选择的分类应与列表中对应索引的分类一致
            return selectedCategory !== null &&
                   selectedCategory._id === categories[randomIndex]._id &&
                   selectedCategory.name === categories[randomIndex].name;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('空分类列表应返回空选项数组', () => {
      const options = generateCategorySelectorOptions([]);
      expect(options).toEqual([]);
      expect(options.length).toBe(0);
    });

    test('无效输入应返回空选项数组', () => {
      expect(generateCategorySelectorOptions(null)).toEqual([]);
      expect(generateCategorySelectorOptions(undefined)).toEqual([]);
      expect(generateCategorySelectorOptions('invalid')).toEqual([]);
    });
  });


  /**
   * Property 2: 上传按钮状态联动
   * For any 页面状态，当 selectedCategoryForUpload 为 null 时，上传按钮应该处于禁用状态；
   * 当 selectedCategoryForUpload 不为 null 时，上传按钮应该处于启用状态。
   * 
   * Feature: category-image-upload, Property 2: 上传按钮状态联动
   * Validates: Requirements 2.3, 2.4
   */
  describe('Property 2: 上传按钮状态联动', () => {
    test('selectedCategoryForUpload 为 null 时，上传按钮应禁用', () => {
      fc.assert(
        fc.property(
          // 生成 null 或 undefined
          fc.constantFrom(null, undefined),
          (selectedCategory) => {
            const isEnabled = shouldEnableUploadButton(selectedCategory);
            
            // 未选择分类时，按钮应禁用
            return isEnabled === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('selectedCategoryForUpload 不为 null 时，上传按钮应启用', () => {
      fc.assert(
        fc.property(
          // 生成有效的分类对象
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
            icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
            image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined })
          }),
          (selectedCategory) => {
            const isEnabled = shouldEnableUploadButton(selectedCategory);
            
            // 已选择分类时，按钮应启用
            return isEnabled === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('按钮状态应与分类选择状态严格对应', () => {
      fc.assert(
        fc.property(
          // 生成随机的分类选择状态（有分类或无分类）
          fc.oneof(
            fc.constant(null),
            fc.record({
              _id: fc.string({ minLength: 1, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 50 })
            })
          ),
          (selectedCategory) => {
            const isEnabled = shouldEnableUploadButton(selectedCategory);
            const hasCategory = selectedCategory !== null && selectedCategory !== undefined;
            
            // 按钮启用状态应与是否有选中分类严格对应
            return isEnabled === hasCategory;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: 分类字段更新正确性
   * For any 分类和图片类型（icon 或 image），当图片上传成功后，对应分类的相应字段（icon 或 image）
   * 应该被更新为新的 fileID，且其他字段保持不变。
   * 
   * Feature: category-image-upload, Property 3: 分类字段更新正确性
   * Validates: Requirements 3.5
   */
  describe('Property 3: 分类字段更新正确性', () => {
    test('更新 icon 字段时，其他字段应保持不变', () => {
      fc.assert(
        fc.property(
          // 生成完整的分类对象
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ maxLength: 200 }),
            icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: '' }),
            image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: '' }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1)
          }),
          // 生成新的 fileID
          fc.string({ minLength: 10, maxLength: 100 }),
          (category, newFileID) => {
            const result = updateCategoryField(category, 'icon', newFileID);
            
            if (!result.success) return false;
            
            const updatedCategory = result.category;
            
            // icon 字段应被更新
            if (updatedCategory.icon !== newFileID) return false;
            
            // 其他字段应保持不变
            if (updatedCategory._id !== category._id) return false;
            if (updatedCategory.name !== category.name) return false;
            if (updatedCategory.description !== category.description) return false;
            if (updatedCategory.image !== category.image) return false;
            if (updatedCategory.order !== category.order) return false;
            if (updatedCategory.status !== category.status) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('更新 image 字段时，其他字段应保持不变', () => {
      fc.assert(
        fc.property(
          // 生成完整的分类对象
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ maxLength: 200 }),
            icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: '' }),
            image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: '' }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1)
          }),
          // 生成新的 fileID
          fc.string({ minLength: 10, maxLength: 100 }),
          (category, newFileID) => {
            const result = updateCategoryField(category, 'image', newFileID);
            
            if (!result.success) return false;
            
            const updatedCategory = result.category;
            
            // image 字段应被更新
            if (updatedCategory.image !== newFileID) return false;
            
            // 其他字段应保持不变
            if (updatedCategory._id !== category._id) return false;
            if (updatedCategory.name !== category.name) return false;
            if (updatedCategory.description !== category.description) return false;
            if (updatedCategory.icon !== category.icon) return false;
            if (updatedCategory.order !== category.order) return false;
            if (updatedCategory.status !== category.status) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('只有指定的字段类型应被更新', () => {
      fc.assert(
        fc.property(
          // 生成完整的分类对象
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ maxLength: 200 }),
            icon: fc.string({ minLength: 1, maxLength: 200 }),
            image: fc.string({ minLength: 1, maxLength: 200 }),
            order: fc.integer({ min: 0, max: 1000 }),
            status: fc.constantFrom(0, 1)
          }),
          // 生成新的 fileID
          fc.string({ minLength: 10, maxLength: 100 }),
          // 生成字段类型
          fc.constantFrom('icon', 'image'),
          (category, newFileID, fieldType) => {
            const result = updateCategoryField(category, fieldType, newFileID);
            
            if (!result.success) return false;
            
            const updatedCategory = result.category;
            const otherFieldType = fieldType === 'icon' ? 'image' : 'icon';
            
            // 指定字段应被更新
            if (updatedCategory[fieldType] !== newFileID) return false;
            
            // 另一个字段应保持不变
            if (updatedCategory[otherFieldType] !== category[otherFieldType]) return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('无效的字段类型应返回失败', () => {
      fc.assert(
        fc.property(
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 })
          }),
          fc.string({ minLength: 10, maxLength: 100 }),
          // 生成无效的字段类型
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => s !== 'icon' && s !== 'image'),
          (category, newFileID, invalidFieldType) => {
            const result = updateCategoryField(category, invalidFieldType, newFileID);
            
            // 无效字段类型应返回失败
            return result.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 4: 错误信息显示
   * For any 上传错误，系统应该返回包含错误信息的结果对象，且错误信息不为空字符串。
   * 
   * Feature: category-image-upload, Property 4: 错误信息显示
   * Validates: Requirements 4.3
   */
  describe('Property 4: 错误信息显示', () => {
    test('所有错误类型应返回非空错误信息', () => {
      fc.assert(
        fc.property(
          // 生成已知的错误类型
          fc.constantFrom('no_category', 'upload_failed', 'update_failed', 'network_error', 'invalid_file'),
          (errorType) => {
            const errorMessage = generateErrorMessage(errorType);
            
            // 错误信息不应为空
            if (!errorMessage || errorMessage.trim() === '') return false;
            
            // 错误信息应为字符串
            if (typeof errorMessage !== 'string') return false;
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('未知错误类型应返回默认错误信息', () => {
      fc.assert(
        fc.property(
          // 生成随机的未知错误类型（排除已知错误类型和保留属性名）
          fc.stringOf(
            fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'),
            { minLength: 1, maxLength: 50 }
          ).filter(s => 
            !['no_category', 'upload_failed', 'update_failed', 'network_error', 'invalid_file'].includes(s)
          ),
          (unknownErrorType) => {
            const errorMessage = generateErrorMessage(unknownErrorType);
            
            // 应返回默认错误信息
            return errorMessage === '操作失败，请重试';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('特定错误类型应返回对应的错误信息', () => {
      // 验证特定错误类型的错误信息
      expect(generateErrorMessage('no_category')).toBe('请先选择分类');
      expect(generateErrorMessage('upload_failed')).toBe('上传失败，请重试');
      expect(generateErrorMessage('update_failed')).toBe('更新失败，请重试');
      expect(generateErrorMessage('network_error')).toBe('网络连接失败，请检查网络后重试');
      expect(generateErrorMessage('invalid_file')).toBe('无效的文件格式');
    });

    test('错误信息长度应在合理范围内', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('no_category', 'upload_failed', 'update_failed', 'network_error', 'invalid_file', 'unknown'),
          (errorType) => {
            const errorMessage = generateErrorMessage(errorType);
            
            // 错误信息长度应在合理范围内（1-100字符）
            return errorMessage.length >= 1 && errorMessage.length <= 100;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: 分类预览和按钮文本显示
   * For any 已选分类，如果该分类的 icon 字段不为空，则应显示图标预览且按钮文本为"更换图标"；
   * 如果 icon 字段为空，则按钮文本为"上传图标"。同理适用于 image 字段。
   * 
   * Feature: category-image-upload, Property 5: 分类预览和按钮文本显示
   * Validates: Requirements 5.2, 5.3
   */
  describe('Property 5: 分类预览和按钮文本显示', () => {
    test('有图标时按钮文本应为"更换图标"', () => {
      fc.assert(
        fc.property(
          // 生成有图标的分类
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            icon: fc.string({ minLength: 1, maxLength: 200 }), // 非空图标
            image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined })
          }),
          (category) => {
            const buttonText = getUploadButtonText(category, 'icon');
            
            // 有图标时应显示"更换图标"
            return buttonText === '更换图标';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('无图标时按钮文本应为"上传图标"', () => {
      fc.assert(
        fc.property(
          // 生成无图标的分类
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            icon: fc.constantFrom('', null, undefined), // 空图标
            image: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined })
          }),
          (category) => {
            const buttonText = getUploadButtonText(category, 'icon');
            
            // 无图标时应显示"上传图标"
            return buttonText === '上传图标';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('有图片时按钮文本应为"更换图片"', () => {
      fc.assert(
        fc.property(
          // 生成有图片的分类
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
            image: fc.string({ minLength: 1, maxLength: 200 }) // 非空图片
          }),
          (category) => {
            const buttonText = getUploadButtonText(category, 'image');
            
            // 有图片时应显示"更换图片"
            return buttonText === '更换图片';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('无图片时按钮文本应为"上传图片"', () => {
      fc.assert(
        fc.property(
          // 生成无图片的分类
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            icon: fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
            image: fc.constantFrom('', null, undefined) // 空图片
          }),
          (category) => {
            const buttonText = getUploadButtonText(category, 'image');
            
            // 无图片时应显示"上传图片"
            return buttonText === '上传图片';
          }
        ),
        { numRuns: 100 }
      );
    });

    test('未选择分类时应显示默认按钮文本', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(null, undefined),
          fc.constantFrom('icon', 'image'),
          (category, type) => {
            const buttonText = getUploadButtonText(category, type);
            
            // 未选择分类时应显示默认文本
            if (type === 'icon') {
              return buttonText === '上传图标';
            } else {
              return buttonText === '上传图片';
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('按钮文本应与分类字段状态严格对应', () => {
      fc.assert(
        fc.property(
          // 生成随机分类（有或无图标/图片）
          fc.record({
            _id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            icon: fc.oneof(
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined),
              fc.string({ minLength: 1, maxLength: 200 })
            ),
            image: fc.oneof(
              fc.constant(''),
              fc.constant(null),
              fc.constant(undefined),
              fc.string({ minLength: 1, maxLength: 200 })
            )
          }),
          fc.constantFrom('icon', 'image'),
          (category, type) => {
            const buttonText = getUploadButtonText(category, type);
            const hasField = category[type] && category[type].length > 0;
            
            if (type === 'icon') {
              if (hasField) {
                return buttonText === '更换图标';
              } else {
                return buttonText === '上传图标';
              }
            } else {
              if (hasField) {
                return buttonText === '更换图片';
              } else {
                return buttonText === '上传图片';
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
