# 需求文档

## 介绍

本文档定义了"年轮环环"微信小程序后台管理系统的功能需求。该系统为管理员提供完整的后台管理功能，包括分类管理、产品管理、数据导入导出、云存储管理等功能，支持对产品分类和产品信息进行增删改查操作。

## 系统概述

管理后台主要包含以下功能模块：

1. **分类管理** - 产品分类的增删改查
2. **产品管理** - 产品信息的增删改查、上下架管理
3. **数据导入** - CSV文件批量导入产品数据
4. **图片管理** - 产品图片、分类图片、轮播图上传
5. **数据迁移** - 本地数据迁移到云数据库
6. **云函数测试** - 测试云函数连接状态
7. **数据备份** - 数据备份与恢复

## 术语表

- **Admin_System**: 后台管理系统
- **Category_Manager**: 分类管理模块
- **Product_Admin**: 产品管理模块
- **Cloud_Database**: 云数据库
- **Cloud_Storage**: 云存储
- **Admin_User**: 管理员用户
- **CSV_Processor**: CSV文件处理器
- **Data_Backup**: 数据备份模块

## 需求

### 需求 1：分类管理 - 分类列表展示

**用户故事：** 作为管理员，我希望查看所有产品分类列表，以便了解当前分类结构。

#### 验收标准

1. WHEN 管理员进入分类管理页面 THEN Admin_System SHALL 显示所有分类列表
2. WHEN 分类列表加载完成 THEN Admin_System SHALL 显示分类名称、描述、排序权重和状态
3. WHEN 分类数据加载失败 THEN Admin_System SHALL 显示错误提示并提供重试选项
4. THE Admin_System SHALL 按排序权重升序显示分类列表
5. WHEN 管理员输入搜索关键词 THEN Admin_System SHALL 按名称或描述过滤分类列表

### 需求 2：分类管理 - 新增分类

**用户故事：** 作为管理员，我希望新增产品分类，以便扩展产品分类体系。

#### 验收标准

1. WHEN 管理员点击新增分类按钮 THEN Admin_System SHALL 显示新增分类表单
2. WHEN 管理员填写分类信息并提交 THEN Category_Manager SHALL 验证必填字段
3. WHEN 分类信息验证通过 THEN Category_Manager SHALL 将新分类保存到云数据库
4. WHEN 新增分类成功 THEN Admin_System SHALL 刷新分类列表并显示成功提示
5. IF 分类名称已存在 THEN Admin_System SHALL 显示重复提示并阻止提交
6. FOR ALL 新增分类操作，保存后再查询 SHALL 返回包含新分类的列表

### 需求 3：分类管理 - 修改分类

**用户故事：** 作为管理员，我希望修改现有分类信息，以便更新分类内容。

#### 验收标准

1. WHEN 管理员点击编辑分类按钮 THEN Admin_System SHALL 显示编辑表单并填充当前数据
2. WHEN 管理员修改分类信息并提交 THEN Category_Manager SHALL 验证修改后的数据
3. WHEN 修改验证通过 THEN Category_Manager SHALL 更新云数据库中的分类数据
4. WHEN 修改分类成功 THEN Admin_System SHALL 刷新分类列表并显示成功提示
5. FOR ALL 分类修改操作，修改后再查询 SHALL 返回更新后的分类数据

### 需求 4：分类管理 - 删除分类

**用户故事：** 作为管理员，我希望删除不需要的分类，以便保持分类体系整洁。

#### 验收标准

1. WHEN 管理员点击删除分类按钮 THEN Admin_System SHALL 显示删除确认对话框
2. WHEN 管理员确认删除 THEN Category_Manager SHALL 检查该分类下是否有产品
3. IF 分类下存在产品 THEN Admin_System SHALL 显示警告并要求先处理关联产品
4. WHEN 分类下无产品且确认删除 THEN Category_Manager SHALL 从云数据库删除该分类
5. WHEN 删除分类成功 THEN Admin_System SHALL 刷新分类列表并显示成功提示
6. FOR ALL 分类删除操作，删除后再查询 SHALL 不返回已删除的分类

### 需求 5：产品管理 - 产品列表展示

**用户故事：** 作为管理员，我希望查看所有产品列表，以便管理产品信息。

#### 验收标准

1. WHEN 管理员进入产品管理页面 THEN Admin_System SHALL 显示产品列表
2. WHEN 产品列表加载完成 THEN Admin_System SHALL 显示产品名称、分类、价格、状态、标签（热门/新品/推荐）
3. WHEN 产品数量较多 THEN Admin_System SHALL 支持分页加载（每页20条）
4. WHEN 管理员选择分类筛选 THEN Product_Admin SHALL 按分类过滤产品列表
5. THE Admin_System SHALL 支持按产品名称搜索
6. WHEN 管理员选择状态筛选 THEN Product_Admin SHALL 按上架/下架状态过滤产品列表
7. THE Admin_System SHALL 显示产品缩略图（支持云存储图片临时URL转换）

