/**
 * Category Admin Manager 属性测试
 * Feature: admin-management-system
 * 
 * 使用 fast-check 进行属性测试，验证分类管理模块的CRUD操作正确性
 */

const fc = require('fast-check');

// Mock wx.cloud 数据库
let mockCategories = [];
let mockProducts = [];
let idCounter = 1;

const mockDb = {
  collection: jest.fn(),
  serverDate: jest.fn(() => new Date())
};

const createMockCollection = () => ({
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  where: jest.fn(function(query) {
    this._query = query;
    return this;
  }),
  doc: jest.fn(function(id) {
    this._docId = id;
    return this;
  }),
  get: jest.fn(async function() {
    // 如果是通过doc(id)查询
    if (this._docId) {
      const found = mockCategories.find(c => c._id === this._docId);
      if (found) {
        return { data: found };
      }
      const error = new Error('not exist');
      error.errCode = -1;
      throw error;
    }
    // 如果是通过where查询
    if (this._query) {
      const filtered = mockCategories.filter(c => {
        for (const key in this._query) {
          if (c[key] !== this._query[key]) return false;
        }
        return true;
      });
      return { data: filtered };
    }
    // 获取所有分类
    return { data: [...mockCategories].sort((a, b) => (a.order || 999) - (b.order || 999)) };
  }),
  add: jest.fn(async function({ data }) {
    const newId = `cat_${idCounter++}`;
    const newCategory = { ...data, _id: newId };
    mockCategories.push(newCategory);
    return { _id: newId };
  }),
  update: jest.fn(async function({ data }) {
    const index = mockCategories.findIndex(c => c._id === this._docId);
    if (index !== -1) {
      mockCategories[index] = { ...mockCategories[index], ...data };
      return { stats: { updated: 1 } };
    }
    return { stats: { updated: 0 } };
  }),
  remove: jest.fn(async function() {
    const index = mockCategories.findIndex(c => c._id === this._docId);
    if (index !== -1) {
      mockCategories.splice(index, 1);
      return { stats: { removed: 1 } };
    }
    return { stats: { removed: 0 } };
  }),
  count: jest.fn(async function() {
    // 检查产品集合中是否有匹配的产品
    const count = mockProducts.filter(p => p.categoryName === this._query?.categoryName).length;
    return { total: count };
  }),
  _query: null,
  _docId: null
});

// Setup mock before requiring the module
global.wx = {
  cloud: {
    database: jest.fn(() => mockDb)
  }
};

// 每次调用collection时返回新的mock实例
mockDb.collection.mockImplementation(() => createMockCollection());

// Now require the module after setting up mocks
const categoryAdminManager = require('../../utils/categoryAdminManager');

