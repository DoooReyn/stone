# Stone - Cocos Creator 游戏项目

## 项目概述

这是一个基于 Cocos Creator 3.8.8 引擎的游戏项目，使用 TypeScript 开发。项目集成了自研的 Fast 游戏框架，提供了完整的插件化架构和开发工具链。

**主要特性：**

- 基于 Cocos Creator 3.8.8 引擎
- TypeScript 开发，支持渐进式严格模式
- 自研 Fast 游戏框架，插件化架构
- 完整的工具链支持（ESLint、TypeScript 编译）
- 模块化设计，清晰的目录结构

## 技术栈

- **游戏引擎**: Cocos Creator 3.8.8
- **开发语言**: TypeScript 5.9.3
- **代码规范**: ESLint + TypeScript ESLint
- **构建工具**: Cocos Creator 内置构建系统
- **包管理**: npm
- **核心依赖**:
  - `js-base64`: Base64 编解码
  - `pako`: 数据压缩

## 项目结构

```
stone/
├── assets/                   # 资源目录
│   ├── boot/                 # 启动模块
│   │   ├── src/              # 启动逻辑
│   │   │   └── Boot.ts       # 主启动组件
│   │   └── res/              # 启动资源
│   ├── framework/            # Fast 框架
│   │   ├── config/           # 配置定义
│   │   ├── foundation/       # 基础组件
│   │   ├── plugin/           # 插件系统
│   │   ├── util/             # 工具函数
│   │   ├── Fast.ts           # 框架核心
│   │   ├── Init.ts           # 框架初始化
│   │   └── Types.ts          # 类型定义
│   ├── game/                 # 游戏逻辑
│   │   ├── src/              # 游戏源码
│   │   └── res/              # 游戏资源
│   └── stage/                # 场景资源
└── settings/                 # 项目设置
```

## 核心架构

### Fast 框架

项目集成了自研的 Fast 游戏框架，采用插件化架构设计：

- **核心类**: `Fast` (assets/framework/Fast.ts:15)
- **单例实例**: `fast` (assets/framework/Fast.ts:87)
- **插件系统**: 基于 `Plugin` 基类的可扩展架构
- **初始化流程**: `boot()` 函数 (assets/framework/Init.ts:6)

### 插件系统

框架包含以下核心插件：

1. **基础服务插件**:

   - `GlobalPlugin`: 全局变量管理
   - `ObjectPoolPlugin`: 对象池管理
   - `NodePoolPlugin`: 节点池管理
   - `EventBusPlugin`: 事件总线
   - `TimerPlugin`: 定时器系统

2. **功能插件**:

   - `CatcherPlugin`: 异常捕获
   - `ArgParserPlugin`: 参数解析
   - `StoragePlugin`: 数据存储
   - `I18nPlugin`: 国际化
   - `RedPlugin`: Red 状态管理

3. **开发工具插件**:
   - `ProfilerPlugin`: 性能分析
   - `AppPlugin`: 应用管理

## 构建和运行

### 开发环境

```bash
# 安装依赖
npm install

# TypeScript 编译检查
npx tsc --noEmit

# 代码检查
npm run lint

# 自动修复代码格式
npm run lint:fix
```

### 构建项目

使用 Cocos Creator 编辑器进行构建：

1. 打开 Cocos Creator 3.8.8
2. 加载项目目录
3. 选择目标平台
4. 点击"构建"按钮

### 运行项目

1. 在 Cocos Creator 编辑器中点击"预览"
2. 或使用构建后的发布版本

## 开发规范

### TypeScript 配置

项目采用渐进式严格模式 (tsconfig.json:12-20)：

- `noImplicitAny`: 禁止隐式 any 类型
- `strictNullChecks`: 严格的 null 检查
- `strictFunctionTypes`: 严格的函数类型检查
- `noImplicitReturns`: 函数必须有明确返回值
- `noFallthroughCasesInSwitch`: switch 语句必须有 break

### 代码风格

基于 Airbnb 风格指南 (eslint.config.js:25-85)：

- **缩进**: 2 个空格
- **引号**: 单引号
- **分号**: 必须使用
- **命名**:
  - 类名：PascalCase
  - 方法/属性：camelCase
  - 私有属性：前缀下划线
- **导入**: 从 'cc' 导入 Cocos Creator 模块
- **组件**: 扩展 Component 类，使用 @ccclass 装饰器

### 组件开发模式

```typescript
import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ComponentName')
export class ComponentName extends Component {
  start() {
    // 初始化逻辑
  }

  update(deltaTime: number) {
    // 每帧更新逻辑
  }
}
```

## 启动流程

1. **Cocos Creator 启动**: 加载 Boot 组件 (assets/boot/src/Boot.ts:8)
2. **框架初始化**: 调用 `boot()` 函数 (assets/framework/Init.ts:6)
3. **插件注册**: 按依赖顺序注册所有插件 (assets/framework/Init.ts:13-29)
4. **插件初始化**: 逐个初始化插件 (assets/framework/Init.ts:32-37)
5. **全局注册**: 将框架实例注册到全局变量 (assets/framework/Init.ts:48-51)

## 路径别名

项目配置了路径别名 (tsconfig.json:21)：

```typescript
"paths": {
  "fast/*": ["./assets/framework/*"]
}
```

使用示例：

```typescript
import { fast } from 'fast/Fast';
import { boot } from 'fast/index';
```

## 开发建议

1. **插件开发**: 继承 `Plugin` 基类，实现 `initialize()` 和 `dispose()` 方法
2. **组件开发**: 遵循 Cocos Creator 组件生命周期，使用装饰器模式
3. **代码规范**: 严格遵循 ESLint 配置，保持代码风格统一
4. **性能优化**: 合理使用对象池和节点池，避免频繁创建销毁
5. **错误处理**: 利用 CatcherPlugin 进行统一异常处理

## 注意事项

- 项目使用 ES 模块 (`"type": "module"`)
- 忽略 `.meta` 文件的 ESLint 检查
- 发布模式下自动提升日志等级到 WARN
- 框架实例通过全局变量访问，便于调试
