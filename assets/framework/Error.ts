/**
 * 自定义框架错误类
 */
export class FastError extends Error {
  /**
   * 构造函数
   * @param token 标识
   * @param message 消息
   */
  constructor(token: string, message?: string) {
    super(message);
    this.name = `FastError<${token}>`;
  }
}
