# 高阶人机版升级计划

本计划采用增量实施。每个阶段必须先通过 `npm test`、`npm run lint` 和 `npm run build`，再进入下一阶段。

## 阶段状态

| 阶段 | 状态 | 范围 |
| --- | --- | --- |
| 1. 基线和架构整理 | 已完成 | 基线记录、文档、拆分 App 职责、规则回归测试 |
| 2. 游戏模式和状态模型 | 已完成 | 模式、玩家阵营、难度、游戏与局面版本标识 |
| 3. 基础 AI | 已完成 | 评估、合法着法枚举、Negamax、Alpha-Beta、难度测试 |
| 4. Worker 和高级搜索 | 进行中 | Worker、取消、迭代加深和统计已完成；置换表等待完善 |
| 5. 声音和动画 | 未开始 | AudioManager、音频降级、动画与 reduced motion |
| 6. 棋谱和存储 | 未开始 | 标准记谱、回放、导入导出、存档、人机悔棋 |
| 7. 质量收尾 | 未开始 | 移动端、完整测试、README、Pages 产物验证 |

当前产品决策：仅保留人机对弈，不再提供双人模式选择。`GameSettings` 已移除模式字段，默认始终启动人机局。

## 1. 游戏状态重构

- 阶段一将现有棋局状态和操作从 `App.tsx` 迁入 `useChessGame`。
- 拆分棋盘、棋子、状态和控制组件，React 组件不包含规则判断。
- 缓存游戏状态、合法走法和棋盘位置索引，减少重复计算。
- 阶段二建立统一 `GameState`、历史快照、`gameId`、`positionVersion` 和请求版本模型。
- 保持 `src/game/chess.ts` 的已有导出行为，后续再按规则边界渐进迁移。

## 2. 人机 AI

- 复用现有 `getLegalMoves`、`isLegalMove` 和 `makeMove` 枚举所有 AI 候选着法。
- 实现局面评估、Negamax、Alpha-Beta 和可注入时钟/随机源。
- 增加吃子、将军、Killer Move 与 History Heuristic 排序。
- 实现迭代加深、Principal Variation、节点和深度统计。
- 不让 AI 模块依赖 React 或浏览器 DOM。

## 3. Web Worker

- 使用 Vite `new URL(..., import.meta.url)` 创建模块 Worker。
- 请求和结果携带 `requestId`、`gameId`、`positionVersion`。
- 重开、切换模式或难度、悔棋和卸载时终止并重建 Worker。
- 主线程验证全部版本字段，丢弃过期响应。
- Worker 异常转为可恢复 UI，不影响双人模式。

## 4. 难度系统

- 定义 `beginner`、`easy`、`normal`、`hard`、`master` 集中配置。
- 难度真实控制深度、时间、随机候选范围和搜索优化。
- 低难度从已评分的前若干候选中随机选择，不进行纯随机走棋。
- 测试允许注入固定随机种子以保证可复现。

## 5. 音频系统

- 建立单例式 AudioManager 和 React hook，统一音量、音效及语音开关。
- 使用 `import.meta.env.BASE_URL` 生成 Pages 兼容路径。
- 本地音频优先，加载失败时用 Web Audio 提示音和 `speechSynthesis` 普通话降级。
- 控制重复播放频率，浏览器自动播放失败不得影响棋局。

## 6. 动画系统

- 使用 CSS `transform` 和 `opacity` 实现 250ms 内的落子、吃子和悔棋反馈。
- 增加合法点呼吸、上一手高亮、将军提示、AI 思考动画和结算弹层。
- 设置中可关闭动画，并完整支持 `prefers-reduced-motion`。
- 动画只表现状态，不能成为规则或落子时序来源。

## 7. 棋谱与本地存储

- 扩展标准化 Move 元数据，生成平、进、退记谱和红黑数字体系。
- 按回合展示红黑着法，支持历史局面查看和回到最新局面。
- 定义带格式版本的 JSON 导入导出，并逐层校验结构和合法走法。
- 使用带版本号的持久化数据保存设置、未完成棋局和有限数量历史棋局。
- 解析或写入失败时安全降级，不影响继续游戏。

## 8. UI 和移动端优化

- 保留当前深色中国传统视觉和木质棋盘。
- 桌面端形成状态、棋盘、模式/棋谱/设置三栏布局。
- 移动端保持棋盘优先，次要面板使用可折叠区域。
- 普通用户隐藏搜索细节，开发者模式显示深度、节点、分数、耗时和主变化。
- 所有确认弹层和 Worker 错误具备键盘与触屏可操作性。

## 9. 测试与文档

