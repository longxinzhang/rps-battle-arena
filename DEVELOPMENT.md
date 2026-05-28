# World of RPS 开发规范

这份文档用于让项目从单文件快速原型，逐步变成可维护、可移植、可二次开发的小游戏项目。当前阶段的重点是稳定现有玩法，不做框架迁移，先把职责边界拆清楚。

## 目标

- 保持现有玩法体验稳定，重构期间不改变默认游戏行为。
- 使用浏览器原生能力优先，避免在没有明确收益前引入构建工具。
- 让新增玩法可以作为独立模块接入，不再继续堆进一个大文件。
- 桌面、iPhone、iPad、安卓浏览器都必须作为同等级目标。
- 部署包应保持静态资源形态，能直接用任意静态服务托管。

## 当前结构状态

`0.1.0` 已完成 Web 版第一轮模块化重构。当前没有超过 500 行的 Web JS 文件，入口文件只负责装配模块；CSS 已按界面区域拆分。

| 文件 | 当前行数 | 职责 | 建议上限 |
| --- | ---: | --- | ---: |
| `js/game.js` | 406 | 初始化、模块装配、启动应用 | 500 |
| `js/ui/setup-controller.js` | 341 | 开场设置状态、主题、赔率、设置同步 | 350 |
| `js/core/round-flow.js` | 294 | 开局、倒计时、单局重置、结算流转 | 350 |
| `js/render/canvas.js` | 280 | Canvas 绘制调度和非实体层绘制 | 300 |
| `js/core/combat.js` | 279 | 单位移动、碰撞、转化、悬赏奖励 | 300 |

`index.html` 当前可以暂时保留；当 UI 模板继续膨胀时再拆成组件或局部模板。

## 代码组织原则

- 每个文件只负责一个清晰主题，例如音频、碰撞、某个玩法、某类 UI。
- 可选玩法必须是独立模块，至少包含 `reset`、`update`、可选 `draw`、可选 `onCollision`。
- 游戏核心循环不直接写具体玩法细节，只调度模块。
- 所有常量集中管理，禁止在玩法代码中散落魔法数字。
- Canvas 绘制和 DOM UI 更新分开，避免渲染层直接修改游戏规则。
- 音频只允许通过音频模块播放，玩法模块不直接 `new Audio()`。
- 随机事件必须有可解释的触发条件、冷却时间和一局内触发上限。
- 移动端改动必须检查竖屏、横屏、iPad Safari，尤其是底部按钮和 emoji 绘制。

## 推荐目录结构

第一阶段使用原生 ES Modules，不引入打包器：

```text
World of RPS
├── index.html
├── css/
│   ├── base.css
│   ├── hud.css
│   ├── setup.css
│   ├── overlays.css
│   ├── dock.css
│   └── responsive.css
├── js/
│   ├── game.js
│   ├── config/
│   │   ├── constants.js
│   │   └── themes.js
│   ├── core/
│   │   ├── state.js
│   │   ├── loop.js
│   │   ├── arena.js
│   │   ├── entities.js
│   │   ├── movement.js
│   │   ├── collisions.js
│   │   └── scoring.js
│   ├── features/
│   │   ├── bounty.js
│   │   ├── black-hole.js
│   │   ├── god-hand.js
│   │   ├── last-stand.js
│   │   ├── powerups.js
│   │   ├── shrink.js
│   │   ├── ten-fight.js
│   │   ├── thanos.js
│   │   ├── traitor.js
│   │   └── zones.js
│   ├── render/
│   │   ├── canvas.js
│   │   ├── background.js
│   │   ├── entities.js
│   │   ├── effects.js
│   │   └── overlays.js
│   ├── ui/
│   │   ├── dom.js
│   │   ├── setup.js
│   │   ├── hud.js
│   │   ├── betting.js
│   │   ├── settings.js
│   │   └── screens.js
│   ├── services/
│   │   └── audio.js
│   └── utils/
│       ├── math.js
│       └── random.js
├── assets/
├── legacy/
└── README.md
```

