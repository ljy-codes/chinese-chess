# 楚河汉界 · 中国象棋

一款基于 React 和 TypeScript 开发的本地人机中国象棋网页游戏，支持桌面端和移动端。

## 功能

- 标准中国象棋开局与完整棋子移动规则。
- 支持蹩马腿、塞象眼、炮架、过河兵、九宫限制和将帅照面判定。
- 自动过滤会导致己方被将军的非法走法。
- 自动识别将军、将死和困毙状态。
- 对局结束后停止 AI 计算，并显示玩家视角的胜利或惜败结算弹层。
- 被将军时通过状态栏文字提示；终局明确显示胜方、负方和“再来一局”按钮。
- 提供合法落点提示、上一手标记、悔棋和重新开局。
- 同时以虚线和实线圆圈标记红黑双方最近一步的起点与落点；空合法点显示绿色，可吃子点显示红色。
- 支持玩家执红、执黑或随机执棋，以及五档 AI 难度。
- 东方未来棋局视觉、精确 SVG 棋盘线和立体漆面棋子，适配桌面与移动端。
- 可选山涧流水五声音阶背景声场，并为落子、吃子和终局提供互不相同的音效。
- AI 使用迭代加深、Alpha-Beta、静态吃子搜索、高级走法排序与困难/大师置换表。
- AI 使用 Web Worker 在浏览器本地搜索，不阻塞棋盘界面。
- AI 搜索采用迭代加深、Negamax 和 Alpha-Beta 剪枝，并设置严格思考时间上限。
- 人机悔棋按完整回合撤销；AI 思考中悔棋只撤销玩家刚走的一步。
- 响应式棋盘，兼容桌面端与移动端。

## 技术栈

- React 19
- TypeScript 6
- Vite 8
- Vitest
- GitHub Actions / GitHub Pages

## 本地运行

环境要求：Node.js 20.19+ 或 Node.js 22.12+。

```bash
npm install
npm run dev
```

测试、检查并构建：

```bash
npm test
npm run lint
npm run build
```

## 发布

项目已配置 GitHub Pages 工作流。推送到 `main` 分支后，在仓库 `Settings > Pages` 中将 `Source` 设为 `GitHub Actions`，即可自动发布至：

`https://ljy-codes.github.io/chinese-chess/`