- 规则测试逐步拆为规则、状态、记谱和历史模块。
- AI 测试使用小局面、注入时钟和固定随机源，避免真实秒级等待。
- 状态测试覆盖玩家阵营、AI 首步、双步悔棋和过期 Worker 响应。
- 存储测试覆盖损坏 JSON、字段缺失和版本不匹配。
- 每阶段更新本文件；最终更新 README 的功能、架构、运行和资源说明。

## 阶段一验收记录

完成日期：2026-07-12

### 新增和修改文件

- 新增 `docs/current-architecture.md`：记录升级前状态、规则、测试、部署和问题。
- 新增 `docs/upgrade-plan.md`：维护九类工作和七个实施阶段。
- 新增 `src/app/App.tsx`：只负责页面组合。
- 新增 `src/hooks/useChessGame.ts`：集中现有双人棋局状态、派生数据和操作。
- 新增 `src/components/ChessBoard.tsx` 和 `ChessPiece.tsx`：棋盘及棋子展示。
- 新增 `src/components/PlayerStatus.tsx`、`GameStatusPanel.tsx`、`GameControls.tsx` 和 `MoveHistory.tsx`：拆分状态和控制视图。
- 修改 `src/game/types.ts`：提升 `HistoryEntry` 为共享核心类型。
- 修改 `src/game/chess.test.ts`：增加塞象眼、送将过滤和困毙回归测试。
- 修改 `src/main.tsx`：入口指向新的 app 目录。
- 删除原单体 `src/App.tsx`，内容按上述职责迁移，未改变规则实现和 UI 样式。

### 关键设计

- `src/game/chess.ts` 的函数和公开行为保持不变，规则仍是无 React 依赖的纯函数。
- `useChessGame` 是当前唯一棋局状态入口，为阶段二统一状态模型提供迁移边界。
- `getGameStatus`、选中棋子、合法走法、合法点集合和棋盘索引均按依赖缓存。
- 棋盘使用位置 `Map` 取代每个坐标对 `Piece[]` 的重复线性查找。
- 静态 90 点和棋盘线在模块加载时生成，不在每次渲染重新创建。
- 本阶段不引入模式、AI、Worker、存储、音频或新 UI，避免扩大阶段范围。

### 验证结果

基线验证：

```text
npm install     成功，0 vulnerabilities
npm test        成功，6/6 tests passed
npm run lint    成功
npm run build   成功
```

阶段一验证：

```text
npm test        成功，9/9 tests passed
npm run lint    成功
npm run build   成功，Vite 生产资源基路径保持 /chinese-chess/
```

阶段一完成后进入“游戏模式和状态模型”，范围限定为双人/人机模式、玩家阵营、五档难度配置以及 `gameId`、`positionVersion`、`requestId` 生命周期，不包含搜索算法。

## 阶段二验收记录

完成日期：2026-07-12

### 新增和修改文件

- 新增 `src/game/game-state.ts`：默认设置、新棋局创建、随机阵营、玩家回合和请求身份校验。
- 新增 `src/game/game-state.test.ts`：覆盖双人开局、玩家执黑、随机阵营和过期请求拒绝。
- 新增 `src/game/ai/config.ts`：集中定义五档难度的深度、时间、候选范围和优化开关。
- 新增 `src/game/ai/config.test.ts`：验证难度真实改变搜索参数。
- 新增 `src/components/SettingsPanel.tsx`：模式、玩家阵营和难度可见设置面板。
- 修改 `src/game/types.ts`：新增 `GameMode`、`PlayerSidePreference`、`AiDifficulty`、`GameSettings` 和 `GameState`。
- 修改 `src/hooks/useChessGame.ts`：统一使用 `GameState`，维护局面身份和人机回合权限。
- 修改 `src/app/App.tsx`：接入设置面板、红黑控制者和 AI 回合状态。
- 修改 `src/components/ChessBoard.tsx`、`PlayerStatus.tsx` 和 `GameStatusPanel.tsx`：支持 AI 控制者及棋盘锁定。
- 修改 `src/styles.css`：增加桌面右侧设置面板、AI 回合遮罩及移动端设置布局。

### 关键设计

- 任何模式、阵营或难度变更都会创建新棋局，更换 `gameId` 和 `requestId`，防止旧上下文继续生效。
- 每次有效落子或悔棋递增 `positionVersion` 并更换 `requestId`，为 Worker 结果过滤提供完整身份链。
- 随机执棋只在开局解析一次并存入 `humanSide`，不会在渲染时重复随机。
- 人机模式只允许玩家操作 `humanSide`；轮到 AI 时锁定棋盘。
- 玩家执黑时初始红方回合被识别为 AI 回合，为后续自动首步提供触发条件。
- 五档配置已真实区分深度、时间、低难度候选范围和搜索优化开关；搜索算法在阶段三消费这些配置。
- 本阶段没有用随机走子冒充 AI。UI 明确提示引擎将在下一阶段接入。

