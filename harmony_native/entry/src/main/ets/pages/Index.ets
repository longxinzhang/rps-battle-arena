import { common } from '@kit.AbilityKit';
import { FieldMode, GameEventKind, GamePhase, NativeGameOptions, FACTIONS } from '../model/GameTypes';
import { NativeGameEngine } from '../model/GameEngine';
import { NativePreset, PRESETS, presetOptions } from '../model/Presets';
import { configSummary, eventSummary, mechanicSummary } from '../model/OptionSummary';
import { NativeAudioService } from '../services/AudioService';
import { RageBar } from '../components/RageBar';
@Entry
@Component
struct Index {
  private settings: RenderingContextSettings = new RenderingContextSettings(true);
  private context: CanvasRenderingContext2D = new CanvasRenderingContext2D(this.settings);
  private engine: NativeGameEngine = new NativeGameEngine();
  private audioService: NativeAudioService = new NativeAudioService();
  private frameTimer: number = -1;
  private countdownTimer: number = -1;
  @State phase: GamePhase = GamePhase.Setup;
  @State canvasWidth: number = 390;
  @State canvasHeight: number = 760;
  @State tick: number = 0;
  @State countdown: string = '3';
  @State selectedPreset: string = 'custom';
  @State syncCounts: boolean = true;
  @State fieldMode: FieldMode = FieldMode.Push;
  @State rockCount: number = 7;
  @State scissorsCount: number = 7;
  @State paperCount: number = 7;
  @State durationSec: number = 60;
  @State deathmatch: boolean = false;
  @State godHand: boolean = false;
  @State obstacles: boolean = false;
  @State shrink: boolean = false;
  @State blackHole: boolean = false;
  @State traitor: boolean = false;
  @State thanos: boolean = false;
  @State lastStand: boolean = false;
  @State controlZones: boolean = false;
  @State powerUps: boolean = false;
  @State teamPowerUps: boolean = false;
  @State tenAgainstOne: boolean = false;
  @State betting: boolean = false;
  @State bank: number = 1000;
  @State selectedPick: number = 0;
  @State bgmVolume: number = 45;
  @State sfxVolume: number = 80;
  @State sRock: number = 0;
  @State sScissors: number = 0;
  @State sPaper: number = 0;
  @State statusText: string = '未开';
  @State eventText: string = '';
  @State winner: number = -1;
  @State thanosVisible: boolean = false;
  @State thanosText: string = '啪，打个响指';
  @State heroOverlayVisible: boolean = false;
  @State heroOverlayText: string = '';
  @State heroOverlaySubText: string = '';
  @State rageType: number = -1;
  @State rageTimeLeftSec: number = 0;
  @State rageProgress: number = 0;
  private lastEventId: number = 0;
  private resultSettled: boolean = false;
  aboutToAppear(): void {
    const context = this.getUIContext().getHostContext();
    if (context !== undefined) {
      this.audioService.init(context as common.Context);
    }
    this.startLoop();
  }

  aboutToDisappear(): void {
    this.stopLoop();
    this.clearCountdown();
    this.audioService.release();
  }

