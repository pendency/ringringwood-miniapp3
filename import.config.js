// import.config.js
// 产品数据导入配置文件
// 注意：数据库是唯一数据源，此配置文件仅用于CSV导入到数据库的场景
module.exports = {
  // Excel/CSV 源文件路径（相对项目根目录）
  // 默认使用项目根目录下的产品信息管理模板.csv
  inputFilePath: './产品信息管理模板.csv',

  // 生成的中间 JSON 文件
  outputJsonPath: './utils/generated-products.json',

  // 导入日志
  logFilePath: './scripts/import-log.txt',

  // 错误输出（仅当存在严重错误时生成）
  errorJsonPath: './scripts/import-errors.json'
};