### 需求 6：产品管理 - 新增产品

**用户故事：** 作为管理员，我希望新增产品，以便扩展产品目录。

#### 验收标准

1. WHEN 管理员点击新增产品按钮 THEN Admin_System SHALL 显示新增产品表单
2. WHEN 管理员填写产品信息 THEN Admin_System SHALL 提供分类选择下拉框
3. WHEN 管理员上传产品图片 THEN Product_Admin SHALL 将图片上传到云存储
4. WHEN 产品信息验证通过 THEN Product_Admin SHALL 将新产品保存到云数据库
5. WHEN 新增产品成功 THEN Admin_System SHALL 刷新产品列表并显示成功提示
6. FOR ALL 新增产品操作，保存后再查询 SHALL 返回包含新产品的列表
7. THE Admin_System SHALL 支持设置产品标签（热门、新品、推荐）

### 需求 7：产品管理 - 修改产品

**用户故事：** 作为管理员，我希望修改产品信息，以便更新产品内容。

#### 验收标准

1. WHEN 管理员点击编辑产品按钮 THEN Admin_System SHALL 显示编辑表单并填充当前数据
2. WHEN 管理员修改产品信息并提交 THEN Product_Admin SHALL 验证修改后的数据
3. WHEN 管理员更换产品图片 THEN Product_Admin SHALL 上传新图片并更新引用
4. WHEN 修改验证通过 THEN Product_Admin SHALL 更新云数据库中的产品数据
5. WHEN 修改产品成功 THEN Admin_System SHALL 刷新产品列表并显示成功提示
6. FOR ALL 产品修改操作，修改后再查询 SHALL 返回更新后的产品数据

### 需求 8：产品管理 - 删除产品

**用户故事：** 作为管理员，我希望删除不需要的产品，以便保持产品目录整洁。

#### 验收标准

1. WHEN 管理员点击删除产品按钮 THEN Admin_System SHALL 显示删除确认对话框
2. WHEN 管理员确认删除 THEN Product_Admin SHALL 从云数据库删除该产品
3. WHEN 删除产品成功 THEN Admin_System SHALL 刷新产品列表并显示成功提示
4. FOR ALL 产品删除操作，删除后再查询 SHALL 不返回已删除的产品

### 需求 9：产品管理 - 上架下架

**用户故事：** 作为管理员，我希望控制产品的上架下架状态，以便管理产品可见性。

#### 验收标准

1. WHEN 管理员点击上架按钮 THEN Product_Admin SHALL 通过云函数将产品状态设置为上架(status=1)
2. WHEN 管理员点击下架按钮 THEN Product_Admin SHALL 通过云函数将产品状态设置为下架(status=0)
3. WHEN 产品状态变更成功 THEN Admin_System SHALL 更新列表中的状态显示
4. WHEN 产品处于下架状态 THEN 前台小程序 SHALL 不显示该产品
5. FOR ALL 上架下架操作，状态变更后再查询 SHALL 返回正确的状态值
6. THE Product_Admin SHALL 支持批量更新产品状态

### 需求 10：数据验证

**用户故事：** 作为系统，我需要验证管理员输入的数据，以确保数据完整性和正确性。

#### 验收标准

1. WHEN 提交分类数据 THEN Admin_System SHALL 验证分类名称不为空
2. WHEN 提交产品数据 THEN Admin_System SHALL 验证产品名称和分类不为空
3. WHEN 输入价格 THEN Admin_System SHALL 验证价格为有效数字或"联系销售"
4. IF 验证失败 THEN Admin_System SHALL 显示具体的错误信息
5. THE Admin_System SHALL 在提交前进行客户端验证
6. WHEN 产品名称超过100个字符 THEN Admin_System SHALL 显示长度超限错误

### 需求 11：CSV数据导入

**用户故事：** 作为管理员，我希望通过CSV文件批量导入产品数据，以便快速添加大量产品。

#### 验收标准

1. WHEN 管理员上传CSV文件 THEN Admin_System SHALL 保存文件到本地存储
2. WHEN CSV文件上传成功 THEN Admin_System SHALL 显示文件名和导入按钮
3. WHEN 管理员点击导入按钮 THEN CSV_Processor SHALL 解析CSV文件内容
4. WHEN CSV解析完成 THEN CSV_Processor SHALL 验证每行数据的必填字段
5. WHEN 数据验证通过 THEN CSV_Processor SHALL 转换数据格式并保存到数据库
6. WHEN 导入完成 THEN Admin_System SHALL 显示导入结果（成功数量、警告数量）
7. IF 导入过程中有错误 THEN Admin_System SHALL 保存错误日志并提供查看功能
8. THE CSV_Processor SHALL 支持中英文字段名映射