  build() {
    Stack() {
      Canvas(this.context)
        .width('100%')
        .height('100%')
        .onReady(() => {
          this.engine.resize(this.canvasWidth, this.canvasHeight);
          this.engine.draw(this.context);
        })
        .onAreaChange((oldArea, newArea) => {
          const width = Number.parseFloat(`${newArea.width}`);
          const height = Number.parseFloat(`${newArea.height}`);
          if (!Number.isNaN(width) && !Number.isNaN(height)) {
            this.canvasWidth = Math.max(280, width);
            this.canvasHeight = Math.max(420, height);
            this.engine.resize(this.canvasWidth, this.canvasHeight);
          }
        })
        .onTouch((event) => {
          this.handleTouch(event);
        })

      if (this.phase === GamePhase.Setup) {
        this.SetupScreen()
      } else {
        this.GameHud()
        this.ControlDock()
      }

      if (this.phase === GamePhase.Countdown) {
        this.CountdownScreen()
      }

      if (this.thanosVisible) {
        this.ThanosOverlay()
      }

      if (this.heroOverlayVisible) {
        this.HeroOverlay()
      }

      if (this.phase === GamePhase.Result) {
        this.ResultScreen()
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#edf5f1')
  }

  @Builder
  SetupScreen() {
    Stack({ alignContent: Alignment.Bottom }) {
      Scroll() {
        Column({ space: 12 }) {
          Row({ space: 12 }) {
            Image($r('app.media.app_icon'))
              .width(56)
              .height(56)
              .borderRadius(14)
            Column({ space: 3 }) {
              Text('World of RPS')
                .fontSize(28)
                .fontWeight(FontWeight.Bold)
                .fontColor('#17201c')
              Text('原生鸿蒙 NEXT · 石头剪刀布大作战')
                .fontSize(13)
                .fontColor('#637067')
            }
            .alignItems(HorizontalAlign.Start)
          }
          .width('100%')
          .alignItems(VerticalAlign.Center)

          this.PresetPanel()
          this.LineupPanel()
          this.SettingsPanel()
          this.MechanicPanel()
          this.EventPanel()
          this.MatchPanel()
          Blank()
            .height(88)
        }
        .padding({ left: 16, right: 16, top: 16, bottom: 12 })
      }
      .width('100%')
      .height('100%')

      Row() {
        Button('开始乱斗')
          .width('100%')
          .height(50)
          .borderRadius(8)
          .fontWeight(FontWeight.Bold)
          .fontColor('#ffffff')
          .backgroundColor('#17201c')
          .onClick(() => {
            this.beginCountdown();
          })
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 10, bottom: 14 })
      .backgroundColor('rgba(248,250,247,0.94)')
    }
    .width('100%')
    .height('100%')
  }

  @Builder
  PresetPanel() {
    Column({ space: 10 }) {
      Row() {
        Text(this.canvasWidth < 620 ? '经典战役' : '游戏预设')
          .fontSize(17)
          .fontWeight(FontWeight.Bold)
        Blank()
        Text('一键套用')
          .fontSize(12)
          .fontColor('#637067')
      }
      .width('100%')

      Grid() {
        ForEach(PRESETS, (item: NativePreset) => {
          GridItem() {
            Column({ space: 4 }) {
              Text(item.name)
                .fontSize(14)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.selectedPreset === item.key ? '#ffffff' : '#17201c')
              Text(item.subtitle)
                .fontSize(11)
                .fontColor(this.selectedPreset === item.key ? 'rgba(255,255,255,0.78)' : '#637067')
            }
            .alignItems(HorizontalAlign.Start)
            .width('100%')
            .height(64)
            .padding(10)
            .borderRadius(8)
            .backgroundColor(this.selectedPreset === item.key ? '#2c8f7f' : '#ffffff')
            .border({ width: 1, color: this.selectedPreset === item.key ? '#2c8f7f' : 'rgba(23,32,28,0.12)' })
            .onClick(() => {
              this.applyPreset(item.key);
            })
          }
        }, (item: NativePreset) => item.key)
      }
      .columnsTemplate('1fr 1fr')
      .rowsGap(8)
      .columnsGap(8)
      .height(136)
    }
    .panelStyle()
  }

  @Builder
  LineupPanel() {
    Column({ space: 10 }) {
      this.PanelTitle('初始阵容', `${this.rockCount}/${this.scissorsCount}/${this.paperCount} · ${this.durationSec}s`)
      Row({ space: 8 }) {
        this.CountControl(0, '石头', this.rockCount)
        this.CountControl(1, '剪刀', this.scissorsCount)
        this.CountControl(2, '布', this.paperCount)
      }
      .width('100%')

      Row({ space: 8 }) {
        this.ToggleChip('人数同步', this.syncCounts, '调整一方同步三方')
        Button(`时长 ${this.durationSec}s`)
          .height(38)
          .layoutWeight(1)
          .borderRadius(8)
          .fontSize(13)
          .backgroundColor('#ffffff')
          .fontColor('#17201c')
          .onClick(() => {
            this.durationSec = this.durationSec >= 120 ? 30 : this.durationSec + 15;
          })
      }
    }
    .panelStyle()
  }

