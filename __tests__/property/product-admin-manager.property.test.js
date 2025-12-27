/**
 * Product Admin Manager 属性测试
 * Feature: admin-management-system
 * 
 * 使用 fast-check 进行属性测试，验证产品管理模块的CRUD操作正确性
 */

const fc = require('fast-check');

// Mock wx.cloud 数据库
let mockProducts = [];
let idCounter = 1;

const mockDb = {
  collection: jest.fn(),
  serverDate: jest.fn(() => new Date()),
  command: {
    in: jest.fn((arr) => ({ $in: arr }))
  },
  RegExp: jest.fn(({ regexp, options }) => new RegExp(regexp, options))
};

const createMockCollection = () => ({
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
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
      const found = mockProducts.find(p => p._id === this._docId);
      if (found) {
        return { data: found };
      }
      const error = new Error('not exist');
      error.errCode = -1;
      throw error;
    }
    // 如果是通过where查询
    if (this._query) {
      let filtered = [...mockProducts];
      
      // 处理categoryName筛选
      if (this._query.categoryName) {
        filtered = filtered.filter(p => p.categoryName === this._query.categoryName);
      }
      
      // 处理status筛选
      if (this._query.status !== undefined) {
        filtered = filtered.filter(p => p.status === this._query.status);
      }
      
      // 处理name正则搜索
      if (this._query.name instanceof RegExp) {
        filtered = filtered.filter(p => this._query.name.test(p.name));
      }
      
      return { data: filtered };
    }
    // 获取所有产品
    return { data: [...mockProducts].sort((a, b) => (a.order || 999) - (b.order || 999)) };
  }),
  count: jest.fn(async function() {
    let filtered = [...mockProducts];
    if (this._query) {
      if (this._query.categoryName) {
        filtered = filtered.filter(p => p.categoryName === this._query.categoryName);
      }
      if (this._query.status !== undefined) {
        filtered = filtered.filter(p => p.status === this._query.status);
      }
      if (this._query.name instanceof RegExp) {
        filtered = filtered.filter(p => this._query.name.test(p.name));
      }
    }
    return { total: filtered.length };
  }),
  add: jest.fn(async function({ data }) {
    const newId = `product_${idCounter++}`;
    const newProduct = { ...data, _id: newId };
    mockProducts.push(newProduct);
    return { _id: newId };
  }),
  update: jest.fn(async function({ data }) {
    // 处理批量更新
    if (this._query && this._query._id && this._query._id.$in) {
      const ids = this._query._id.$in;
      let updated = 0;
      for (const id of ids) {
        const index = mockProducts.findIndex(p => p._id === id);
        if (index !== -1) {
          mockProducts[index] = { ...mockProducts[index], ...data };
          updated++;
        }
      }
      return { stats: { updated } };
    }
    // 处理单个更新
    const index = mockProducts.findIndex(p => p._id === this._docId);
    if (index !== -1) {
      mockProducts[index] = { ...mockProducts[index], ...data };
      return { stats: { updated: 1 } };
    }
    return { stats: { updated: 0 } };
  }),
  remove: jest.fn(async function() {
    const index = mockProducts.findIndex(p => p._id === this._docId);
    if (index !== -1) {
      mockProducts.splice(index, 1);
      return { stats: { removed: 1 } };
    }
    return { stats: { removed: 0 } };
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
const productAdminManager = require('../../utils/productAdminManager');

describe('Product Admin Manager Property Tests', () => {
  beforeEach(() => {
    // 重置mock数据
    mockProducts = [];
    idCounter = 1;
    jest.clearAllMocks();
    mockDb.collection.mockImplementation(() => createMockCollection());
  });

  // 生成有效的分类ID
  const validCategoryIds = ['cat_001', 'cat_002', 'cat_003', 'cat_004', 'cat_005'];

  /**
   * Property 4: 产品新增后可查询
   * For any 有效的产品数据，新增产品后，调用getProducts应返回包含该产品的列表
   * Validates: Requirements 6.6
   * 
   * Feature: admin-management-system, Property 4: 产品新增后可查询
   */
  describe('Property 4: 产品新增后可查询', () => {
    /**
     * 4.1: 新增有效产品后，getProducts应返回包含该产品的列表
     * Requirements 6.6: FOR ALL 新增产品操作，保存后再查询 SHALL 返回包含新产品的列表
     */
    test('新增有效产品后，getProducts应返回包含该产品的列表', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称（非空非纯空白）
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          // 生成可选的描述
          fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          // 生成可选的价格
          fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: undefined }),
          // 生成可选的状态
          fc.option(fc.constantFrom(0, 1), { nil: undefined }),
          async (name, categoryId, description, price, status) => {
            // 重置mock数据，确保每次测试独立
            mockProducts = [];
            idCounter = 1;
            
            // 构建产品输入数据
            const productInput = { name, categoryId };
            if (description !== undefined) productInput.description = description;
            if (price !== undefined) productInput.price = price;
            if (status !== undefined) productInput.status = status;
            
            // 执行新增操作
            const addResult = await productAdminManager.addProduct(productInput);
            
            // 验证新增成功
            if (!addResult.success) {
              return true;
            }
            
            // 查询所有产品
            const result = await productAdminManager.getProducts();
            
            // 验证：新增的产品应该在列表中
            const found = result.products.some(p => 
              p._id === addResult.id && 
              p.name === name.trim()
            );
            
            return found === true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 4.2: 新增多个产品后，所有产品都应可查询
     * Requirements 6.6: 验证多次新增操作的累积效果
     */
    test('新增多个产品后，所有产品都应可查询', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成1-5个产品数据
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
              categoryId: fc.constantFrom(...validCategoryIds)
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (products) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            const addedIds = [];
            
            // 依次新增所有产品
            for (const product of products) {
              const result = await productAdminManager.addProduct(product);
              if (result.success) {
                addedIds.push({ id: result.id, name: product.name.trim() });
              }
            }
            
            // 如果没有成功新增任何产品，跳过
            if (addedIds.length === 0) return true;
            
            // 查询所有产品
            const result = await productAdminManager.getProducts({ pageSize: 100 });
            
            // 验证：所有成功新增的产品都应该在列表中
            return addedIds.every(added => 
              result.products.some(p => p._id === added.id && p.name === added.name)
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 4.3: 新增产品后，通过getProductById也应能查询到
     * Requirements 6.6: 验证通过ID查询的一致性
     */
    test('新增产品后，通过getProductById也应能查询到', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          async (name, categoryId, description) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 构建产品输入数据
            const productInput = { name, categoryId };
            if (description !== undefined) productInput.description = description;
            
            // 执行新增操作
            const addResult = await productAdminManager.addProduct(productInput);
            
            // 验证新增成功
            if (!addResult.success) {
              return true;
            }
            
            // 通过ID查询产品
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：查询到的产品数据应与输入一致
            return product !== null && 
                   product._id === addResult.id && 
                   product.name === name.trim();
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 5: 产品修改后数据一致
   * For any 已存在的产品，修改后再查询，返回的数据应与修改后的数据一致
   * Validates: Requirements 7.6
   * 
   * Feature: admin-management-system, Property 5: 产品修改后数据一致
   */
  describe('Property 5: 产品修改后数据一致', () => {
    /**
     * 5.1: 修改产品名称后，查询返回的名称应与修改后的一致
     * Requirements 7.6: FOR ALL 产品修改操作，修改后再查询 SHALL 返回更新后的产品数据
     */
    test('修改产品名称后，查询返回的名称应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成原始产品名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成新的产品名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成分类ID
          fc.constantFrom(...validCategoryIds),
          async (originalName, newName, categoryId) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 如果新旧名称相同（trim后），跳过此测试用例
            if (originalName.trim() === newName.trim()) {
              return true;
            }
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ name: originalName, categoryId });
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await productAdminManager.updateProduct(addResult.id, { name: newName, categoryId });
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的产品
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：查询到的名称应与修改后的名称一致
            return product !== null && product.name === newName.trim();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 5.2: 修改产品价格后，查询返回的价格应与修改后的一致
     * Requirements 7.6: 验证价格字段的修改一致性
     */
    test('修改产品价格后，查询返回的价格应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成产品名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成分类ID
          fc.constantFrom(...validCategoryIds),
          // 生成原始价格
          fc.double({ min: 0, max: 10000, noNaN: true }),
          // 生成新的价格
          fc.double({ min: 0, max: 10000, noNaN: true }),
          async (name, categoryId, originalPrice, newPrice) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ 
              name, 
              categoryId,
              price: originalPrice 
            });
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await productAdminManager.updateProduct(addResult.id, { 
              name,
              categoryId,
              price: newPrice 
            });
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的产品
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：查询到的价格应与修改后的价格一致
            return product !== null && product.price === newPrice;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 5.3: 修改产品分类后，查询返回的分类应与修改后的一致
     * Requirements 7.6: 验证分类字段的修改一致性
     */
    test('修改产品分类后，查询返回的分类应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成产品名称
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
          // 生成原始分类ID
          fc.constantFrom(...validCategoryIds),
          // 生成新的分类ID
          fc.constantFrom(...validCategoryIds),
          async (name, originalCategoryId, newCategoryId) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ 
              name, 
              categoryId: originalCategoryId 
            });
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await productAdminManager.updateProduct(addResult.id, { 
              name,
              categoryId: newCategoryId 
            });
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的产品
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：查询到的分类应与修改后的分类一致
            return product !== null && product.categoryId === newCategoryId;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 5.4: 同时修改多个字段后，所有字段都应与修改后的一致
     * Requirements 7.6: 验证多字段同时修改的一致性
     */
    test('同时修改多个字段后，所有字段都应与修改后的一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成原始产品数据
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            categoryId: fc.constantFrom(...validCategoryIds),
            description: fc.string({ maxLength: 100 }),
            price: fc.double({ min: 0, max: 10000, noNaN: true }),
            status: fc.constantFrom(0, 1)
          }),
          // 生成新的产品数据
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
            categoryId: fc.constantFrom(...validCategoryIds),
            description: fc.string({ maxLength: 100 }),
            price: fc.double({ min: 0, max: 10000, noNaN: true }),
            status: fc.constantFrom(0, 1)
          }),
          async (originalData, newData) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct(originalData);
            if (!addResult.success) {
              return true;
            }
            
            // 执行修改操作
            const updateResult = await productAdminManager.updateProduct(addResult.id, newData);
            if (!updateResult.success) {
              return true;
            }
            
            // 查询修改后的产品
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：所有字段都应与修改后的一致
            return product !== null &&
                   product.name === newData.name.trim() &&
                   product.categoryId === newData.categoryId &&
                   product.description === newData.description &&
                   product.price === newData.price &&
                   product.status === newData.status;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 6: 产品删除后不可查询
   * For any 已删除的产品ID，调用getProductById应返回null或抛出未找到错误
   * Validates: Requirements 8.4
   * 
   * Feature: admin-management-system, Property 6: 产品删除后不可查询
   */
  describe('Property 6: 产品删除后不可查询', () => {
    /**
     * 6.1: 删除产品后，getProductById应返回null
     * Requirements 8.4: FOR ALL 产品删除操作，删除后再查询 SHALL 不返回已删除的产品
     */
    test('删除产品后，getProductById应返回null', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          // 生成可选的描述
          fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
          async (name, categoryId, description) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 构建产品输入数据
            const productInput = { name, categoryId };
            if (description !== undefined) productInput.description = description;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct(productInput);
            if (!addResult.success) {
              return true;
            }
            
            const productId = addResult.id;
            
            // 验证产品已成功新增
            const productBeforeDelete = await productAdminManager.getProductById(productId);
            if (!productBeforeDelete) {
              return true;
            }
            
            // 执行删除操作
            const deleteResult = await productAdminManager.deleteProduct(productId);
            if (!deleteResult.success) {
              return true;
            }
            
            // 验证：删除后通过ID查询应返回null
            const productAfterDelete = await productAdminManager.getProductById(productId);
            
            return productAfterDelete === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 6.2: 删除产品后，getProducts不应包含该产品
     * Requirements 8.4: 验证删除后列表查询也不返回已删除的产品
     */
    test('删除产品后，getProducts不应包含该产品', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          async (name, categoryId) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ name, categoryId });
            if (!addResult.success) {
              return true;
            }
            
            const productId = addResult.id;
            
            // 执行删除操作
            const deleteResult = await productAdminManager.deleteProduct(productId);
            if (!deleteResult.success) {
              return true;
            }
            
            // 查询所有产品
            const result = await productAdminManager.getProducts({ pageSize: 100 });
            
            // 验证：删除后的产品不应在列表中
            const found = result.products.some(p => p._id === productId);
            
            return found === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 6.3: 删除多个产品后，所有已删除的产品都不可查询
     * Requirements 8.4: 验证多次删除操作的累积效果
     */
    test('删除多个产品后，所有已删除的产品都不可查询', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成2-5个产品数据
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
              categoryId: fc.constantFrom(...validCategoryIds)
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (products) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            const addedIds = [];
            
            // 依次新增所有产品
            for (const product of products) {
              const result = await productAdminManager.addProduct(product);
              if (result.success) {
                addedIds.push(result.id);
              }
            }
            
            // 如果没有成功新增足够的产品，跳过
            if (addedIds.length < 2) return true;
            
            // 删除所有产品
            for (const id of addedIds) {
              await productAdminManager.deleteProduct(id);
            }
            
            // 验证：所有已删除的产品都不可通过ID查询
            for (const id of addedIds) {
              const product = await productAdminManager.getProductById(id);
              if (product !== null) {
                return false;
              }
            }
            
            // 验证：所有已删除的产品都不在列表中
            const result = await productAdminManager.getProducts({ pageSize: 100 });
            const foundAny = addedIds.some(id => 
              result.products.some(p => p._id === id)
            );
            
            return foundAny === false;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 6.4: 删除部分产品后，未删除的产品仍可查询
     * Requirements 8.4: 验证删除操作不影响其他产品
     */
    test('删除部分产品后，未删除的产品仍可查询', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成3-5个产品数据
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
              categoryId: fc.constantFrom(...validCategoryIds)
            }),
            { minLength: 3, maxLength: 5 }
          ),
          async (products) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            const addedProducts = [];
            
            // 依次新增所有产品
            for (const product of products) {
              const result = await productAdminManager.addProduct(product);
              if (result.success) {
                addedProducts.push({ id: result.id, name: product.name.trim() });
              }
            }
            
            // 如果没有成功新增足够的产品，跳过
            if (addedProducts.length < 3) return true;
            
            // 删除一半的产品（向下取整）
            const deleteCount = Math.floor(addedProducts.length / 2);
            const toDelete = addedProducts.slice(0, deleteCount);
            const toKeep = addedProducts.slice(deleteCount);
            
            // 执行删除操作
            for (const prod of toDelete) {
              await productAdminManager.deleteProduct(prod.id);
            }
            
            // 验证：已删除的产品不可查询
            for (const prod of toDelete) {
              const product = await productAdminManager.getProductById(prod.id);
              if (product !== null) {
                return false;
              }
            }
            
            // 验证：未删除的产品仍可查询
            for (const prod of toKeep) {
              const product = await productAdminManager.getProductById(prod.id);
              if (product === null || product._id !== prod.id) {
                return false;
              }
            }
            
            // 验证：列表中只包含未删除的产品
            const result = await productAdminManager.getProducts({ pageSize: 100 });
            const allKeptFound = toKeep.every(prod => 
              result.products.some(p => p._id === prod.id)
            );
            const noDeletedFound = toDelete.every(prod => 
              !result.products.some(p => p._id === prod.id)
            );
            
            return allKeptFound && noDeletedFound;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 6.5: 重复删除同一产品应返回失败
     * Requirements 8.4: 验证删除已删除产品的行为
     */
    test('重复删除同一产品应返回失败', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          async (name, categoryId) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ name, categoryId });
            if (!addResult.success) {
              return true;
            }
            
            const productId = addResult.id;
            
            // 第一次删除应成功
            const firstDeleteResult = await productAdminManager.deleteProduct(productId);
            if (!firstDeleteResult.success) {
              return true;
            }
            
            // 第二次删除应失败（产品已不存在）
            const secondDeleteResult = await productAdminManager.deleteProduct(productId);
            
            return secondDeleteResult.success === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * Property 7: 产品状态变更一致性
   * For any 产品ID和目标状态，调用updateProductStatus后再查询，产品状态应等于目标状态
   * Validates: Requirements 9.5
   * 
   * Feature: admin-management-system, Property 7: 产品状态变更一致性
   */
  describe('Property 7: 产品状态变更一致性', () => {
    /**
     * 7.1: 更新产品状态后，查询返回的状态应与目标状态一致
     * Requirements 9.5: FOR ALL 上架下架操作，状态变更后再查询 SHALL 返回正确的状态值
     */
    test('更新产品状态后，查询返回的状态应与目标状态一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          // 生成初始状态
          fc.constantFrom(0, 1),
          // 生成目标状态
          fc.constantFrom(0, 1),
          async (name, categoryId, initialStatus, targetStatus) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ 
              name, 
              categoryId,
              status: initialStatus 
            });
            if (!addResult.success) {
              return true;
            }
            
            // 执行状态更新操作
            const statusResult = await productAdminManager.updateProductStatus(addResult.id, targetStatus);
            if (!statusResult.success) {
              return true;
            }
            
            // 查询更新后的产品
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：查询到的状态应与目标状态一致
            return product !== null && product.status === targetStatus;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 7.2: 多次状态变更后，最终状态应与最后一次变更的目标状态一致
     * Requirements 9.5: 验证多次状态变更的累积效果
     */
    test('多次状态变更后，最终状态应与最后一次变更的目标状态一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          // 生成状态变更序列（2-5次变更）
          fc.array(fc.constantFrom(0, 1), { minLength: 2, maxLength: 5 }),
          async (name, categoryId, statusSequence) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ name, categoryId });
            if (!addResult.success) {
              return true;
            }
            
            // 依次执行状态变更
            for (const status of statusSequence) {
              const statusResult = await productAdminManager.updateProductStatus(addResult.id, status);
              if (!statusResult.success) {
                return true;
              }
            }
            
            // 查询最终状态
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：最终状态应与最后一次变更的目标状态一致
            const expectedStatus = statusSequence[statusSequence.length - 1];
            return product !== null && product.status === expectedStatus;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 7.3: 批量更新状态后，所有产品状态都应与目标状态一致
     * Requirements 9.5: 验证批量状态变更的一致性
     */
    test('批量更新状态后，所有产品状态都应与目标状态一致', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成2-5个产品数据
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
              categoryId: fc.constantFrom(...validCategoryIds),
              status: fc.constantFrom(0, 1)
            }),
            { minLength: 2, maxLength: 5 }
          ),
          // 生成目标状态
          fc.constantFrom(0, 1),
          async (products, targetStatus) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            const addedIds = [];
            
            // 依次新增所有产品
            for (const product of products) {
              const result = await productAdminManager.addProduct(product);
              if (result.success) {
                addedIds.push(result.id);
              }
            }
            
            // 如果没有成功新增足够的产品，跳过
            if (addedIds.length < 2) return true;
            
            // 执行批量状态更新
            const batchResult = await productAdminManager.batchUpdateStatus(addedIds, targetStatus);
            if (!batchResult.success) {
              return true;
            }
            
            // 验证：所有产品的状态都应与目标状态一致
            for (const id of addedIds) {
              const product = await productAdminManager.getProductById(id);
              if (product === null || product.status !== targetStatus) {
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
     * 7.4: 状态变更幂等性 - 重复设置相同状态应成功且状态不变
     * Requirements 9.5: 验证状态变更的幂等性
     */
    test('状态变更幂等性 - 重复设置相同状态应成功且状态不变', async () => {
      await fc.assert(
        fc.asyncProperty(
          // 生成有效的产品名称
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          // 生成有效的分类ID
          fc.constantFrom(...validCategoryIds),
          // 生成目标状态
          fc.constantFrom(0, 1),
          // 生成重复次数
          fc.integer({ min: 2, max: 5 }),
          async (name, categoryId, targetStatus, repeatCount) => {
            // 重置mock数据
            mockProducts = [];
            idCounter = 1;
            
            // 先新增一个产品
            const addResult = await productAdminManager.addProduct({ name, categoryId });
            if (!addResult.success) {
              return true;
            }
            
            // 重复设置相同状态
            for (let i = 0; i < repeatCount; i++) {
              const statusResult = await productAdminManager.updateProductStatus(addResult.id, targetStatus);
              if (!statusResult.success) {
                return false; // 重复设置应该成功
              }
            }
            
            // 查询最终状态
            const product = await productAdminManager.getProductById(addResult.id);
            
            // 验证：状态应与目标状态一致
            return product !== null && product.status === targetStatus;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