## 平台移植规范

- 平台工程放在独立目录，避免改动 Web 主入口时破坏线上静态部署。
- `harmony-next/` 只负责 HarmonyOS NEXT 工程壳、资源声明、ArkTS 入口和打包说明。
- HarmonyOS 内置网页资源放在 `entry/src/main/resources/rawfile/world-rps/`，通过同步脚本从主项目复制，禁止手动长期分叉维护。
- 平台适配层只做加载、窗口、生命周期、权限和原生能力桥接；游戏规则仍由主项目模块负责。
- 每次 Web 玩法变更后都要运行 `node harmony-next/scripts/sync-web-assets.mjs`，再用 DevEco Studio 编译验证。

## 模块职责和行数预算

| 模块 | 职责 | 目标行数 |
| --- | --- | ---: |
| `js/game.js` | 初始化、绑定模块、启动应用 | 300-500 |
| `config/constants.js` | 尺寸、概率、时间、速度等常量 | 80-160 |
| `config/themes.js` | RPS、颜色球、国家队、品牌战配置 | 80-180 |
| `core/state.js` | 创建初始状态、重置局/赛制状态 | 160-260 |
| `core/loop.js` | `requestAnimationFrame`、暂停、更新顺序 | 120-220 |
| `core/arena.js` | 场地边界、缩圈边界、障碍碰撞边界 | 180-320 |
| `core/entities.js` | 单位创建、计数、查找、分裂、半径 | 180-320 |
| `core/movement.js` | 追逐、逃跑、速度上限、场地反弹 | 180-300 |
| `core/collisions.js` | 单位碰撞、克制、转化、击杀入口 | 180-300 |
| `core/scoring.js` | 计时结算、死斗、胜场、竞猜积分 | 180-300 |
| `features/*.js` | 每个可选玩法单独维护状态和规则 | 120-280 |
| `render/*.js` | Canvas 绘制，禁止改状态规则 | 120-280 |
| `ui/*.js` | DOM 查询、设置面板、HUD、弹层 | 120-300 |
| `services/audio.js` | BGM、音效池、音量、静音 | 120-220 |
| `utils/*.js` | 纯函数工具 | 50-160 |
| `css/*.css` | 按 UI 区域拆分样式 | 120-350 |

硬性规则：新文件超过 500 行必须拆；函数超过 80 行必须拆；新增玩法文件超过 300 行必须说明原因。

## 可选玩法接入标准

新增玩法不要直接改散落逻辑，应按以下接口接入：

```js
export function resetFeature(state, now) {}
export function updateFeature(context, now, dt) {}
export function drawFeature(context, now) {}
export function onCollision(context, a, b, collision) {
  return false;
}
```

`context` 建议包含：

```js
{
  state,
  constants,
  audio,
  rng,
  emitBurst,
  addEvent,
  countEntities,
  aliveFactionMembers,
}
```

模块只能读写自己声明的状态区域，例如：

```js
state.features.traitor = {
  nextAt: 0,
  pending: [],
};
```

不要让多个玩法写同一个临时字段；需要跨玩法影响时，放到核心规则层统一仲裁。

## 游戏循环顺序

推荐固定为：

1. 更新时间型事件：缩圈、灭霸预警、叛徒倒计时、道具刷新。
2. 更新场上力：上帝之手、黑洞吸引、据点吸引、悬赏追击。
3. 更新单位移动。
4. 处理道具拾取。
5. 处理单位碰撞，由 `core/collisions.js` 统一询问玩法模块。
6. 清理死亡单位。
7. 更新结算条件。
8. 绘制场景、单位、特效、DOM HUD。

这样能避免某个玩法在碰撞前后重复结算，减少死局和竞态。

## CSS 规范

