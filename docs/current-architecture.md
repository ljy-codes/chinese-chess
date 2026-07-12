# 当前架构说明

记录日期：2026-07-12

## 当前目录结构

```text
.
├── .github/workflows/deploy.yml  GitHub Pages 持续部署
├── src/
│   ├── App.tsx                   页面、棋局状态和交互入口
│   ├── game/
│   │   ├── chess.ts              初始局面、规则、走法、胜负和简易记谱
│   │   ├── chess.test.ts         规则单元测试
│   │   └── types.ts              棋子、坐标、走法和状态类型
│   ├── main.tsx                  React 入口
│   ├── styles.css                全部页面样式
│   └── vite-env.d.ts             Vite 类型声明
├── index.html
├── package.json
├── vite.config.ts
└── vitest.config.ts
```

## 棋局状态存储方式

`App.tsx` 使用四组 React 本地状态保存棋局：

- `pieces`：当前所有棋子及坐标。
- `turn`：当前行棋方。
- `selectedId`：当前选中棋子。
- `history`：每一步之前的棋子数组、行棋方和标准化 `Move`。

当前状态只存在内存中，刷新页面即丢失；没有游戏标识、局面版本、模式、设置或持久化版本。

## 走法判断方式

核心规则位于 `src/game/chess.ts`，保持纯函数：

- `isPseudoLegal` 按棋子种类处理直线阻挡、炮架、蹩马腿、塞象眼、九宫和过河兵卒。
- `isLegalMove` 在伪合法基础上应用走法，并使用 `isInCheck` 排除送将着法。
- `getLegalMoves` 遍历 10 x 9 全棋盘，返回指定棋子的全部合法目标点。
- `makeMove` 生成新棋子数组和标准化 `Move`，不直接修改输入数组。

规则实现以 `Piece[]` 为局面结构，多处通过线性 `find` 和 `filter` 查询棋子，适合当前规模，但 AI 搜索阶段需要关注热点性能。

## 胜负判断方式

`getGameStatus` 首先检查当前行棋方将帅是否存在，再枚举当前方所有合法着法：

- 有合法着法且被攻击：`check`。
- 有合法着法且未被攻击：`playing`。
- 无合法着法且被攻击：`checkmate`，对方获胜。
- 无合法着法且未被攻击：`stalemate`，对方困毙获胜。

## 悔棋实现方式

每次落子前把 `{ pieces, turn, move }` 追加到 `history`。悔棋时恢复最后一个快照并删除最后一项，因此双人模式每次撤销一步。快照中的棋子由不可变更新产生，没有共享可变棋盘数据。

## UI 结构

当前 `App.tsx` 同时承担状态、交互和全部视图：

- 顶部题头。
- 左右执棋方标识。
- 中央棋盘线、90 个坐标按钮和棋子。
- 底部状态、悔棋、重新开局和上一手。

棋盘具有桌面与移动端 CSS 断点。渲染每个坐标时均通过 `Array.find` 查棋子，并通过 `Array.some` 查合法点和上一手。

## 测试覆盖情况

基线共有一个测试文件、6 项测试，覆盖：

- 标准 32 子初始局面和初始状态。
- 蹩马腿。
- 炮架吃子。
- 兵卒过河前后横走限制。
- 将帅照面及不能暴露将帅。
- 一个将死局面。

尚缺塞象眼、普通送将过滤、困毙、记谱、历史状态、人机模式、AI、Worker、存储和导入校验等测试。

## 部署方式

Vite 生产资源基路径为 `/chinese-chess/`。`.github/workflows/deploy.yml` 在 `main` 推送时执行 `npm ci`、测试和生产构建，然后通过 GitHub 官方 Pages Actions 上传并部署 `dist`。当前线上地址为 `https://ljy-codes.github.io/chinese-chess/`。

## 当前明显架构问题

- `App.tsx` 混合状态、业务操作、派生计算和渲染，后续 AI 异步状态难以安全接入。
- 棋盘渲染进行 90 次棋子线性查询及多次合法点查询，存在无意义重复计算。
- `getGameStatus` 和选中棋子的合法走法在每次 React 渲染重新计算。
- `chess.ts` 同时包含初始化、规则、状态和记谱，职责较多；需在后续阶段按稳定边界逐步拆分。
- 历史快照类型只在组件内定义，不能被测试、存储和 AI 模式复用。
- 没有明确游戏状态模型、模式、阵营、难度、`gameId`、`positionVersion` 或 `requestId`。
- 没有错误边界、Worker 恢复路径、持久化、音频服务或资源降级策略。
- 简易记谱仅显示棋子、起始列和箭头，不是中国象棋标准记谱。
- 全部样式在单文件中；当前规模尚可，后续 UI 增长时需按职责拆分。
