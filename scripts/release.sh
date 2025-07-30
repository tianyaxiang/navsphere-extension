#!/bin/bash

echo "📦 NavSphere Extension 发布准备"
echo "================================"

# 清理之前的构建
echo "🧹 清理构建文件..."
rm -rf dist/
rm -f navsphere-extension.zip

# 重新构建
echo "🔨 重新构建..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

# 创建发布包
echo "📦 创建发布包..."
cd dist
zip -r ../navsphere-extension.zip ./*
cd ..

# 显示构建信息
echo ""
echo "✅ 发布包创建完成"
echo "📁 文件: navsphere-extension.zip"
echo "📊 大小: $(du -sh navsphere-extension.zip | cut -f1)"

echo ""
echo "🚀 下一步操作:"
echo "1. 测试扩展功能是否正常"
echo "2. 访问 Chrome Web Store Developer Dashboard"
echo "3. 上传 navsphere-extension.zip"
echo "4. 填写商店信息并提交审核"

echo ""
echo "📋 商店发布清单:"
echo "- [ ] 扩展标题: NavSphere Extension"
echo "- [ ] 简短描述: 快速书签管理和同步工具"
echo "- [ ] 详细描述: 已准备在 README.md 中"
echo "- [ ] 分类: 生产力工具"
echo "- [ ] 语言: 中文 (简体), English"
echo "- [ ] 隐私政策: 需要准备"
echo "- [ ] 截屏和图标: 需要准备"