New-Item -ItemType Directory -Force -Path "src\dashboard\public\videos" | Out-Null
New-Item -ItemType Directory -Force -Path "src\dashboard\public\screenshots" | Out-Null

Write-Host "Optimizing hero video..."
ffmpeg -y -i "LOGO\Video Kinexis hero.mp4" -vcodec libx264 -crf 28 -preset fast "src\dashboard\public\videos\hero.mp4"

Write-Host "Optimizing samantha video..."
ffmpeg -y -i "LOGO\Samantha oficina.mp4" -vcodec libx264 -crf 28 -preset fast "src\dashboard\public\videos\samantha.mp4"

Write-Host "Optimizing screenshots..."
ffmpeg -y -i "LOGO\dashboard amazon.PNG" -c:v libwebp -q:v 80 "src\dashboard\public\screenshots\amazon.webp"
ffmpeg -y -i "LOGO\Dashboard general.PNG" -c:v libwebp -q:v 80 "src\dashboard\public\screenshots\general.webp"
ffmpeg -y -i "LOGO\dashboard Omnicanal.PNG" -c:v libwebp -q:v 80 "src\dashboard\public\screenshots\omnicanal.webp"
ffmpeg -y -i "LOGO\Dashboard shopify.PNG" -c:v libwebp -q:v 80 "src\dashboard\public\screenshots\shopify.webp"
ffmpeg -y -i "LOGO\dashboard warehouse.PNG" -c:v libwebp -q:v 80 "src\dashboard\public\screenshots\warehouse.webp"
ffmpeg -y -i "LOGO\Captura.PNG" -c:v libwebp -q:v 80 "src\dashboard\public\screenshots\logo.webp"

Write-Host "Getting sizes..."
Get-Item "src\dashboard\public\videos\*.mp4" | Select-Object Name, @{Name="SizeMB"; Expression={[math]::Round($_.Length / 1MB, 2)}}
Get-Item "src\dashboard\public\screenshots\*.webp" | Select-Object Name, @{Name="SizeKB"; Expression={[math]::Round($_.Length / 1KB, 2)}}
