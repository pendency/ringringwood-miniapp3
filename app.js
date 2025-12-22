// app.js
App({
  onLaunch() {
    console.log('年轮环环小程序启动');
    
    // 🆕 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-7gm53wok768268c9', // 云开发环境ID（正确格式：1-32个字符）
        traceUser: true,
      })
      console.log('云开发初始化成功')
    }
    
    // 初始化全局数据
    this.globalData = {
      // 用于页面间传递数据的通道
      eventChannel: {},
      
      // 用户信息
      userInfo: null,
      
      // 系统信息
      systemInfo: null
    };
    
    // 获取系统信息
    const windowInfo = wx.getWindowInfo();
    const deviceInfo = wx.getDeviceInfo();
    const systemInfo = {
      ...windowInfo,
      ...deviceInfo
    };
    this.globalData.systemInfo = systemInfo;
  },
  
  // 全局数据
  globalData: {
    eventChannel: {},
    userInfo: null,
    systemInfo: null
  }
});
