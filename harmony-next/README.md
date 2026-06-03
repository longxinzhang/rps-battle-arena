# World of RPS HarmonyOS NEXT WebView Archive

这是 `World of RPS` 的旧 ArkWeb/WebView 包装版，已冻结归档。

后续鸿蒙 NEXT 只维护 `harmony_native/` 原生 ArkTS + ArkUI Canvas 版本。本目录不再同步 Web 资源，不再承接新功能和问题修复。

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

## 归档说明

- 保留本目录仅用于回溯旧 WebView 包装实现。
- 不再运行 `scripts/sync-web-assets.mjs` 同步主 Web 项目。
- 不再把 Web 版玩法变更移植到本目录。
- 需要开发鸿蒙版本时，打开 `../harmony_native/`。

## 构建旧归档版本

如确实需要验证旧 WebView 归档版，可用 DevEco Studio 打开 `harmony-next/`，配置签名后运行 `entry` 模块。

也可以直接用本机 DevEco Studio 自带工具链构建：

```bash
./harmony-next/scripts/build-app.sh
```

未配置签名时会生成未签名产物：

- `harmony-next/entry/build/default/outputs/default/app/entry-default.hap`
- `harmony-next/build/outputs/default/harmony-next-default-unsigned.app`
