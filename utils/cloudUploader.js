// utils/cloudUploader.js - 云存储上传工具

/**
 * 上传产品图片到云存储
 * @param {Array} imagePaths - 图片路径数组
 * @param {string} productId - 产品ID
 * @returns {Promise<Array>} 上传后的云存储URL数组
 */
async function uploadProductImages(imagePaths, productId) {
  console.log('开始上传产品图片:', imagePaths, productId);
  
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    return [];
  }

  const uploadPromises = imagePaths.map(async (imagePath, index) => {
    try {
      if (!imagePath || imagePath.trim() === '') {
        return null;
      }

      // 生成云存储文件名
      const fileExtension = imagePath.split('.').pop() || 'jpg';
      const cloudPath = `products/${productId}/${productId}-${index + 1}.${fileExtension}`;

      console.log(`上传图片 ${index + 1}:`, imagePath, '到', cloudPath);

      const result = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: imagePath
      });

      console.log(`图片 ${index + 1} 上传成功:`, result.fileID);
      return result.fileID;
    } catch (error) {
      console.error(`图片 ${index + 1} 上传失败:`, error);
      return null;
    }
  });

  const results = await Promise.all(uploadPromises);
  const successfulUploads = results.filter(url => url !== null);
  
  console.log(`产品图片上传完成，成功 ${successfulUploads.length}/${imagePaths.length}`);
  return successfulUploads;
}

/**
 * 上传轮播图到云存储
 * @param {string} imagePath - 图片路径
 * @param {string} bannerId - 轮播图ID
 * @returns {Promise<string>} 上传后的云存储URL
 */
async function uploadBannerImage(imagePath, bannerId) {
  console.log('开始上传轮播图:', imagePath, bannerId);
  
  if (!imagePath || imagePath.trim() === '') {
    throw new Error('图片路径不能为空');
  }

  try {
    // 生成云存储文件名
    const fileExtension = imagePath.split('.').pop() || 'jpg';
    const cloudPath = `banners/${bannerId || Date.now()}.${fileExtension}`;

    console.log('上传轮播图到:', cloudPath);

    const result = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: imagePath
    });

    console.log('轮播图上传成功:', result.fileID);
    return result.fileID;
  } catch (error) {
    console.error('轮播图上传失败:', error);
    throw error;
  }
}

/**
 * 上传分类图片到云存储
 * @param {string} imagePath - 图片路径
 * @param {string} categoryId - 分类ID
 * @param {string} type - 图片类型: 'icon' 或 'image'
 * @returns {Promise<string>} 上传后的云存储URL
 * 
 * 存储路径规范:
 * - icon: categories/{categoryId}/{categoryId}_icon.jpg
 * - image: categories/{categoryId}/{categoryId}.jpg
 */
async function uploadCategoryImage(imagePath, categoryId, type = 'image') {
  console.log('开始上传分类图片:', imagePath, categoryId, type);
  
  if (!imagePath || imagePath.trim() === '') {
    throw new Error('图片路径不能为空');
  }

  if (!categoryId || categoryId.trim() === '') {
    throw new Error('分类ID不能为空');
  }

  try {
    // 统一使用 jpg 格式，保持命名一致性
    const fileExtension = 'jpg';
    
    // 生成云存储文件名
    // icon: categories/{categoryId}/{categoryId}_icon.jpg
    // image: categories/{categoryId}/{categoryId}.jpg
    const fileName = type === 'icon' 
      ? `${categoryId}_icon.${fileExtension}`
      : `${categoryId}.${fileExtension}`;
    const cloudPath = `categories/${categoryId}/${fileName}`;

    console.log('上传分类图片到:', cloudPath);

    const result = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: imagePath
    });

    console.log('分类图片上传成功:', result.fileID);
    return result.fileID;
  } catch (error) {
    console.error('分类图片上传失败:', error);
    throw error;
  }
}

