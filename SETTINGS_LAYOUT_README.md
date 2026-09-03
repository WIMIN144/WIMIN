# DSH Zhipu Balance - 设置面板布局优化

## 功能概述

优化了 dsh-zhipu-balance 插件的设置面板布局，将显示相关的选项整合到"显示板块"部分，使设置更加直观和易于管理。

## 🎯 优化内容

### 设置面板重新组织
- **目标**: 将所有显示相关的选项集中管理
- **改动**: 将"白色背景"和"显示模型用量"移到"显示板块"部分
- **效果**: 设置更加直观，用户可以快速找到所有显示选项

### 新的设置面板结构
```
⚙️ 设置面板
├── 刷新间隔
│   ├── 自动刷新（下拉选择）
│
├── 🎨 显示板块
│   ├── API 额度（复选框）
│   ├── Coding Plan（复选框）
│   ├── 白色背景（复选框）← 新位置
│   └── 显示模型用量（复选框）← 新位置
│
├── ⚠️ 预警阈值
│   ├── 预警 %（数字输入）
│   └── 告警 %（数字输入）
│
└── 恢复默认（按钮）
```

## 📋 技术实现

### 代码修改
1. **客户端代码** (`lib/client.js`):
   - 修改了 `SettingsPanel` 函数中的 `sectionChecks` 生成逻辑
   - 创建了 `displayOptions` 数组来包含所有显示相关的选项
   - 将 `displayOptions` 添加到 `sectionChecks` 后面
   - 保持了原有的功能逻辑不变，仅优化了界面布局

2. **设置选项分类**:
   - **刷新间隔**: 控制自动刷新频率
   - **显示板块**: 所有显示相关的选项
   - **预警阈值**: 控制颜色预警的阈值
   - **恢复默认**: 重置所有设置

### 核心代码逻辑
```javascript
// 生成板块显示选项
var sectionChecks = visible.map(function (spec) {
    var names = { api: t("showApi"), coding: t("showCoding") };
    return React.createElement("div", { key: spec.id, className: "dzb-setting-row" },
        React.createElement("span", { className: "dzb-setting-name" }, names[spec.id] || spec.id),
        React.createElement("input", {
            type: "checkbox",
            checked: !settings.hidden[spec.id],
            onChange: function (e) {
                var next = Object.assign({}, settings.hidden);
                if (e.target.checked) delete next[spec.id];
                else next[spec.id] = true;
                onChange(Object.assign({}, settings, { hidden: next }));
            }
        }));
});

// 添加显示相关的选项
var displayOptions = [
    React.createElement("div", { key: "white-bg", className: "dzb-setting-row" },
        React.createElement("span", { className: "dzb-setting-name" }, "白色背景"),
        React.createElement("input", {
            type: "checkbox",
            checked: settings.whiteBackground,
            onChange: function (e) {
                onChange(Object.assign({}, settings, { whiteBackground: e.target.checked }));
            }
        })),
    React.createElement("div", { key: "show-usage", className: "dzb-setting-row" },
        React.createElement("span", { className: "dzb-setting-name" }, "显示模型用量"),
        React.createElement("input", {
            type: "checkbox",
            checked: settings.showModelUsage,
            onChange: function (e) {
                onChange(Object.assign({}, settings, { showModelUsage: e.target.checked }));
            }
        }))
];

// 渲染设置面板
React.createElement("div", { className: "dzb-setting-title" }, t("sections")),
sectionChecks,
displayOptions,  // ← 新增的显示选项
```

## 🚀 优势

### 🎯 用户体验改进
- **逻辑集中**: 所有显示相关的选项都在一个部分
- **易于查找**: 用户可以快速找到所有显示相关的设置
- **符合预期**: "显示板块"部分包含所有显示选项
- **减少认知负担**: 不需要在不同的设置部分之间切换

### 🔧 界面优化
- **结构清晰**: 设置面板的结构更加符合用户的心理模型
- **视觉层次**: 通过标题和分隔线创建清晰的视觉层次
- **操作便捷**: 相关的设置选项放在一起，操作更加便捷

### 📱 响应式设计
- **兼容性好**: 与现有的响应式设计保持一致
- **样式统一**: 使用相同的样式类确保界面一致性
- **易于维护**: 代码结构清晰，便于后续维护和扩展

## 🔄 版本信息

- **功能版本**: v1.3.0
- **兼容性**: 与现有版本完全兼容
- **依赖**: 无额外依赖
- **向后兼容**: 不会影响现有用户的使用习惯

## 📝 注意事项

- 所有设置选项的功能保持不变
- 设置的保存和加载逻辑没有改变
- 用户界面仅进行了布局优化
- 不影响插件的核心功能

## 🎨 视觉效果

### 设置面板对比
**之前**:
- 显示选项分散在不同部分
- 用户需要在不同部分之间切换
- 设置结构不够直观

**现在**:
- 所有显示选项集中在一个部分
- 用户可以一目了然地看到所有显示选项
- 设置结构更加清晰和符合逻辑

这个优化让用户能够更方便地管理插件的显示选项，提高了整体的使用体验。