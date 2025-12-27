/**
 * Product Admin Manager 单元测试
 * Feature: admin-management-system
 * 
 * 测试产品管理模块的CRUD操作
 */

const { TestProductAdminManager } = require('./test-product-admin-manager.js');

describe('Product Admin Manager Unit Tests', () => {
  let productManager;

  beforeEach(() => {
    productManager = new TestProductAdminManager();
  });

  describe('addProduct', () => {
    test('应成功新增有效产品', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001',
        price: 99.99,
        description: '这是一个测试产品'
      };

      const result = productManager.addProduct(product);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    test('应拒绝缺少名称的产品', () => {
      const product = {
        categoryId: 'cat_001',
        price: 99.99
      };

      const result = productManager.addProduct(product);

      expect(result.success).toBe(false);
      expect(result.error).toContain('产品名称不能为空');
    });

    test('应拒绝缺少分类的产品', () => {
      const product = {
        name: '测试产品',
        price: 99.99
      };

      const result = productManager.addProduct(product);

      expect(result.success).toBe(false);
      expect(result.error).toContain('产品分类不能为空');
    });
  });

  describe('getProductById', () => {
    test('应返回已存在的产品', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001'
      };
      const addResult = productManager.addProduct(product);
      
      const foundProduct = productManager.getProductById(addResult.id);

      expect(foundProduct).not.toBeNull();
      expect(foundProduct.name).toBe('测试产品');
      expect(foundProduct.categoryId).toBe('cat_001');
    });

    test('应返回null当产品不存在', () => {
      const foundProduct = productManager.getProductById('non_existent_id');

      expect(foundProduct).toBeNull();
    });

    test('应返回null当ID为空', () => {
      const foundProduct = productManager.getProductById('');

      expect(foundProduct).toBeNull();
    });
  });

  describe('updateProduct', () => {
    test('应成功更新已存在的产品', () => {
      const product = {
        name: '原始产品',
        categoryId: 'cat_001'
      };
      const addResult = productManager.addProduct(product);

      const updateResult = productManager.updateProduct(addResult.id, {
        name: '更新后的产品',
        categoryId: 'cat_001',
        price: 199.99
      });

      expect(updateResult.success).toBe(true);

      const updatedProduct = productManager.getProductById(addResult.id);
      expect(updatedProduct.name).toBe('更新后的产品');
      expect(updatedProduct.price).toBe(199.99);
    });

    test('应拒绝更新不存在的产品', () => {
      const updateResult = productManager.updateProduct('non_existent_id', {
        name: '更新产品',
        categoryId: 'cat_001'
      });

      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('产品不存在');
    });
  });

  describe('deleteProduct', () => {
    test('应成功删除已存在的产品', () => {
      const product = {
        name: '待删除产品',
        categoryId: 'cat_001'
      };
      const addResult = productManager.addProduct(product);

      const deleteResult = productManager.deleteProduct(addResult.id);

      expect(deleteResult.success).toBe(true);
      expect(productManager.getProductById(addResult.id)).toBeNull();
    });

    test('应拒绝删除不存在的产品', () => {
      const deleteResult = productManager.deleteProduct('non_existent_id');

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toContain('产品不存在');
    });
  });

  describe('updateProductStatus', () => {
    test('应成功更新产品状态为下架', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001',
        status: 1
      };
      const addResult = productManager.addProduct(product);

      const statusResult = productManager.updateProductStatus(addResult.id, 0);

      expect(statusResult.success).toBe(true);
      
      const updatedProduct = productManager.getProductById(addResult.id);
      expect(updatedProduct.status).toBe(0);
    });

    test('应成功更新产品状态为上架', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001',
        status: 0
      };
      const addResult = productManager.addProduct(product);

      const statusResult = productManager.updateProductStatus(addResult.id, 1);

      expect(statusResult.success).toBe(true);
      
      const updatedProduct = productManager.getProductById(addResult.id);
      expect(updatedProduct.status).toBe(1);
    });

    test('应拒绝无效的状态值', () => {
      const product = {
        name: '测试产品',
        categoryId: 'cat_001'
      };
      const addResult = productManager.addProduct(product);

      const statusResult = productManager.updateProductStatus(addResult.id, 2);

      expect(statusResult.success).toBe(false);
      expect(statusResult.error).toContain('状态值无效');
    });
  });

  describe('batchUpdateStatus', () => {
    test('应成功批量更新产品状态', () => {
      const products = [
        { name: '产品1', categoryId: 'cat_001', status: 1 },
        { name: '产品2', categoryId: 'cat_001', status: 1 },
        { name: '产品3', categoryId: 'cat_001', status: 1 }
      ];
      
      const ids = products.map(p => productManager.addProduct(p).id);

      const batchResult = productManager.batchUpdateStatus(ids, 0);

      expect(batchResult.success).toBe(true);
      expect(batchResult.count).toBe(3);

      ids.forEach(id => {
        const product = productManager.getProductById(id);
        expect(product.status).toBe(0);
      });
    });

    test('应拒绝空的ID列表', () => {
      const batchResult = productManager.batchUpdateStatus([], 0);

      expect(batchResult.success).toBe(false);
      expect(batchResult.error).toContain('产品ID列表不能为空');
    });
  });

  describe('getProducts', () => {
    beforeEach(() => {
      // 添加测试数据
      productManager.addProduct({ name: '产品A', categoryId: 'cat_001', status: 1, order: 1 });
      productManager.addProduct({ name: '产品B', categoryId: 'cat_001', status: 0, order: 2 });
      productManager.addProduct({ name: '产品C', categoryId: 'cat_002', status: 1, order: 3 });
      productManager.addProduct({ name: '特殊产品', categoryId: 'cat_002', status: 1, order: 4 });
    });

    test('应返回所有产品', () => {
      const result = productManager.getProducts();

      expect(result.total).toBe(4);
      expect(result.products.length).toBe(4);
    });

    test('应按分类筛选产品', () => {
      const result = productManager.getProducts({ categoryId: 'cat_001' });

      expect(result.total).toBe(2);
      result.products.forEach(p => {
        expect(p.categoryId).toBe('cat_001');
      });
    });

    test('应按状态筛选产品', () => {
      const result = productManager.getProducts({ status: 1 });

      expect(result.total).toBe(3);
      result.products.forEach(p => {
        expect(p.status).toBe(1);
      });
    });

    test('应按关键词搜索产品', () => {
      const result = productManager.getProducts({ keyword: '特殊' });

      expect(result.total).toBe(1);
      expect(result.products[0].name).toBe('特殊产品');
    });

    test('应支持分页', () => {
      const result = productManager.getProducts({ page: 1, pageSize: 2 });

      expect(result.total).toBe(4);
      expect(result.products.length).toBe(2);
    });
  });
});
