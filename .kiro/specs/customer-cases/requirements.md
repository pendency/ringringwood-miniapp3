# Requirements Document

## Introduction

本功能为树脂定制款分类页面添加客户案例展示功能。用户可以在树脂定制款页面查看更多定制案例，管理员可以在后台管理客户案例内容。客户案例图片按照标准命名规范上传至云存储。

## Glossary

- **Customer_Case_System**: 客户案例管理系统，负责案例的展示、管理和存储
- **Case_Button**: 查看更多定制案例按钮，显示在树脂定制款分类页面
- **Case_Gallery_Page**: 客户案例展示页面，类似灵感上新页面的布局
- **Case_Admin_Page**: 客户案例管理页面，用于新增、编辑、删除案例
- **Cloud_Storage**: 微信云存储，用于存储案例图片
- **Category_Page**: 分类页面，显示产品列表的页面

## Requirements

### Requirement 1: 分类页面案例入口按钮

**User Story:** As a user, I want to see a button to view more custom cases on the resin custom category page, so that I can explore more design inspirations.

#### Acceptance Criteria

1. WHEN a user views the "树脂定制款" category page, THE Case_Button SHALL be displayed between the product count text and the first product item
2. THE Case_Button SHALL have the same visual style as the "立即选购" button on the home page (brown background #8B5A2B, white text, rounded corners)
3. THE Case_Button SHALL display the text "查看更多定制案例" with a right arrow indicator
4. WHEN a user taps the Case_Button, THE Customer_Case_System SHALL navigate to the Case_Gallery_Page
5. THE Case_Button SHALL only be visible on the "树脂定制款" category (categoryId: cat_custom)

### Requirement 2: 客户案例展示页面

**User Story:** As a user, I want to browse customer cases in a gallery format, so that I can see real examples of custom resin products.

#### Acceptance Criteria

1. THE Case_Gallery_Page SHALL display a page header with title "定制案例" and subtitle "每一件都是独一无二的定制"
2. THE Case_Gallery_Page SHALL display the total count of cases in format "共 X 个案例"
3. WHEN cases are loaded, THE Case_Gallery_Page SHALL display cases in a grid layout similar to the "灵感上新" page
4. FOR EACH case item, THE Case_Gallery_Page SHALL display the case image, title, and description
5. WHEN a user taps a case item, THE Case_Gallery_Page SHALL display the case image in full-screen preview mode
6. WHEN no cases exist, THE Case_Gallery_Page SHALL display an empty state message "暂无案例"
7. THE Case_Gallery_Page SHALL support pull-down refresh to reload case data

### Requirement 3: 客户案例数据模型

**User Story:** As a system architect, I want a well-defined data model for customer cases, so that the system can store and retrieve case information correctly.

#### Acceptance Criteria

1. THE Customer_Case_System SHALL store each case with fields: _id, title, description, imageUrl, order, status, createTime, updateTime
2. THE Customer_Case_System SHALL generate case IDs in format "case{number}" (e.g., case1, case2)
3. THE Customer_Case_System SHALL store case images in cloud storage path "cases/case{number}.{ext}"
4. WHEN a case is created, THE Customer_Case_System SHALL set createTime to current timestamp
5. WHEN a case is updated, THE Customer_Case_System SHALL update the updateTime field

### Requirement 4: 管理后台案例管理

**User Story:** As an administrator, I want to manage customer cases in the admin panel, so that I can add, edit, and delete case content.

#### Acceptance Criteria

1. THE Case_Admin_Page SHALL be accessible from the admin page as a new tab "案例管理"
2. THE Case_Admin_Page SHALL display a list of all existing cases with image preview, title, and status
3. WHEN an administrator clicks "新增案例", THE Case_Admin_Page SHALL display a form with fields for image upload, title, description, order, and status
4. WHEN an administrator uploads a case image, THE Customer_Case_System SHALL validate the image format (jpg, jpeg, png) and size (max 2MB)
5. WHEN an administrator saves a new case, THE Customer_Case_System SHALL upload the image to cloud storage with standardized naming and create the database record
6. WHEN an administrator edits a case, THE Case_Admin_Page SHALL pre-populate the form with existing case data
7. WHEN an administrator deletes a case, THE Customer_Case_System SHALL remove both the database record and the cloud storage image
8. IF an image upload fails, THEN THE Customer_Case_System SHALL display an error message and prevent case creation

### Requirement 5: 云存储图片命名规范

**User Story:** As a system administrator, I want case images to follow a standardized naming convention, so that the storage is organized and maintainable.

#### Acceptance Criteria

1. THE Customer_Case_System SHALL upload case images to the path "cases/" in cloud storage
2. THE Customer_Case_System SHALL name case images as "case{number}.{ext}" where number is the case sequence number
3. WHEN uploading a new case image, THE Customer_Case_System SHALL determine the next available case number
4. THE Customer_Case_System SHALL preserve the original file extension (jpg, jpeg, png)
5. WHEN a case is deleted, THE Customer_Case_System SHALL delete the corresponding image from cloud storage

### Requirement 6: 案例排序和状态管理

**User Story:** As an administrator, I want to control the display order and visibility of cases, so that I can curate the case gallery effectively.

#### Acceptance Criteria

1. THE Case_Gallery_Page SHALL display cases sorted by order field (ascending, smaller numbers first)
2. THE Case_Gallery_Page SHALL only display cases with status = 1 (active)
3. THE Case_Admin_Page SHALL allow administrators to set the order value for each case
4. THE Case_Admin_Page SHALL allow administrators to toggle case status between active (1) and inactive (0)
5. WHEN multiple cases have the same order value, THE Customer_Case_System SHALL sort them by createTime (newest first)
