import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // 允许使用any类型（由于Cocos Creator项目可能需要）
      '@typescript-eslint/no-explicit-any': 'off',
      // 允许使用非空断言（符合AGENTS.md中的约定）
      '@typescript-eslint/no-non-null-assertion': 'off',
      // 允许使用require
      '@typescript-eslint/no-var-requires': 'off',
      // 允许未使用的变量（游戏开发中常见）
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // 缩进设置为2个空格（符合AGENTS.md）
      indent: ['error', 2],
      // 使用单引号（符合AGENTS.md）
      quotes: ['error', 'single'],
      // 需要分号（符合AGENTS.md）
      semi: ['error', 'always'],
      // 禁用console警告（游戏开发中可能需要console）
      'no-console': 'off',
      // 允许未定义的全局变量（Cocos Creator全局变量）
      'no-undef': 'off',
      // === Airbnb规则：强制使用const和let，禁止var
      'no-var': 'error',
      'prefer-const': 'error',
      // === Airbnb规则：严格的命名约定
      camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],
      // 禁用过于严格的命名约定规则，保持代码简洁
      '@typescript-eslint/naming-convention': 'off',
      // === Airbnb规则：强制使用现代语法
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      // === Airbnb规则：禁止过时语法
      'prefer-rest-params': 'error',
      'no-restricted-globals': ['error', 'arguments'],
      // === Airbnb规则：代码风格统一
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-dangle': ['error', 'always-multiline'],
      'function-paren-newline': ['error', 'multiline-arguments'],
      // === Airbnb规则：安全性考虑
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error'
    }
  },
  {
    ignores: [
      'node_modules/',
      'temp/',
      'build/',
      'dist/',
      '**/*.meta'
    ]
  }
];