  @Builder
  SettingsPanel() {
    Column({ space: 10 }) {
      this.PanelTitle('游戏设置', `BGM ${this.bgmVolume}% · 音效 ${this.sfxVolume}%`)
      Row({ space: 8 }) {
        this.VolumeControl('BGM', this.bgmVolume)
        this.VolumeControl('音效', this.sfxVolume)
      }
      .width('100%')
    }
    .panelStyle()
  }

  @Builder
  VolumeControl(label: string, value: number) {
    Row({ space: 6 }) {
      Text(`${label} ${value}%`)
        .fontSize(13)
        .fontWeight(FontWeight.Bold)
        .fontColor('#17201c')
        .layoutWeight(1)
      Button('-')
        .width(30)
        .height(30)
        .borderRadius(6)
        .backgroundColor('rgba(23,32,28,0.06)')
        .fontColor('#17201c')
        .onClick(() => {
          this.stepVolume(label, -5);
        })
      Button('+')
        .width(30)
        .height(30)
        .borderRadius(6)
        .backgroundColor('rgba(23,32,28,0.06)')
        .fontColor('#17201c')
        .onClick(() => {
          this.stepVolume(label, 5);
        })
    }
    .layoutWeight(1)
    .height(44)
    .padding({ left: 10, right: 8 })
    .borderRadius(8)
    .backgroundColor('#ffffff')
    .border({ width: 1, color: 'rgba(23,32,28,0.12)' })
  }

  @Builder
  MechanicPanel() {
    Column({ space: 10 }) {
      this.PanelTitle('游戏机制', mechanicSummary(this.currentOptions()))
      Row({ space: 8 }) {
        this.OptionButton('上帝之手', this.godHand, '底部可切换推/吸')
        this.OptionButton('地形障碍', this.obstacles, '碰撞弹开')
      }
      Row({ space: 8 }) {
        this.OptionButton('缩圈', this.shrink, '边界持续内收')
        this.OptionButton('据点争夺', this.controlZones, '占点到100获胜')
      }
    }
    .panelStyle()
  }

  @Builder
  EventPanel() {
    Column({ space: 10 }) {
      this.PanelTitle('精彩事件', eventSummary(this.currentOptions()))
      Row({ space: 8 }) {
        this.OptionButton('黑洞', this.blackHole, '吞噬后体积+30%')
        this.OptionButton('我们中出了叛徒', this.traitor, '紫圈2秒后叛变')
      }
      Row({ space: 8 }) {
        this.OptionButton('绝地求生', this.lastStand, '少数方分裂/复活')
        this.OptionButton('灭霸响指', this.thanos, '全场派系减半')
      }
      Row({ space: 8 }) {
        this.OptionButton('能量道具', this.powerUps, '加速/护盾/分裂')
        this.OptionButton('团队道具', this.teamPowerUps, '全队共享效果')
      }
      Row({ space: 8 }) {
        this.OptionButton('我要打十个', this.tenAgainstOne, '劣势方10秒反杀')
      }
    }
    .panelStyle()
  }

  @Builder
  MatchPanel() {
    Column({ space: 10 }) {
      this.PanelTitle('赛制', this.deathmatch ? '死斗模式' : '限时模式')
      Row({ space: 8 }) {
        this.OptionButton('死斗模式', this.deathmatch, '直到一方霸屏')
        this.OptionButton('下注模式', this.betting, '猜中获100积分')
      }
    }
    .panelStyle()
  }

  @Builder
  PanelTitle(title: string, summary: string) {
    Row() {
      Text(title)
        .fontSize(16)
        .fontWeight(FontWeight.Bold)
        .fontColor('#17201c')
      Blank()
      Text(summary)
        .fontSize(12)
        .fontColor('#637067')
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
    }
    .width('100%')
  }

