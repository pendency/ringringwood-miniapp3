/**
 * Favorite Manager 模块
 * 收藏管理模块，提供收藏的增删改查功能
 * Requirements: 4.1, 4.2, 4.4, 4.5
 */

const STORAGE_KEY = 'favorites';

/**
 * 收藏管理器类
 */
class FavoriteManager {
  constructor() {
    this.storageKey = STORAGE_KEY;
  }

  /**
   * 添加产品到收藏列表
   * Requirements: 4.1 - WHEN 用户点击收藏按钮 THEN Favorite_Manager SHALL 将产品添加到收藏列表
   * @param {String} productId - 产品ID
   * @param {Object} productData - 产品数据（可选，用于存储产品信息）
   * @returns {Boolean} 是否添加成功
   */
  addFavorite(productId, productData = null) {
    if (!productId) {
      console.error('FavoriteManager.addFavorite: 产品ID不能为空');
      return false;
    }

    try {
      const favorites = this._loadFavorites();
      
      // 检查是否已存在
      if (this._findIndex(favorites, productId) !== -1) {
        console.log('FavoriteManager.addFavorite: 产品已在收藏列表中', productId);
        return true;
      }

      // 创建收藏项
      const favoriteItem = this._createFavoriteItem(productId, productData);
      favorites.push(favoriteItem);

      // 持久化到本地存储 - Requirements: 4.4
      this._saveFavorites(favorites);
      console.log('FavoriteManager.addFavorite: 添加收藏成功', productId);
      return true;
    } catch (error) {
      console.error('FavoriteManager.addFavorite: 添加收藏失败', error);
      return false;
    }
  }

  /**
   * 从收藏列表移除产品
   * Requirements: 4.2 - WHEN 用户再次点击已收藏产品的收藏按钮 THEN Favorite_Manager SHALL 取消收藏
   * @param {String} productId - 产品ID
   * @returns {Boolean} 是否移除成功
   */
  removeFavorite(productId) {
    if (!productId) {
      console.error('FavoriteManager.removeFavorite: 产品ID不能为空');
      return false;
    }

    try {
      const favorites = this._loadFavorites();
      const index = this._findIndex(favorites, productId);

      if (index === -1) {
        console.log('FavoriteManager.removeFavorite: 产品不在收藏列表中', productId);
        return true;
      }

      favorites.splice(index, 1);

      // 持久化到本地存储 - Requirements: 4.4
      this._saveFavorites(favorites);
      console.log('FavoriteManager.removeFavorite: 移除收藏成功', productId);
      return true;
    } catch (error) {
      console.error('FavoriteManager.removeFavorite: 移除收藏失败', error);
      return false;
    }
  }


  /**
   * 检查产品是否已收藏
   * @param {String} productId - 产品ID
   * @returns {Boolean} 是否已收藏
   */
  isFavorite(productId) {
    if (!productId) {
      return false;
    }

    try {
      const favorites = this._loadFavorites();
      return this._findIndex(favorites, productId) !== -1;
    } catch (error) {
      console.error('FavoriteManager.isFavorite: 检查收藏状态失败', error);
      return false;
    }
  }

  /**
   * 获取所有收藏的产品ID列表
   * Requirements: 4.5 - WHEN 小程序重新打开 THEN Favorite_Manager SHALL 从本地存储恢复收藏列表
   * @returns {Array<String>} 收藏的产品ID数组
   */
  getFavorites() {
    try {
      const favorites = this._loadFavorites();
      return favorites.map(item => item._id || item.productId || item);
    } catch (error) {
      console.error('FavoriteManager.getFavorites: 获取收藏列表失败', error);
      return [];
    }
  }

