#!/bin/bash

# NavSphere Extension - ZIP 构建脚本
# 用于打包扩展以发布到 Chrome Web Store 或其他商店

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取版本号
VERSION=$(node -p "require('./package.json').version")
NAME="navsphere-extension"
DIST_DIR="dist"
OUTPUT_DIR="releases"
ZIP_NAME="${NAME}-v${VERSION}.zip"

echo -e "${GREEN}🚀 NavSphere Extension 构建脚本${NC}"
echo -e "${YELLOW}版本: ${VERSION}${NC}"
echo ""

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    npm install
fi

# 清理旧的构建
echo -e "${YELLOW}🧹 清理旧的构建文件...${NC}"
rm -rf "$DIST_DIR"

# 构建项目
echo -e "${YELLOW}🔨 构建项目...${NC}"
npm run build

# 检查构建是否成功
if [ ! -d "$DIST_DIR" ]; then
    echo -e "${RED}❌ 构建失败：dist 目录不存在${NC}"
    exit 1
fi

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 删除旧的 zip 文件（如果存在）
if [ -f "$OUTPUT_DIR/$ZIP_NAME" ]; then
    echo -e "${YELLOW}🗑️  删除旧的 zip 文件...${NC}"
    rm "$OUTPUT_DIR/$ZIP_NAME"
fi

# 创建 zip 文件
echo -e "${YELLOW}📦 创建 ZIP 文件...${NC}"
cd "$DIST_DIR"
zip -r "../$OUTPUT_DIR/$ZIP_NAME" . -x "*.DS_Store" -x "__MACOSX/*" -x ".vite/*"
cd ..

# 显示文件信息
ZIP_SIZE=$(du -h "$OUTPUT_DIR/$ZIP_NAME" | cut -f1)
echo ""
echo -e "${GREEN}✅ 构建完成！${NC}"
echo -e "📁 输出文件: ${OUTPUT_DIR}/${ZIP_NAME}"
echo -e "📊 文件大小: ${ZIP_SIZE}"
echo ""
echo -e "${YELLOW}📋 下一步:${NC}"
echo "1. Chrome Web Store: https://chrome.google.com/webstore/devconsole"
echo "2. Edge Add-ons: https://partner.microsoft.com/dashboard/microsoftedge"
echo "3. Firefox Add-ons: https://addons.mozilla.org/developers/"
