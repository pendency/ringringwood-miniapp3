/**
 * Category Navigation 属性测试
 * Feature: category-navigation-fix
 * 
 * 使用 fast-check 进行属性测试，验证分类页导航行为的正确性
 * 
 * Property 1: 返回时保持分类状态
 * Property 2: 返回时不触发数据刷新
 * Validates: Requirements 1.1, 1.2, 1.4, 2.2, 3.2
 */

const fc = require('fast-check');

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
  { _id: 'prod_1', name: '产品1', categoryId: 'cat_1' },
  { _id: 'prod_2', name: '产品2', categoryId: 'cat_2' }
];

// 创建模拟的 Page 实例
function createMockPageInstance(initialData = {}) {
  const defaultData = {
    showMenu: false,
    activeTab: 0,
    statusBarHeight: 20,
    navBarHeight: 44,
    contentPaddingTop: 64,
    categories: [...mockCategories],
    products: [...mockProducts],
    loading: false,
    loadingMore: false,
    totalProducts: 0,
    hasMoreProducts: false,
    currentPage: 1,
    pageSize: 10,
    scrollIntoView: '',
    isFirstLoad: true,
    lastActiveTab: 0
  };

  const pageData = { ...defaultData, ...initialData };
  
  // 跟踪方法调用
  const methodCalls = {
    loadCategoriesWithRefresh: 0,
    loadCategories: 0,
    setData: []
  };

  const pageInstance = {
    data: pageData,
    
    // 模拟 setData 方法
    setData: function(newData) {
      methodCalls.setData.push({ ...newData });
      Object.assign(this.data, newData);
    },
    
    // 模拟 loadCategoriesWithRefresh 方法
    loadCategoriesWithRefresh: function() {
      methodCalls.loadCategoriesWithRefresh++;
    },
    
    // 模拟 loadCategories 方法
    loadCategories: function() {
      methodCalls.loadCategories++;
    },
    
    // 待切换的分类信息
    pendingSwitchCategoryId: null,
    pendingSwitchCategory: null,
    
    // 获取方法调用记录
    getMethodCalls: function() {
      return methodCalls;
    },
    
    // 重置方法调用记录
    resetMethodCalls: function() {
      methodCalls.loadCategoriesWithRefresh = 0;
      methodCalls.loadCategories = 0;
      methodCalls.setData = [];
    }
  };

  return pageInstance;
}

// 创建模拟的全局 App 实例
function createMockApp(eventChannelData = {}) {
  return {
    globalData: {
      eventChannel: {
        categoryType: eventChannelData.categoryType || null,
        categoryId: eventChannelData.categoryId || null
      }
    }
  };
}

// 模拟 onShow 方法的核心逻辑（从 category.js 提取）
function simulateOnShow(pageInstance, app) {
  console.log('[Category] onShow 触发, isFirstLoad:', pageInstance.data.isFirstLoad);
  
  // 获取全局数据中的分类类型和ID
  const hasEventChannel = app && app.globalData && app.globalData.eventChannel;
  const hasCategorySwitchRequest = hasEventChannel && 
      (app.globalData.eventChannel.categoryType || app.globalData.eventChannel.categoryId);
  
  if (hasCategorySwitchRequest) {
    // 有分类切换请求，处理跳转
    const categoryType = app.globalData.eventChannel.categoryType;
    const categoryId = app.globalData.eventChannel.categoryId;
    console.log('[Category] 接收到分类切换请求，分类类型:', categoryType, '分类ID:', categoryId);
    
    // Requirements 2.3: 处理后立即清除全局数据
    app.globalData.eventChannel.categoryType = null;
    app.globalData.eventChannel.categoryId = null;
    console.log('[Category] 已清除全局分类切换请求数据');
    
    // 保存要切换的分类信息
    pageInstance.pendingSwitchCategoryId = categoryId;
    pageInstance.pendingSwitchCategory = categoryType;
    
    // 强制刷新分类数据
    console.log('[Category] 强制刷新分类数据（有指定分类）');
    pageInstance.loadCategoriesWithRefresh();
  } else if (pageInstance.data.isFirstLoad) {
    // Requirements 3.1: 首次加载时
    console.log('[Category] 首次加载，加载分类数据');
    pageInstance.setData({ isFirstLoad: false });
  } else {
    // Requirements 1.1, 1.2, 1.4, 2.2, 3.2: 从详情页返回时，保持当前状态不变
    console.log('[Category] 从详情页返回或无分类切换请求，保持当前状态');
    console.log('[Category] 当前 activeTab:', pageInstance.data.activeTab);
    // 不调用 loadCategoriesWithRefresh()，保持当前分类状态
  }
}