/**
 * 批量上传文件到云存储
 * @param {Array} files - 文件信息数组 [{path: string, cloudPath: string}]
 * @returns {Promise<Array>} 上传结果数组
 */
export async function batchUploadFiles(files) {
  console.log('开始批量上传文件:', files.length, '个文件');
  
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map(async (file, index) => {
    try {
      if (!file.path || !file.cloudPath) {
        throw new Error('文件路径或云存储路径不能为空');
      }

      console.log(`上传文件 ${index + 1}:`, file.path, '到', file.cloudPath);

      const result = await wx.cloud.uploadFile({
        cloudPath: file.cloudPath,
        filePath: file.path
      });

      return {
        success: true,
        fileID: result.fileID,
        originalPath: file.path,
        cloudPath: file.cloudPath
      };
    } catch (error) {
      console.error(`文件 ${index + 1} 上传失败:`, error);
      return {
        success: false,
        error: error.message,
        originalPath: file.path,
        cloudPath: file.cloudPath
      };
    }
  });

  const results = await Promise.all(uploadPromises);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`批量上传完成，成功 ${successCount}/${files.length}`);
  return results;
}

/**
 * 删除云存储文件
 * @param {Array} fileIDs - 要删除的文件ID数组
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteCloudFiles(fileIDs) {
  console.log('开始删除云存储文件:', fileIDs);
  
  if (!Array.isArray(fileIDs) || fileIDs.length === 0) {
    return { success: 0, failed: 0 };
  }

  try {
    const result = await wx.cloud.deleteFile({
      fileList: fileIDs
    });

    const successCount = result.fileList.filter(file => file.status === 0).length;
    const failedCount = result.fileList.length - successCount;

    console.log(`云存储文件删除完成，成功 ${successCount}，失败 ${failedCount}`);
    
    return {
      success: successCount,
      failed: failedCount,
      details: result.fileList
    };
  } catch (error) {
    console.error('删除云存储文件失败:', error);
    throw error;
  }
}

/**
 * 获取云存储文件下载链接
 * @param {Array} fileIDs - 文件ID数组
 * @returns {Promise<Array>} 下载链接数组
 */
export async function getDownloadUrls(fileIDs) {
  console.log('获取云存储文件下载链接:', fileIDs);
  
  if (!Array.isArray(fileIDs) || fileIDs.length === 0) {
    return [];
  }

  try {
    const result = await wx.cloud.getTempFileURL({
      fileList: fileIDs
    });

    console.log('获取下载链接完成:', result.fileList.length);
    return result.fileList;
  } catch (error) {
    console.error('获取下载链接失败:', error);
    throw error;
  }
}

/**
 * 压缩图片
 * @param {string} imagePath - 图片路径
 * @param {number} quality - 压缩质量 (0-100)
 * @returns {Promise<string>} 压缩后的图片路径
 */
export async function compressImage(imagePath, quality = 80) {
  console.log('开始压缩图片:', imagePath, '质量:', quality);
  
  if (!imagePath || imagePath.trim() === '') {
    throw new Error('图片路径不能为空');
  }

  try {
    const result = await wx.compressImage({
      src: imagePath,
      quality: quality
    });

    console.log('图片压缩成功:', result.tempFilePath);
    return result.tempFilePath;
  } catch (error) {
    console.error('图片压缩失败:', error);
    // 如果压缩失败，返回原图片路径
    return imagePath;
  }
}

/**
 * 选择并上传图片
 * @param {Object} options - 选择选项
 * @returns {Promise<Array>} 上传后的云存储URL数组
 */
