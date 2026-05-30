# World of RPS iOS

Native iOS wrapper for the Web version of World of RPS.

## Run

Open this file in Xcode:

```bash
open ios_rps_battle_arena/WorldRPS.xcodeproj
```

Select an iPhone or iPad simulator/device, then press Run.

The app loads bundled Web assets from `WorldRPS/Resources/world-rps` through a local `worldrps://app/` URL scheme. No remote server is required for normal play.

## Sync Web Assets

After changing the Web version, refresh the iOS bundle resources:

```bash
ios_rps_battle_arena/sync_web_assets.sh
```