  @Builder
  CountControl(type: number, label: string, count: number) {
    Column({ space: 7 }) {
      Text(`${FACTIONS[type].emoji} ${label}`)
        .fontSize(12)
        .fontWeight(FontWeight.Bold)
        .fontColor(FACTIONS[type].darkColor)
      Row({ space: 6 }) {
        Button('-')
          .width(28)
          .height(30)
          .borderRadius(6)
          .backgroundColor('rgba(23,32,28,0.06)')
          .fontColor('#17201c')
          .onClick(() => {
            this.stepCount(type, -1);
          })
        Text(`${count}`)
          .fontSize(17)
          .fontWeight(FontWeight.Bold)
          .fontColor('#17201c')
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
        Button('+')
          .width(28)
          .height(30)
          .borderRadius(6)
          .backgroundColor('rgba(23,32,28,0.06)')
          .fontColor('#17201c')
          .onClick(() => {
            this.stepCount(type, 1);
          })
      }
      .width('100%')
    }
    .layoutWeight(1)
    .padding(9)
    .borderRadius(8)
    .backgroundColor('#ffffff')
    .border({ width: 1, color: 'rgba(23,32,28,0.12)' })
  }

  @Builder
  OptionButton(label: string, enabled: boolean, hint: string) {
    Column({ space: 3 }) {
      Text(label)
        .fontSize(13)
        .fontWeight(FontWeight.Bold)
        .fontColor(enabled ? '#ffffff' : '#17201c')
        .maxLines(1)
      Text(hint)
        .fontSize(10)
        .fontColor(enabled ? 'rgba(255,255,255,0.76)' : '#637067')
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
    }
    .alignItems(HorizontalAlign.Start)
    .height(52)
    .layoutWeight(1)
    .padding(9)
    .borderRadius(8)
    .backgroundColor(enabled ? '#2c8f7f' : '#ffffff')
    .border({ width: 1, color: enabled ? '#2c8f7f' : 'rgba(23,32,28,0.12)' })
    .onClick(() => {
      this.toggleOption(label);
    })
  }

  @Builder
  ToggleChip(label: string, enabled: boolean, hint: string) {
    Column({ space: 3 }) {
      Text(label)
        .fontSize(13)
        .fontWeight(FontWeight.Bold)
        .fontColor(enabled ? '#ffffff' : '#17201c')
      Text(hint)
        .fontSize(10)
        .fontColor(enabled ? 'rgba(255,255,255,0.76)' : '#637067')
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
    }
    .alignItems(HorizontalAlign.Start)
    .height(38)
    .layoutWeight(1)
    .padding({ left: 10, right: 10, top: 5, bottom: 5 })
    .borderRadius(8)
    .backgroundColor(enabled ? '#17201c' : '#ffffff')
    .border({ width: 1, color: enabled ? '#17201c' : 'rgba(23,32,28,0.12)' })
    .onClick(() => {
      if (label === '人数同步') {
        this.syncCounts = !this.syncCounts;
      } else {
        this.deathmatch = !this.deathmatch;
      }
    })
  }

  @Builder
  GameHud() {
    Column({ space: 6 }) {
      Row({ space: 6 }) {
        this.StatPill('局势', this.statusText)
        this.StatPill('积分', `${this.bank}`)
        this.StatPill('模式', this.deathmatch ? '死斗' : `${this.durationSec}s`)
      }
      .width('100%')
      Row({ space: 6 }) {
        this.ScorePill(0, this.sRock)
        this.ScorePill(1, this.sScissors)
        this.ScorePill(2, this.sPaper)
      }
      .width('100%')
      if (this.eventText.length > 0) {
        Text(this.eventText)
          .width('100%')
          .height(28)
          .padding({ left: 10, right: 10 })
          .borderRadius(8)
          .fontSize(12)
          .fontWeight(FontWeight.Bold)
          .fontColor('#17201c')
          .backgroundColor('rgba(255,255,255,0.90)')
      }
      if (this.rageTimeLeftSec > 0 && this.rageType >= 0) {
        RageBar({
          rageType: this.rageType,
          rageTimeLeftSec: this.rageTimeLeftSec,
          rageProgress: this.rageProgress,
          canvasWidth: this.canvasWidth
        })
      }
    }
    .position({ x: 10, y: 8 })
    .width(this.canvasWidth - 20)
  }

