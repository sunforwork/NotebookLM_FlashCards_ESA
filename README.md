# Flashcards 学习网站

本项目将从 NotebookLM 导出的 flashcards CSV 文件转换为一个面向移动端优化的静态网站，便于学习与复习。项目配置为可在阿里云 ESA Pages 上一键构建、部署和托管。

> 声明：本项目由阿里云ESA提供加速、计算和保护

![阿里云 ESA](https://img.alicdn.com/imgextra/i3/O1CN01H1UU3i1Cti9lYtFrs_!!6000000000139-2-tps-7534-844.png)

## 特性

- **移动优先：** 触控友好（滑动切换、点击翻转卡片）。
- **离线友好：** 生成纯静态站点（输出目录为 `dist/`），可托管于任意静态站点服务。
- **Explain 模式：** 提供“Explain”按钮，生成用于 LLM 的提示，帮助深入理解卡片内容。
- **进度记录：** 在本地记录每个章节的学习进度。

## 项目结构

```
.
├── flashcards/          # 源 CSV 文件（格式：正面, 反面），来自 NotebookLM 导出
├── scripts/
│   └── build.js         # 构建脚本（CSV -> JSON 转换）
├── src/
│   ├── index.js         # ESA Pages 入口存根
│   └── ui/              # 前端源代码（HTML/CSS/JS）
├── dist/                # 生成的静态站点（请勿手动修改）
├── esa.jsonc            # ESA Pages 配置
└── package.json
```

## 本地开发

1. 安装依赖：

```bash
npm install
```

2. 构建站点（处理 `flashcards/` 下的 CSV 并生成 `dist/`）：

```bash
npm run build
```

3. 本地预览：

```bash
npm run dev
```

在浏览器中打开 `http://127.0.0.1:8080` 进行预览。

## 部署到阿里云 ESA Pages

仓库已配置为在 ESA Pages 上零配置部署：

1. 在 ESA Pages 控制台导入此仓库。
2. 系统会读取 `esa.jsonc` 中的配置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
3. 推送分支变更后会触发自动构建与部署。

## 添加卡片内容

将 `.csv` 文件放入 `flashcards/` 目录以添加新章节：

- **格式：** 无表头。
- **列顺序：** 第一列为正面（Question/Front），第二列为反面（Answer/Back）。
- **编码：** 建议使用 UTF-8。

---
