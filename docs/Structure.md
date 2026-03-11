# 项目技术架构 (Structure)

本文档是该德州扑克 (Texas Hold'em - Preflop) 项目的技术架构和组件设计说明。

## 1. 整体设计 (Overall Architecture)
当前项目建立在 React (前端单页应用) 和 Vite (构建工具) 的基础之上，主要通过 WebSocket 和后端服务端进行实时双向通信，以支持多用户的实时游戏状态同步。

整体采用了 **“单向数据流 (One-way Data Flow) + 中心状态管理”** 的设计模式。所有的 WebSocket 通信和核心的游戏引擎状态（如玩家列表、荷官按钮位置、倒计时、底池大小等）都在最顶层的 `App.tsx` 中被集中维护。底层（各个 `View` 和 `Component`）作为纯显示组件 (Dumb Components)，通过 Props 接收数据并在用户发生按键交互时，调用传入的回调函数 (如 `takeAction` 和 `sitDown`)向上触发事件。

### 架构图 (Architecture Diagram)

```mermaid
graph TD;
    subgraph Frontend Client
        App[App.tsx (State & WebSocket Hub)]
        App ---|Props & Callbacks| Login[LoginView.tsx]
        App ---|Props & Callbacks| Host[HostControls.tsx]
        App ---|Props & Callbacks| Table[GameTable.tsx]
        
        Table ---|Props| Seat[PlayerSeat.tsx (Multiple)]
        Table ---|Props & Callbacks| Actions[PlayerActions.tsx]
    end

    subgraph Backend Server
        WS((WebSocket Server))
    end
    
    App <-->|JSON Messages| WS
```

## 2. 目录结构与文件说明 (Directory & File Roles)

主要业务逻辑代码都集中在 `/src` 目录下，下表描述了其中每个重要文件或文件夹的角色：

- **`src/types.ts`**:
  存放全项目通用的 TypeScript 接口 (`interface`) 和类型声明。包含了 `Player`、`GameState`、`GamePhase` 等各种模型约束，是被多个组件引用的根基字典。

- **`src/App.tsx`**:
  项目的**控制中枢**和**顶层容器**。
  - **职责 1**: 建立并维护 `WebSocket` 连接，监听来自服务端的 `state_update` 消息。
  - **职责 2**: 存储局内所有的活跃数据（`role`, `players`, `gameState` 等 React 状态变量）。
  - **职责 3**: 定义并下发用于操作服务端的函数方法 (如 `joinAsHost`, `approvePlayer`, `takeAction` 等)。
  - **职责 4**: 根据用户的身份 (`role`) 挂载对应的子视图和组件。它内置了一个用于本地 UI 调试的 `?mock=true` 后门解析器。

### `src/components/` 目录：细分视图层

负责分离 `App.tsx` 的庞大 UI，以下均为仅负责接收 props 返回 HTML 的可视层组件：

- **`LoginView.tsx`**:
  进入游戏的第一屏。负责处理用户未选择身份前（`role = null`）时的渲染逻辑，包括提供输入名字框以及“作为房主创建”或“作为玩家加入”的入口按钮。

- **`HostControls.tsx`**:
  顶部的管理面版，**仅对房主（Host）可见**。负责拉取 `waitingPlayers` 列表进行入座审核，踢出违规玩家，以及控制游戏节奏的发牌、开启下局，和“强制结束”手牌 (`Force End Hand`) 按钮的防误触确认。

- **`GameTable.tsx`**:
  主要的桌面游戏区域容器。渲染扑克桌的多层椭圆背景、中央筹码底池 (`Pot`) 和翻开的 5 张公共牌 (`Community Cards`)。接收由 `App.tsx` 动态计算好的内部嵌合体（如玩家座位 `PlayerSeat` 和操作栏 `PlayerActions`）作为 `children` 在其相对布局内展现。

- **`PlayerSeat.tsx`**:
  用于渲染桌面坐标上单个玩家状态的可复用组件。处理复杂的相对方位坐标系 (`cx`, `cy`)、三角函数椭圆布局和视觉状态（比如手牌的内外投影渲染、庄家按钮 `D` 的相对定位，弃牌变灰状态以及 `isHero` 的屏幕底部 Y 轴微调）。

- **`PlayerActions.tsx`**:
  牌桌视图右下角的操作控制枢纽 (HUD 面板)。当轮到此玩家行动阶段时，会显示跟注 (`CALL`/`CHECK`)、弃牌 (`FOLD`) 以及可供自定义拉动和直接使用 50/75/100% 快捷键的加注 (`RAISE`) 模块。

## 3. 核心机制与扩展 (Core Mechanisms)

### 开发调试技巧 (Mock Mode)
在 `App.tsx` 的启动 `useEffect` 挂载中内置了热加载 UI 调试接口。只需通过浏览器访问 `http://localhost:3000/?mock=true` 就会立即挂载一套虚拟满员、已发牌的 `GameState` 状态，跳过冗长的房主审核联机流程，大幅加快修改 React 组件的所见即所得调试效率。
