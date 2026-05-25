import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';

const DOMAIN = 0x0000;

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(DOMAIN, 'WorldOfRPS', 'EntryAbility created');
  }

  onDestroy(): void {
    hilog.info(DOMAIN, 'WorldOfRPS', 'EntryAbility destroyed');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    const mainWindow = windowStage.getMainWindowSync();
    mainWindow.setWindowLayoutFullScreen(true);
    windowStage.loadContent('pages/Index', (err) => {
      if (err.code) {
        hilog.error(DOMAIN, 'WorldOfRPS', 'Failed to load content: %{public}s', JSON.stringify(err));
        return;
      }
      hilog.info(DOMAIN, 'WorldOfRPS', 'Content loaded');
    });
  }

  onWindowStageDestroy(): void {
    hilog.info(DOMAIN, 'WorldOfRPS', 'Window stage destroyed');
  }

  onForeground(): void {
    hilog.info(DOMAIN, 'WorldOfRPS', 'App foreground');
  }

  onBackground(): void {
    hilog.info(DOMAIN, 'WorldOfRPS', 'App background');
  }
}
