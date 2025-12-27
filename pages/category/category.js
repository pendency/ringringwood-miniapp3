// category.js
// Requirements: 2.2, 2.3, 2.4 - 分类产品筛选和分页
const productData = require('../../utils/productData.js');

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
    pageSize: 10, // 每页显示的产品数量 - Requirements 2.3 (改为合理的分页大小)
    scrollIntoView: '' // 用于scroll-view的scroll-into-view属性
  },
  
  onLoad: function() {
    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    // 设置状态栏高度和内容区域顶部内边距
    const statusBarHeight = windowInfo.statusBarHeight;
    const navBarHeight = 44; // 固定导航栏高度
    const contentPaddingTop = statusBarHeight + navBarHeight;
    
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      contentPaddingTop: contentPaddingTop
    });
    
    // 加载分类数据
    this.loadCategories();
  },
  
  // 页面显示时检查是否有指定分类
  onShow: function() {
    console.log('[Category] onShow 触发');
    
    // 获取全局数据中的分类类型和ID
    const app = getApp();
    if (app && app.globalData && app.globalData.eventChannel && 
        (app.globalData.eventChannel.categoryType || app.globalData.eventChannel.categoryId)) {
      const categoryType = app.globalData.eventChannel.categoryType;
      const categoryId = app.globalData.eventChannel.categoryId; // 🆕 获取分类ID
      console.log('[Category] 接收到分类类型:', categoryType, '分类ID:', categoryId);
      
      // 清除全局数据，避免下次进入页面仍然跳转
      app.globalData.eventChannel.categoryType = null;
      app.globalData.eventChannel.categoryId = null;
      
      // 🆕 保存要切换的分类信息（优先使用ID）
      this.pendingSwitchCategoryId = categoryId;
      this.pendingSwitchCategory = categoryType;
      
      // 🆕 强制刷新分类数据，确保获取最新的分类名称和排序
      console.log('[Category] 强制刷新分类数据（有指定分类）');
      this.loadCategoriesWithRefresh();
    } else {
      console.log('[Category] 未接收到分类类型，强制刷新分类数据');
      // 每次显示页面时强制刷新分类数据，确保获取最新排序
      // 使用 refreshCategories 方法，它会先清除缓存再获取数据
      this.loadCategoriesWithRefresh();
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
  async loadCategoriesWithRefresh() {
    // 设置加载状态标记，避免重复加载
    this.loadingCategories = true;
    
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
      
      // 如果有分类且没有切换到指定分类，默认选中第一个
      if (this.data.categories.length > 0) {
        // 同时刷新产品缓存
        await productData.refreshCategoryProducts(this.data.categories[0]._id, {
          limit: this.data.pageSize,
          offset: 0
        });
        this.loadProductsByCategory(0);
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
      this.setData({
        loading: true,
        loadingMore: false,
        currentPage: 1,
        products: [] // 清空当前列表
      });

      // 检查分类ID是否有效
      if (!category._id) {
        console.error('分类ID无效:', category);
        this.setData({
          loading: false,
          products: [],
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
          this.setData({
            products: fallbackResult.products,
            activeTab: categoryIndex,
            totalProducts: fallbackResult.total || fallbackResult.products.length,
            hasMoreProducts: false,
            loading: false
          });
          
          console.log('使用备用数据加载完成，当前activeTab:', categoryIndex);
          return;
        }
      }
      
      // 计算是否有更多产品 - Requirements 2.3
      const loadedCount = result.products ? result.products.length : 0;
      const totalCount = result.total || 0;
      const hasMore = loadedCount < totalCount;
      
      // 更新产品数据，同时保持activeTab的值
      this.setData({
        products: result.products || [],
        activeTab: categoryIndex,
        totalProducts: totalCount,
        hasMoreProducts: hasMore,
        loading: false
      });
      
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

    // 先更新activeTab，确保UI立即响应
    this.setData({
      activeTab: numIndex
    });

    // 滚动到对应分类
    this.scrollToCategoryItem(numIndex);

    // 加载产品数据
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
  
  // 尝试使用备用方法获取产品
  async tryFallbackProductLoad(category) {
    try {
      console.log('尝试使用备用方法获取产品，分类:', category.name);
      
      // 🆕 直接使用默认产品（避免使用包含本地路径的 mock 数据）
      console.log('使用默认产品数据');
      
      // 🆕 根据分类名称选择默认产品（使用云端URL）
      const defaultProducts = {
          '原木经典': [
            {
              _id: 'wood1',
              name: '黑檀升降桌',
              description: '精选优质实木，展现自然纹理之美',
              price: '联系销售',
              imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/wood/wood1.jpeg']
            },
            {
              _id: 'wood2',
              name: '黑檀水波纹',
              description: '精选优质实木，展现自然纹理之美',
              price: '联系销售',
              imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/wood/wood2.jpeg']
            }
          ],
          '树脂美学': [
            {
              _id: 'resin1',
              name: '冰晶玉石树脂桌面',
              description: '创新树脂工艺，打造晶莹剔透质感',
              price: '联系销售',
              imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/resin/resin1.jpeg']
            }
          ],
          '玩趣设计': [
            {
              _id: 'design1',
              name: '复古波点桌',
              description: '独特的创意设计，为空间增添艺术气息',
              price: '联系销售',
              imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/design/design1.jpeg']
            }
          ],
          '高定专属': [
            {
              _id: 'custom1',
              name: '海浪亮光款',
              description: '精心定制的独特作品，每一件都是艺术品',
              price: '联系销售',
              imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/custom/custom1.jpeg']
            },
            {
              _id: 'custom2',
              name: '南美胡桃木海浪款',
              description: '精心定制的独特作品，每一件都是艺术品',
              price: '联系销售',
              imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/custom/custom2.jpeg']
            }
          ],
          '桌架专区': [
            {
              _id: 'frame1',
              name: '现代简约金属桌架',
              description: '多样化桌架选择，稳固实用美观',
              price: '联系销售',
              imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/images/frame/frame1.jpeg']
            }
          ]
        };
      
      const matchedProducts = defaultProducts[category.name] || [];
      console.log('默认产品数量:', matchedProducts.length);
      
      // 添加isFavorite属性
      const favorites = wx.getStorageSync('favorites') || [];
      const favoriteIds = favorites.map(item => item._id);
      
      const productsWithFavorite = matchedProducts.map(item => ({
        ...item,
        isFavorite: favoriteIds.includes(item._id)
      }));
      
      return {
        products: productsWithFavorite,
        total: productsWithFavorite.length
      };
    } catch (error) {
      console.error('备用方法获取产品失败:', error);
      return { products: [], total: 0 };
    }
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