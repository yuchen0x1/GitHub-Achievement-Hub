/**
 * 构建模式判断。
 *
 * `NEXT_PUBLIC_EXPORT_MODE` 由 `next.config.ts` 的 `env` 在构建期注入
 * （导出模式为 `'1'`，SSR 模式为 `'0'`）。这样客户端组件在浏览器里
 * 也能读到真实值，而不是运行时未定义的 `process.env.NEXT_OUTPUT`。
 */
export const IS_EXPORT = process.env.NEXT_PUBLIC_EXPORT_MODE === '1';
