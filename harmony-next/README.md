# World of RPS HarmonyOS NEXT

这是 `World of RPS` 的 HarmonyOS NEXT 版本。当前采用 ArkTS + ArkUI 工程承载本地 ArkWeb 游戏资源，玩法逻辑仍复用主项目的 `index.html`、`css/`、`js/` 和 `assets/`。

## 目录

```text
harmony-next/
├── AppScope/
├── entry/
│   └── src/main/
│       ├── ets/
│       │   ├── entryability/EntryAbility.ets
│       │   └── pages/Index.ets
│       └── resources/rawfile/world-rps/
└── scripts/sync-web-assets.mjs
```

## 开发

1. 用 DevEco Studio 打开 `harmony-next/`。
2. 选择 HarmonyOS NEXT SDK。
3. 配置签名后运行 `entry` 模块到手机、平板或模拟器。

也可以直接用本机 DevEco Studio 自带工具链构建：

```bash
./harmony-next/scripts/build-app.sh
```

未配置签名时会生成未签名产物：

- `harmony-next/entry/build/default/outputs/default/app/entry-default.hap`
- `harmony-next/build/outputs/default/harmony-next-default-unsigned.app`

## 同步 Web 游戏资源

主项目的 Web 游戏更新后，在仓库根目录执行：

```bash
node harmony-next/scripts/sync-web-assets.mjs
```

脚本会刷新 `entry/src/main/resources/rawfile/world-rps/` 下的网页资源，并移除 HTML 中的脚本版本参数，避免 rawfile 场景下的本地资源解析差异。

## 后续原生化建议

- 第一步保持 ArkWeb 包装，先验证触控、音频、性能和横竖屏。
- 第二步把设置页迁移到 ArkUI，继续用 Web Canvas 承载战斗场景。
- 第三步再评估是否将 Canvas 战斗循环改写为原生 ArkTS 渲染。
