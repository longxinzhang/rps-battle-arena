# World of RPS Native

`harmony_native` 是 World of RPS 的原生鸿蒙 NEXT 版本。它不使用 ArkWeb/WebView，主循环、碰撞、机制和界面都运行在 ArkTS + ArkUI Canvas 中。

## 目录职责

- `entry/src/main/ets/pages/Index.ets`：页面状态、设置界面、HUD、Canvas 渲染入口。
- `entry/src/main/ets/components`：可复用 ArkUI 组件，目前包含「我要打十个」倒计时条。
- `entry/src/main/ets/model/GameEngine.ets`：游戏模拟、碰撞、缩圈、黑洞、叛徒、响指等机制。
- `entry/src/main/ets/model/GameTypes.ets`：游戏数据结构、阵营常量、默认配置。
- `entry/src/main/ets/model/Presets.ets`：经典战役预设。
- `entry/src/main/ets/model/TenAgainstOneSystem.ets`：「我要打十个」触发、反杀、结算逻辑。
- `entry/src/main/ets/model/GameRules.ets`：阵营计数、存活阵营、领先方等纯规则函数。
- `entry/src/main/ets/model/OptionSummary.ets`：开局配置摘要文案。
- `entry/src/main/ets/render/CanvasRenderer.ets`：Canvas 绘制，包含实体、障碍、黑洞、叛徒标记、暴走残影。
- `entry/src/main/ets/services/AudioService.ets`：BGM、音效加载与播放。
- `entry/src/main/resources/base/media`：原生图片资源。
- `entry/src/main/resources/rawfile/audio`：音频资源。

## 模块约束

- 页面和引擎文件继续控制在 1000 行以内；新增玩法优先拆到 `model/*System.ets` 或 `components`。
- 纯规则函数不写进页面，放在 `GameRules.ets` / 独立系统文件里，方便后续复用和测试。
- 不提交本机签名材料，`build-profile.json5` 的 `signingConfigs` 保持空配置。

## 构建

```bash
./scripts/build-app.sh --stacktrace
```

当前工程不提交本机签名材料。需要安装到真机时，在 DevEco Studio 中打开 `harmony_native`，为该工程配置签名后部署。