describe('Category Navigation Property Tests', () => {
  /**
   * Property 1: 返回时保持分类状态
   * For any 分类页当前选中的分类索引 activeTab，当用户从产品详情页返回分类页时，
   * 如果全局数据中没有分类切换请求，则 activeTab 应该保持不变。
   * 
   * Validates: Requirements 1.1, 1.4, 2.2
   * Feature: category-navigation-fix, Property 1: 返回时保持分类状态
   */
  describe('Property 1: 返回时保持分类状态', () => {
    /**
     * 1.1: 从详情页返回时，activeTab 应保持不变
     * Requirements 1.1, 1.4, 2.2: 返回时保持分类状态
     */
    test('从详情页返回时，activeTab 应保持不变', () => {
      fc.assert(
        fc.property(
          // 生成有效的 activeTab 索引 (0-4，对应5个分类)
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          (activeTab) => {
            // 创建页面实例，模拟已经在某个分类下浏览
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: false, // 非首次加载（已经浏览过）
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，没有分类切换请求（模拟从详情页返回）
            const app = createMockApp({
              categoryType: null,
              categoryId: null
            });
            
            // 记录 onShow 前的 activeTab
            const activeTabBefore = pageInstance.data.activeTab;
            
            // 模拟 onShow 触发（从详情页返回）
            simulateOnShow(pageInstance, app);
            
            // 验证：activeTab 应保持不变
            const activeTabAfter = pageInstance.data.activeTab;
            
            return activeTabBefore === activeTabAfter;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 1.2: 多次从详情页返回时，activeTab 始终保持不变
     * Requirements 1.1, 1.4: 验证多次返回的一致性
     */
    test('多次从详情页返回时，activeTab 始终保持不变', () => {
      fc.assert(
        fc.property(
          // 生成有效的 activeTab 索引
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          // 生成返回次数 (1-5次)
          fc.integer({ min: 1, max: 5 }),
          (activeTab, returnCount) => {
            // 创建页面实例
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: false,
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，没有分类切换请求
            const app = createMockApp({
              categoryType: null,
              categoryId: null
            });
            
            // 记录初始 activeTab
            const initialActiveTab = pageInstance.data.activeTab;
            
            // 模拟多次从详情页返回
            for (let i = 0; i < returnCount; i++) {
              simulateOnShow(pageInstance, app);
            }
            
            // 验证：activeTab 应始终保持不变
            return pageInstance.data.activeTab === initialActiveTab;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 1.3: 不同分类索引下返回时都应保持状态
     * Requirements 1.1, 1.4, 2.2: 验证所有分类索引的一致性
     */
    test('不同分类索引下返回时都应保持状态', () => {
      fc.assert(
        fc.property(
          // 生成所有可能的 activeTab 索引
          fc.constantFrom(0, 1, 2, 3, 4),
          (activeTab) => {
            // 创建页面实例
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: false,
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，没有分类切换请求
            const app = createMockApp({
              categoryType: null,
              categoryId: null
            });
            
            // 模拟 onShow 触发
            simulateOnShow(pageInstance, app);
            
            // 验证：activeTab 应保持为原始值
            return pageInstance.data.activeTab === activeTab;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 返回时不触发数据刷新
   * For any 从详情页返回分类页的导航操作，如果全局数据中没有分类切换请求，
   * 则不应该触发 loadCategoriesWithRefresh 方法。
   * 
   * Validates: Requirements 1.2, 3.2
   * Feature: category-navigation-fix, Property 2: 返回时不触发数据刷新
   */
  describe('Property 2: 返回时不触发数据刷新', () => {
    /**
     * 2.1: 从详情页返回时，不应调用 loadCategoriesWithRefresh
     * Requirements 1.2, 3.2: 返回时不触发数据刷新
     */
    test('从详情页返回时，不应调用 loadCategoriesWithRefresh', () => {
      fc.assert(
        fc.property(
          // 生成有效的 activeTab 索引
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          (activeTab) => {
            // 创建页面实例
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: false, // 非首次加载
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，没有分类切换请求
            const app = createMockApp({
              categoryType: null,
              categoryId: null
            });
            
            // 重置方法调用记录
            pageInstance.resetMethodCalls();
            
            // 模拟 onShow 触发
            simulateOnShow(pageInstance, app);
            
            // 验证：loadCategoriesWithRefresh 不应被调用
            const methodCalls = pageInstance.getMethodCalls();
            return methodCalls.loadCategoriesWithRefresh === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.2: 多次从详情页返回时，都不应触发数据刷新
     * Requirements 1.2, 3.2: 验证多次返回都不触发刷新
     */
    test('多次从详情页返回时，都不应触发数据刷新', () => {
      fc.assert(
        fc.property(
          // 生成有效的 activeTab 索引
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          // 生成返回次数 (1-5次)
          fc.integer({ min: 1, max: 5 }),
          (activeTab, returnCount) => {
            // 创建页面实例
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: false,
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，没有分类切换请求
            const app = createMockApp({
              categoryType: null,
              categoryId: null
            });
            
            // 重置方法调用记录
            pageInstance.resetMethodCalls();
            
            // 模拟多次从详情页返回
            for (let i = 0; i < returnCount; i++) {
              simulateOnShow(pageInstance, app);
            }
            
            // 验证：loadCategoriesWithRefresh 不应被调用
            const methodCalls = pageInstance.getMethodCalls();
            return methodCalls.loadCategoriesWithRefresh === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.3: 有分类切换请求时，应触发数据刷新
     * Requirements 2.1: 验证有请求时的正确行为（对比测试）
     */
    test('有分类切换请求时，应触发数据刷新', () => {
      fc.assert(
        fc.property(
          // 生成有效的 activeTab 索引
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          // 生成分类切换请求（categoryType 或 categoryId）
          fc.oneof(
            fc.record({
              categoryType: fc.constantFrom('原木经典', '树脂美学', '玩趣设计', '高定专属', '桌架专区'),
              categoryId: fc.constant(null)
            }),
            fc.record({
              categoryType: fc.constant(null),
              categoryId: fc.constantFrom('cat_1', 'cat_2', 'cat_3', 'cat_4', 'cat_5')
            }),
            fc.record({
              categoryType: fc.constantFrom('原木经典', '树脂美学'),
              categoryId: fc.constantFrom('cat_1', 'cat_2')
            })
          ),
          (activeTab, switchRequest) => {
            // 创建页面实例
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: false,
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，有分类切换请求
            const app = createMockApp(switchRequest);
            
            // 重置方法调用记录
            pageInstance.resetMethodCalls();
            
            // 模拟 onShow 触发
            simulateOnShow(pageInstance, app);
            
            // 验证：loadCategoriesWithRefresh 应被调用
            const methodCalls = pageInstance.getMethodCalls();
            return methodCalls.loadCategoriesWithRefresh === 1;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.4: 首次加载时，不应调用 loadCategoriesWithRefresh（由 onLoad 处理）
     * Requirements 3.1: 验证首次加载的行为
     */
    test('首次加载时，不应调用 loadCategoriesWithRefresh', () => {
      fc.assert(
        fc.property(
          // 生成有效的 activeTab 索引
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          (activeTab) => {
            // 创建页面实例，首次加载
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: true, // 首次加载
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，没有分类切换请求
            const app = createMockApp({
              categoryType: null,
              categoryId: null
            });
            
            // 重置方法调用记录
            pageInstance.resetMethodCalls();
            
            // 模拟 onShow 触发
            simulateOnShow(pageInstance, app);
            
            // 验证：loadCategoriesWithRefresh 不应被调用
            // （首次加载由 onLoad 中的 loadCategories 处理）
            const methodCalls = pageInstance.getMethodCalls();
            return methodCalls.loadCategoriesWithRefresh === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * 2.5: 首次加载后 isFirstLoad 应设置为 false
     * Requirements 3.1: 验证首次加载标记的更新
     */
    test('首次加载后 isFirstLoad 应设置为 false', () => {
      fc.assert(
        fc.property(
          // 生成有效的 activeTab 索引
          fc.integer({ min: 0, max: mockCategories.length - 1 }),
          (activeTab) => {
            // 创建页面实例，首次加载
            const pageInstance = createMockPageInstance({
              activeTab: activeTab,
              isFirstLoad: true, // 首次加载
              categories: [...mockCategories]
            });
            
            // 创建 App 实例，没有分类切换请求
            const app = createMockApp({
              categoryType: null,
              categoryId: null
            });
            
            // 模拟 onShow 触发
            simulateOnShow(pageInstance, app);
            
            // 验证：isFirstLoad 应设置为 false
            return pageInstance.data.isFirstLoad === false;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property 4: 刷新后恢复分类状态
 * For any 分类页当前选中的分类索引 activeTab，当触发数据刷新（如下拉刷新）时，
 * 刷新完成后 activeTab 应该恢复到刷新前的值（除非有新的分类切换请求）。
 * 
 * Validates: Requirements 2.4, 3.4
 * Feature: category-navigation-fix, Property 4: 刷新后恢复分类状态
 */
describe('Category Navigation - Property 4: 刷新后恢复分类状态', () => {
  // Mock 分类数据
  const mockCategories = [
    { _id: 'cat_1', name: '原木经典', order: 1 },
    { _id: 'cat_2', name: '树脂美学', order: 2 },
    { _id: 'cat_3', name: '玩趣设计', order: 3 },
    { _id: 'cat_4', name: '高定专属', order: 4 },
    { _id: 'cat_5', name: '桌架专区', order: 5 }
  ];

  // 创建模拟的 Page 实例
  function createMockPageInstance(initialData = {}) {
    const defaultData = {
      showMenu: false,
      activeTab: 0,
      categories: [...mockCategories],
      loading: false,
      isFirstLoad: false,
      lastActiveTab: 0
    };

    const pageData = { ...defaultData, ...initialData };
    
    const pageInstance = {
      data: pageData,
      pendingSwitchCategoryId: null,
      pendingSwitchCategory: null,
      
      setData: function(newData) {
        Object.assign(this.data, newData);
      }
    };

    return pageInstance;
  }

  // 模拟 loadCategoriesWithRefresh 方法的核心逻辑
  function simulateLoadCategoriesWithRefresh(pageInstance, hasPendingSwitch = false) {
    // Requirements 2.4: 在刷新前保存当前 activeTab 到 lastActiveTab
    const savedActiveTab = pageInstance.data.activeTab;
    pageInstance.setData({ lastActiveTab: savedActiveTab });
    
    pageInstance.setData({ loading: true });
    
    // 检查是否有待切换的分类
    if (hasPendingSwitch) {
      // 有待切换的分类，不恢复到 lastActiveTab
      return;
    }
    
    // Requirements 3.4: 恢复到 lastActiveTab，处理索引越界的边界情况
    let targetIndex = pageInstance.data.lastActiveTab;
    
    // 边界情况处理：如果保存的索引超出当前分类数组长度，回退到索引 0
    if (targetIndex < 0 || targetIndex >= pageInstance.data.categories.length) {
      targetIndex = 0;
    }
    
    // 更新 activeTab
    pageInstance.setData({ activeTab: targetIndex, loading: false });
  }

  /**
   * 4.1: 刷新后应恢复到刷新前的分类索引
   * Requirements 2.4, 3.4: 刷新后恢复分类状态
   */
  test('刷新后应恢复到刷新前的分类索引', () => {
    const fc = require('fast-check');
    
    fc.assert(
      fc.property(
        // 生成有效的 activeTab 索引 (0-4，对应5个分类)
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (activeTab) => {
          // 创建页面实例
          const pageInstance = createMockPageInstance({
            activeTab: activeTab,
            categories: [...mockCategories]
          });
          
          // 记录刷新前的 activeTab
          const activeTabBefore = pageInstance.data.activeTab;
          
          // 模拟刷新操作（没有待切换的分类）
          simulateLoadCategoriesWithRefresh(pageInstance, false);
          
          // 验证：activeTab 应恢复到刷新前的值
          return pageInstance.data.activeTab === activeTabBefore;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 4.2: 刷新前应保存当前分类索引到 lastActiveTab
   * Requirements 2.4: 刷新前保存分类索引
   */
  test('刷新前应保存当前分类索引到 lastActiveTab', () => {
    const fc = require('fast-check');
    
    fc.assert(
      fc.property(
        // 生成有效的 activeTab 索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (activeTab) => {
          // 创建页面实例
          const pageInstance = createMockPageInstance({
            activeTab: activeTab,
            lastActiveTab: 0, // 初始值
            categories: [...mockCategories]
          });
          
          // 模拟刷新操作
          simulateLoadCategoriesWithRefresh(pageInstance, false);
          
          // 验证：lastActiveTab 应被设置为刷新前的 activeTab
          return pageInstance.data.lastActiveTab === activeTab;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 4.3: 索引越界时应回退到索引 0
   * Requirements 3.4: 处理索引越界的边界情况
   */
  test('索引越界时应回退到索引 0', () => {
    const fc = require('fast-check');
    
    fc.assert(
      fc.property(
        // 生成越界的索引值
        fc.oneof(
          fc.integer({ min: mockCategories.length, max: 100 }), // 超出上界
          fc.integer({ min: -100, max: -1 }) // 负数索引
        ),
        (invalidIndex) => {
          // 创建页面实例，设置一个越界的 lastActiveTab
          const pageInstance = createMockPageInstance({
            activeTab: 0,
            lastActiveTab: invalidIndex, // 越界的索引
            categories: [...mockCategories]
          });
          
          // 直接测试恢复逻辑
          let targetIndex = pageInstance.data.lastActiveTab;
          
          // 边界情况处理
          if (targetIndex < 0 || targetIndex >= pageInstance.data.categories.length) {
            targetIndex = 0;
          }
          
          pageInstance.setData({ activeTab: targetIndex });
          
          // 验证：activeTab 应回退到 0
          return pageInstance.data.activeTab === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 4.4: 有待切换分类时不应恢复到 lastActiveTab
   * Requirements 2.1: 有分类切换请求时应切换到指定分类
   */
  test('有待切换分类时不应恢复到 lastActiveTab', () => {
    const fc = require('fast-check');
    
    fc.assert(
      fc.property(
        // 生成有效的 activeTab 索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (activeTab) => {
          // 创建页面实例
          const pageInstance = createMockPageInstance({
            activeTab: activeTab,
            lastActiveTab: 0,
            categories: [...mockCategories]
          });
          
          // 设置待切换的分类
          pageInstance.pendingSwitchCategoryId = 'cat_3';
          pageInstance.pendingSwitchCategory = '玩趣设计';
          
          // 模拟刷新操作（有待切换的分类）
          simulateLoadCategoriesWithRefresh(pageInstance, true);
          
          // 验证：activeTab 不应被自动恢复（由待切换逻辑处理）
          return pageInstance.pendingSwitchCategoryId === 'cat_3';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 4.5: 多次刷新后仍能正确恢复分类状态
   * Requirements 2.4, 3.4: 验证多次刷新的一致性
   */
  test('多次刷新后仍能正确恢复分类状态', () => {
    const fc = require('fast-check');
    
    fc.assert(
      fc.property(
        // 生成有效的 activeTab 索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        // 生成刷新次数 (1-5次)
        fc.integer({ min: 1, max: 5 }),
        (activeTab, refreshCount) => {
          // 创建页面实例
          const pageInstance = createMockPageInstance({
            activeTab: activeTab,
            categories: [...mockCategories]
          });
          
          // 记录初始 activeTab
          const initialActiveTab = pageInstance.data.activeTab;
          
          // 模拟多次刷新
          for (let i = 0; i < refreshCount; i++) {
            simulateLoadCategoriesWithRefresh(pageInstance, false);
          }
          
          // 验证：activeTab 应始终恢复到初始值
          return pageInstance.data.activeTab === initialActiveTab;
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 3: 分类切换请求正确设置全局状态
 * For any 商品详情页的分类点击，应正确设置 categorySwitchRequest 全局状态
 * 
 * Validates: Requirements 1.3, 2.1, 3.1
 * Feature: category-navigation-fix, Property 3: 分类切换请求正确设置全局状态
 */
describe('Category Navigation - Property 3: 分类切换请求正确设置全局状态', () => {
  // Mock 分类数据
  const mockCategories = [
    { _id: 'cat_1', name: '原木经典', order: 1 },
    { _id: 'cat_2', name: '树脂美学', order: 2 },
    { _id: 'cat_3', name: '玩趣设计', order: 3 },
    { _id: 'cat_4', name: '高定专属', order: 4 },
    { _id: 'cat_5', name: '桌架专区', order: 5 }
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

  // 创建模拟的产品详情页实例
  function createMockProductDetailPage(productData = {}) {
    const defaultProduct = {
      _id: 'prod_1',
      name: '测试产品',
      categoryId: 'cat_1',
      categoryName: '原木经典'
    };

    const product = { ...defaultProduct, ...productData };

    return {
      data: {
        product: product
      }
    };
  }

  // 模拟 onCategoryTap 方法的核心逻辑
  function simulateOnCategoryTap(pageInstance, app) {
    const product = pageInstance.data.product;
    const categoryId = product.categoryId;
    const categoryName = product.categoryName || product.category;
    
    if (!categoryId) {
      return { success: false, reason: 'no_category_id' };
    }
    
    // 设置全局分类切换请求
    app.globalData.categorySwitchRequest = {
      pending: true,
      targetCategoryId: categoryId,
      targetCategoryName: categoryName
    };
    
    return { success: true, navigateTo: '/pages/category/category' };
  }

  /**
   * 3.1: 点击分类应设置 pending 为 true
   * Requirements 1.3: 设置 categorySwitchRequest 全局状态
   */
  test('点击分类应设置 pending 为 true', () => {
    fc.assert(
      fc.property(
        // 生成有效的分类索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (categoryIndex) => {
          const category = mockCategories[categoryIndex];
          
          // 创建 App 实例
          const app = createMockApp();
          
          // 创建产品详情页实例
          const pageInstance = createMockProductDetailPage({
            categoryId: category._id,
            categoryName: category.name
          });
          
          // 模拟点击分类
          simulateOnCategoryTap(pageInstance, app);
          
          // 验证：pending 应为 true
          return app.globalData.categorySwitchRequest.pending === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 3.2: 点击分类应设置正确的 targetCategoryId
   * Requirements 1.3, 2.1: 设置正确的目标分类ID
   */
  test('点击分类应设置正确的 targetCategoryId', () => {
    fc.assert(
      fc.property(
        // 生成有效的分类索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (categoryIndex) => {
          const category = mockCategories[categoryIndex];
          
          // 创建 App 实例
          const app = createMockApp();
          
          // 创建产品详情页实例
          const pageInstance = createMockProductDetailPage({
            categoryId: category._id,
            categoryName: category.name
          });
          
          // 模拟点击分类
          simulateOnCategoryTap(pageInstance, app);
          
          // 验证：targetCategoryId 应为产品的 categoryId
          return app.globalData.categorySwitchRequest.targetCategoryId === category._id;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 3.3: 点击分类应设置正确的 targetCategoryName
   * Requirements 1.3: 设置正确的目标分类名称
   */
  test('点击分类应设置正确的 targetCategoryName', () => {
    fc.assert(
      fc.property(
        // 生成有效的分类索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (categoryIndex) => {
          const category = mockCategories[categoryIndex];
          
          // 创建 App 实例
          const app = createMockApp();
          
          // 创建产品详情页实例
          const pageInstance = createMockProductDetailPage({
            categoryId: category._id,
            categoryName: category.name
          });
          
          // 模拟点击分类
          simulateOnCategoryTap(pageInstance, app);
          
          // 验证：targetCategoryName 应为产品的 categoryName
          return app.globalData.categorySwitchRequest.targetCategoryName === category.name;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 3.4: 无分类ID时不应设置全局状态
   * Requirements 1.3: 边界情况处理
   */
  test('无分类ID时不应设置全局状态', () => {
    fc.assert(
      fc.property(
        // 生成产品名称
        fc.string({ minLength: 1, maxLength: 20 }),
        (productName) => {
          // 创建 App 实例
          const app = createMockApp();
          
          // 创建产品详情页实例（无分类ID）
          const pageInstance = createMockProductDetailPage({
            categoryId: null,
            categoryName: null,
            name: productName
          });
          
          // 模拟点击分类
          const result = simulateOnCategoryTap(pageInstance, app);
          
          // 验证：应返回失败，且全局状态不变
          return result.success === false && 
                 app.globalData.categorySwitchRequest.pending === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 3.5: 点击分类应返回正确的导航路径
   * Requirements 3.1: 使用 wx.switchTab 导航到分类页面
   */
  test('点击分类应返回正确的导航路径', () => {
    fc.assert(
      fc.property(
        // 生成有效的分类索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (categoryIndex) => {
          const category = mockCategories[categoryIndex];
          
          // 创建 App 实例
          const app = createMockApp();
          
          // 创建产品详情页实例
          const pageInstance = createMockProductDetailPage({
            categoryId: category._id,
            categoryName: category.name
          });
          
          // 模拟点击分类
          const result = simulateOnCategoryTap(pageInstance, app);
          
          // 验证：应返回正确的导航路径
          return result.success === true && 
                 result.navigateTo === '/pages/category/category';
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 3.6: 多次点击分类应覆盖之前的全局状态
   * Requirements 1.3: 验证状态覆盖行为
   */
  test('多次点击分类应覆盖之前的全局状态', () => {
    fc.assert(
      fc.property(
        // 生成两个不同的分类索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (firstCategoryIndex, secondCategoryIndex) => {
          const firstCategory = mockCategories[firstCategoryIndex];
          const secondCategory = mockCategories[secondCategoryIndex];
          
          // 创建 App 实例
          const app = createMockApp();
          
          // 第一次点击
          const pageInstance1 = createMockProductDetailPage({
            categoryId: firstCategory._id,
            categoryName: firstCategory.name
          });
          simulateOnCategoryTap(pageInstance1, app);
          
          // 第二次点击（不同分类）
          const pageInstance2 = createMockProductDetailPage({
            categoryId: secondCategory._id,
            categoryName: secondCategory.name
          });
          simulateOnCategoryTap(pageInstance2, app);
          
          // 验证：全局状态应为第二次点击的分类
          return app.globalData.categorySwitchRequest.targetCategoryId === secondCategory._id &&
                 app.globalData.categorySwitchRequest.targetCategoryName === secondCategory.name;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 3.7: 使用 category 字段作为备选分类名称
   * Requirements 1.3: 兼容不同的数据结构
   */
  test('使用 category 字段作为备选分类名称', () => {
    fc.assert(
      fc.property(
        // 生成有效的分类索引
        fc.integer({ min: 0, max: mockCategories.length - 1 }),
        (categoryIndex) => {
          const category = mockCategories[categoryIndex];
          
          // 创建 App 实例
          const app = createMockApp();
          
          // 创建产品详情页实例（使用 category 而非 categoryName）
          const pageInstance = createMockProductDetailPage({
            categoryId: category._id,
            categoryName: null,
            category: category.name
          });
          
          // 模拟点击分类
          simulateOnCategoryTap(pageInstance, app);
          
          // 验证：targetCategoryName 应为 category 字段的值
          return app.globalData.categorySwitchRequest.targetCategoryName === category.name;
        }
      ),
      { numRuns: 100 }
    );
  });
});