  @Builder
  StatPill(label: string, value: string) {
    Column({ space: 1 }) {
      Text(label)
        .fontSize(10)
        .fontColor('#637067')
      Text(value)
        .fontSize(13)
        .fontWeight(FontWeight.Bold)
        .fontColor('#17201c')
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
    }
    .layoutWeight(1)
    .height(44)
    .padding({ left: 8, right: 8, top: 5, bottom: 5 })
    .borderRadius(8)
    .backgroundColor('rgba(255,255,255,0.90)')
    .border({ width: 1, color: 'rgba(23,32,28,0.12)' })
  }

  @Builder
  ScorePill(type: number, count: number) {
    Row({ space: 6 }) {
      Text(FACTIONS[type].emoji)
        .fontSize(18)
      Text(`${count}`)
        .fontSize(17)
        .fontWeight(FontWeight.Bold)
        .fontColor('#17201c')
    }
    .justifyContent(FlexAlign.Center)
    .layoutWeight(1)
    .height(38)
    .borderRadius(8)
    .backgroundColor('rgba(255,255,255,0.90)')
    .border({ width: 1, color: FACTIONS[type].color })
  }

  @Builder
  ControlDock() {
    Row({ space: 6 }) {
      if (this.godHand) {
        Button(this.fieldMode === FieldMode.Push ? '推开' : '吸引')
          .height(44)
          .layoutWeight(1)
          .borderRadius(8)
          .backgroundColor('#20a4f3')
          .fontColor('#ffffff')
          .onClick(() => {
            this.fieldMode = this.fieldMode === FieldMode.Push ? FieldMode.Pull : FieldMode.Push;
          })
      }
      Button(this.phase === GamePhase.Paused ? '继续' : '暂停')
        .height(44)
        .layoutWeight(1)
        .borderRadius(8)
        .backgroundColor('#ffffff')
        .fontColor('#17201c')
        .onClick(() => {
          const now = Date.now();
          if (this.phase === GamePhase.Paused) {
            this.engine.resume(now);
            this.audioService.playBgm();
            this.phase = GamePhase.Playing;
          } else if (this.phase === GamePhase.Playing) {
            this.engine.pause();
            this.audioService.pauseBgm();
            this.phase = GamePhase.Paused;
          }
        })
      Button('回首页')
        .height(44)
        .layoutWeight(1)
        .borderRadius(8)
        .backgroundColor('#17201c')
        .fontColor('#ffffff')
        .onClick(() => {
          this.engine.resetToSetup();
          this.audioService.pauseBgm();
          this.phase = GamePhase.Setup;
        })
    }
    .position({ x: 10, y: this.canvasHeight - 62 })
    .width(this.canvasWidth - 20)
    .padding(6)
    .borderRadius(10)
    .backgroundColor('rgba(255,255,255,0.88)')
    .border({ width: 1, color: 'rgba(23,32,28,0.12)' })
  }

  @Builder
  CountdownScreen() {
    Column({ space: 14 }) {
      Image($r('app.media.app_icon'))
        .width(72)
        .height(72)
        .borderRadius(18)
      Text('石头剪刀布大作战')
        .fontSize(27)
        .fontWeight(FontWeight.Bold)
        .fontColor('#ffffff')
      Text('请选择你支持的选手')
        .fontSize(16)
        .fontColor('rgba(255,255,255,0.78)')
      Row({ space: 12 }) {
        Text('🪨')
          .fontSize(34)
        Text('✂️')
          .fontSize(34)
        Text('✋🏻')
          .fontSize(34)
      }
      if (this.betting) {
        Row({ space: 8 }) {
          this.PickButton(0)
          this.PickButton(1)
          this.PickButton(2)
        }
        .width(Math.min(this.canvasWidth - 48, 420))
      }
      Text(this.countdown)
        .fontSize(58)
        .fontWeight(FontWeight.Bold)
        .fontColor('#f0b429')
      Text(configSummary(this.currentOptions()))
        .fontSize(12)
        .fontColor('rgba(255,255,255,0.76)')
        .maxLines(3)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .padding({ left: 24, right: 24 })
      Button('直接开始')
        .width(160)
        .height(42)
        .borderRadius(8)
        .backgroundColor('#ffffff')
        .fontColor('#17201c')
        .fontWeight(FontWeight.Bold)
        .onClick(() => {
          this.startGame();
        })
    }
    .justifyContent(FlexAlign.Center)
    .width('100%')
    .height('100%')
    .backgroundColor('rgba(7,8,18,0.88)')
  }