  /**
   * 获取所有收藏的产品完整数据
   * Requirements: 4.3 - WHEN 用户进入收藏页面 THEN Favorite_Manager SHALL 显示所有已收藏的产品
   * @returns {Array<Object>} 收藏的产品数据数组
   */
  getFavoriteItems() {
    try {
      return this._loadFavorites();
    } catch (error) {
      console.error('FavoriteManager.getFavoriteItems: 获取收藏数据失败', error);
      return [];
    }
  }

  /**
   * 切换产品收藏状态
   * Requirements: 4.1, 4.2
   * @param {String} productId - 产品ID
   * @param {Object} productData - 产品数据（添加时使用）
   * @returns {Boolean} 切换后的收藏状态（true=已收藏，false=未收藏）
   */
  toggleFavorite(productId, productData = null) {
    if (!productId) {
      console.error('FavoriteManager.toggleFavorite: 产品ID不能为空');
      return false;
    }

    const currentStatus = this.isFavorite(productId);
    
    if (currentStatus) {
      // 当前已收藏，取消收藏
      this.removeFavorite(productId);
      return false;
    } else {
      // 当前未收藏，添加收藏
      this.addFavorite(productId, productData);
      return true;
    }
  }

  /**
   * 获取收藏数量
   * @returns {Number} 收藏数量
   */
  getFavoriteCount() {
    try {
      const favorites = this._loadFavorites();
      return favorites.length;
    } catch (error) {
      console.error('FavoriteManager.getFavoriteCount: 获取收藏数量失败', error);
      return 0;
    }
  }

  /**
   * 清空所有收藏
   * @returns {Boolean} 是否清空成功
   */
  clearFavorites() {
    try {
      this._saveFavorites([]);
      console.log('FavoriteManager.clearFavorites: 清空收藏成功');
      return true;
    } catch (error) {
      console.error('FavoriteManager.clearFavorites: 清空收藏失败', error);
      return false;
    }
  }


  // ==================== 私有方法 ====================

  /**
   * 从本地存储加载收藏列表
   * Requirements: 4.5 - 从本地存储恢复收藏列表
   * @returns {Array} 收藏列表
   * @private
   */
  _loadFavorites() {
    try {
      const data = wx.getStorageSync(this.storageKey);
      if (Array.isArray(data)) {
        return data;
      }
      return [];
    } catch (error) {
      console.error('FavoriteManager._loadFavorites: 加载收藏数据失败', error);
      return [];
    }
  }

  /**
   * 保存收藏列表到本地存储
   * Requirements: 4.4 - WHEN 用户收藏产品 THEN Local_Storage SHALL 立即持久化收藏数据
   * @param {Array} favorites - 收藏列表
   * @private
   */
  _saveFavorites(favorites) {
    try {
      wx.setStorageSync(this.storageKey, favorites);
    } catch (error) {
      console.error('FavoriteManager._saveFavorites: 保存收藏数据失败', error);
      throw error;
    }
  }

  /**
   * 在收藏列表中查找产品索引
   * @param {Array} favorites - 收藏列表
   * @param {String} productId - 产品ID
   * @returns {Number} 索引，未找到返回-1
   * @private
   */
  _findIndex(favorites, productId) {
    return favorites.findIndex(item => {
      // 支持多种数据格式
      const itemId = item._id || item.productId || item;
      return itemId === productId;
    });
  }

  /**
   * 创建收藏项对象
   * @param {String} productId - 产品ID
   * @param {Object} productData - 产品数据
   * @returns {Object} 收藏项
   * @private
   */
  _createFavoriteItem(productId, productData) {
    if (productData) {
      return {
        _id: productId,
        name: productData.name || '',
        description: productData.description || productData.brief || '',
        imageUrls: productData.images || productData.imageUrls || [],
        price: productData.price || '',
        addedAt: Date.now()
      };
    }
    
    return {
      _id: productId,
      addedAt: Date.now()
    };
  }
}

// 创建单例实例
const favoriteManager = new FavoriteManager();

// 导出单例实例和类
module.exports = favoriteManager;
module.exports.FavoriteManager = FavoriteManager;
