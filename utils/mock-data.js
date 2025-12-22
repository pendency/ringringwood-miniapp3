// 临时模拟数据 - 替代云开发
// 当云开发环境配置好后，可以删除此文件

// 模拟分类数据
const mockCategories = [
  {
    _id: 'cat_wood',
    name: '原木经典',
    description: '厚实整板，稳重大气',
    order: 1,
    status: 1
  },
  {
    _id: 'cat_resin',
    name: '树脂美学', 
    description: '光影流动，自带焦点感',
    order: 2,
    status: 1
  },
  {
    _id: 'cat_design',
    name: '玩趣设计',
    description: '风格桌面，空间主角',
    order: 3,
    status: 1
  },
  {
    _id: 'cat_custom',
    name: '高定专属',
    description: '材质尺寸自由搭配',
    order: 4,
    status: 1
  },
  {
    _id: 'cat_frame',
    name: '桌架专区',
    description: '多样款式，自由组合',
    order: 5,
    status: 1
  }
];

// 模拟产品数据 - 基于CSV数据生成，修复了图片路径和字段映射问题
const mockProducts = [
  // 原木经典系列 - 完整的13款产品，严格按照CSV数据
  {
    _id: 'wood1',
    name: '黑檀升降桌',
    description: '精选优质黑檀木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood1.jpeg'], // 主图 (imageUrl1)
    images: [
      // 详情图 (imageUrl2-imageUrl10，根据CSV实际内容)
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood1-1.jpeg', // imageUrl2
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood1-2.jpeg', // imageUrl3
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood1-3.jpeg', // imageUrl4
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood1-4.jpeg'  // imageUrl5
      // wood1的CSV中只有到imageUrl5，imageUrl6-imageUrl10为空
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 1
  },
  {
    _id: 'wood2',
    name: '黑檀水波纹',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2.jpeg'], // 主图 (imageUrl1)
    images: [
      // 详情图 (imageUrl2-imageUrl9，根据CSV实际内容)
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-1.jpeg', // imageUrl2
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-2.jpeg', // imageUrl3
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-3.jpeg', // imageUrl4
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-4.jpeg', // imageUrl5
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-5.jpeg', // imageUrl6
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-6.jpeg', // imageUrl7
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-7.jpeg', // imageUrl8
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood2-8.jpeg'  // imageUrl9
      // wood2的CSV中imageUrl10为空
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: true,
    isNew: false,
    isRecommended: true,
    stock: 10,
    sales: 0,
    status: 1,
    order: 2
  },
  {
    _id: 'wood3',
    name: '东非酸枝折角茶几',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3-5.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3-6.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood3-7.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '东非酸枝' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 3
  },
  {
    _id: 'wood4',
    name: '黑檀白马桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-5.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-6.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-7.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood4-8.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 4
  },
  {
    _id: 'wood5',
    name: '黑檀蜘蛛桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5-5.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5-6.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood5-7.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: true,
    isNew: false,
    isRecommended: true,
    stock: 10,
    sales: 0,
    status: 1,
    order: 5
  },
  {
    _id: 'wood6',
    name: '黑檀流线锥桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood6.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood6-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood6-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood6-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood6-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood6-5.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 6
  },
  {
    _id: 'wood7',
    name: '黑檀透灰桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood7.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood7-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood7-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood7-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood7-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood7-5.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 7
  },
  {
    _id: 'wood8',
    name: '黑檀水晶桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood8.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood8-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood8-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood8-3.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 8
  },
  {
    _id: 'wood9',
    name: '黑檀山形桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood9.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood9-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood9-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood9-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood9-4.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 9
  },
  {
    _id: 'wood10',
    name: '黑檀黑方桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood10.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood10-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood10-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood10-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood10-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood10-5.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood10-6.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 10
  },
  {
    _id: 'wood11',
    name: '黑檀斜锥桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11-5.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11-6.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood11-7.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 11
  },
  {
    _id: 'wood12',
    name: '黑檀方门桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood12.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood12-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood12-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood12-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood12-4.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 12
  },
  {
    _id: 'wood13',
    name: '黑檀行者桌',
    description: '精选优质实木，展现自然纹理之美',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_wood',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood13.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood13-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood13-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood13-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/wood13-4.jpeg'
    ],
    features: [
      {
        title: '天然木纹',
        description: '每一块木板都有独特的纹理，展现自然年轮的美感',
        type: 'text'
      },
      {
        title: '环保材质',
        description: '全部采用环保材料，不含甲醛等有害物质',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '黑檀木' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: true,
    isNew: false,
    isRecommended: true,
    stock: 10,
    sales: 0,
    status: 1,
    order: 13
  },

  // 高定专属系列 - 包含视频展示
  {
    _id: 'custom1',
    name: '海浪亮光款',
    description: '精心定制的独特作品，每一件都是艺术品',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_custom',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/custom1.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/custom1-1.jpeg'
    ],
    features: [
      {
        title: '产品展示',
        video: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom/custom1-v1.mp4', // 使用云存储视频文件路径
        description: '产品视频展示',
        type: 'video'
      },
      {
        title: '定制工艺',
        description: '精心定制的独特作品，每一件都是艺术品',
        type: 'text'
      },
      {
        title: '独一无二',
        description: '根据客户需求量身定制，独特设计',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '环氧树脂+实木' },
      { name: '尺寸', value: '160cm*80cm*5.6cm' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 1
  },
  {
    _id: 'custom2',
    name: '南美胡桃木海浪款',
    description: '精心定制的独特作品，每一件都是艺术品',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_custom',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/custom2.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/custom2-1.jpeg'
    ],
    features: [
      {
        title: '产品展示',
        video: 'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom/custom2-v1.mp4',
        description: '产品视频展示',
        type: 'video'
      },
      {
        title: '定制工艺',
        description: '精心定制的独特作品，每一件都是艺术品',
        type: 'text'
      },
      {
        title: '独一无二',
        description: '根据客户需求量身定制，独特设计',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '南美胡桃木' },
      { name: '尺寸', value: '150cm*80cm*5.3cm' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: false,
    isNew: false,
    isRecommended: false,
    stock: 10,
    sales: 0,
    status: 1,
    order: 2
  },
  // 玩趣设计系列
  {
    _id: 'design1',
    name: '复古波点桌',
    description: '独特的创意设计，为空间增添艺术气息',
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_design',
    imageUrls: ['cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1.jpeg'],
    images: [
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-1.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-2.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-3.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-4.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-5.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-6.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-7.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-8.jpeg',
      'cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/design1-9.jpeg'
    ],
    features: [
      {
        title: '创意设计',
        description: '独特的创意设计，为空间增添艺术气息',
        type: 'text'
      }
    ],
    params: [
      { name: '材质', value: '创意复合材料' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: true,
    isNew: false,
    isRecommended: true,
    stock: 10,
    sales: 0,
    status: 1,
    order: 1
  }
];

// 原木经典系列已在上面完整定义（wood1-wood13），无需额外生成

// 为树脂美学分类添加更多产品
for (let i = 2; i <= 6; i++) {
  mockProducts.push({
    _id: `resin_${i}`,
    name: `树脂美学作品 ${i}`,
    description: `光影流动的树脂艺术，自带焦点感`,
    price: 3500 + Math.floor(Math.random() * 2000),
    originalPrice: 4500 + Math.floor(Math.random() * 2000),
    categoryId: 'cat_resin',
    imageUrls: [`/images/products/resin${i}.jpeg`],
    images: [`/images/products/resin${i}-1.jpeg`],
    features: [],
    params: [
      { name: '材质', value: '环氧树脂' },
      { name: '尺寸', value: `${170 + i*8}cm×${75 + i*3}cm×${4 + i}cm` },
      { name: '重量', value: `约${50 + i*4}kg` }
    ],
    isHot: Math.random() > 0.5,
    isNew: Math.random() > 0.6,
    isRecommended: Math.random() > 0.6,
    stock: Math.floor(Math.random() * 6) + 2,
    sales: Math.floor(Math.random() * 25),
    status: 1
  });
}

// 为玩趣设计分类添加更多产品
for (let i = 2; i <= 6; i++) {
  mockProducts.push({
    _id: `design_${i}`,
    name: `玩趣设计作品 ${i}`,
    description: `创意无限的设计风格，空间的主角`,
    price: 2200 + Math.floor(Math.random() * 1800),
    originalPrice: 3200 + Math.floor(Math.random() * 1800),
    categoryId: 'cat_design',
    imageUrls: [`/images/products/design${i}.jpeg`],
    images: [`/images/products/design${i}-1.jpeg`],
    features: [],
    params: [
      { name: '材质', value: '创意复合材料' },
      { name: '尺寸', value: `${160 + i*12}cm×${70 + i*4}cm×${3 + i}cm` },
      { name: '重量', value: `约${40 + i*3}kg` }
    ],
    isHot: Math.random() > 0.7,
    isNew: Math.random() > 0.4,
    isRecommended: Math.random() > 0.5,
    stock: Math.floor(Math.random() * 10) + 5,
    sales: Math.floor(Math.random() * 20),
    status: 1
  });
}

// 为桌架专区分类添加产品
for (let i = 1; i <= 8; i++) {
  mockProducts.push({
    _id: `frame_${i}`,
    name: `桌架专区作品 ${i}`,
    description: `多样款式的桌架，自由组合搭配`,
    price: 800 + Math.floor(Math.random() * 1200),
    originalPrice: 1200 + Math.floor(Math.random() * 1200),
    categoryId: 'cat_frame',
    imageUrls: [`/images/products/frame${i}.jpeg`],
    images: [`/images/products/frame${i}-1.jpeg`],
    features: [],
    params: [
      { name: '材质', value: '金属/木质' },
      { name: '尺寸', value: `${100 + i*5}cm×${60 + i*2}cm×${70 + i}cm` },
      { name: '重量', value: `约${20 + i*2}kg` }
    ],
    isHot: Math.random() > 0.6,
    isNew: Math.random() > 0.5,
    isRecommended: Math.random() > 0.6,
    stock: Math.floor(Math.random() * 15) + 8,
    sales: Math.floor(Math.random() * 40),
    status: 1
  });
}

// 生成高定专属系列产品（修复图片和视频路径）
for (let i = 1; i <= 59; i++) {
  // 构建正确的特性数组
  const features = [
    {
      title: '定制工艺',
      description: '精心定制的独特作品，每一件都是艺术品',
      type: 'text'
    },
    {
      title: '独一无二',
      description: '根据客户需求量身定制，独特设计',
      type: 'text'
    }
  ];

  // 添加视频特性（custom51没有视频文件）
  if (i !== 51) {
    features.unshift({
      title: '产品展示',
      video: `cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom/custom${i}-v1.mp4`, // 使用云存储视频文件路径
      description: '产品视频展示',
      type: 'video'
    });
  }

  // custom33有第二个视频文件
  if (i === 33) {
    features.push({
      title: '工艺细节',
      video: `cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/products/videos/custom/custom33-v2.mp4`, // 使用云存储视频文件路径
      description: '展示更多精细工艺细节',
      type: 'video'
    });
  }

  mockProducts.push({
    _id: `custom${i}`,
    name: `高定专属作品 ${i}`,
    description: `精心定制的独特作品，每一件都是艺术品`,
    price: '联系销售',
    originalPrice: '联系销售',
    categoryId: 'cat_custom',
    imageUrls: [`/images/products/custom${i}.jpeg`],
    images: [`/images/products/custom${i}-1.jpeg`],
    features: features,
    params: [
      { name: '材质', value: '定制材质' },
      { name: '尺寸', value: '可定制' },
      { name: '重量', value: '视规格而定' },
      { name: '颜色', value: '如图' },
      { name: '适用场景', value: '会议室、办公室、茶室' }
    ],
    isHot: Math.random() > 0.7,
    isNew: Math.random() > 0.5,
    isRecommended: Math.random() > 0.6,
    stock: Math.floor(Math.random() * 5) + 1,
    sales: Math.floor(Math.random() * 20),
    status: 1,
    order: i
  });
}

// 模拟轮播图数据
const mockBanners = [
  {
    id: 1,
    title: '✧ 原木经典',
    subtitle: '厚实整板，稳重大气',
    imageUrl: '/images/banner1.jpeg'
  },
  {
    id: 2,
    title: '✧ 树脂美学',
    subtitle: '光影流动，自带焦点感',
    imageUrl: '/images/banner2.jpeg'
  },
  {
    id: 3,
    title: '✦ 玩趣设计',
    subtitle: '风格桌面，空间主角',
    imageUrl: '/images/banner3.jpeg'
  },
  {
    id: 4,
    title: '✦ 高定专属',
    subtitle: '材质尺寸自由搭配',
    imageUrl: '/images/banner4.jpeg'
  },
  {
    id: 5,
    title: '✦ 桌架专区',
    subtitle: '多样款式，自由组合',
    imageUrl: '/images/banner5.jpeg'
  }
];

// 导出模拟数据和模拟API函数
module.exports = {
  // 数据
  mockCategories,
  mockProducts,
  mockBanners,
  
  // 模拟API函数
  async getProductList(options = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('getProductList 调用，选项:', options);
        console.log('所有产品数量:', mockProducts.length);
        
        // 输出所有产品的分类ID，用于调试
        const categoryIds = [...new Set(mockProducts.map(p => p.categoryId))];
        console.log('所有产品的分类ID:', categoryIds);
        
        let products = [...mockProducts];
        
        // 过滤条件
        if (options.categoryId) {
          console.log('按分类ID过滤:', options.categoryId);
          const beforeFilter = products.length;
          products = products.filter(p => p.categoryId === options.categoryId);
          console.log(`过滤前: ${beforeFilter} 个产品, 过滤后: ${products.length} 个产品`);
          
          // 调试输出，查看过滤后的产品
          if (products.length > 0) {
            console.log('过滤后的第一个产品:', {
              _id: products[0]._id,
              name: products[0].name,
              categoryId: products[0].categoryId
            });
          } else {
            console.warn('没有找到匹配的产品，检查分类ID是否正确');
            // 输出所有产品的分类ID，用于调试
            const allProductCategoryIds = mockProducts.map(p => ({
              productId: p._id,
              categoryId: p.categoryId,
              name: p.name
            })).slice(0, 10); // 只显示前10个，避免日志过长
            console.log('前10个产品的分类ID:', allProductCategoryIds);
          }
        }
        
        if (options.isHot) {
          const beforeFilter = products.length;
          products = products.filter(p => p.isHot);
          console.log(`isHot过滤前: ${beforeFilter} 个产品, 过滤后: ${products.length} 个产品`);
        }
        
        if (options.isRecommended) {
          const beforeFilter = products.length;
          products = products.filter(p => p.isRecommended);
          console.log(`isRecommended过滤前: ${beforeFilter} 个产品, 过滤后: ${products.length} 个产品`);
        }
        
        if (options.isNew) {
          const beforeFilter = products.length;
          products = products.filter(p => p.isNew);
          console.log(`isNew过滤前: ${beforeFilter} 个产品, 过滤后: ${products.length} 个产品`);
        }
        
        // 记录总数
        const total = products.length;
        console.log('过滤后总数:', total);
        
        // 分页 - 如果是高定专属分类，确保返回所有产品
        if (options.categoryId === 'cat_custom') {
          console.log(`高定专属分类共有${total}个产品`);
          // 不做分页限制，返回所有高定专属产品
        } else {
          // 其他分类正常分页
          const limit = options.limit || 10;
          const skip = options.skip || 0;
          const beforePagination = products.length;
          products = products.slice(skip, skip + limit);
          console.log(`分页前: ${beforePagination} 个产品, 分页后: ${products.length} 个产品`);
        }
        
        const result = {
          data: products,
          total
        };
        
        console.log('getProductList 返回结果:', {
          dataCount: result.data.length,
          total: result.total
        });
        
        resolve(result);
      }, 100); // 模拟网络延迟
    });
  },
  
  async getCategoryList(options = {}) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [...mockCategories]
        });
      }, 100);
    });
  },
  
  async getBannerList() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [...mockBanners]
        });
      }, 100);
    });
  },
  
  async getProductById(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('getProductById 查找ID:', id);
        console.log('可用产品ID列表:', mockProducts.map(p => p._id).slice(0, 5));
        const product = mockProducts.find(p => p._id === id);
        console.log('找到的产品:', product ? product.name : '未找到');
        resolve({
          data: product || null
        });
      }, 100);
    });
  }
};