- `base.css`：变量、重置、全局字体、根容器。
- `hud.css`：顶部比分、时间、通知。
- `dock.css`：底部暂停、设置、上帝之手按钮。
- `setup.css`：首页设置面板、折叠区、输入控件。
- `overlays.css`：开场倒计时、结算、灭霸、我要打十个等弹层。
- `responsive.css`：所有断点和移动端修正集中放这里。

禁止把新的移动端修复散落到多个 CSS 文件。移动端断点优先使用 `max-width: 860px` 和 `max-width: 560px` 两档。

## 命名规范

- 文件名用 kebab-case：`ten-fight.js`、`black-hole.js`。
- 变量和函数用 camelCase：`updateTenFight`。
- 常量用 UPPER_SNAKE_CASE：`TEN_FIGHT_DURATION`。
- DOM id 保持 kebab-case：`ten-fight-screen`。
- CSS class 保持 kebab-case：`.ten-fight-bar`。
- 用户可见中文文案集中在 UI 或玩法模块顶部，避免散落在循环里。

## 状态规范

- `state.options` 只保存开关。
- `state.settings` 只保存音量、通知等设置。
- `state.features.<name>` 保存玩法状态。
- `state.entities` 的单个实体字段必须有明确生命周期。
- 临时视觉状态优先放实体字段，例如 `flash`、`scale`；长期玩法状态放玩法模块。

新增实体字段前必须回答：

- 谁写入？
- 谁读取？
- 什么时候重置？
- 是否会影响存档/回放/复盘？

## 验证规范

每次改动至少执行：

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
```

本项目保持原生 ES Modules，不需要构建工具。需要本地预览时启动静态服务：

```bash
python3 -m http.server 5173
```

涉及 UI 或 Canvas 的改动必须人工或浏览器自动化检查：

- 桌面 1280x720。
- 手机竖屏宽度约 390。
- iPad 横屏或接近 1024x768。
- 开始前设置页、倒计时、游戏中、暂停、结算页。

涉及 iOS emoji 的改动必须实际看截图，不能只靠 DOM。

## 重构顺序建议

### 第 1 步：无行为变化抽离

- 抽出 `config/constants.js`。
- 抽出 `config/themes.js`。
- 抽出 `utils/math.js` 和 `utils/random.js`。
- 抽出 `services/audio.js`。

这一步风险最低，目标是让 `game.js` 先减少 500-800 行。

### 第 2 步：拆 UI

- 抽出 DOM 查询到 `ui/dom.js`。
- 抽出首页设置、HUD、竞猜、结算、设置面板。
- 保持所有按钮行为不变。

这一步完成后，`game.js` 不应直接到处 `document.getElementById()`。

### 第 3 步：拆玩法

优先拆最独立的玩法：

- `features/thanos.js`
- `features/black-hole.js`
- `features/powerups.js`
- `features/traitor.js`
- `features/ten-fight.js`
- `features/last-stand.js`

每拆一个玩法，都要保证默认关闭时完全不影响基础模式。

### 第 4 步：拆核心和渲染

- 拆 `core/entities.js`、`core/movement.js`、`core/collisions.js`。
- 拆 `render/entities.js`、`render/effects.js`、`render/overlays.js`。
- 最后让 `game.js` 只做装配。

当前已落地：核心循环、结算、单位查询、粒子、移动碰撞、主要事件、实体绘制、输入绑定已拆成独立模块。后续新增玩法应优先新增 `features/*.js`，不要继续扩大 `js/game.js`。

### 第 5 步：拆 CSS

CSS 拆分可以最后做，因为它容易影响视觉细节。拆完后 `index.html` 直接引入多个 CSS 文件即可，仍然不需要构建工具。

## 变更准入清单

提交或部署前检查：

- 新玩法默认关闭。
- 开场页有简短说明。
- 不破坏基础 RPS 模式。
- 暂停、回首页、设置、音量仍可用。
- 手机底部按钮不被遮挡。
- 重要事件通知不超过 2 行。
- `README.md` 或本文件已同步更新。
- 部署后公网资源和本地资源 hash 一致。