  @Builder
  PickButton(type: number) {
    Button(`${FACTIONS[type].emoji} ${FACTIONS[type].label}`)
      .height(40)
      .layoutWeight(1)
      .borderRadius(8)
      .backgroundColor(this.selectedPick === type ? FACTIONS[type].color : '#ffffff')
      .fontColor(this.selectedPick === type ? '#ffffff' : '#17201c')
      .fontSize(13)
      .fontWeight(FontWeight.Bold)
      .onClick(() => {
        this.selectedPick = type;
      })
  }

  @Builder
  ThanosOverlay() {
    Column({ space: 10 }) {
      Image($r('app.media.thanos'))
        .width(Math.min(this.canvasWidth - 48, 420))
        .borderRadius(8)
      Text('灭霸响指')
        .fontSize(28)
        .fontWeight(FontWeight.Bold)
        .fontColor('#fff8dc')
      Text(this.thanosText)
        .fontSize(16)
        .fontColor('rgba(255,248,220,0.78)')
    }
    .justifyContent(FlexAlign.Center)
    .width('100%')
    .height('100%')
    .backgroundColor('rgba(7,8,18,0.74)')
  }

  @Builder
  HeroOverlay() {
    Column({ space: 10 }) {
      Text(this.heroOverlayText)
        .fontSize(30)
        .fontWeight(FontWeight.Bold)
        .fontColor('#fff8dc')
        .textAlign(TextAlign.Center)
        .padding({ left: 20, right: 20 })
      Text(this.heroOverlaySubText)
        .fontSize(16)
        .fontColor('rgba(255,248,220,0.82)')
    }
    .justifyContent(FlexAlign.Center)
    .width('100%')
    .height('100%')
    .backgroundColor('rgba(38,18,74,0.74)')
  }

  @Builder
  ResultScreen() {
    Column({ space: 14 }) {
      Text(this.winner >= 0 ? `${FACTIONS[this.winner].emoji} ${FACTIONS[this.winner].label} 获胜` : '无人获胜')
        .fontSize(27)
        .fontWeight(FontWeight.Bold)
        .fontColor('#17201c')
      Text(`${FACTIONS[0].emoji}${this.sRock} · ${FACTIONS[1].emoji}${this.sScissors} · ${FACTIONS[2].emoji}${this.sPaper}`)
        .fontSize(16)
        .fontColor('#637067')
      if (this.betting) {
        Text(`支持 ${FACTIONS[this.selectedPick].emoji}${FACTIONS[this.selectedPick].label} · 当前积分 ${this.bank}`)
          .fontSize(13)
          .fontColor('#637067')
      }
      Row({ space: 10 }) {
        Button('再来一局')
          .height(44)
          .layoutWeight(1)
          .borderRadius(8)
          .backgroundColor('#2c8f7f')
          .fontColor('#ffffff')
          .onClick(() => {
            this.beginCountdown();
          })
        Button('回首页')
          .height(44)
          .layoutWeight(1)
          .borderRadius(8)
          .backgroundColor('#17201c')
          .fontColor('#ffffff')
          .onClick(() => {
            this.engine.resetToSetup();
            this.audioService.pauseBgm();
            this.phase = GamePhase.Setup;
          })
      }
      .width('100%')
    }
    .width(Math.min(this.canvasWidth - 32, 420))
    .padding(18)
    .borderRadius(10)
    .backgroundColor('rgba(255,255,255,0.96)')
    .border({ width: 1, color: 'rgba(23,32,28,0.12)' })
  }

