# ChatAnchor

<p align="center">
  <strong>为 ChatGPT 对话提供目录导航，快速跳转到任意问答位置</strong>
</p>

## 🎯 功能特性

- **📋 对话目录** - 自动扫描当前对话的所有消息，生成可点击的目录
- **🚀 快速跳转** - 点击目录项一键跳转到对应消息位置
- **🎨 实时高亮** - 当前阅读位置自动高亮显示
- **🔄 自动更新** - 新消息发送后目录自动刷新
- **🔍 搜索过滤** - 支持按关键词快速过滤目录项
- **🌙 主题适配** - 自动适配 ChatGPT 的亮色/暗色主题
- **💾 状态记忆** - 面板折叠状态自动保存

## 📦 安装方法

### 开发者模式加载（推荐）

1. 下载或克隆本项目到本地

2. 打开 Chrome 浏览器，在地址栏输入：
   ```
   chrome://extensions/
   ```

3. 在页面右上角开启 **"开发者模式"**

4. 点击 **"加载已解压的扩展程序"**

5. 选择项目目录 `ChatAnchor`

6. 扩展加载成功后，访问 [ChatGPT](https://chatgpt.com) 即可看到目录面板

## 🔧 使用方法

1. 打开 ChatGPT 并进入任意对话
2. 页面右侧会显示 **对话目录** 面板
3. 点击目录中的任意项可跳转到对应消息
4. 使用搜索框可快速过滤消息
5. 点击折叠按钮可隐藏面板

### 目录项图标说明

- **Q** (紫色) - 用户问题
- **A** (绿色) - ChatGPT 回答

## 📁 项目结构

```
ChatAnchor/
├── manifest.json    # 扩展配置文件
├── content.js       # 内容脚本（核心逻辑）
├── styles.css       # 样式文件
├── icons/           # 图标文件
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md        # 说明文档
```

## ⚠️ 注意事项

1. **仅支持 chatgpt.com** - 本插件仅在 ChatGPT 官方网站生效

2. **隐私安全** - 所有数据仅在本地处理，不会上传到任何服务器

3. **DOM 变化** - 如果 ChatGPT 更新页面结构，插件可能需要更新适配

## 🛠️ 开发说明

### 技术栈
- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6+)
- CSS3 (CSS Variables, Flexbox)

### 核心 API
- `MutationObserver` - 监听 DOM 变化，自动更新目录
- `IntersectionObserver` 概念应用 - 检测当前阅读位置
- `scrollIntoView` - 平滑滚动到目标位置
- `localStorage` - 保存面板状态

## 📝 版本记录

### v1.0.0
- 初始版本
- 实现目录生成、点击跳转、自动更新、当前位置高亮
- 支持搜索过滤
- 支持亮色/暗色主题

## 📄 许可证

MIT License
