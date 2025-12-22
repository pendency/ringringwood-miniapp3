// brand.js
Page({
  data: {
    contactPhone: '13800138000',
    statusBarHeight: 20, // 默认状态栏高度
    navBarHeight: 44, // 默认导航栏高度
    contentPaddingTop: 64 // 默认内容区域顶部内边距
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
    
    // 设置内容区域的样式
    wx.createSelectorQuery()
      .select('.content-container')
      .fields({ node: true, size: true })
      .exec(res => {
        if (res[0] && res[0].node) {
          res[0].node.style.paddingTop = contentPaddingTop + 'px';
        }
      });
  },
  
  // 处理导航栏返回事件
  onBack: function(e) {
    wx.navigateBack({
      delta: 1
    });
  },
  
  // 拨打电话
  makePhoneCall: function() {
    wx.makePhoneCall({
      phoneNumber: this.data.contactPhone,
      success: function() {
        console.log('拨打电话成功');
      },
      fail: function() {
        console.log('拨打电话失败');
      }
    });
  },
  
  // 分享
  onShareAppMessage: function() {
    return {
      title: '年轮环环 - 年轮是树的故事，环环是家的史诗',
      path: '/pages/brand/brand'
    };
  }
}); 