### 验证结果

```text
npm test        成功，3 files、14/14 tests passed
npm run lint    成功
npm run build   成功，27 modules transformed
```

下一阶段是“基础 AI”。阶段三将实现合法着法枚举、局面评估、Negamax、Alpha-Beta、搜索超时和难度候选选择，并使用小局面测试正确性；Web Worker 和高级搜索优化仍留到阶段四。

## 人机响应修复与阶段三验收记录

完成日期：2026-07-12

### 根因

阶段二上线版本只有 AI 回合识别和棋盘锁定，没有搜索实现、Worker 或自动落子触发。所谓“机器几分钟才动”实际是机器永远不会落子，并非搜索本身过慢。

### 新增和修改文件

- 新增 `src/game/ai/types.ts`：定义带三重身份字段的搜索请求、结果和错误消息。
- 新增 `src/game/ai/evaluation.ts`：集中棋子价值、位置、活动度、过河兵和将军评估。
- 新增 `src/game/ai/search.ts`：合法着法枚举、Negamax、Alpha-Beta、迭代加深、吃子/将军排序、固定种子候选选择和超时返回。
- 新增 `src/game/ai/search.test.ts`：覆盖合法着法、无着返回空、吃高价值子、固定种子和注入时钟超时。
- 新增 `src/workers/chess-ai.worker.ts`：在独立 Worker 中执行搜索并转换可恢复错误。
- 新增 `src/hooks/useChessAi.ts`：管理 Worker 生命周期、主线程看门狗、卸载终止和响应身份校验。
- 修改 `src/hooks/useChessGame.ts`：自动触发 AI，二次验证返回着法并应用到当前局面。
- 修改 `src/components/SettingsPanel.tsx` 和 `src/styles.css`：显示思考上限、动态状态、错误重试和轻量动画。
- 修改 `src/game/ai/config.ts`：将五档硬上限收紧为 100ms、250ms、600ms、1200ms 和 2000ms。
- 修改 `README.md`：补充本地 Worker AI 运行说明。

### 响应与安全设计

- 所有 AI 候选均通过现有 `getLegalMoves` 和 `makeMove` 生成。
- Worker 返回后主线程再次调用 `isLegalMove`，禁止应用非法着法。
- 响应必须同时匹配 `gameId`、`positionVersion` 和 `requestId`。
- 重开、悔棋、切换设置或组件卸载会终止旧 Worker。
- 搜索内部按时钟停止，主线程另设 `timeLimitMs + 750ms` 看门狗强制终止失控 Worker。
- 超时时使用最近完成的迭代；即使深度一未完成，也有排序后的合法保底着法。
- 叶节点不再重复枚举双方完整合法着法，AI 测试耗时由约 1.7 秒降至约 0.25 秒。
- Vite 生产构建已生成独立哈希 Worker 资源，不使用硬编码根路径，兼容 `/chinese-chess/`。

### 验证结果

```text
npm test        成功，4 files、19/19 tests passed
npm run lint    成功
npm run build   成功，生成独立 chess-ai.worker-*.js
```

阶段四仍需完善置换表、Zobrist Hash、Killer Move、History Heuristic 和更完整的 Principal Variation 排序；这些不影响本次“机器必须快速合法落子”的修复。

## 游戏技能重构记录

完成日期：2026-07-12

- 依据 chess-engine 技能，将权威落子、AI 响应应用和悔棋迁入纯函数 `src/game/game-engine.ts`，React Hook 只负责编排 UI 与 Worker。
- 依据 minimax-alpha-beta 技能，深度边界显式识别将帅被吃和将死，保留 `MATE_SCORE - ply`，并用上一轮主变化优先排序根节点。
- 依据 ai-agent 技能，AI 仍只能从现有合法着法生成器选择动作，主线程应用前再次验证，超时保留合法保底着法。
- 依据 testing-game 技能，新增人机状态转换测试：AI 思考中撤一步、AI 回复后撤两步、玩家执黑时不能撤销 AI 开局首步、过期 AI 响应丢弃。
- 人机模式成为唯一产品模式，删除模式字段和双人入口，只保留执棋方与难度。

验证结果：

```text
npm test        成功，5 files、24/24 tests passed
npm run lint    成功
npm run build   成功，生成独立 chess-ai.worker-*.js
```