export async function chooseAndUploadImages(options = {}) {
  const {
    count = 9,
    sizeType = ['original', 'compressed'],
    sourceType = ['album', 'camera'],
    cloudPathPrefix = 'uploads',
    compress = true,
    quality = 80
  } = options;

  console.log('开始选择并上传图片');

  try {
    // 选择图片
    const chooseResult = await wx.chooseImage({
      count: count,
      sizeType: sizeType,
      sourceType: sourceType
    });

    console.log('选择了', chooseResult.tempFilePaths.length, '张图片');

    // 处理每张图片
    const uploadPromises = chooseResult.tempFilePaths.map(async (imagePath, index) => {
      try {
        let finalImagePath = imagePath;

        // 压缩图片（如果需要）
        if (compress) {
          finalImagePath = await compressImage(imagePath, quality);
        }

        // 生成云存储路径
        const timestamp = Date.now();
        const fileExtension = imagePath.split('.').pop() || 'jpg';
        const cloudPath = `${cloudPathPrefix}/${timestamp}_${index}.${fileExtension}`;

        // 上传到云存储
        const uploadResult = await wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: finalImagePath
        });

        return uploadResult.fileID;
      } catch (error) {
        console.error(`图片 ${index + 1} 处理失败:`, error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(url => url !== null);

    console.log(`图片上传完成，成功 ${successfulUploads.length}/${chooseResult.tempFilePaths.length}`);
    return successfulUploads;
  } catch (error) {
    console.error('选择并上传图片失败:', error);
    throw error;
  }
}

/**
 * 上传案例图片到云存储
 * @param {string} tempFilePath - 临时文件路径
 * @param {string} caseId - 案例ID (格式: custom{number})
 * @returns {Promise<string>} 云存储文件ID
 * 
 * 存储路径规范:
 * - 路径: cases/custom/custom{number}.{ext}
 * - 支持格式: jpg, jpeg, png
 * - 最大文件大小: 2MB
 */
async function uploadCaseImage(tempFilePath, caseId) {
  console.log('开始上传案例图片:', tempFilePath, caseId);
  
  if (!tempFilePath || tempFilePath.trim() === '') {
    throw new Error('图片路径不能为空');
  }

  if (!caseId || caseId.trim() === '') {
    throw new Error('案例ID不能为空');
  }

  // 验证案例ID格式
  const caseIdPattern = /^custom\d+$/;
  if (!caseIdPattern.test(caseId)) {
    throw new Error('案例ID格式无效，应为 custom{number} 格式');
  }

  try {
    // 获取原始文件扩展名并保留
    const pathParts = tempFilePath.split('.');
    const originalExtension = pathParts.length > 1 ? pathParts.pop().toLowerCase() : 'jpg';
    
    // 验证文件扩展名
    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const fileExtension = allowedExtensions.includes(originalExtension) ? originalExtension : 'jpg';
    
    // 生成云存储文件路径: cases/custom/custom{number}.{ext}
    const cloudPath = `cases/custom/${caseId}.${fileExtension}`;

    console.log('上传案例图片到:', cloudPath);

    const result = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath
    });

    console.log('案例图片上传成功:', result.fileID);
    return result.fileID;
  } catch (error) {
    console.error('案例图片上传失败:', error);
    throw error;
  }
}

/**
 * 生成案例图片的云存储路径
 * @param {string} caseId - 案例ID (格式: custom{number})
 * @param {string} extension - 文件扩展名 (jpg, jpeg, png)
 * @returns {string} 云存储路径
 */
function generateCaseImagePath(caseId, extension = 'jpg') {
  if (!caseId || caseId.trim() === '') {
    throw new Error('案例ID不能为空');
  }
  
  // 验证案例ID格式
  const caseIdPattern = /^custom\d+$/;
  if (!caseIdPattern.test(caseId)) {
    throw new Error('案例ID格式无效，应为 custom{number} 格式');
  }
  
  // 验证并规范化扩展名
  const allowedExtensions = ['jpg', 'jpeg', 'png'];
  const normalizedExt = extension.toLowerCase();
  const finalExtension = allowedExtensions.includes(normalizedExt) ? normalizedExt : 'jpg';
  
  return `cases/custom/${caseId}.${finalExtension}`;
}

// 导出函数
module.exports = {
  uploadProductImages,
  uploadBannerImage,
  uploadCategoryImage,
  uploadCaseImage,
  generateCaseImagePath
};