  private startLoop(): void {
    if (this.frameTimer >= 0) {
      return;
    }
    this.frameTimer = setInterval(() => {
      this.frame();
    }, 33);
  }

  private stopLoop(): void {
    if (this.frameTimer >= 0) {
      clearInterval(this.frameTimer);
      this.frameTimer = -1;
    }
  }

  private frame(): void {
    const now = Date.now();
    const snapshot = this.engine.update(now);
    this.sRock = snapshot.counts[0];
    this.sScissors = snapshot.counts[1];
    this.sPaper = snapshot.counts[2];
    this.statusText = snapshot.status;
    this.eventText = snapshot.eventText;
    this.winner = snapshot.winner;
    this.thanosVisible = snapshot.thanosVisible;
    this.thanosText = snapshot.thanosText;
    this.heroOverlayVisible = snapshot.heroOverlayVisible;
    this.heroOverlayText = snapshot.heroOverlayText;
    this.heroOverlaySubText = snapshot.heroOverlaySubText;
    this.rageType = snapshot.rageType;
    this.rageTimeLeftSec = snapshot.rageTimeLeftSec;
    this.rageProgress = snapshot.rageProgress;
    this.phase = snapshot.phase === GamePhase.Setup ? this.phase : snapshot.phase;
    this.handleGameEvent(snapshot.eventId, snapshot.eventKind);
    if (snapshot.phase === GamePhase.Result && !this.resultSettled) {
      this.settleBet(snapshot.winner);
    }
    this.tick = now;
    this.engine.draw(this.context);
  }

