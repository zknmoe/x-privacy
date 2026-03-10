# 🕵️ X Privacy

在公共场合刷  X（Twitter）时隐藏你的身份。把你的名字和用户名替换成假身份——或者直接隐藏所有人的身份。

![Chrome Web Store](https://img.shields.io/badge/平台-Chrome-brightgreen)
![Manifest V3](https://img.shields.io/badge/manifest-v3-blue)
![License](https://img.shields.io/badge/许可-MIT-green)

[English](./README.md)

## 为什么需要这个？

在地铁上、教室里、咖啡馆刷推的时候，旁边的人瞟一眼就能看到你的用户名和你在跟谁互动。X Privacy 在浏览器本地替换所有可见的身份信息——不会向任何服务器发送数据。

## 功能

- **Just Me 模式** — 只隐藏你自己的名字和用户名
- **Everyone 模式** — 替换时间线上所有用户的身份
- **自定义身份** — 设置你想要的假名字和用户名，或者让插件随机分配
- **全面替换** — 覆盖推文、回复和浏览器标签页标题
- **一致的假身份** — 同一个用户在整个会话中使用相同的假身份（不会闪烁变化）
- **模糊账号切换按钮** — 侧边栏的个人资料按钮被模糊处理，鼠标悬停时恢复
- **零数据收集** — 所有设置通过 `chrome.storage.sync` 存储在本地

## 安装

### 从源码安装（开发者模式）

1. Clone 或下载本仓库
2. 在 Chrome 中打开 `chrome://extensions`
3. 打开右上角的 **开发者模式**
4. 点击 **加载已解压的扩展程序**，选择 `x-privacy` 文件夹
5. 点击工具栏上的扩展图标，配置你的设置


## 使用方法

1. 点击工具栏上的 🕵️ 图标
2. 在「Your actual identity」下输入你的 **个人资料名称** 和 **@ 用户名**
3. 可选：在「Custom identity」下设置 **自定义身份**（留空则随机分配）
4. 选择模式：
   - **Just Me** — 只替换你的信息
   - **Everyone** — 页面上所有用户都获得假身份
5. 打开开关——完成

## 工作原理

X Privacy 是一个在 `x.com` 和 `twitter.com` 上运行的 content script，使用了以下技术：

- **DOM 选择器**（`data-testid`、`a[href^="/"]`）定位用户名、显示名和头像
- **TreeWalker** 扫描文本节点，捕获散落在各处的名字/用户名（通知、"正在回复"、标签页标题）
- **MutationObserver** 持续监听 DOM 变化，在 X 动态加载新内容时自动应用替换（X 是 React SPA）
- **chrome.storage.sync** 在标签页和会话之间持久化你的设置

一切都在客户端运行。没有网络请求，没有数据收集，没有服务器。

## 项目结构

```
x-privacy/
├── manifest.json      # 扩展配置（Manifest V3）
├── content.js         # 核心逻辑——注入到 X 页面中
├── popup.html         # 设置面板 UI
├── popup.js           # 设置面板逻辑
└── icons/
    ├── icon16.png     # 工具栏图标
    ├── icon48.png     # 扩展管理页
    └── icon128.png    # Chrome Web Store
```

## 隐私政策

X Privacy 不会在外部收集、传输或存储任何用户数据。所有配置（你的用户名、显示名、模式偏好）均通过 `chrome.storage.sync` 存储在浏览器本地。无分析、无追踪、无服务端组件。

## 许可证

MIT
