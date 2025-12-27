// utils/admin-auth.js - 管理员认证工具
const AdminAuth = class {
  static adminConfig = {
    // 管理员微信openid列表
    adminOpenIds: [
      'oy9pIvok6rXcjqpUUg6t3VTk9u6E'  // 您的OpenID
    ],
    // 备用验证手机号（可选）
    adminPhones: [
      '138****8888'
    ],
    // 验证码（开发环境使用简单验证码）
    validAuthCodes: ['121380', '123456', '000000'],
    // 手势密码序列：下 → 左下 → 右下 → 左下 → 右下
    requiredGesture: ['bottom', 'left-bottom', 'right-bottom', 'left-bottom', 'right-bottom']
  };

  // 检查管理员权限
  static async checkAdminAccess() {
    try {
      console.log('开始管理员权限验证...');
      
      // 第一步：检查微信身份
      const userInfo = await this.getUserInfo();
      console.log('获取用户信息:', userInfo);
      
      if (!this.adminConfig.adminOpenIds.includes(userInfo.openid)) {
        throw new Error('非管理员用户');
      }

      // 第二步：验证设备指纹
      const deviceInfo = await this.getDeviceInfo();
      console.log('设备信息:', deviceInfo);
      
      if (!this.isAuthorizedDevice(deviceInfo)) {
        console.log('新设备，需要额外验证');
        const authResult = await this.requestAdditionalAuth();
        if (!authResult.success) {
          throw new Error(authResult.error);
        }
      }

      // 第三步：生成访问令牌
      const accessToken = this.generateAccessToken(userInfo.openid);
      wx.setStorageSync('admin_access_token', accessToken);
      
      console.log('管理员验证成功');
      return { success: true, token: accessToken };
    } catch (error) {
      console.error('管理员验证失败:', error);
      return { success: false, error: error.message };
    }
  }

  // 获取用户信息
  static async getUserInfo() {
    try {
      // 先检查是否已经有缓存的用户信息
      const cachedInfo = wx.getStorageSync('admin_user_info');
      if (cachedInfo) {
        console.log('使用缓存的用户信息');
        return cachedInfo;
      }

      // 调用云函数获取用户信息
      const { result } = await wx.cloud.callFunction({
        name: 'getUserInfo'
      });
      
      if (!result || !result.openid) {
        throw new Error('获取用户信息失败');
      }
      
      // 缓存用户信息
      wx.setStorageSync('admin_user_info', result);
      
      return result;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 如果是在开发环境，返回测试用户信息
      if (process.env.NODE_ENV === 'development') {
        const testUser = {
          openid: 'test_admin_openid',
          userInfo: {
            nickName: 'TestAdmin',
            avatarUrl: ''
          }
        };
        return testUser;
      }
      throw error;
    }
  }

  // 获取设备信息
  static async getDeviceInfo() {
    try {
      // 获取设备基本信息
      const deviceInfo = wx.getDeviceInfo();
      
      // 获取系统信息
      const systemInfo = wx.getSystemInfoSync();
      
      // 获取窗口信息
      const windowInfo = wx.getWindowInfo();
      
      // 获取应用基本信息
      const appBaseInfo = wx.getAppBaseInfo();
      
      return {
        // 设备信息
        model: deviceInfo.model || 'unknown',
        brand: deviceInfo.brand || 'unknown',
        system: deviceInfo.system || 'unknown',
        platform: deviceInfo.platform || 'unknown',
        
        // 系统信息
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight,
        pixelRatio: systemInfo.pixelRatio,
        
        // 窗口信息
        windowWidth: windowInfo.windowWidth,
        windowHeight: windowInfo.windowHeight,
        
        // 应用信息
        version: appBaseInfo.version,
        language: appBaseInfo.language,
        theme: appBaseInfo.theme
      };
    } catch (error) {
      console.error('获取设备信息失败:', error);
      // 返回基本信息
      return {
        model: 'unknown',
        brand: 'unknown',
        system: 'unknown',
        platform: 'unknown',
        version: 'unknown'
      };
    }
  }

  // 检查是否为授权设备
  static isAuthorizedDevice(deviceInfo) {
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    const authorizedDevices = wx.getStorageSync('authorized_devices') || [];
    return authorizedDevices.includes(deviceFingerprint);
  }

  // 生成设备指纹
  static generateDeviceFingerprint(deviceInfo) {
    // 使用设备信息生成唯一标识
    const fingerprint = `${deviceInfo.model}-${deviceInfo.system}-${deviceInfo.brand}`;
    
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // 转换为16位的十六进制字符串
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    return hexHash.substring(0, 16);
  }

  // 请求额外验证
  static async requestAdditionalAuth() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '设备验证',
        content: '检测到新设备，请输入管理员验证码（开发环境可使用：123456）',
        editable: true,
        placeholderText: '请输入6位验证码',
        success: async (res) => {
          if (res.confirm) {
            console.log('用户输入验证码:', res.content);
            if (this.validateAuthCode(res.content)) {
              // 验证成功，添加设备到授权列表
              try {
                await this.authorizeCurrentDevice();
                console.log('设备授权成功');
                resolve({ success: true });
              } catch (error) {
                console.error('设备授权失败:', error);
                resolve({ success: false, error: '设备授权失败: ' + error.message });
              }
            } else {
              console.error('验证码无效:', res.content);
              resolve({ success: false, error: '验证码错误' });
            }
          } else {
            console.log('用户取消验证');
            resolve({ success: false, error: '用户取消验证' });
          }
        },
        fail: (error) => {
          console.error('验证对话框显示失败:', error);
          resolve({ success: false, error: '验证对话框显示失败' });
        }
      });
    });
  }

  // 检查是否为开发环境
  static isDevelopment() {
    // 微信开发者工具中运行时视为开发环境
    const systemInfo = wx.getSystemInfoSync();
    return systemInfo.platform === 'devtools';
  }

  // 验证授权码
  static validateAuthCode(code) {
    if (!code) {
      console.error('验证码为空');
      return false;
    }

    // 去除换行符和空格
    const cleanCode = code.replace(/[\n\r\s]/g, '').trim();

    // 开发环境下，允许使用 123456 或 000000
    if (this.isDevelopment()) {
      if (cleanCode === '123456' || cleanCode === '000000') {
        console.log('开发环境：使用测试验证码');
        return true;
      }
    }

    const isValid = this.adminConfig.validAuthCodes.includes(cleanCode);
    console.log('验证码验证结果:', isValid, '输入:', cleanCode);
    return isValid;
  }

  // 授权当前设备
  static async authorizeCurrentDevice() {
    try {
      const deviceInfo = await this.getDeviceInfo();
      const fingerprint = this.generateDeviceFingerprint(deviceInfo);
      const authorizedDevices = wx.getStorageSync('authorized_devices') || [];
      
      if (!authorizedDevices.includes(fingerprint)) {
        authorizedDevices.push(fingerprint);
        wx.setStorageSync('authorized_devices', authorizedDevices);
        console.log('设备已授权:', fingerprint);
      }
    } catch (error) {
      console.error('设备授权失败:', error);
    }
  }

  // 生成访问令牌
  static generateAccessToken(openid) {
    const timestamp = Date.now();
    const token = `${openid}_${timestamp}`;
    return token;
  }

  // 验证访问令牌
  static validateAccessToken(token) {
    try {
      if (!token) {
        console.error('令牌为空');
        return false;
      }

      // 使用下划线分隔，避免 Base64 编码/解码问题
      const [openid, timestamp] = token.split('_');
      
      if (!openid || !timestamp) {
        console.error('令牌格式无效');
        return false;
      }

      // 检查令牌是否过期（24小时）
      const now = Date.now();
      const tokenAge = now - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24小时
      
      const isValid = tokenAge < maxAge && this.adminConfig.adminOpenIds.includes(openid);
      console.log('令牌验证结果:', isValid, '年龄:', Math.round(tokenAge / 1000 / 60), '分钟');
      
      return isValid;
    } catch (error) {
      console.error('令牌验证失败:', error);
      return false;
    }
  }

  // 获取手势密码配置
  static getGestureConfig() {
    return {
      requiredSequence: this.adminConfig.requiredGesture,
      description: '请按顺序点击：下 → 左下 → 右下 → 左下 → 右下'
    };
  }

  // 验证手势序列
  static validateGestureSequence(inputSequence) {
    if (!Array.isArray(inputSequence)) return false;
    if (inputSequence.length !== this.adminConfig.requiredGesture.length) return false;
    
    return JSON.stringify(inputSequence) === JSON.stringify(this.adminConfig.requiredGesture);
  }

  // 清除访问令牌（登出）
  static clearAccessToken() {
    wx.removeStorageSync('admin_access_token');
    console.log('访问令牌已清除');
  }

  // 清除所有授权设备（重置）
  static clearAuthorizedDevices() {
    wx.removeStorageSync('authorized_devices');
    console.log('授权设备列表已清除');
  }
}

// 导出类
module.exports = AdminAuth;
