# NavSphere Browser Extension

NavSphere 浏览器扩展 - 快速书签管理和同步工具

## 功能特性

### 🚀 核心功能
- **快速添加链接**：右键菜单或快捷键 `Ctrl+Shift+A` 快速添加当前页面到 NavSphere
- **多实例支持**：支持添加和管理多个 NavSphere 实例
- **智能分类**：自动获取页面信息，支持选择或创建分类
- **书签同步**：同步浏览器书签到 NavSphere（开发中）

### 🔧 技术特性
- **Manifest V3**：使用最新的浏览器扩展标准
- **TypeScript**：完整的类型安全支持
- **React + Tailwind CSS**：现代化 UI 框架
- **跨浏览器支持**：Chrome、Edge、Firefox

## 安装使用

### 开发环境设置

1. **克隆项目**
```bash
git clone <repository-url>
cd navsphere-extension
```

2. **安装依赖**
```bash
npm install
```

3. **开发模式**
```bash
npm run dev
```

4. **构建扩展**
```bash
npm run build
```

### 加载到浏览器

#### Chrome/Edge
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist` 文件夹

#### Firefox
1. 打开 `about:debugging`
2. 点击"此Firefox"
3. 点击"临时载入附加组件"
4. 选择 `dist/manifest.json`

## 使用指南

### 1. 配置 NavSphere 实例

首次使用需要配置您的 NavSphere 实例：

1. 点击扩展图标打开弹窗
2. 点击"配置实例"按钮
3. 添加您的 NavSphere 网站 URL
4. 验证连接是否成功

### 2. 快速添加链接

有三种方式快速添加链接：

- **右键菜单**：在任意页面右键选择"添加到 NavSphere"
- **快捷键**：按 `Ctrl+Shift+A`（Mac 上是 `Cmd+Shift+A`）
- **扩展弹窗**：点击扩展图标手动添加

### 3. 管理分类

在快速添加时：
1. 选择现有分类
2. 或创建新分类
3. 编辑标题和描述
4. 确认添加

## 项目结构

```
navsphere-extension/
├── src/
│   ├── background/          # Service Worker
│   ├── content/            # Content Scripts  
│   ├── popup/              # 弹窗界面
│   ├── options/            # 设置页面
│   ├── components/         # 共享组件
│   ├── lib/               # 工具函数
│   ├── types/             # TypeScript 类型
│   └── assets/            # 静态资源
├── public/                # 静态文件
├── manifest.json          # 插件配置
└── package.json
```

## 开发说明

### 核心模块

- **StorageManager**: 负责扩展数据存储管理
- **NavSphereAPI**: 与 NavSphere API 交互
- **Background Script**: 处理右键菜单、快捷键等
- **Content Script**: 获取页面信息
- **Popup**: 快速添加界面
- **Options**: 设置管理界面

### 数据流

1. 用户触发添加操作（右键/快捷键）
2. Content Script 获取页面信息
3. Background Script 存储数据并打开弹窗
4. Popup 显示添加界面，调用 API
5. 数据同步到 NavSphere 实例

## API 集成

扩展与 NavSphere 通过以下 API 交互：

- `GET /api/health` - 健康检查
- `GET /api/navigation` - 获取导航数据
- `POST /api/navigation/{id}/items` - 添加导航项
- `PUT /api/navigation` - 更新导航数据

## 权限说明

扩展请求的权限：
- `contextMenus`: 右键菜单功能
- `storage`: 存储配置和缓存
- `tabs`: 获取当前页面信息
- `activeTab`: 访问活动标签页
- `bookmarks`: 书签同步功能
- `identity`: GitHub OAuth 认证

## 安全性

- 所有敏感数据加密存储
- HTTPS 通信
- 最小权限原则
- 定期清理缓存

## 版本计划

### v1.0.0 (当前)
- [x] 基础项目结构
- [x] 快速添加功能
- [x] 多实例管理
- [x] 右键菜单集成
- [ ] GitHub OAuth 认证
- [ ] 书签同步功能

### v1.1.0 (计划中)
- [ ] Firefox 完整支持
- [ ] 批量导入书签
- [ ] 离线缓存功能
- [ ] 主题切换

### v1.2.0 (计划中)
- [ ] Safari 支持
- [ ] 高级分类管理
- [ ] 同步历史记录
- [ ] 快捷键自定义

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License

## 支持

如有问题或建议，请提交 Issue 或联系维护者。# navsphere-extension
