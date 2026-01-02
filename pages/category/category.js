// category.js
// Requirements: 2.2, 2.3, 2.4 - 分类产品筛选和分页
// Feature: category-filter-search - 筛选和搜索功能
const productData = require('../../utils/productData.js');
const productFilter = require('../../utils/productFilter.js');

Page({
  data: {
    showMenu: false, // 控制侧边菜单显示
    activeTab: 0, // 当前选中的分类索引
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64, // 默认内容区域顶部内边距
    categories: [], // 分类列表
    products: [], // 产品列表
    loading: false,
    loadingMore: false, // 加载更多状态 - Requirements 2.3
    totalProducts: 0, // 总产品数
    hasMoreProducts: false, // 是否有更多产品 - Requirements 2.3
    currentPage: 1, // 当前页码 - Requirements 2.3
    pageSize: 100, // 每页显示的产品数量 - 增大到100以显示所有产品
    scrollIntoView: '', // 用于scroll-view的scroll-into-view属性
    isFirstLoad: true, // 是否首次加载 - Requirements 1.1, 2.4
    lastActiveTab: 0, // 上次选中的分类索引（用于刷新后恢复）- Requirements 2.4
    
    // ========== 筛选和搜索相关字段 - Feature: category-filter-search ==========
    // Requirements: 1.1, 2.1, 3.1, 4.1
    
    // 搜索相关 - Requirements: 4.1
    searchKeyword: '',           // 当前搜索关键词
    searchInputValue: '',        // 输入框中的值（用于防抖）
    
    // 筛选面板 - Requirements: 1.1
    showFilterPanel: false,      // 筛选面板是否展开
    
    // 长度筛选 - Requirements: 2.1
    lengthFilter: null,          // 当前选中的长度范围 { min, max, label }
    lengthOptions: [             // 长度筛选选项
      { min: null, max: null, label: '不限' },
      { min: 0, max: 150, label: '150cm以下' },
      { min: 150, max: 180, label: '150-180cm' },
      { min: 180, max: 210, label: '180-210cm' },
      { min: 210, max: 240, label: '210-240cm' },
      { min: 240, max: 270, label: '240-270cm' },
      { min: 270, max: 300, label: '270-300cm' },
      { min: 300, max: 350, label: '300-350cm' },
      { min: 350, max: 400, label: '350-400cm' },
      { min: 400, max: 500, label: '400-500cm' },
      { min: 500, max: Infinity, label: '500cm以上' }
    ],
    
    // 宽度筛选 - Requirements: 3.1
    widthFilter: null,           // 当前选中的宽度范围 { min, max, label }
    widthOptions: [              // 宽度筛选选项
      { min: null, max: null, label: '不限' },
      { min: 0, max: 60, label: '60cm以下' },
      { min: 60, max: 80, label: '60-80cm' },
      { min: 80, max: 100, label: '80-100cm' },
      { min: 100, max: 120, label: '100-120cm' },
      { min: 120, max: 140, label: '120-140cm' },
      { min: 140, max: Infinity, label: '140cm以上' }
    ],
    
    // 排序相关 - Requirements: 7.1, 7.2
    sortOption: 'default',       // 当前排序方式
    showSortDropdown: false,     // 排序下拉菜单是否展开
    sortOptions: [               // 排序选项
      { value: 'default', label: '默认排序' },
      { value: 'newest', label: '最新优先' },
      { value: 'priceAsc', label: '价格升序' },
      { value: 'priceDesc', label: '价格降序' }
    ],
    
    // 筛选结果 - Requirements: 5.1
    filteredProducts: [],        // 筛选后的产品列表
    hasActiveFilters: false,     // 是否有激活的筛选条件
    activeFilterCount: 0,        // 激活的筛选条件数量 - Requirements: 5.2
    
    // 原始产品列表（用于筛选）
    allProducts: []              // 当前分类的所有产品（筛选前的完整列表）
    // ========== 筛选和搜索相关字段结束 ==========
  },
  
  // ========== 搜索和筛选方法 - Feature: category-filter-search ==========
  
  // 搜索防抖定时器
  _searchDebounceTimer: null,
  
  /**
   * 搜索输入事件处理 - Requirements: 4.2, 4.3
   * 实现防抖机制，延迟300ms执行筛选
   */
  onSearchInput: function(e) {
    const value = e.detail.value;
    console.log('[Search] 输入变化:', value);
    
    // 更新输入框显示值
    this.setData({
      searchInputValue: value
    });
    
    // 清除之前的防抖定时器
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }
    
    // 设置新的防抖定时器，300ms后执行搜索
    this._searchDebounceTimer = setTimeout(() => {
      this.executeSearch(value);
    }, 300);
  },
  
  /**
   * 搜索确认事件（键盘搜索按钮）
   */
  onSearchConfirm: function(e) {
    const value = e.detail.value;
    console.log('[Search] 确认搜索:', value);
    
    // 清除防抖定时器，立即执行搜索
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }
    
    this.executeSearch(value);
  },
  
  /**
   * 执行搜索 - Requirements: 4.2, 4.6
   * 大小写不敏感搜索
   */
  executeSearch: function(keyword) {
    console.log('[Search] 执行搜索:', keyword);
    
    // 更新搜索关键词
    this.setData({
      searchKeyword: keyword.trim()
    });
    
    // 应用所有筛选条件
    this.applyAllFilters();
  },
  
  /**
   * 清除搜索 - Requirements: 4.4, 4.5
   */
  clearSearch: function() {
    console.log('[Search] 清除搜索');
    
    // 清除防抖定时器
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }
    
    // 清除搜索关键词
    this.setData({
      searchKeyword: '',
      searchInputValue: ''
    });
    
    // 重新应用筛选（不含搜索）
    this.applyAllFilters();
  },
  
  /**
   * 切换筛选面板显示 - Requirements: 1.2, 1.3
   * 点击筛选按钮时展开/收起筛选面板
   */
  toggleFilterPanel: function() {
    console.log('[Filter] 切换筛选面板，当前状态:', this.data.showFilterPanel);
    
    this.setData({
      showFilterPanel: !this.data.showFilterPanel,
      showSortDropdown: false // 关闭排序下拉菜单
    });
    
    console.log('[Filter] 筛选面板新状态:', this.data.showFilterPanel);
  },
  
  /**
   * 切换排序下拉菜单显示 - Requirements: 7.1
   */
  toggleSortDropdown: function() {
    console.log('[Sort] 切换排序下拉菜单，当前状态:', this.data.showSortDropdown);
    
    this.setData({
      showSortDropdown: !this.data.showSortDropdown,
      showFilterPanel: false // 关闭筛选面板
    });
    
    console.log('[Sort] 排序下拉菜单新状态:', this.data.showSortDropdown);
  },
  
  /**
   * 选择排序方式 - Requirements: 7.3, 7.4, 7.5, 7.6
   */
  selectSortOption: function(e) {
    const value = e.currentTarget.dataset.value;
    console.log('[Sort] 选择排序方式:', value);
    
    this.setData({
      sortOption: value,
      showSortDropdown: false
    });
    
    // 重新应用筛选和排序
    this.applyAllFilters();
  },
  
  /**
   * 获取当前排序选项的标签
   */
  getCurrentSortLabel: function() {
    const option = this.data.sortOptions.find(opt => opt.value === this.data.sortOption);
    return option ? option.label : '默认排序';
  },
  
  /**
   * 选择长度筛选范围 - Requirements: 1.6, 2.2, 2.3, 2.4
   * 单选模式：只能选择一个长度范围
   * "不限" 选项会清除长度筛选
   */
  selectLengthFilter: function(e) {
    const index = e.currentTarget.dataset.index;
    const selectedOption = this.data.lengthOptions[index];
    
    console.log('[Filter] 选择长度筛选:', selectedOption);
    
    // 如果选择 "不限" 选项，清除长度筛选
    if (selectedOption.min === null) {
      console.log('[Filter] 选择不限，清除长度筛选');
      this.setData({
        lengthFilter: null
      });
    } else if (this.data.lengthFilter && this.data.lengthFilter.label === selectedOption.label) {
      // 如果点击已选中的选项，则取消选择（回到不限）
      console.log('[Filter] 取消长度筛选');
      this.setData({
        lengthFilter: null
      });
    } else {
      // 选择新的选项（单选模式）
      this.setData({
        lengthFilter: selectedOption
      });
    }
    
    // 应用所有筛选条件
    this.applyAllFilters();
  },
  
  /**
   * 选择宽度筛选范围 - Requirements: 1.6, 3.2, 3.3, 3.4
   * 单选模式：只能选择一个宽度范围
   * "不限" 选项会清除宽度筛选
   */
  selectWidthFilter: function(e) {
    const index = e.currentTarget.dataset.index;
    const selectedOption = this.data.widthOptions[index];
    
    console.log('[Filter] 选择宽度筛选:', selectedOption);
    
    // 如果选择 "不限" 选项，清除宽度筛选
    if (selectedOption.min === null) {
      console.log('[Filter] 选择不限，清除宽度筛选');
      this.setData({
        widthFilter: null
      });
    } else if (this.data.widthFilter && this.data.widthFilter.label === selectedOption.label) {
      // 如果点击已选中的选项，则取消选择（回到不限）
      console.log('[Filter] 取消宽度筛选');
      this.setData({
        widthFilter: null
      });
    } else {
      // 选择新的选项（单选模式）
      this.setData({
        widthFilter: selectedOption
      });
    }
    
    // 应用所有筛选条件
    this.applyAllFilters();
  },
  
  /**
   * 清除长度筛选 - Requirements: 2.3
   */
  clearLengthFilter: function() {
    console.log('[Filter] 清除长度筛选');
    
    this.setData({
      lengthFilter: null
    });
    
    // 重新应用筛选
    this.applyAllFilters();
  },
  
  /**
   * 清除宽度筛选 - Requirements: 3.3
   */
  clearWidthFilter: function() {
    console.log('[Filter] 清除宽度筛选');
    
    this.setData({
      widthFilter: null
    });
    
    // 重新应用筛选
    this.applyAllFilters();
  },
  
  /**
   * 清除所有筛选条件 - Requirements: 5.3
   */
  clearAllFilters: function() {
    console.log('[Filter] 清除所有筛选');
    
    // 清除防抖定时器
    if (this._searchDebounceTimer) {
      clearTimeout(this._searchDebounceTimer);
    }
    
    // 重置所有筛选和排序状态
    this.setData({
      searchKeyword: '',
      searchInputValue: '',
      lengthFilter: null,
      widthFilter: null,
      sortOption: 'default',
      showFilterPanel: false,
      showSortDropdown: false,
      hasActiveFilters: false,
      filteredProducts: []
    });
    
    console.log('[Filter] 所有筛选已清除');
  },
  
  /**
   * 应用所有筛选条件 - Requirements: 5.1, 5.2, 7.8
   * 组合搜索关键词、长度筛选、宽度筛选，然后应用排序
   * 使用 allProducts 作为筛选源，确保筛选基于完整的产品列表
   */
  applyAllFilters: function() {
    console.log('[Filter] 应用所有筛选条件');
    
    const { searchKeyword, lengthFilter, widthFilter, sortOption, allProducts, products } = this.data;
    
    // 使用 allProducts 作为筛选源，如果 allProducts 为空则使用 products
    // Requirements: 5.1 - 组合筛选应基于原始产品列表
    const sourceProducts = (allProducts && allProducts.length > 0) ? allProducts : products;
    
    console.log('[Filter] 筛选源产品数量:', sourceProducts.length);
    
    // 🆕 调试：打印前3个产品的尺寸信息
    if (sourceProducts.length > 0) {
      console.log('[Filter] 产品尺寸数据示例:');
      sourceProducts.slice(0, 3).forEach((p, i) => {
        const sizeFromProduct = productFilter.getSizeFromProduct ? productFilter.getSizeFromProduct(p) : null;
        console.log(`[Filter] 产品${i+1}: name=${p.name}, size=${p.size}, params=${JSON.stringify(p.params)}, 提取的尺寸=${sizeFromProduct}`);
      });
    }
    
    // 构建筛选条件对象
    const filters = {};
    
    if (searchKeyword && searchKeyword.trim()) {
      filters.keyword = searchKeyword.trim();
    }
    
    // 只有当 lengthFilter 不是 "不限" 时才添加筛选条件
    if (lengthFilter && lengthFilter.min !== null) {
      filters.lengthRange = {
        min: lengthFilter.min,
        max: lengthFilter.max
      };
    }
    
    // 只有当 widthFilter 不是 "不限" 时才添加筛选条件
    if (widthFilter && widthFilter.min !== null) {
      filters.widthRange = {
        min: widthFilter.min,
        max: widthFilter.max
      };
    }
    
    // 检查是否有激活的筛选条件（不包括 "不限" 选项）
    const hasFilters = productFilter.hasActiveFilters(filters);
    
    // 检查是否有非默认排序
    const hasNonDefaultSort = sortOption && sortOption !== 'default';
    
    console.log('[Filter] 筛选条件:', filters);
    console.log('[Filter] 是否有激活筛选:', hasFilters);
    console.log('[Sort] 当前排序方式:', sortOption);
    
    // Requirements: 5.2 - 更新筛选状态指示器
    const activeFilterCount = this.getActiveFilterCount();
    
    if (hasFilters || hasNonDefaultSort) {
      // 应用筛选 - Requirements: 5.1
      let resultProducts = hasFilters 
        ? productFilter.applyFilters(sourceProducts, filters)
        : [...sourceProducts];
      
      // 应用排序 - Requirements: 7.8 (排序在筛选后应用)
      if (hasNonDefaultSort) {
        resultProducts = productFilter.sortProducts(resultProducts, sortOption);
        console.log('[Sort] 排序后产品数量:', resultProducts.length);
      }
      
      console.log('[Filter] 最终结果数量:', resultProducts.length);
      console.log('[Filter] 激活的筛选条件数量:', activeFilterCount);
      
      this.setData({
        filteredProducts: resultProducts,
        hasActiveFilters: hasFilters || hasNonDefaultSort,
        activeFilterCount: activeFilterCount
      });
    } else {
      // 无筛选条件且默认排序，清空筛选结果
      this.setData({
        filteredProducts: [],
        hasActiveFilters: false,
        activeFilterCount: 0
      });
    }
  },
  
  /**
   * 获取当前激活的筛选条件数量 - Requirements: 5.2
   * 用于更新筛选状态指示器
   */
  getActiveFilterCount: function() {
    let count = 0;
    
    if (this.data.searchKeyword && this.data.searchKeyword.trim()) {
      count++;
    }
    
    if (this.data.lengthFilter) {
      count++;
    }
    
    if (this.data.widthFilter) {
      count++;
    }
    
    return count;
  },
  
  // ========== 搜索和筛选方法结束 ==========
  
  onLoad: function() {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    // 设置状态栏高度和内容区域顶部内边距
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = 44; // 固定导航栏高度
    const contentPaddingTop = statusBarHeight + navBarHeight;
    
    // 确保首次加载标识为 true - Requirements 3.1
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      contentPaddingTop: contentPaddingTop,
      isFirstLoad: true
    });
    
    // 加载分类数据
    this.loadCategories();
  },
  
  // 页面显示时检查是否有指定分类
  // Requirements: 1.1, 1.2, 1.4, 2.2, 2.3, 3.2 - 优化刷新策略
  onShow: function() {
    console.log('[Category] onShow 触发, isFirstLoad:', this.data.isFirstLoad);
    
    // 重置可能遮挡页面的弹窗状态
    if (this.data.showMenu) {
      console.log('[Category] 检测到侧边菜单未关闭，重置中...');
      this.setData({ showMenu: false });
    }
    
    // 获取全局数据中的分类类型和ID
    const app = getApp();
    const hasEventChannel = app && app.globalData && app.globalData.eventChannel;
    const hasCategorySwitchRequest = hasEventChannel && 
        (app.globalData.eventChannel.categoryType || app.globalData.eventChannel.categoryId);
    
    if (hasCategorySwitchRequest) {
      // 有分类切换请求，处理跳转
      const categoryType = app.globalData.eventChannel.categoryType;
      const categoryId = app.globalData.eventChannel.categoryId;
      console.log('[Category] 接收到分类切换请求，分类类型:', categoryType, '分类ID:', categoryId);
      
      // Requirements 2.3: 处理后立即清除全局数据，避免下次进入页面仍然跳转
      app.globalData.eventChannel.categoryType = null;
      app.globalData.eventChannel.categoryId = null;
      console.log('[Category] 已清除全局分类切换请求数据');
      
      // 保存要切换的分类信息（优先使用ID）
      this.pendingSwitchCategoryId = categoryId;
      this.pendingSwitchCategory = categoryType;
      
      // 强制刷新分类数据，确保获取最新的分类名称和排序
      console.log('[Category] 强制刷新分类数据（有指定分类）');
      this.loadCategoriesWithRefresh();
    } else if (this.data.isFirstLoad) {
      // Requirements 3.1: 首次加载时加载分类数据
      console.log('[Category] 首次加载，加载分类数据');
      // 首次加载已在 onLoad 中处理，这里标记为非首次加载
      this.setData({ isFirstLoad: false });
    } else {
      // Requirements 1.1, 1.2, 1.4, 2.2, 3.2: 从详情页返回时，保持当前状态不变
      // 不触发数据刷新，保持 activeTab 不变
      console.log('[Category] 从详情页返回或无分类切换请求，保持当前状态');
      console.log('[Category] 当前 activeTab:', this.data.activeTab);
      // 不调用 loadCategoriesWithRefresh()，保持当前分类状态
    }
  },
  
  // 查找并切换到指定分类
  findAndSwitchCategory: function(categoryName) {
    console.log('尝试查找分类:', categoryName);
    
    if (!categoryName) {
      console.log('分类名称为空，无法查找');
      return;
    }
    
    // 确保分类数据已加载
    if (this.data.categories && this.data.categories.length > 0) {
      // 打印当前所有分类，用于调试
      console.log('当前所有分类:', this.data.categories.map(cat => cat.name));
      
      // 精确匹配
      let index = this.data.categories.findIndex(cat => cat.name === categoryName);
      console.log('精确匹配结果:', index);
      
      // 如果精确匹配失败，尝试部分匹配
      if (index === -1) {
        // 定义精确的分类名称映射表
        const exactCategoryMapping = {
          '原木经典': 0,
          '树脂美学': 1,
          '玩趣设计': 2,
          '高定专属': 3,
          '桌架专区': 4
        };
        
        if (exactCategoryMapping[categoryName] !== undefined) {
          index = exactCategoryMapping[categoryName];
          console.log('通过精确映射找到分类索引:', index);
        } else {
          // 定义分类名称关键词映射表
          const categoryMapping = {
            '原木': '原木经典',
            '树脂': '树脂美学',
            '玩趣': '玩趣设计',
            '设计': '玩趣设计',
            '高定': '高定专属',
            '专属': '高定专属',
            '桌架': '桌架专区',
            '专区': '桌架专区'
          };
          
          // 检查是否有部分匹配
          for (const [key, value] of Object.entries(categoryMapping)) {
            if (categoryName.includes(key)) {
              const mappedIndex = this.data.categories.findIndex(cat => cat.name === value);
              if (mappedIndex !== -1) {
                index = mappedIndex;
                console.log('通过关键词匹配找到分类:', key, '->', value, '索引:', index);
                break;
              }
            }
          }
          
          // 如果映射表匹配失败，尝试反向匹配
          if (index === -1) {
            for (let i = 0; i < this.data.categories.length; i++) {
              const catName = this.data.categories[i].name;
              if (categoryName.includes(catName) || catName.includes(categoryName)) {
                index = i;
                console.log('通过反向匹配找到分类:', catName, '索引:', index);
                break;
              }
            }
          }
        }
      }
      
      if (index !== -1) {
        if (index >= 0 && index < this.data.categories.length) {
          console.log('找到分类索引:', index, '分类名称:', this.data.categories[index].name);
          
          // 如果当前已经是该分类，不需要重新加载
          if (this.data.activeTab === index) {
            console.log('当前已经是该分类，不需要重新加载');
            // 仍然需要确保视觉上的滚动到对应分类
            this.scrollToCategoryItem(index);
          } else {
            console.log('切换到分类索引:', index);
            
            // 先更新activeTab，确保UI立即响应
            this.setData({
              activeTab: index
            });
            
            // 滚动到对应分类
            this.scrollToCategoryItem(index);
            
            // 然后加载产品数据
            this.loadProductsByCategory(index);
          }
        } else {
          console.log('分类索引超出范围:', index, '分类总数:', this.data.categories.length);
        }
      } else {
        console.log('未找到分类:', categoryName);
      }
    } else {
      console.log('分类数据尚未加载完成，稍后将尝试切换到:', categoryName);
      // 保存要切换的分类名称，等分类加载完成后再切换
      this.pendingSwitchCategory = categoryName;
    }
  },

  // 加载分类数据
  async loadCategories() {
    // 设置加载状态标记，避免重复加载
    this.loadingCategories = true;
    
    try {
      this.setData({ loading: true });
      
      console.log('[Category] 开始加载分类数据');
      
      // 使用公共产品数据模块 - Requirements 2.1
      const categories = await productData.getCategories();
      
      console.log('[Category] 分类数据加载完成，共', categories.length, '个分类');
      // 验证分类按排序权重排序 - Requirements 2.5
      console.log('[Category] 分类排序顺序:', categories.map(cat => `${cat.name}(order:${cat.order})`).join(' -> '));
      
      this.setData({
        categories: categories,
        loading: false
      });
      
      // 检查是否有待切换的分类
      if (this.pendingSwitchCategory) {
        const categoryName = this.pendingSwitchCategory;
        this.pendingSwitchCategory = null; // 清除待切换标记
        console.log('分类加载完成，处理待切换分类:', categoryName);
        
        // 延迟执行，确保UI更新完成
        setTimeout(() => {
          // 使用增强的分类查找逻辑
          this.findAndSwitchCategory(categoryName);
        }, 200);
        
        return; // 已尝试切换到指定分类，不需要加载默认分类
      }
      
      // 如果有分类且没有切换到指定分类，默认选中第一个
      if (this.data.categories.length > 0) {
        this.loadProductsByCategory(0);
      }
      
      // 首次加载完成后，标记为非首次加载 - Requirements 3.1
      if (this.data.isFirstLoad) {
        this.setData({ isFirstLoad: false });
        console.log('[Category] 首次加载完成，isFirstLoad 设置为 false');
      }
    } catch (error) {
      console.error('加载分类失败', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      // 清除加载状态标记
      this.loadingCategories = false;
    }
  },

  // 强制刷新分类数据（清除缓存后重新加载）
  // Requirements 2.4, 3.3, 3.4: 刷新前保存当前分类索引，刷新后恢复
  async loadCategoriesWithRefresh() {
    // 设置加载状态标记，避免重复加载
    this.loadingCategories = true;
    
    // Requirements 2.4: 在刷新前保存当前 activeTab 到 lastActiveTab
    const savedActiveTab = this.data.activeTab;
    this.setData({ lastActiveTab: savedActiveTab });
    console.log('[Category] 保存当前分类索引:', savedActiveTab);
    
    try {
      this.setData({ loading: true });
      
      console.log('[Category] 开始强制刷新分类数据');
      
      // 使用 refreshCategories 方法，它会先清除缓存再获取数据
      const categories = await productData.refreshCategories();
      
      console.log('[Category] 分类数据刷新完成，共', categories.length, '个分类');
      // 验证分类按排序权重排序 - Requirements 2.5
      console.log('[Category] 分类排序顺序:', categories.map(cat => `${cat.name}(order:${cat.order})`).join(' -> '));
      
      this.setData({
        categories: categories,
        loading: false
      });
      
      // 🆕 检查是否有待切换的分类（优先使用ID）
      if (this.pendingSwitchCategoryId || this.pendingSwitchCategory) {
        const categoryId = this.pendingSwitchCategoryId;
        const categoryName = this.pendingSwitchCategory;
        this.pendingSwitchCategoryId = null; // 清除待切换标记
        this.pendingSwitchCategory = null;
        console.log('分类加载完成，处理待切换分类，ID:', categoryId, '名称:', categoryName);
        
        // 延迟执行，确保UI更新完成
        setTimeout(() => {
          // 🆕 优先使用ID查找分类
          if (categoryId) {
            const targetIndex = categories.findIndex(cat => cat._id === categoryId);
            if (targetIndex !== -1) {
              console.log('通过ID找到分类，索引:', targetIndex);
              this.setData({ activeTab: targetIndex });
              this.scrollToCategoryItem(targetIndex);
              this.loadProductsByCategory(targetIndex);
              return;
            }
          }
          // 如果ID查找失败，使用名称查找
          this.findAndSwitchCategory(categoryName);
        }, 200);
        
        return; // 已尝试切换到指定分类，不需要加载默认分类
      }
      
      // Requirements 3.4: 如果有分类且没有切换到指定分类，恢复到之前的分类索引
      if (this.data.categories.length > 0) {
        // Requirements 2.4, 3.4: 恢复到 lastActiveTab，处理索引越界的边界情况
        let targetIndex = this.data.lastActiveTab;
        
        // 边界情况处理：如果保存的索引超出当前分类数组长度，回退到索引 0
        if (targetIndex < 0 || targetIndex >= this.data.categories.length) {
          console.log('[Category] lastActiveTab 索引越界，回退到 0:', targetIndex);
          targetIndex = 0;
        }
        
        console.log('[Category] 刷新完成，恢复到分类索引:', targetIndex);
        
        // 同时刷新产品缓存
        await productData.refreshCategoryProducts(this.data.categories[targetIndex]._id, {
          limit: this.data.pageSize,
          offset: 0
        });
        
        // 更新 activeTab 并加载产品
        this.setData({ activeTab: targetIndex });
        this.loadProductsByCategory(targetIndex);
      }
    } catch (error) {
      console.error('刷新分类失败', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      // 清除加载状态标记
      this.loadingCategories = false;
    }
  },

  // 根据分类加载产品 - Requirements 2.2, 2.4
  // 当用户选择某个分类时，筛选并显示该分类下的所有产品
  // 当用户切换分类时，清空当前列表并加载新分类产品
  // Feature: category-filter-search - 保存原始产品列表用于筛选
  async loadProductsByCategory(categoryIndex) {
    try {
      console.log('loadProductsByCategory 开始，索引:', categoryIndex);
      console.log('当前分类数组:', this.data.categories);

      const category = this.data.categories[categoryIndex];
      if (!category) {
        console.error('分类不存在，索引:', categoryIndex, '分类总数:', this.data.categories.length);
        wx.showToast({
          title: '分类不存在',
          icon: 'none'
        });
        return;
      }

      console.log('开始加载分类产品:', category.name, '分类ID:', category._id);

      // Requirements 2.4: 切换分类时清空当前列表
      // Feature: category-filter-search - 同时清空 allProducts
      this.setData({
        loading: true,
        loadingMore: false,
        currentPage: 1,
        products: [], // 清空当前列表
        allProducts: [] // 清空原始产品列表
      });

      // 检查分类ID是否有效
      if (!category._id) {
        console.error('分类ID无效:', category);
        this.setData({
          loading: false,
          products: [],
          allProducts: [],
          totalProducts: 0,
          hasMoreProducts: false
        });
        wx.showToast({
          title: '分类ID无效',
          icon: 'none'
        });
        return;
      }

      // 使用公共产品数据模块 - Requirements 2.2: 按分类筛选产品
      console.log('调用 productData.getProductsByCategory，参数:', category._id, { 
        limit: this.data.pageSize,
        offset: 0 
      });
      const result = await productData.getProductsByCategory(category._id, {
        limit: this.data.pageSize,
        offset: 0
      });

      console.log('获取到产品结果:', result);
      console.log('产品数量:', result.products ? result.products.length : 0);
      console.log('总数:', result.total);
      
      if (result.products && result.products.length > 0) {
        console.log('第一个产品示例:', result.products[0]);
      } else {
        console.warn('该分类没有产品');
        
        // 尝试使用备用方法获取产品
        console.log('尝试使用备用方法获取产品...');
        const fallbackResult = await this.tryFallbackProductLoad(category);
        
        if (fallbackResult && fallbackResult.products && fallbackResult.products.length > 0) {
          console.log('备用方法成功获取到产品:', fallbackResult.products.length);
          
          // 更新产品数据，同时保持activeTab的值
          // Feature: category-filter-search - 保存到 allProducts
          this.setData({
            products: fallbackResult.products,
            allProducts: fallbackResult.products, // 保存原始产品列表
            activeTab: categoryIndex,
            totalProducts: fallbackResult.total || fallbackResult.products.length,
            hasMoreProducts: false,
            loading: false
          });
          
          // Feature: category-filter-search - 加载完成后应用筛选
          this.applyAllFilters();
          
          console.log('使用备用数据加载完成，当前activeTab:', categoryIndex);
          return;
        }
      }
      
      // 计算是否有更多产品 - Requirements 2.3
      const loadedCount = result.products ? result.products.length : 0;
      const totalCount = result.total || 0;
      const hasMore = loadedCount < totalCount;
      
      // 更新产品数据，同时保持activeTab的值
      // Feature: category-filter-search - 保存到 allProducts 用于筛选
      const loadedProducts = result.products || [];
      this.setData({
        products: loadedProducts,
        allProducts: loadedProducts, // Requirements: 5.1 - 保存原始产品列表
        activeTab: categoryIndex,
        totalProducts: totalCount,
        hasMoreProducts: hasMore,
        loading: false
      });
      
      // Feature: category-filter-search - 加载完成后应用当前筛选条件
      // Requirements: 5.1 - 确保筛选状态在产品加载后生效
      this.applyAllFilters();
      
      console.log('分类页加载完成，当前activeTab:', categoryIndex);
      console.log(`加载${category.name}分类产品: ${loadedCount}/${totalCount}, 还有更多: ${hasMore}`);
    } catch (error) {
      console.error('加载产品失败', error);
      this.setData({ loading: false, loadingMore: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 加载更多产品 - Requirements 2.3: 分页加载更多产品
  async loadMoreProducts() {
    // 检查是否可以加载更多
    if (this.data.loadingMore || this.data.loading || !this.data.hasMoreProducts) {
      console.log('无法加载更多:', {
        loadingMore: this.data.loadingMore,
        loading: this.data.loading,
        hasMoreProducts: this.data.hasMoreProducts
      });
      return;
    }

    const category = this.data.categories[this.data.activeTab];
    if (!category || !category._id) {
      console.error('当前分类无效，无法加载更多');
      return;
    }

    try {
      console.log('开始加载更多产品，当前页:', this.data.currentPage);
      
      this.setData({ loadingMore: true });

      const nextPage = this.data.currentPage + 1;
      const offset = this.data.currentPage * this.data.pageSize;

      // 调用数据接口获取下一页数据
      const result = await productData.getProductsByCategory(category._id, {
        limit: this.data.pageSize,
        offset: offset
      });

      console.log('加载更多结果:', result);
      console.log('新增产品数量:', result.products ? result.products.length : 0);

      if (result.products && result.products.length > 0) {
        // 合并新数据到现有列表
        const newProducts = [...this.data.products, ...result.products];
        const hasMore = newProducts.length < (result.total || 0);

        this.setData({
          products: newProducts,
          currentPage: nextPage,
          hasMoreProducts: hasMore,
          loadingMore: false
        });

        console.log(`加载更多完成: 第${nextPage}页, 总计${newProducts.length}/${result.total}个产品, 还有更多: ${hasMore}`);
      } else {
        // 没有更多数据
        this.setData({
          hasMoreProducts: false,
          loadingMore: false
        });
        console.log('没有更多产品了');
      }
    } catch (error) {
      console.error('加载更多产品失败:', error);
      this.setData({ loadingMore: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 滚动到底部触发加载更多 - Requirements 2.3
  onScrollToLower() {
    console.log('滚动到底部，触发加载更多');
    this.loadMoreProducts();
  },
  
  // 切换分类
  switchTab: function(e) {
    console.log('switchTab 被调用，事件对象:', e);
    console.log('事件数据集:', e.currentTarget.dataset);

    const index = e.currentTarget.dataset.index;
    const categoryId = e.currentTarget.dataset.categoryId;
    const categoryName = e.currentTarget.dataset.categoryName;

    console.log('手动切换到分类:', {
      index: index,
      categoryId: categoryId,
      categoryName: categoryName
    });

    // 验证索引有效性
    if (index === undefined || index === null) {
      console.error('分类索引无效:', index);
      wx.showToast({
        title: '分类索引无效',
        icon: 'none'
      });
      return;
    }

    const numIndex = parseInt(index);
    if (isNaN(numIndex) || numIndex < 0 || numIndex >= this.data.categories.length) {
      console.error('分类索引超出范围:', numIndex, '分类总数:', this.data.categories.length);
      wx.showToast({
        title: '分类索引超出范围',
        icon: 'none'
      });
      return;
    }

    const targetCategory = this.data.categories[numIndex];
    console.log('目标分类:', targetCategory);

    // 防止重复点击同一分类
    if (this.data.activeTab === numIndex) {
      console.log('已经是当前分类，无需切换');
      return;
    }

    console.log('切换到分类:', targetCategory?.name, '索引:', numIndex);
    
    // Feature: category-filter-search - Requirements: 5.4
    // 筛选状态（searchKeyword, lengthFilter, widthFilter）在分类切换时保持不变
    // loadProductsByCategory 会在加载完成后调用 applyAllFilters() 应用当前筛选状态
    console.log('[Filter] 分类切换时保持筛选状态:', {
      searchKeyword: this.data.searchKeyword,
      lengthFilter: this.data.lengthFilter ? this.data.lengthFilter.label : null,
      widthFilter: this.data.widthFilter ? this.data.widthFilter.label : null
    });

    // 先更新activeTab，确保UI立即响应
    this.setData({
      activeTab: numIndex
    });

    // 滚动到对应分类
    this.scrollToCategoryItem(numIndex);

    // 加载产品数据 - 会自动应用当前筛选状态
    this.loadProductsByCategory(numIndex);
  },
  
  // 跳转到产品详情页
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('分类页点击产品，ID:', id);
    
    if (!id) {
      console.error('分类页点击产品，但ID为空');
      wx.showToast({
        title: '产品ID不存在',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: '/pages/product-detail/product-detail?id=' + id,
      success: function() {
        console.log('成功跳转到详情页，ID:', id);
      },
      fail: function(error) {
        console.error('跳转到详情页失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 收藏/取消收藏
  toggleFavorite: function(e) {
    console.log('toggleFavorite 被调用，事件对象:', e);
    
    // 安全地阻止事件冒泡
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    
    // 安全地获取数据
    const id = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.id : null;
    console.log('分类页面收藏按钮点击，产品ID:', id);
    
    if (!id) {
      console.error('无法获取产品ID，事件对象:', e);
      wx.showToast({
        title: '产品ID获取失败',
        icon: 'none'
      });
      return;
    }
    
    // 从当前产品列表中找到对应的产品
    const products = this.data.products;
    if (!products || !Array.isArray(products)) {
      console.error('产品列表无效:', products);
      wx.showToast({
        title: '产品列表加载失败',
        icon: 'none'
      });
      return;
    }
    
    const productIndex = products.findIndex(p => p._id === id);
    
    if (productIndex === -1) {
      console.error('未找到对应的产品，ID:', id, '产品列表长度:', products.length);
      wx.showToast({
        title: '产品不存在',
        icon: 'none'
      });
      return;
    }
    
    const item = products[productIndex];
    console.log('找到产品数据:', item);
    
    // 使用公共产品数据模块处理收藏逻辑
    const isFavorite = productData.toggleProductFavorite(id, item);
    console.log('收藏操作结果:', isFavorite);
    
    // 更新产品状态
    products[productIndex].isFavorite = isFavorite;
    
    this.setData({
      products: products
    });
    
    console.log('分类页面收藏状态已更新');
  },
  
  // 滚动到对应分类项
  scrollToCategoryItem: function(index) {
    console.log('滚动到分类项:', index);

    if (index < 0 || !this.data.categories || index >= this.data.categories.length) {
      console.error('无效的分类索引:', index);
      return;
    }

    // 简化的滚动实现，避免使用已废弃的API
    try {
      // 方法1：使用scroll-view的scroll-into-view属性（推荐）
      this.setData({
        scrollIntoView: `category-item-${index}`
      });

      // 延迟一下再清除，确保滚动完成
      setTimeout(() => {
        this.setData({
          scrollIntoView: ''
        });
      }, 500);

    } catch (error) {
      console.error('滚动失败，使用备用方案:', error);

      // 方法2：备用方案 - 使用修复后的API
      const query = wx.createSelectorQuery();
      query.select(`#category-item-${index}`).boundingClientRect();
      query.select('.category-list').boundingClientRect();
      query.exec(res => {
        if (!res || !res[0] || !res[1]) {
          console.error('获取元素位置失败');
          return;
        }

        const target = res[0]; // 目标分类项
        const container = res[1]; // 分类列表容器

        // 计算目标元素相对于容器的位置
        const elementTop = target.top - container.top;
        // 计算使目标元素居中的滚动位置
        const centerPosition = Math.max(0, elementTop - (container.height - target.height) / 2);

        console.log('滚动到分类项:', index, '位置:', centerPosition);

        // 方法3：使用pageScrollTo作为最终备用方案
        wx.pageScrollTo({
          scrollTop: centerPosition,
          duration: 300
        });
      });
    }

    // 高亮显示当前分类
    this.setData({
      activeTab: index
    });
  },
  
  // 备用方法获取产品（已废弃，数据库是唯一数据源）
  async tryFallbackProductLoad(category) {
    console.log('备用方法已废弃，分类:', category.name, '- 请确保数据库中有产品数据');
    return { products: [], total: 0 };
  },

  // 🆕 图片加载失败处理
  onImageError: function(e) {
    const imageSrc = e.target.src;
    const productIndex = e.currentTarget.dataset.index;
    const productId = e.currentTarget.dataset.id;
    
    console.error('🖼️ 分类页图片加载失败:', imageSrc);
    console.error('🖼️ 产品ID:', productId, '索引:', productIndex);
    
    // 如果是临时URL加载失败，尝试重新获取
    if (imageSrc && imageSrc.includes('tcb.qcloud.la')) {
      if (imageSrc.includes('sign=')) {
        console.log('🔄 分类页检测到临时URL失败，可能已过期或403错误');
        this.refreshProductImage(productIndex, imageSrc);
      } else {
        console.log('🔄 分类页检测到云存储域名但非临时URL格式');
        // 可能是其他类型的云存储URL错误
        this.handleImageLoadError(productIndex, productId, imageSrc);
      }
    } else {
      console.log('🔄 分类页检测到非云存储URL错误');
      this.handleImageLoadError(productIndex, productId, imageSrc);
    }
  },

  // 🆕 处理图片加载错误的通用方法
  handleImageLoadError: function(productIndex, productId, failedUrl) {
    console.log('🚨 分类页处理图片加载错误:', {
      productIndex,
      productId,
      failedUrl
    });
    
    // 设置默认图片 - 使用云存储图片
    const products = this.data.products;
    if (products && productIndex !== undefined && productIndex < products.length) {
      // 使用云存储默认图片
      const defaultImage = 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/default-product.jpeg';
      
      if (products[productIndex].imageUrls && products[productIndex].imageUrls.length > 0) {
        console.log('🔄 分类页设置默认图片:', defaultImage);
        products[productIndex].imageUrls[0] = defaultImage;
        
        this.setData({
          products: products
        });
      }
    }
  },

  // 🆕 刷新产品图片URL
  async refreshProductImage(productIndex, failedUrl) {
    try {
      console.log('🔄 分类页尝试刷新产品图片URL:', failedUrl);
      
      // 从失败的临时URL中提取原始文件ID
      const urlObj = new URL(failedUrl);
      const pathname = urlObj.pathname;
      
      // 重构原始文件ID
      const envId = 'cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968';
      const originalFileId = `cloud://${envId}${pathname}`;
      
      console.log('🔍 重构的文件ID:', originalFileId);
      
      // 重新获取临时URL
      const result = await wx.cloud.getTempFileURL({
        fileList: [originalFileId]
      });
      
      if (result.fileList && result.fileList.length > 0) {
        const fileInfo = result.fileList[0];
        if (fileInfo.status === 0 && fileInfo.tempFileURL) {
          console.log('✅ 分类页成功获取新的临时URL:', fileInfo.tempFileURL);
          
          // 更新产品图片
          const products = this.data.products;
          if (products && productIndex !== undefined && productIndex < products.length) {
            if (products[productIndex].imageUrls && products[productIndex].imageUrls.length > 0) {
              products[productIndex].imageUrls[0] = fileInfo.tempFileURL;
              this.setData({
                products: products
              });
              
              console.log('🔄 分类页图片已刷新');
              
              // 显示成功提示
              wx.showToast({
                title: '图片已刷新',
                icon: 'success',
                duration: 1500
              });
            }
          }
        } else {
          console.error('❌ 分类页获取临时URL失败:', fileInfo.errMsg);
          
          // 如果文件不存在，使用默认图片
          if (fileInfo.errMsg && fileInfo.errMsg.includes('STORAGE_FILE_NONEXIST')) {
            console.log('📂 分类页文件不存在，使用默认图片');
            this.handleImageLoadError(productIndex, null, failedUrl);
          } else {
            // 其他错误也使用默认图片
            this.handleImageLoadError(productIndex, null, failedUrl);
          }
        }
      } else {
        console.error('❌ 分类页未返回文件信息');
        this.handleImageLoadError(productIndex, null, failedUrl);
      }
    } catch (error) {
      console.error('❌ 分类页刷新图片URL失败:', error);
      
      // 如果是权限错误，显示特定提示
      if (error.errMsg && error.errMsg.includes('permission denied')) {
        wx.showToast({
          title: '图片访问权限不足',
          icon: 'none',
          duration: 3000
        });
      }
      
      // 刷新失败时使用默认图片
      this.handleImageLoadError(productIndex, null, failedUrl);
    }
  },
  
  // 🆕 批量刷新所有图片URL
  async refreshAllImages() {
    try {
      console.log('🔄 分类页开始批量刷新所有图片URL');
      
      const products = this.data.products;
      if (!products || products.length === 0) {
        console.log('📭 分类页没有产品需要刷新');
        return;
      }
      
      // 收集所有需要刷新的云存储文件ID
      const cloudFileIds = [];
      const cloudFileIdSet = new Set();
      
      products.forEach((product, index) => {
        if (product.imageUrls && Array.isArray(product.imageUrls)) {
          product.imageUrls.forEach(url => {
            if (url && url.startsWith('cloud://') && !cloudFileIdSet.has(url)) {
              cloudFileIds.push(url);
              cloudFileIdSet.add(url);
            }
          });
        }
      });
      
      if (cloudFileIds.length === 0) {
        console.log('📭 分类页没有云存储图片需要刷新');
        return;
      }
      
      console.log(`🔄 分类页准备刷新 ${cloudFileIds.length} 个图片`);
      
      // 批量获取新的临时URL
      const result = await wx.cloud.getTempFileURL({
        fileList: cloudFileIds
      });
      
      if (result.fileList) {
        const tempUrlMap = {};
        
        result.fileList.forEach(file => {
          if (file.status === 0 && file.tempFileURL) {
            tempUrlMap[file.fileID] = file.tempFileURL;
          } else {
            console.warn('⚠️ 分类页批量刷新失败:', file.fileID, file.errMsg);
          }
        });
        
        // 更新产品中的图片URL
        const updatedProducts = products.map(product => {
          const updatedProduct = { ...product };
          if (product.imageUrls && Array.isArray(product.imageUrls)) {
            updatedProduct.imageUrls = product.imageUrls.map(url => {
              if (url && url.startsWith('cloud://')) {
                return tempUrlMap[url] || url;
              }
              return url;
            });
          }
          return updatedProduct;
        });
        
        this.setData({
          products: updatedProducts
        });
        
        console.log(`✅ 分类页批量刷新完成，成功刷新 ${Object.keys(tempUrlMap).length} 个图片`);
        
        wx.showToast({
          title: '图片已刷新',
          icon: 'success',
          duration: 2000
        });
      }
      
    } catch (error) {
      console.error('❌ 分类页批量刷新图片失败:', error);
      wx.showToast({
        title: '批量刷新失败',
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 切换菜单显示
  toggleMenu: function() {
    this.setData({
      showMenu: !this.data.showMenu
    });
  },
  
  // 导航到首页
  navigateToHome: function() {
    this.setData({
      showMenu: false
    });
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
  
  // 跳转到分类页
  navigateToCategory: function(e) {
    const type = e.currentTarget.dataset.type;
    const categoryId = e.currentTarget.dataset.id; // 🆕 获取分类ID
    this.setData({
      showMenu: false
    });
    
    console.log('从分类页跳转到分类页，分类类型:', type, '分类ID:', categoryId);
    
    // 确保全局数据对象存在
    if (!getApp().globalData) {
      getApp().globalData = {};
    }
    
    // 设置要跳转的分类类型
    getApp().globalData.targetCategoryType = type;
    
    // 如果已经在分类页面，直接切换到对应分类
    const categories = this.data.categories;
    
    // 🆕 优先使用分类ID查找，如果没有ID则使用名称
    let targetIndex = -1;
    if (categoryId) {
      targetIndex = categories.findIndex(cat => cat._id === categoryId);
    }
    if (targetIndex === -1) {
      targetIndex = categories.findIndex(cat => cat.name === type);
    }
    
    if (targetIndex !== -1) {
      console.log('在当前页面切换到分类:', type, '索引:', targetIndex);
      this.switchTab({
        currentTarget: {
          dataset: {
            index: targetIndex,
            categoryId: categories[targetIndex]._id,
            categoryName: categories[targetIndex].name
          }
        }
      });
    } else {
      console.log('未找到对应分类，保持当前状态');
    }
  },
  
  // 跳转到收藏页
  navigateToFavorite: function() {
    this.setData({
      showMenu: false
    });
    wx.switchTab({
      url: '/pages/favorite/favorite'
    });
  },
  
  // 跳转到选购页
  navigateToContact: function() {
    this.setData({
      showMenu: false
    });
    wx.switchTab({
      url: '/pages/contact/contact'
    });
  },

  // 跳转到客户案例页面 - Requirements: 1.4
  navigateToCases: function() {
    console.log('[Category] 跳转到客户案例页面');
    wx.navigateTo({
      url: '/pages/customer-cases/customer-cases',
      success: function() {
        console.log('[Category] 成功跳转到客户案例页面');
      },
      fail: function(error) {
        console.error('[Category] 跳转到客户案例页面失败:', error);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // Logo点击处理
  onLogoTap: function() {
    console.log('Logo被点击');
    // 可以添加Logo点击的特殊功能
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '年轮环环 - 产品分类',
      path: '/pages/category/category'
    };
  }
}); 