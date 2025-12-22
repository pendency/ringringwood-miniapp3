# Video file information checker
Write-Host "=== Video File Analysis Report ===" -ForegroundColor Green
Write-Host "Checking path: images/products/" -ForegroundColor Yellow
Write-Host ""

# Get all mp4 files (exclude system files starting with ._ )
$videoFiles = Get-ChildItem -Path "images/products/" -Filter "*.mp4" | Where-Object { -not $_.Name.StartsWith("._") }

if ($videoFiles.Count -eq 0) {
    Write-Host "No video files found" -ForegroundColor Red
    exit
}

Write-Host "Found $($videoFiles.Count) video files" -ForegroundColor Green
Write-Host ""

# Create results array
$results = @()

foreach ($file in $videoFiles) {
    $fileName = $file.Name
    $fileSize = [math]::Round($file.Length / 1MB, 2)
    
    Write-Host "Checking file: $fileName" -ForegroundColor Cyan
    Write-Host "  File size: $fileSize MB" -ForegroundColor White
    
    # Try to get video properties using Shell.Application
    try {
        $shell = New-Object -ComObject Shell.Application
        $folder = $shell.Namespace($file.Directory.FullName)
        $item = $folder.ParseName($file.Name)
        
        # Get video properties
        $duration = $folder.GetDetailsOf($item, 27)
        $dimensions = $folder.GetDetailsOf($item, 31)
        $bitrate = $folder.GetDetailsOf($item, 28)
        
        Write-Host "  Duration: $duration" -ForegroundColor White
        Write-Host "  Dimensions: $dimensions" -ForegroundColor White
        Write-Host "  Bitrate: $bitrate" -ForegroundColor White
        
        $result = [PSCustomObject]@{
            FileName = $fileName
            FileSize_MB = $fileSize
            Duration = $duration
            Dimensions = $dimensions
            Bitrate = $bitrate
        }
        
    } catch {
        Write-Host "  Error reading file properties" -ForegroundColor Red
        
        $result = [PSCustomObject]@{
            FileName = $fileName
            FileSize_MB = $fileSize
            Duration = "Error"
            Dimensions = "Error"
            Bitrate = "Error"
        }
    }
    
    $results += $result
    Write-Host ""
}

# Summary statistics
Write-Host "=== Summary Statistics ===" -ForegroundColor Green
Write-Host "Total files: $($results.Count)" -ForegroundColor Yellow
Write-Host "Total size: $([math]::Round(($results | Measure-Object FileSize_MB -Sum).Sum, 2)) MB" -ForegroundColor Yellow

# File size distribution
$smallFiles = ($results | Where-Object { $_.FileSize_MB -lt 10 }).Count
$mediumFiles = ($results | Where-Object { $_.FileSize_MB -ge 10 -and $_.FileSize_MB -lt 50 }).Count
$largeFiles = ($results | Where-Object { $_.FileSize_MB -ge 50 }).Count

Write-Host "File size distribution:" -ForegroundColor Yellow
Write-Host "  Small files (<10MB): $smallFiles" -ForegroundColor White
Write-Host "  Medium files (10-50MB): $mediumFiles" -ForegroundColor White
Write-Host "  Large files (>50MB): $largeFiles" -ForegroundColor White

# Export to CSV
$csvPath = "video-analysis-report.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
Write-Host ""
Write-Host "Detailed report saved to: $csvPath" -ForegroundColor Green

# Show first 10 files
Write-Host ""
Write-Host "=== First 10 Files Details ===" -ForegroundColor Green
$results | Select-Object -First 10 | Format-Table -AutoSize

Write-Host "Analysis complete!" -ForegroundColor Green