  private beginCountdown(): void {
    this.clearCountdown();
    this.countdown = '3';
    this.phase = GamePhase.Countdown;
    this.audioService.setBgmVolume(this.bgmVolume / 100);
    this.audioService.playBgm();
    let value = 3;
    this.countdownTimer = setInterval(() => {
      value -= 1;
      if (value > 0) {
        this.countdown = `${value}`;
      } else if (value === 0) {
        this.countdown = '开始';
      } else {
        this.startGame();
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownTimer >= 0) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = -1;
    }
  }

  private startGame(): void {
    this.clearCountdown();
    const options = this.currentOptions();
    this.resultSettled = false;
    this.lastEventId = 0;
    this.engine.resize(this.canvasWidth, this.canvasHeight);
    this.engine.start(options, Date.now());
    this.phase = GamePhase.Playing;
  }

  private handleGameEvent(eventId: number, eventKind: GameEventKind): void {
    if (eventId <= this.lastEventId || eventKind === GameEventKind.None) {
      return;
    }
    this.lastEventId = eventId;
    if (eventKind === GameEventKind.Attack) {
      this.audioService.play('attack');
    } else if (eventKind === GameEventKind.Warning) {
      this.audioService.play('warning');
    } else if (eventKind === GameEventKind.Shrink) {
      this.audioService.play('shrink');
    } else if (eventKind === GameEventKind.Snap) {
      this.audioService.play('snap');
    } else if (eventKind === GameEventKind.Win) {
      this.audioService.play('win');
      this.audioService.pauseBgm();
    } else if (eventKind === GameEventKind.PowerUp) {
      this.audioService.play('power');
    }
  }

  private settleBet(winner: number): void {
    this.resultSettled = true;
    if (!this.betting || winner < 0) {
      return;
    }
    if (winner === this.selectedPick) {
      this.bank += 100;
    } else {
      this.bank = Math.max(0, this.bank - 100);
    }
  }

  private currentOptions(): NativeGameOptions {
    return {
      counts: [this.rockCount, this.scissorsCount, this.paperCount],
      durationSec: this.durationSec,
      deathmatch: this.deathmatch,
      godHand: this.godHand,
      obstacles: this.obstacles,
      shrink: this.shrink,
      blackHole: this.blackHole,
      traitor: this.traitor,
      thanos: this.thanos,
      lastStand: this.lastStand,
      controlZones: this.controlZones,
      powerUps: this.powerUps,
      teamPowerUps: this.teamPowerUps,
      tenAgainstOne: this.tenAgainstOne,
      betting: this.betting
    };
  }

  private applyPreset(key: string): void {
    const options = presetOptions(key, this.canvasWidth);
    this.selectedPreset = key;
    this.rockCount = options.counts[0];
    this.scissorsCount = options.counts[1];
    this.paperCount = options.counts[2];
    this.durationSec = options.durationSec;
    this.deathmatch = options.deathmatch;
    this.godHand = options.godHand;
    this.obstacles = options.obstacles;
    this.shrink = options.shrink;
    this.blackHole = options.blackHole;
    this.traitor = options.traitor;
    this.thanos = options.thanos;
    this.lastStand = options.lastStand;
    this.controlZones = options.controlZones;
    this.powerUps = options.powerUps;
    this.teamPowerUps = options.teamPowerUps;
    this.tenAgainstOne = options.tenAgainstOne;
    this.betting = options.betting;
  }

  private stepCount(type: number, step: number): void {
    if (this.syncCounts) {
      const base = type === 0 ? this.rockCount : type === 1 ? this.scissorsCount : this.paperCount;
      const next = Math.max(3, Math.min(60, base + step));
      this.rockCount = next;
      this.scissorsCount = next;
      this.paperCount = next;
      return;
    }
    if (type === 0) {
      this.rockCount = Math.max(3, Math.min(60, this.rockCount + step));
    } else if (type === 1) {
      this.scissorsCount = Math.max(3, Math.min(60, this.scissorsCount + step));
    } else {
      this.paperCount = Math.max(3, Math.min(60, this.paperCount + step));
    }
  }

  private stepVolume(label: string, step: number): void {
    if (label === 'BGM') {
      this.bgmVolume = Math.max(0, Math.min(100, this.bgmVolume + step));
      this.audioService.setBgmVolume(this.bgmVolume / 100);
    } else {
      this.sfxVolume = Math.max(0, Math.min(100, this.sfxVolume + step));
      this.audioService.setSfxVolume(this.sfxVolume / 100);
    }
  }

  private toggleOption(label: string): void {
    if (label === '上帝之手') {
      this.godHand = !this.godHand;
    } else if (label === '地形障碍') {
      this.obstacles = !this.obstacles;
    } else if (label === '缩圈') {
      this.shrink = !this.shrink;
    } else if (label === '据点争夺') {
      this.controlZones = !this.controlZones;
    } else if (label === '黑洞') {
      this.blackHole = !this.blackHole;
    } else if (label === '我们中出了叛徒') {
      this.traitor = !this.traitor;
    } else if (label === '绝地求生') {
      this.lastStand = !this.lastStand;
    } else if (label === '灭霸响指') {
      this.thanos = !this.thanos;
    } else if (label === '能量道具') {
      this.powerUps = !this.powerUps;
      if (!this.powerUps) {
        this.teamPowerUps = false;
      }
    } else if (label === '团队道具') {
      this.teamPowerUps = !this.teamPowerUps;
      if (this.teamPowerUps) {
        this.powerUps = true;
      }
    } else if (label === '我要打十个') {
      this.tenAgainstOne = !this.tenAgainstOne;
    } else if (label === '死斗模式') {
      this.deathmatch = !this.deathmatch;
    } else if (label === '下注模式') {
      this.betting = !this.betting;
    }
    this.selectedPreset = 'custom';
  }

  private handleTouch(event: TouchEvent): void {
    if (!this.godHand || (this.phase !== GamePhase.Playing && this.phase !== GamePhase.Paused)) {
      this.engine.setHand(false, 0, 0, false);
      return;
    }
    if (event.touches === undefined || event.touches.length === 0) {
      this.engine.setHand(false, 0, 0, false);
      return;
    }
    const touch = event.touches[0];
    const active = event.type === TouchType.Down || event.type === TouchType.Move;
    this.engine.setHand(active, touch.x, touch.y, this.fieldMode === FieldMode.Pull);
  }
}

@Extend(Column)
function panelStyle() {
  .width('100%')
  .padding(12)
  .borderRadius(8)
  .backgroundColor('rgba(248,250,247,0.92)')
  .border({ width: 1, color: 'rgba(23,32,28,0.12)' })
}
