# Requirements Document

## Introduction

完善分类管理页面中上传分类图片的功能。当前实现中，用户需要先在分类列表中点击选择一个分类，然后才能上传图片，但这个交互流程不够直观。本需求旨在改进上传分类图片的用户体验，增加明确的分类选择器，让用户能够清晰地选择要上传图片的目标分类。

## Glossary

- **Admin_Page**: 管理员后台主页面（pages/admin/admin）
- **Category_Image_Uploader**: 分类图片上传组件，包含分类选择器和图片上传功能
- **Category_Selector**: 分类选择器，用于选择要上传图片的目标分类
- **Category_Icon**: 分类图标，小尺寸图片，用于分类列表显示
- **Category_Image**: 分类图片，大尺寸图片，用于分类详情展示
- **Cloud_Storage**: 微信云存储，用于存储上传的图片文件

## Requirements

### Requirement 1: 分类选择器显示

**User Story:** As a 管理员, I want to 在上传分类图片前看到明确的分类选择器, so that I can 清楚地知道图片将上传到哪个分类。

#### Acceptance Criteria

1. WHEN 管理员进入分类管理标签页 THEN Admin_Page SHALL 显示分类选择器组件
2. WHEN 分类选择器加载时 THEN Category_Selector SHALL 从数据库获取所有可用分类并显示为下拉选项
3. WHEN 分类列表为空时 THEN Category_Selector SHALL 显示"暂无分类，请先创建分类"的提示信息
4. THE Category_Selector SHALL 默认显示"请选择分类"的占位文本

### Requirement 2: 分类选择功能

**User Story:** As a 管理员, I want to 通过下拉选择器选择目标分类, so that I can 方便地指定图片上传的目标分类。

#### Acceptance Criteria

1. WHEN 管理员点击分类选择器 THEN Category_Selector SHALL 展开显示所有可用分类选项
2. WHEN 管理员选择一个分类 THEN Category_Selector SHALL 显示已选分类的名称
3. WHEN 管理员选择分类后 THEN Admin_Page SHALL 启用图片上传按钮
4. WHILE 未选择分类时 THEN Admin_Page SHALL 禁用图片上传按钮并显示提示

### Requirement 3: 图片上传功能

**User Story:** As a 管理员, I want to 选择分类后上传图标或图片, so that I can 为指定分类添加视觉展示素材。

#### Acceptance Criteria

1. WHEN 管理员已选择分类并点击"上传分类图标"按钮 THEN Category_Image_Uploader SHALL 打开图片选择器
2. WHEN 管理员已选择分类并点击"上传分类图片"按钮 THEN Category_Image_Uploader SHALL 打开图片选择器
3. WHEN 管理员选择图片后 THEN Category_Image_Uploader SHALL 显示图片预览
4. WHEN 管理员确认上传 THEN Category_Image_Uploader SHALL 将图片上传到 Cloud_Storage
5. WHEN 图片上传成功 THEN Category_Image_Uploader SHALL 更新对应分类的图标或图片字段
6. WHEN 图片上传成功 THEN Admin_Page SHALL 显示成功提示并刷新分类列表

### Requirement 4: 上传状态反馈

**User Story:** As a 管理员, I want to 看到图片上传的进度和结果, so that I can 了解上传操作的状态。

#### Acceptance Criteria

1. WHILE 图片正在上传时 THEN Category_Image_Uploader SHALL 显示"上传中..."的加载状态
2. WHEN 图片上传成功 THEN Admin_Page SHALL 显示"上传成功"的提示消息
3. IF 图片上传失败 THEN Admin_Page SHALL 显示具体的错误信息
4. IF 网络连接失败 THEN Admin_Page SHALL 显示"网络连接失败，请检查网络后重试"的提示

### Requirement 5: 界面布局优化

**User Story:** As a 管理员, I want to 在一个清晰的界面中完成分类图片上传, so that I can 高效地管理分类图片。

#### Acceptance Criteria

1. THE Category_Image_Uploader SHALL 将分类选择器放置在上传按钮上方
2. THE Category_Image_Uploader SHALL 在选择器下方显示当前已选分类的图标和图片预览（如果有）
3. WHEN 分类已有图标或图片时 THEN Category_Image_Uploader SHALL 显示"更换图标"或"更换图片"的按钮文本
4. THE Admin_Page SHALL 保持与现有分类管理页面一致的视觉风格
