# Product Requirements Document (PRD)

## 1. Master Plan (总体规划)
我们正在开发一款支持四条街（Pre-flop, Flop, Turn, River）的德州扑克（Texas Hold'em）在线多人游戏。目前主要支持熟人之间的建房对局。
我们的目标是提供一个拥有极致动态UI设计、流程完整、实时互动的德扑体验。不仅可以用来娱乐，还可以用于学习和复盘。未来我们将加入更多高级功能和模式。

## 2. Core Function (核心功能)
游戏核心逻辑围绕真实的德州扑克规则展开：
- **实时同步 (Real-time Sync)**：房主与玩家在独立的浏览器窗口内通过 WebSocket 进行毫秒级别的状态同步。
- **座位机制 (Seating)**：支持玩家加入房间，申请坐下并带入筹码，房主负责审批。
- **四条街对局阶段 (Four Streets Phases)**：
  - **Pre-flop (翻前)**：每人发2张底牌，基于大盲（BB）和小盲（SB）强制下注，进行第一轮下注。
  - **Flop (翻牌)**：发出3张公共牌，进行第二轮下注。
  - **Turn (转牌)**：发出第4张公共牌，进行第三轮下注。
  - **River (河牌)**：发出第5张公共牌，进行最后一轮下注。
  - **Showdown (摊牌)**：所有玩家比牌，结算筹码（支持玩家提前 Fold 导致一人独赢的提前结算）。
- **行动控制 (Action Control)**：玩家可进行 Fold、Call (Check)、Raise 等合法操作。
- **房主控制 (Host Controls)**：房主可开始游戏、踢人、审查入座以及在必要时强制重置当前手牌以解决卡死问题。

## 3. UI Design (视觉设计)
提取自 `UI Design System.md`，重点包括：
- 极其丰富的深色主题（Dark Mode），玻璃拟态（Glassmorphism）和多层阴影堆叠制造的空间感。
- 主体为椭圆形的扑克桌台（Table），使用渐变和不同深浅的蓝色/深灰色。
- 全局使用 Inter 等现代无衬线字体。
- 强调微动效：例如轮到玩家操作时的筹码脉冲动画（Pulse）、呼吸灯效果、操作面板滑入。
- 筹码抛掷、发牌等过程需要保持视觉上的一致性和流畅感。

## 4. Implementation Plan (执行方案)
总结自 `Structure.md`：
- **前端架构**：React + Vite 构建单页应用，TailwindCSS 负责样式组织。
- **单向数据流**：所有状态和通信由顶层 `App.tsx` 统筹并向下传递 Props。所有交互由底层向上调用 Callback 触发。
- **UI切分**：分为 `LoginView`（登录），`HostControls`（房主面版），`GameTable`（桌面），`PlayerSeat`（玩家座位），`PlayerActions`（操作面板）。
- **后端架构**：Node.js Express + `ws` 提供 WebSocket 实时通讯。负责维护全局状态，扑克演算交给 `pokersolver`。
- **扩展性**：支持 `?mock=true` 用于无后端状态下的 UI 直接预览与调试。