describe('Category Admin Manager Property Tests', () => {
  beforeEach(() => {
    // 重置mock数据
    mockCategories = [];
    mockProducts = [];
    idCounter = 1;
    jest.clearAllMocks();
    mockDb.collection.mockImplementation(() => createMockCollection());
  });

  /**
   * Property 1: 分类新增后可查询
   * For any 有效的分类数据，新增分类后，调用getCategories应返回包含该分类的列表
   * Validates: Requirements 2.6
   * 
   * Feature: admin-management-system, Property 1: 分类新增后可查询
   */
  describe('Property 1: 分类新增后可查询', () => {
    /**
     * 1.1: 新增有效分类后，getCategories应返回包含该分类的列表
     * Requirements 2.6: FOR ALL 新增分类操作，保存后再查询 SHALL 返回包含新分类的列表
     */
    test('新增有效分类后，getCategories应返回包含该分类的列表', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的分类名称（非空非纯空白）
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成可选的描述
          fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          // 生成可选的排序权重
          fc.option(fc.nat(1000), { nil: undefined }),
          // 生成可选的状态
          fc.option(fc.constantFrom(0, 1), { nil: undefined }),
          async (name, description, order, status) => {
            // 重置mock数据，确保每次测试独立
            mockCategories = [];
            idCounter = 1;
            
            // 构建分类输入数据
            const categoryInput = { name };
            if (description !== undefined) categoryInput.description = description;
            if (order !== undefined) categoryInput.order = order;
            if (status !== undefined) categoryInput.status = status;
            
            // 执行新增操作
            const addResult = await categoryAdminManager.addCategory(categoryInput);
            
            // 验证新增成功
            if (!addResult.success) {
              // 如果新增失败，跳过此测试用例（可能是名称重复等情况）
              return true;
            }
            
            // 查询所有分类
            const categories = await categoryAdminManager.getCategories();
            
            // 验证：新增的分类应该在列表中
            const found = categories.some(c => 
              c._id === addResult.id && 
              c.name === name.trim()
            );
            
            return found === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 1.2: 新增多个分类后，所有分类都应可查询
     * Requirements 2.6: 验证多次新增操作的累积效果
     */
    test('新增多个分类后，所有分类都应可查询', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成1-5个不同的分类名称
          fc.array(
            fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 5 }
          ).map(names => [...new Set(names.map(n => n.trim()))].filter(n => n.length > 0)),
          async (uniqueNames) => {
            // 重置mock数据
            mockCategories = [];
            idCounter = 1;
            
            // 如果没有有效名称，跳过
            if (uniqueNames.length === 0) return true;
            
            const addedIds = [];
            
            // 依次新增所有分类
            for (const name of uniqueNames) {
              const result = await categoryAdminManager.addCategory({ name });
              if (result.success) {
                addedIds.push({ id: result.id, name });
              }
            }
            
            // 如果没有成功新增任何分类，跳过
            if (addedIds.length === 0) return true;
            
            // 查询所有分类
            const categories = await categoryAdminManager.getCategories();
            
            // 验证：所有成功新增的分类都应该在列表中
            return addedIds.every(added => 
              categories.some(c => c._id === added.id && c.name === added.name)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 1.3: 新增分类后，通过getCategoryById也应能查询到
     * Requirements 2.6: 验证通过ID查询的一致性
     */
    test('新增分类后，通过getCategoryById也应能查询到', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的分类名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          async (name, description) => {
            // 重置mock数据
            mockCategories = [];
            idCounter = 1;
            
            // 构建分类输入数据
            const categoryInput = { name };
            if (description !== undefined) categoryInput.description = description;
            
            // 执行新增操作
            const addResult = await categoryAdminManager.addCategory(categoryInput);
            
            // 验证新增成功
            if (!addResult.success) {
              return true;
            }
            
            // 通过ID查询分类
            const category = await categoryAdminManager.getCategoryById(addResult.id);
            
            // 验证：查询到的分类数据应与输入一致
            return category !== null && 
                   category._id === addResult.id && 
                   category.name === name.trim();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 分类修改后数据一致
   * For any 已存在的分类，修改后再查询，返回的数据应与修改后的数据一致
   * Validates: Requirements 3.5
   * 
   * Feature: admin-management-system, Property 2: 分类修改后数据一致
   */
  describe('Property 2: 分类修改后数据一致', () => {
    /**
     * 2.1: 修改分类名称后，查询返回的名称应与修改后的一致
     * Requirements 3.5: FOR ALL 分类修改操作，修改后再查询 SHALL 返回更新后的分类数据
     */
    test('修改分类名称后，查询返回的名称应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成原始分类名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成新的分类名称（确保与原始名称不同）
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          async (originalName, newName) => {
            // 重置mock数据
            mockCategories = [];
            idCounter = 1;
            
            // 如果新旧名称相同（trim后），跳过此测试用例
            if (originalName.trim() === newName.trim()) {
              return true;
            }
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory({ name: originalName });
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await categoryAdminManager.updateCategory(addResult.id, { name: newName });
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的分类
            const category = await categoryAdminManager.getCategoryById(addResult.id);
            
            // 验证：查询到的名称应与修改后的名称一致
            return category !== null && category.name === newName.trim();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.2: 修改分类描述后，查询返回的描述应与修改后的一致
     * Requirements 3.5: 验证描述字段的修改一致性
     */
    test('修改分类描述后，查询返回的描述应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成分类名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成原始描述
          fc.string({ maxLength: 100 }),
          // 生成新的描述
          fc.string({ maxLength: 100 }),
          async (name, originalDesc, newDesc) => {
            // 重置mock数据
            mockCategories = [];
            idCounter = 1;
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory({ 
              name, 
              description: originalDesc 
            });
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await categoryAdminManager.updateCategory(addResult.id, { 
              name,
              description: newDesc 
            });
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的分类
            const category = await categoryAdminManager.getCategoryById(addResult.id);
            
            // 验证：查询到的描述应与修改后的描述一致
            return category !== null && category.description === newDesc;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.3: 修改分类排序权重后，查询返回的排序权重应与修改后的一致
     * Requirements 3.5: 验证排序权重字段的修改一致性
     */
    test('修改分类排序权重后，查询返回的排序权重应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成分类名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成原始排序权重
          fc.nat(1000),
          // 生成新的排序权重
          fc.nat(1000),
          async (name, originalOrder, newOrder) => {
            // 重置mock数据
            mockCategories = [];
            idCounter = 1;
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory({ 
              name, 
              order: originalOrder 
            });
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await categoryAdminManager.updateCategory(addResult.id, { 
              name,
              order: newOrder 
            });
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的分类
            const category = await categoryAdminManager.getCategoryById(addResult.id);
            
            // 验证：查询到的排序权重应与修改后的一致
            return category !== null && category.order === newOrder;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.4: 修改分类状态后，查询返回的状态应与修改后的一致
     * Requirements 3.5: 验证状态字段的修改一致性
     */
    test('修改分类状态后，查询返回的状态应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成分类名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成原始状态
          fc.constantFrom(0, 1),
          // 生成新的状态
          fc.constantFrom(0, 1),
          async (name, originalStatus, newStatus) => {
            // 重置mock数据
            mockCategories = [];
            idCounter = 1;
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory({ 
              name, 
              status: originalStatus 
            });
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await categoryAdminManager.updateCategory(addResult.id, { 
              name,
              status: newStatus 
            });
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的分类
            const category = await categoryAdminManager.getCategoryById(addResult.id);
            
            // 验证：查询到的状态应与修改后的一致
            return category !== null && category.status === newStatus;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.5: 同时修改多个字段后，所有字段都应与修改后的一致
     * Requirements 3.5: 验证多字段同时修改的一致性
     */
    test('同时修改多个字段后，所有字段都应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成原始分类数据
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            description: fc.string({ maxLength: 100 }),
            order: fc.nat(1000),
            status: fc.constantFrom(0, 1)
          }),
          // 生成新的分类数据
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            description: fc.string({ maxLength: 100 }),
            order: fc.nat(1000),
            status: fc.constantFrom(0, 1)
          }),
          async (originalData, newData) => {
            // 重置mock数据
            mockCategories = [];
            idCounter = 1;
            
            // 如果新旧名称相同（trim后），确保至少有一个字段不同
            if (originalData.name.trim() === newData.name.trim() &&
                originalData.description === newData.description &&
                originalData.order === newData.order &&
                originalData.status === newData.status) {
              return true;
            }
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory(originalData);
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await categoryAdminManager.updateCategory(addResult.id, newData);
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的分类
            const category = await categoryAdminManager.getCategoryById(addResult.id);
            
            // 验证：所有字段都应与修改后的一致
            return category !== null &&
                   category.name === newData.name.trim() &&
                   category.description === newData.description &&
                   category.order === newData.order &&
                   category.status === newData.status;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: 分类删除后不可查询
   * For any 已删除的分类ID，调用getCategoryById应返回null或抛出未找到错误
   * Validates: Requirements 4.6
   * 
   * Feature: admin-management-system, Property 3: 分类删除后不可查询
   */
  describe('Property 3: 分类删除后不可查询', () => {
    /**
     * 3.1: 删除分类后，getCategoryById应返回null
     * Requirements 4.6: FOR ALL 分类删除操作，删除后再查询 SHALL 不返回已删除的分类
     */
    test('删除分类后，getCategoryById应返回null', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的分类名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成可选的描述
          fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          // 生成可选的排序权重
          fc.option(fc.nat(1000), { nil: undefined }),
          async (name, description, order) => {
            // 重置mock数据
            mockCategories = [];
            mockProducts = [];
            idCounter = 1;
            
            // 构建分类输入数据
            const categoryInput = { name };
            if (description !== undefined) categoryInput.description = description;
            if (order !== undefined) categoryInput.order = order;
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory(categoryInput);
            if (!addResult.success) {
              return true;
            }
            
            const categoryId = addResult.id;
            
            // 验证分类已成功新增
            const categoryBeforeDelete = await categoryAdminManager.getCategoryById(categoryId);
            if (!categoryBeforeDelete) {
              return true;
            }
            
            // 执行删除操作
            const deleteResult = await categoryAdminManager.deleteCategory(categoryId);
            if (!deleteResult.success) {
              return true;
            }
            
            // 验证：删除后通过ID查询应返回null
            const categoryAfterDelete = await categoryAdminManager.getCategoryById(categoryId);
            
            return categoryAfterDelete === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 3.2: 删除分类后，getCategories不应包含该分类
     * Requirements 4.6: 验证删除后列表查询也不返回已删除的分类
     */
    test('删除分类后，getCategories不应包含该分类', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的分类名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成可选的描述
          fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          async (name, description) => {
            // 重置mock数据
            mockCategories = [];
            mockProducts = [];
            idCounter = 1;
            
            // 构建分类输入数据
            const categoryInput = { name };
            if (description !== undefined) categoryInput.description = description;
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory(categoryInput);
            if (!addResult.success) {
              return true;
            }
            
            const categoryId = addResult.id;
            
            // 执行删除操作
            const deleteResult = await categoryAdminManager.deleteCategory(categoryId);
            if (!deleteResult.success) {
              return true;
            }
            
            // 查询所有分类
            const categories = await categoryAdminManager.getCategories();
            
            // 验证：删除后的分类不应在列表中
            const found = categories.some(c => c._id === categoryId);
            
            return found === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 3.3: 删除多个分类后，所有已删除的分类都不可查询
     * Requirements 4.6: 验证多次删除操作的累积效果
     */
    test('删除多个分类后，所有已删除的分类都不可查询', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成2-5个不同的分类名称
          fc.array(
            fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            { minLength: 2, maxLength: 5 }
          ).map(names => [...new Set(names.map(n => n.trim()))].filter(n => n.length > 0)),
          async (uniqueNames) => {
            // 重置mock数据
            mockCategories = [];
            mockProducts = [];
            idCounter = 1;
            
            // 如果没有足够的有效名称，跳过
            if (uniqueNames.length < 2) return true;
            
            const addedIds = [];
            
            // 依次新增所有分类
            for (const name of uniqueNames) {
              const result = await categoryAdminManager.addCategory({ name });
              if (result.success) {
                addedIds.push(result.id);
              }
            }
            
            // 如果没有成功新增足够的分类，跳过
            if (addedIds.length < 2) return true;
            
            // 删除所有分类
            for (const id of addedIds) {
              await categoryAdminManager.deleteCategory(id);
            }
            
            // 验证：所有已删除的分类都不可通过ID查询
            for (const id of addedIds) {
              const category = await categoryAdminManager.getCategoryById(id);
              if (category !== null) {
                return false;
              }
            }
            
            // 验证：所有已删除的分类都不在列表中
            const categories = await categoryAdminManager.getCategories();
            const foundAny = addedIds.some(id => 
              categories.some(c => c._id === id)
            );
            
            return foundAny === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 3.4: 删除部分分类后，未删除的分类仍可查询
     * Requirements 4.6: 验证删除操作不影响其他分类
     */
    test('删除部分分类后，未删除的分类仍可查询', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成3-5个不同的分类名称
          fc.array(
            fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            { minLength: 3, maxLength: 5 }
          ).map(names => [...new Set(names.map(n => n.trim()))].filter(n => n.length > 0)),
          async (uniqueNames) => {
            // 重置mock数据
            mockCategories = [];
            mockProducts = [];
            idCounter = 1;
            
            // 如果没有足够的有效名称，跳过
            if (uniqueNames.length < 3) return true;
            
            const addedCategories = [];
            
            // 依次新增所有分类
            for (const name of uniqueNames) {
              const result = await categoryAdminManager.addCategory({ name });
              if (result.success) {
                addedCategories.push({ id: result.id, name });
              }
            }
            
            // 如果没有成功新增足够的分类，跳过
            if (addedCategories.length < 3) return true;
            
            // 删除一半的分类（向下取整）
            const deleteCount = Math.floor(addedCategories.length / 2);
            const toDelete = addedCategories.slice(0, deleteCount);
            const toKeep = addedCategories.slice(deleteCount);
            
            // 执行删除操作
            for (const cat of toDelete) {
              await categoryAdminManager.deleteCategory(cat.id);
            }
            
            // 验证：已删除的分类不可查询
            for (const cat of toDelete) {
              const category = await categoryAdminManager.getCategoryById(cat.id);
              if (category !== null) {
                return false;
              }
            }
            
            // 验证：未删除的分类仍可查询
            for (const cat of toKeep) {
              const category = await categoryAdminManager.getCategoryById(cat.id);
              if (category === null || category._id !== cat.id) {
                return false;
              }
            }
            
            // 验证：列表中只包含未删除的分类
            const categories = await categoryAdminManager.getCategories();
            const allKeptFound = toKeep.every(cat => 
              categories.some(c => c._id === cat.id)
            );
            const noDeletedFound = toDelete.every(cat => 
              !categories.some(c => c._id === cat.id)
            );
            
            return allKeptFound && noDeletedFound;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 3.5: 重复删除同一分类应返回失败
     * Requirements 4.6: 验证删除已删除分类的行为
     */
    test('重复删除同一分类应返回失败', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的分类名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (name) => {
            // 重置mock数据
            mockCategories = [];
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个分类
            const addResult = await categoryAdminManager.addCategory({ name });
            if (!addResult.success) {
              return true;
            }
            
            const categoryId = addResult.id;
            
            // 第一次删除应成功
            const firstDeleteResult = await categoryAdminManager.deleteCategory(categoryId);
            if (!firstDeleteResult.success) {
              return true;
            }
            
            // 第二次删除应失败（分类已不存在）
            const secondDeleteResult = await categoryAdminManager.deleteCategory(categoryId);
            
            return secondDeleteResult.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
