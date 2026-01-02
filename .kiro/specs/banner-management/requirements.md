# Requirements Document

## Introduction

本文档定义了微信小程序轮播图管理功能的需求规范。轮播图管理功能允许管理员在后台上传、编辑、删除轮播图，并将图片存储在微信云存储的指定目录中，数据存储在云数据库的 `banners` 集合中。

## Glossary

- **Banner_Manager**: 轮播图管理系统，负责轮播图的增删改查操作
- **Cloud_Storage**: 微信云存储服务，用于存储轮播图图片文件
- **Banners_Collection**: 云数据库中的 `banners` 集合，存储轮播图元数据
- **Admin_Page**: 管理后台页面，提供轮播图管理的用户界面
- **Cloud_Function**: 云函数 `productManager`，处理轮播图的后端逻辑

## Requirements

### Requirement 1: 轮播图上传功能

**User Story:** As an administrator, I want to upload banner images to cloud storage, so that I can display promotional content on the homepage carousel.

#### Acceptance Criteria

1. WHEN an administrator selects an image file THEN THE Banner_Manager SHALL upload the image to the cloud storage path `cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968/banners/`
2. WHEN an image is successfully uploaded THEN THE Banner_Manager SHALL generate a unique filename using the format `banner_{timestamp}.{extension}`
3. WHEN an image upload completes THEN THE Banner_Manager SHALL display a preview of the uploaded image in the form
4. IF an image upload fails THEN THE Banner_Manager SHALL display an error message and allow retry

### Requirement 2: 轮播图数据存储

**User Story:** As an administrator, I want banner metadata to be stored in the database, so that I can manage banner display properties.

#### Acceptance Criteria

1. WHEN a new banner is saved THEN THE Banner_Manager SHALL create a record in the `banners` collection with fields: `_id`, `image`, `title`, `subtitle`, `order`, `status`, `productId`, `createTime`, `updateTime`
2. WHEN a banner is created THEN THE Banner_Manager SHALL generate a unique ID with the format `banner_{number}`
3. THE Banner_Manager SHALL store the cloud storage file ID in the `image` field
4. WHEN a banner status is set to 1 THEN THE Banner_Manager SHALL mark it as enabled for display
5. WHEN a banner status is set to 0 THEN THE Banner_Manager SHALL mark it as disabled

### Requirement 3: 轮播图编辑功能

**User Story:** As an administrator, I want to edit existing banners, so that I can update promotional content without recreating banners.

#### Acceptance Criteria

1. WHEN an administrator clicks edit on a banner THEN THE Banner_Manager SHALL load the banner data into the edit form
2. WHEN editing a banner image THEN THE Banner_Manager SHALL upload the new image and update the `image` field
3. WHEN editing banner metadata THEN THE Banner_Manager SHALL update only the changed fields
4. WHEN a banner is updated THEN THE Banner_Manager SHALL set the `updateTime` to the current server time
5. IF the old image is replaced THEN THE Banner_Manager SHALL delete the old image from cloud storage

### Requirement 4: 轮播图删除功能

**User Story:** As an administrator, I want to delete banners, so that I can remove outdated promotional content.

#### Acceptance Criteria

1. WHEN an administrator clicks delete on a banner THEN THE Banner_Manager SHALL display a confirmation dialog
2. WHEN deletion is confirmed THEN THE Banner_Manager SHALL remove the banner record from the `banners` collection
3. WHEN a banner is deleted THEN THE Banner_Manager SHALL delete the associated image from cloud storage
4. IF image deletion fails THEN THE Banner_Manager SHALL still complete the database record deletion and log the error

### Requirement 5: 轮播图列表显示

**User Story:** As an administrator, I want to view all banners in a list, so that I can manage the carousel content.

#### Acceptance Criteria

1. WHEN the banners tab is selected THEN THE Banner_Manager SHALL load and display all banners from the `banners` collection
2. THE Banner_Manager SHALL display banners sorted by the `order` field in ascending order
3. THE Banner_Manager SHALL display each banner's image preview, title, subtitle, order, and status
4. THE Banner_Manager SHALL provide edit and delete buttons for each banner item
5. WHEN the banner list is empty THEN THE Banner_Manager SHALL display a helpful message prompting to add banners

### Requirement 6: 轮播图排序功能

**User Story:** As an administrator, I want to set the display order of banners, so that I can control the carousel sequence.

#### Acceptance Criteria

1. THE Banner_Manager SHALL allow setting an order value (integer) for each banner
2. WHEN displaying banners THEN THE Banner_Manager SHALL sort them by order value in ascending order
3. THE Banner_Manager SHALL default the order value to 999 for new banners
4. WHEN multiple banners have the same order value THEN THE Banner_Manager SHALL sort them by creation time

### Requirement 7: 轮播图关联产品

**User Story:** As an administrator, I want to link banners to products, so that users can navigate to product details when clicking on banners.

#### Acceptance Criteria

1. THE Banner_Manager SHALL allow setting an optional product ID for each banner
2. WHEN a product ID is set THEN THE Banner_Manager SHALL store it in the `productId` field
3. THE Banner_Manager SHALL validate that the product ID format is correct before saving
