# NavSphere 浏览器扩展开发指南

## 🎉 插件已经完成！

NavSphere 浏览器扩展的第一个版本已经成功开发完成。包含以下核心功能：

### ✅ 已完成功能

1. **快速添加链接** - 右键菜单和快捷键支持
2. **多实例管理** - 支持添加多个 NavSphere 实例
3. **智能页面信息获取** - 自动获取标题、URL、图标等
4. **响应式UI** - 基于 Tailwind CSS 的现代化界面
5. **完整的设置页面** - 实例管理、配置等

### 🔧 技术实现

- **Manifest V3** - 最新浏览器扩展标准
- **TypeScript + React** - 类型安全的现代前端开发
- **Vite + CRXJS** - 快速构建和热重载
- **Tailwind CSS** - 原子化 CSS 框架
- **Zustand** - 轻量级状态管理

## 📦 安装和使用

### 1. 构建插件
```bash
cd navsphere-extension
npm install
npm run build
```

### 2. 加载到 Chrome
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist` 文件夹

### 3. 配置使用
1. 点击扩展图标
2. 点击"配置实例"
3. 添加您的 NavSphere 网站 URL
4. 验证连接成功

## 🚀 使用方法

### 快速添加链接

**方法一：右键菜单**
- 在任意网页右键
- 选择"添加到 NavSphere"

**方法二：快捷键**
- 按 `Ctrl+Shift+A` (Windows)
- 按 `Cmd+Shift+A` (Mac)

**方法三：扩展弹窗**
- 点击浏览器工具栏的扩展图标

### 多实例管理

1. **添加实例**
   - 进入设置页面
   - 点击"添加实例"
   - 输入实例名称和URL
   - 验证连接

2. **切换实例**
   - 在弹窗中选择不同实例
   - 或在设置中设置默认实例

## 📁 项目结构

```
navsphere-extension/
├── src/
│   ├── background/          # Service Worker 后台脚本
│   │   └── index.ts        # 右键菜单、快捷键处理
│   ├── content/            # Content Scripts
│   │   └── index.ts        # 页面信息获取
│   ├── popup/              # 快速添加弹窗
│   │   ├── index.html      # 弹窗页面
│   │   ├── index.tsx       # React 入口
│   │   └── PopupApp.tsx    # 主要组件
│   ├── options/            # 设置页面
│   │   ├── index.html      # 设置页面
│   │   ├── index.tsx       # React 入口
│   │   └── OptionsApp.tsx  # 设置组件
│   ├── components/ui/      # UI 组件库
│   ├── lib/               # 工具函数
│   │   ├── storage.ts     # 数据存储管理
│   │   ├── api.ts         # NavSphere API 调用
│   │   └── utils.ts       # 通用工具
│   ├── types/             # TypeScript 类型定义
│   └── assets/            # 样式和静态资源
├── public/icons/          # 扩展图标
├── manifest.json          # 扩展配置
└── dist/                  # 构建输出
```

## 🔄 开发流程

### 开发模式
```bash
npm run dev
```
这会启动热重载开发模式，修改代码后自动重新构建。

### 类型检查
```bash
npm run type-check
```

### 代码检查
```bash
npm run lint
npm run lint:fix
```

### 生产构建
```bash
npm run build
```

## 🎯 核心功能详解

### 1. 右键菜单集成
- 在 `background/index.ts` 中创建上下文菜单
- 支持页面、链接、选中文本等场景
- 智能获取页面信息

### 2. 快速添加弹窗
- React 组件化设计
- 实时页面信息获取
- 分类选择和自定义编辑
- 错误处理和成功反馈

### 3. 多实例管理
- 支持添加多个 NavSphere 实例
- 实例验证和健康检查
- 默认实例设置
- 认证状态管理

### 4. 数据存储
- Chrome Storage API
- 加密敏感信息
- 缓存优化
- 同步和本地存储分离

## 🔮 后续开发计划

### Phase 2 (v1.1.0)
- [ ] GitHub OAuth 认证集成
- [ ] 书签批量导入功能
- [ ] 离线缓存支持
- [ ] 主题切换功能

### Phase 3 (v1.2.0)
- [ ] Firefox 完整兼容
- [ ] 高级同步设置
- [ ] 快捷键自定义
- [ ] 导入/导出配置

### Phase 4 (v2.0.0)
- [ ] Safari 支持
- [ ] 团队协作功能
- [ ] 统计和分析
- [ ] 云端同步

## 🐛 已知限制

1. **认证功能** - GitHub OAuth 正在开发中
2. **书签同步** - 批量同步功能待实现
3. **Firefox 兼容** - 部分 API 差异需要适配
4. **离线支持** - 网络断开时的处理有限

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -m 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**恭喜！🎉 您已经成功创建了一个功能完整的 NavSphere 浏览器扩展！**

现在您可以：
1. 在浏览器中加载和测试扩展
2. 根据需要定制功能
3. 发布到 Chrome Web Store
4. 继续开发高级功能