# 云存储迁移脚本 - PowerShell版本
# 批量替换项目中的本地路径为云存储URL

Write-Host "🚀 开始云存储迁移..." -ForegroundColor Green
Write-Host ""

# 云存储配置
$CLOUD_BASE_URL = "cloud://cloud1-7gm53wok768268c9.636c-cloud1-7gm53wok768268c9-1369425968"

# 需要处理的文件类型
$TARGET_EXTENSIONS = @('.js', '.json', '.wxml', '.wxss')

# 需要跳过的目录
$SKIP_DIRS = @('node_modules', '.git', 'miniprogram_npm', 'images')

# 路径替换规则
$PATH_REPLACEMENTS = @(
    # TabBar 图标
    @{
        From = '"images/home.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/home.jpg`""
    },
    @{
        From = '"images/home-active.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/home-active.jpg`""
    },
    @{
        From = '"images/category.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/category.jpg`""
    },
    @{
        From = '"images/category-active.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/category-active.jpg`""
    },
    @{
        From = '"images/favorite.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/favorite.jpg`""
    },
    @{
        From = '"images/favorite-active.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/favorite-active.jpg`""
    },
    @{
        From = '"images/contact.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/contact.jpg`""
    },
    @{
        From = '"images/contact-active.jpg"'
        To = "`"$CLOUD_BASE_URL/ui/tabbar/contact-active.jpg`""
    },
    
    # 产品路径
    @{
        From = "'/images/products/"
        To = "'$CLOUD_BASE_URL/products/"
    },
    @{
        From = '"/images/products/'
        To = "`"$CLOUD_BASE_URL/products/"
    },
    @{
        From = '`/images/products/'
        To = "`$CLOUD_BASE_URL/products/"
    }
)

# 获取所有需要处理的文件
function Get-AllFiles {
    param([string]$Path)
    
    $files = @()
    
    Get-ChildItem -Path $Path -Recurse -File | ForEach-Object {
        $file = $_
        $extension = $file.Extension
        $shouldSkip = $false
        
        # 检查是否在跳过的目录中
        foreach ($skipDir in $SKIP_DIRS) {
            if ($file.FullName -like "*\$skipDir\*") {
                $shouldSkip = $true
                break
            }
        }
        
        # 检查文件扩展名
        if (-not $shouldSkip -and $TARGET_EXTENSIONS -contains $extension) {
            $files += $file.FullName
        }
    }
    
    return $files
}

# 处理单个文件
function Process-File {
    param([string]$FilePath)
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $originalContent = $content
        $modified = $false
        $changes = @()
        
        # 应用所有替换规则
        foreach ($rule in $PATH_REPLACEMENTS) {
            if ($content -like "*$($rule.From)*") {
                $content = $content -replace [regex]::Escape($rule.From), $rule.To
                $modified = $true
                $changes += "替换: $($rule.From) -> $($rule.To)"
            }
        }
        
        # 如果有修改，写回文件
        if ($modified) {
            Set-Content -Path $FilePath -Value $content -Encoding UTF8
            Write-Host "✅ 已更新: $FilePath" -ForegroundColor Green
            foreach ($change in $changes) {
                Write-Host "   $change" -ForegroundColor Gray
            }
            return $true
        }
        
        return $false
    }
    catch {
        Write-Host "❌ 处理文件失败: $FilePath - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 主函数
Write-Host "📁 目标云存储: $CLOUD_BASE_URL" -ForegroundColor Yellow
Write-Host ""

# 获取所有文件
$files = Get-AllFiles -Path "."
Write-Host "📋 找到 $($files.Count) 个文件需要检查" -ForegroundColor Cyan
Write-Host ""

$processedCount = 0
$modifiedCount = 0

# 处理每个文件
foreach ($file in $files) {
    $processedCount++
    $wasModified = Process-File -FilePath $file
    if ($wasModified) {
        $modifiedCount++
    }
}

Write-Host ""
Write-Host "📊 迁移完成统计:" -ForegroundColor Green
Write-Host "   检查文件: $processedCount" -ForegroundColor White
Write-Host "   修改文件: $modifiedCount" -ForegroundColor White
Write-Host "   未修改文件: $($processedCount - $modifiedCount)" -ForegroundColor White

if ($modifiedCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️  重要提醒:" -ForegroundColor Yellow
    Write-Host "1. 请检查修改后的文件是否正确" -ForegroundColor White
    Write-Host "2. 建议先在开发环境测试" -ForegroundColor White
    Write-Host "3. 确认云存储文件已正确上传" -ForegroundColor White
    Write-Host "4. 测试所有功能是否正常" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ 云存储迁移完成！" -ForegroundColor Green

