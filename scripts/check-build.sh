#!/bin/bash

echo "🚀 NavSphere Extension 构建完成检查"
echo "=================================="

# 检查必要文件是否存在
echo "📁 检查构建文件..."

files=(
    "dist/manifest.json"
    "dist/src/popup/index.html" 
    "dist/src/options/index.html"
    "dist/icons/icon-16.png"
    "dist/icons/icon-32.png"
    "dist/icons/icon-48.png"
    "dist/icons/icon-128.png"
)

all_files_exist=true

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
        all_files_exist=false
    fi
done

# 检查构建大小
echo ""
echo "📊 构建统计..."
if [ -d "dist" ]; then
    total_size=$(du -sh dist | cut -f1)
    echo "总大小: $total_size"
    
    # 统计文件数量
    file_count=$(find dist -type f | wc -l)
    echo "文件数量: $file_count"
fi

echo ""
if [ "$all_files_exist" = true ]; then
    echo "🎉 构建验证通过！"
    echo ""
    echo "📝 下一步操作:"
    echo "1. 打开 Chrome 浏览器"
    echo "2. 访问 chrome://extensions/"
    echo "3. 开启开发者模式"
    echo "4. 点击'加载已解压的扩展程序'"
    echo "5. 选择 'dist' 文件夹"
    echo ""
    echo "🔧 开发模式运行:"
    echo "   npm run dev"
else
    echo "❌ 构建验证失败，请检查缺失的文件"
    exit 1
fi