### 需求 12：图片上传管理

**用户故事：** 作为管理员，我希望上传和管理产品图片、分类图片和轮播图，以便丰富产品展示。

#### 验收标准

1. WHEN 管理员选择产品并上传图片 THEN Admin_System SHALL 将图片上传到云存储
2. WHEN 图片上传成功 THEN Admin_System SHALL 更新产品的图片引用
3. THE Admin_System SHALL 支持上传多张产品图片（最多9张）
4. WHEN 管理员上传分类图片 THEN Admin_System SHALL 支持图标和封面图两种类型
5. WHEN 管理员上传轮播图 THEN Admin_System SHALL 创建轮播图记录并保存到数据库
6. THE Cloud_Storage SHALL 自动生成临时访问URL用于图片显示

### 需求 18：产品视频上传管理

**用户故事：** 作为管理员，我希望为产品上传视频，以便更好地展示产品特点和使用场景。

#### 验收标准

1. WHEN 管理员在产品编辑页面点击上传视频按钮 THEN Admin_System SHALL 打开视频选择器
2. WHEN 管理员选择视频文件 THEN Admin_System SHALL 将视频上传到云存储
3. THE Admin_System SHALL 限制视频时长最长为60秒
4. WHEN 视频上传成功 THEN Admin_System SHALL 显示视频预览
5. WHEN 管理员点击删除视频按钮 THEN Admin_System SHALL 显示确认对话框
6. WHEN 管理员确认删除视频 THEN Admin_System SHALL 移除视频引用
7. THE 视频命名格式 SHALL 遵循 `products/videos/{category}/{productId}_video.mp4` 规范
8. WHEN 产品保存成功 THEN Product_Admin SHALL 将视频URL保存到数据库的 `videoUrl` 字段

### 需求 13：数据迁移

**用户故事：** 作为管理员，我希望将本地数据迁移到云数据库，以便实现数据云端化。

#### 验收标准

1. WHEN 管理员点击数据迁移按钮 THEN Admin_System SHALL 显示迁移进度
2. WHEN 迁移执行中 THEN Admin_System SHALL 将本地JSON数据上传到云数据库
3. WHEN 迁移完成 THEN Admin_System SHALL 显示迁移结果（成功/失败）
4. IF 迁移失败 THEN Admin_System SHALL 显示错误信息

### 需求 14：云函数测试

**用户故事：** 作为管理员，我希望测试云函数连接状态，以便确认云服务正常运行。

#### 验收标准

1. WHEN 管理员点击测试云函数按钮 THEN Admin_System SHALL 调用云函数测试接口
2. WHEN 测试完成 THEN Admin_System SHALL 显示测试结果（通过数/总数、成功率）
3. IF 云函数连接失败 THEN Admin_System SHALL 显示连接失败提示

### 需求 15：管理员权限验证

**用户故事：** 作为系统，我需要验证用户的管理员权限，以确保只有授权用户可以访问后台。

#### 验收标准

1. WHEN 用户进入管理后台页面 THEN Admin_System SHALL 验证管理员访问令牌
2. IF 访问令牌不存在或无效 THEN Admin_System SHALL 尝试重新获取管理员权限
3. IF 权限验证失败 THEN Admin_System SHALL 显示权限错误并跳转到首页
4. WHEN 权限验证成功 THEN Admin_System SHALL 允许访问管理功能
5. THE Admin_System SHALL 在每次页面显示时重新验证权限

### 需求 16：数据备份与恢复

**用户故事：** 作为管理员，我希望备份和恢复数据，以便防止数据丢失。

#### 验收标准

1. WHEN 管理员请求数据备份 THEN Data_Backup SHALL 导出当前数据到备份文件
2. WHEN 备份完成 THEN Admin_System SHALL 记录备份历史
3. THE Admin_System SHALL 显示备份历史列表
4. WHEN 管理员选择恢复备份 THEN Data_Backup SHALL 从备份文件恢复数据

### 需求 17：网络错误处理

**用户故事：** 作为系统，我需要优雅地处理网络错误，以便提供良好的用户体验。

#### 验收标准

1. WHEN 网络请求失败 THEN Admin_System SHALL 显示友好的错误提示
2. WHEN 云数据库不可用 THEN Admin_System SHALL 提示用户稍后重试
3. THE Admin_System SHALL 在错误页面提供重试按钮
4. WHEN 操作超时 THEN Admin_System SHALL 显示超时提示并允许重试

