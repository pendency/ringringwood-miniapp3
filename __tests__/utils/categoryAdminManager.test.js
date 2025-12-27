/**
 * Category Admin Manager 模块单元测试
 * Feature: admin-management-system
 * Requirements: 1.1, 1.2, 2.3, 2.4, 3.3, 3.4, 4.2, 4.3, 4.4
 */

// Mock wx.cloud
const mockDb = {
  collection: jest.fn(),
  serverDate: jest.fn(() => new Date())
};

const mockCollection = {
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  doc: jest.fn().mockReturnThis(),
  get: jest.fn(),
  add: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  count: jest.fn()
};

// Setup mock before requiring the module
global.wx = {
  cloud: {
    database: jest.fn(() => mockDb)
  }
};

mockDb.collection.mockReturnValue(mockCollection);

// Now require the module after setting up mocks
const categoryAdminManager = require('../../utils/categoryAdminManager');

describe('CategoryAdminManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.collection.mockReturnValue(mockCollection);
    mockCollection.orderBy.mockReturnThis();
    mockCollection.limit.mockReturnThis();
    mockCollection.where.mockReturnThis();
    mockCollection.doc.mockReturnThis();
  });

  describe('getCategories', () => {
    // Requirements 1.1, 1.2: 获取所有分类列表
    test('should return formatted category list', async () => {
      const mockCategories = [
        { _id: 'cat_1', name: '分类1', description: '描述1', order: 1, status: 1 },
        { _id: 'cat_2', name: '分类2', description: '描述2', order: 2, status: 1 }
      ];
      mockCollection.get.mockResolvedValue({ data: mockCategories });

      const result = await categoryAdminManager.getCategories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('分类1');
      expect(result[1].name).toBe('分类2');
      expect(mockCollection.orderBy).toHaveBeenCalledWith('order', 'asc');
    });

    test('should return empty array when no categories exist', async () => {
      mockCollection.get.mockResolvedValue({ data: [] });

      const result = await categoryAdminManager.getCategories();

      expect(result).toHaveLength(0);
    });

    test('should throw error when database fails', async () => {
      mockCollection.get.mockRejectedValue(new Error('Database error'));

      await expect(categoryAdminManager.getCategories()).rejects.toThrow('获取分类列表失败');
    });
  });

  describe('getCategoryById', () => {
    test('should return category when found', async () => {
      const mockCategory = { _id: 'cat_1', name: '分类1', description: '描述1', order: 1, status: 1 };
      mockCollection.get.mockResolvedValue({ data: mockCategory });

      const result = await categoryAdminManager.getCategoryById('cat_1');

      expect(result).not.toBeNull();
      expect(result.name).toBe('分类1');
    });

    test('should return null when category not found', async () => {
      mockCollection.get.mockRejectedValue({ errCode: -1, message: 'not exist' });

      const result = await categoryAdminManager.getCategoryById('non_existent');

      expect(result).toBeNull();
    });

    test('should return null when id is empty', async () => {
      const result = await categoryAdminManager.getCategoryById('');

      expect(result).toBeNull();
    });
  });

  describe('addCategory', () => {
    // Requirements 2.3, 2.4: 新增分类
    test('should add category successfully with valid data', async () => {
      mockCollection.get.mockResolvedValue({ data: [] }); // No duplicate
      mockCollection.add.mockResolvedValue({ _id: 'new_cat_id' });

      const result = await categoryAdminManager.addCategory({
        name: '新分类',
        description: '新分类描述'
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('new_cat_id');
    });

    test('should fail when name is empty', async () => {
      const result = await categoryAdminManager.addCategory({
        name: '',
        description: '描述'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('分类名称不能为空');
    });

    test('should fail when name already exists', async () => {
      mockCollection.get.mockResolvedValue({ 
        data: [{ _id: 'existing_cat', name: '已存在分类' }] 
      });

      const result = await categoryAdminManager.addCategory({
        name: '已存在分类',
        description: '描述'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('分类名称已存在');
    });

    test('should fail when input is invalid', async () => {
      const result = await categoryAdminManager.addCategory(null);

      expect(result.success).toBe(false);
    });
  });

  describe('updateCategory', () => {
    // Requirements 3.3, 3.4: 更新分类
    test('should update category successfully', async () => {
      // First call for getCategoryById, second for duplicate check
      mockCollection.get
        .mockResolvedValueOnce({ data: { _id: 'cat_1', name: '原分类名' } })
        .mockResolvedValueOnce({ data: [] });
      mockCollection.update.mockResolvedValue({ stats: { updated: 1 } });

      const result = await categoryAdminManager.updateCategory('cat_1', {
        name: '新分类名',
        description: '新描述'
      });

      expect(result.success).toBe(true);
    });

    test('should fail when category does not exist', async () => {
      mockCollection.get.mockRejectedValue({ errCode: -1, message: 'not exist' });

      const result = await categoryAdminManager.updateCategory('non_existent', {
        name: '新分类名'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('分类不存在');
    });

    test('should fail when id is empty', async () => {
      const result = await categoryAdminManager.updateCategory('', {
        name: '新分类名'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('分类ID不能为空');
    });

    test('should fail when new name already exists for another category', async () => {
      mockCollection.get
        .mockResolvedValueOnce({ data: { _id: 'cat_1', name: '原分类名' } })
        .mockResolvedValueOnce({ data: [{ _id: 'cat_2', name: '已存在分类' }] });

      const result = await categoryAdminManager.updateCategory('cat_1', {
        name: '已存在分类'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('分类名称已存在');
    });
  });

  describe('deleteCategory', () => {
    // Requirements 4.2, 4.3, 4.4: 删除分类
    test('should delete category successfully when no products', async () => {
      mockCollection.get.mockResolvedValue({ data: { _id: 'cat_1', name: '分类1' } });
      mockCollection.count.mockResolvedValue({ total: 0 });
      mockCollection.remove.mockResolvedValue({ stats: { removed: 1 } });

      const result = await categoryAdminManager.deleteCategory('cat_1');

      expect(result.success).toBe(true);
    });

    test('should fail when category has products', async () => {
      mockCollection.get.mockResolvedValue({ data: { _id: 'cat_1', name: '分类1' } });
      mockCollection.count.mockResolvedValue({ total: 5 });

      const result = await categoryAdminManager.deleteCategory('cat_1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('该分类下有产品，请先删除或移动产品');
    });

    test('should fail when category does not exist', async () => {
      mockCollection.get.mockRejectedValue({ errCode: -1, message: 'not exist' });

      const result = await categoryAdminManager.deleteCategory('non_existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('分类不存在');
    });

    test('should fail when id is empty', async () => {
      const result = await categoryAdminManager.deleteCategory('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('分类ID不能为空');
    });
  });

  describe('checkCategoryHasProducts', () => {
    // Requirements 4.2: 检查分类下是否有产品
    test('should return true when category has products', async () => {
      mockCollection.count.mockResolvedValue({ total: 5 });

      const result = await categoryAdminManager.checkCategoryHasProducts('cat_1');

      expect(result).toBe(true);
    });

    test('should return false when category has no products', async () => {
      mockCollection.count.mockResolvedValue({ total: 0 });

      const result = await categoryAdminManager.checkCategoryHasProducts('cat_1');

      expect(result).toBe(false);
    });

    test('should return false when categoryId is empty', async () => {
      const result = await categoryAdminManager.checkCategoryHasProducts('');

      expect(result).toBe(false);
    });

    test('should return true when database error occurs (safe default)', async () => {
      mockCollection.count.mockRejectedValue(new Error('Database error'));

      const result = await categoryAdminManager.checkCategoryHasProducts('cat_1');

      expect(result).toBe(true);
    });
  });
});
