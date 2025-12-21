# AGENTS.md - 石头游戏项目

## 构建命令
- **构建项目**：使用Cocos Creator编辑器为目标平台构建
- **TypeScript编译**：`tsc`（使用tsconfig.json）
- **代码检查**：`npm run lint`（ESLint + TypeScript ESLint配置）
- **自动修复**：`npm run lint:fix`

## 测试命令
- **未配置测试框架**：添加Jest或Mocha用于单元测试
- **运行单个测试**：`npm test -- --testNamePattern="测试名称"`（配置后）

## 代码风格指南

### TypeScript配置
- 渐进式严格模式：启用部分严格检查，避免引擎兼容性问题
- 启用的严格选项：
  - `noImplicitAny`: 禁止隐式any类型
  - `strictNullChecks`: 严格的null检查
  - `strictFunctionTypes`: 严格的函数类型检查
  - `noImplicitReturns`: 函数必须有明确的返回值
  - `noFallthroughCasesInSwitch`: switch语句必须有break
- `skipLibCheck`: 跳过引擎库文件的类型检查
- 扩展`./temp/tsconfig.cocos.json`（自动生成）

### 命名约定
- **类**：PascalCase（例如：`Boot`、`Scroll`）
- **方法**：camelCase（例如：`start()`、`update()`）
- **属性**：camelCase（例如：`speed`、`offset`）

### 导入和结构
- 从'cc'导入Cocos Creator模块
- 使用解构赋值获取装饰器：`const { ccclass, property } = _decorator;`
- 分组导入：Cocos Creator模块优先，然后是自定义模块

### 组件模式
- 为游戏对象扩展`Component`类
- 使用`@ccclass('ClassName')`装饰器
- 实现`start()`和`update(deltaTime)`生命周期方法

### 错误处理
- 渐进式严格模式：平衡类型安全与开发便利性
- 空值检查：启用`strictNullChecks`，需显式处理可能的null值
- 组件引用：使用条件检查而非非空断言（除非确定非空）

### 格式化
- 2个空格缩进
- 需要分号
- 字符串使用单引号
- 对象字面量使用尾随逗号

### 新增ESLint规则（Airbnb风格）
- **变量声明**：强制使用`const`和`let`，禁止使用`var`
- **常量优化**：未重新赋值的变量必须使用`const`
- **命名约定**：变量使用camelCase，类和类型使用PascalCase
- **私有成员**：私有属性必须以下划线开头（TypeScript）
- **现代语法**：优先使用箭头函数、模板字符串、对象解构
- **代码风格**：统一的对象/数组间距，强制尾随逗号
- **安全性**：禁止`eval()`、`new Function()`等危险操作
- **模块系统**：禁止过时的`arguments`对象，使用rest参数</content>
<parameter name="filePath">F:\cocos\stone\AGENTS.md