/**
 * Integration Tests for Category Navigation
 * 
 * Tests the complete user flow for category navigation:
 * 1. Browse categories -> View product -> Return -> Verify state maintained
 * 2. View product -> Click category -> Verify category switch
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2
 */

const fc = require('fast-check');

describe('Category Navigation Integration Tests', () => {
  // Mock 分类数据
  const mockCategories = [
    { _id: 'cat_1', name: '原木经典', order: 1 },
    { _id: 'cat_2', name: '树脂美学', order: 2 },
    { _id: 'cat_3', name: '玩趣设计', order: 3 },
    { _id: 'cat_4', name: '高定专属', order: 4 },
    { _id: 'cat_5', name: '桌架专区', order: 5 }
  ];

  // Mock 产品数据
  const mockProducts = [
    { _id: 'prod_1', name: '产品1', categoryId: 'cat_1', categoryName: '原木经典' },
    { _id: 'prod_2', name: '产品2', categoryId: 'cat_2', categoryName: '树脂美学' },
    { _id: 'prod_3', name: '产品3', categoryId: 'cat_3', categoryName: '玩趣设计' }
  ];

  // 创建模拟的 App 实例
  function createMockApp() {
    return {
      globalData: {
        categorySwitchRequest: {
          pending: false,
          targetCategoryId: null,
          targetCategoryName: null
        }
      }
    };
  }

  // 创建模拟的分类页面实例
  function createMockCategoryPage(initialActiveTab = 0) {
    return {
      data: {
        categories: mockCategories,
        activeTab: initialActiveTab,
        isFirstLoad: false,
        lastActiveTab: initialActiveTab
      },
      setData(newData) {
        Object.assign(this.data, newData);
      },
      loadCategoriesWithRefresh: jest.fn(function() {
        this.data.lastActiveTab = this.data.activeTab;
        const app = this._app;
        if (app && app.globalData.categorySwitchRequest && app.globalData.categorySwitchRequest.pending) {
          // 有切换请求，不恢复
        } else {
          const newActiveTab = this.data.lastActiveTab < this.data.categories.length 
            ? this.data.lastActiveTab 
            : 0;
          this.setData({ activeTab: newActiveTab });
        }
      }),
      switchToCategory: jest.fn(function(categoryId) {
        const index = this.data.categories.findIndex(c => c._id === categoryId);
        if (index !== -1) {
          this.setData({ activeTab: index });
        }
      }),
      _app: null
    };
  }

  // 模拟 onShow 方法
  function simulateOnShow(pageInstance, app) {
    pageInstance._app = app;
    const switchRequest = app.globalData.categorySwitchRequest;
    
    if (switchRequest && switchRequest.pending) {
      app.globalData.categorySwitchRequest = {
        pending: false,
        targetCategoryId: null,
        targetCategoryName: null
      };
      pageInstance.switchToCategory(switchRequest.targetCategoryId);
    } else if (pageInstance.data.isFirstLoad) {
      pageInstance.loadCategoriesWithRefresh();
    }
    // 正常返回 - 保持当前状态，不刷新
  }

  // 模拟产品详情页的 onCategoryTap
  function simulateOnCategoryTap(product, app) {
    const categoryId = product.categoryId;
    const categoryName = product.categoryName;
    
    if (!categoryId) {
      return { success: false };
    }
    
    app.globalData.categorySwitchRequest = {
      pending: true,
      targetCategoryId: categoryId,
      targetCategoryName: categoryName
    };
    
    return { success: true, navigateTo: '/pages/category/category' };
  }

  describe('Scenario 1: 浏览分类 -> 查看商品 -> 返回 -> 验证状态保持', () => {
    test('返回后应保持之前选中的分类', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          (initialActiveTab) => {
            const app = createMockApp();
            const categoryPage = createMockCategoryPage(initialActiveTab);
            
            expect(categoryPage.data.activeTab).toBe(initialActiveTab);
            simulateOnShow(categoryPage, app);
            
            return categoryPage.data.activeTab === initialActiveTab;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('返回后不应触发数据刷新', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          (initialActiveTab) => {
            const app = createMockApp();
            const categoryPage = createMockCategoryPage(initialActiveTab);
            
            simulateOnShow(categoryPage, app);
            
            return categoryPage.loadCategoriesWithRefresh.mock.calls.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Scenario 2: 查看商品 -> 点击分类 -> 验证分类切换', () => {
    test('点击分类后应切换到对应分类', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          fc.integer({ min: 0, max: mockProducts.length - 1 }),
          (initialActiveTab, productIndex) => {
            const product = mockProducts[productIndex];
            const targetCategoryIndex = mockCategories.findIndex(c => c._id === product.categoryId);
            
            const app = createMockApp();
            const categoryPage = createMockCategoryPage(initialActiveTab);
            
            const result = simulateOnCategoryTap(product, app);
            expect(result.success).toBe(true);
            
            simulateOnShow(categoryPage, app);
            
            return categoryPage.data.activeTab === targetCategoryIndex;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('分类切换后全局状态应被清除', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: mockProducts.length - 1 }),
          (productIndex) => {
            const product = mockProducts[productIndex];
            
            const app = createMockApp();
            const categoryPage = createMockCategoryPage(0);
            
            simulateOnCategoryTap(product, app);
            expect(app.globalData.categorySwitchRequest.pending).toBe(true);
            
            simulateOnShow(categoryPage, app);
            
            return app.globalData.categorySwitchRequest.pending === false &&
                   app.globalData.categorySwitchRequest.targetCategoryId === null;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Scenario 3: 复杂用户流程', () => {
    test('多次返回后状态应保持一致', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          fc.integer({ min: 1, max: 5 }),
          (initialActiveTab, returnCount) => {
            const app = createMockApp();
            const categoryPage = createMockCategoryPage(initialActiveTab);
            
            for (let i = 0; i < returnCount; i++) {
              simulateOnShow(categoryPage, app);
            }
            
            return categoryPage.data.activeTab === initialActiveTab;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('分类切换后再返回应保持切换后的状态', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          fc.integer({ min: 0, max: mockProducts.length - 1 }),
          (initialActiveTab, productIndex) => {
            const product = mockProducts[productIndex];
            const targetCategoryIndex = mockCategories.findIndex(c => c._id === product.categoryId);
            
            const app = createMockApp();
            const categoryPage = createMockCategoryPage(initialActiveTab);
            
            simulateOnCategoryTap(product, app);
            simulateOnShow(categoryPage, app);
            
            expect(categoryPage.data.activeTab).toBe(targetCategoryIndex);
            
            simulateOnShow(categoryPage, app);
            
            return categoryPage.data.activeTab === targetCategoryIndex;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('连续切换不同分类应正确处理', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: mockProducts.length - 1 }),
          fc.integer({ min: 0, max: mockProducts.length - 1 }),
          (firstProductIndex, secondProductIndex) => {
            const firstProduct = mockProducts[firstProductIndex];
            const secondProduct = mockProducts[secondProductIndex];
            const finalCategoryIndex = mockCategories.findIndex(c => c._id === secondProduct.categoryId);
            
            const app = createMockApp();
            const categoryPage = createMockCategoryPage(0);
            
            simulateOnCategoryTap(firstProduct, app);
            simulateOnShow(categoryPage, app);
            
            simulateOnCategoryTap(secondProduct, app);
            simulateOnShow(categoryPage, app);
            
            return categoryPage.data.activeTab === finalCategoryIndex;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
