# AGENTS.md - Fast Game Framework

## 构建命令

- **构建项目**：使用 Cocos Creator 编辑器为目标平台构建
- **TypeScript 编译**：`tsc`（渐进式严格模式：noImplicitAny, strictNullChecks, strictFunctionTypes, noImplicitReturns, noFallthroughCasesInSwitch）
- **代码检查**：`npm run lint`（ESLint + TypeScript ESLint 配置）
- **自动修复**：`npm run lint:fix`

## 测试命令

- **测试框架**：未配置（建议添加 Jest 或 Mocha）
- **运行测试**：`npm test`（配置后）
- **运行单个测试**：`npm test -- --testNamePattern="测试名称"`

## 代码风格指南

- **命名约定**：类 PascalCase（Boot），方法/属性 camelCase（start, update），私有属性前缀下划线
- **导入**：从'cc'导入 Cocos Creator 模块，使用解构获取装饰器`const { ccclass, property } = _decorator;`
- **组件模式**：扩展 Component 类，使用@ccclass 装饰器，实现 start()和 update(deltaTime)生命周期
- **格式化**：2 空格缩进，分号必写，单引号字符串，对象尾随逗号
- **ESLint 规则**：Airbnb 风格，强制 const/let，优先箭头函数/模板字符串，禁止 eval/new Function，禁用 arguments 使用 rest 参数</content>

<parameter name="filePath">F:\cocos\stone\AGENTS.md
