import { webview } from '@kit.ArkWeb';

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController();
  @State loading: boolean = true;

  build() {
    Stack() {
      Web({
        src: $rawfile('world-rps/index.html'),
        controller: this.controller
      })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .onPageEnd(() => {
          this.loading = false;
        })

      if (this.loading) {
        Column({ space: 12 }) {
          Image($r('app.media.app_icon'))
            .width(72)
            .height(72)
            .borderRadius(16)
          Text('World of RPS')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .fontColor('#F8FAF7')
          Text('加载中')
            .fontSize(14)
            .fontColor('rgba(248, 250, 247, 0.72)')
        }
        .justifyContent(FlexAlign.Center)
        .width('100%')
        .height('100%')
        .backgroundColor('#07110D')
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#07110D')
  }
}
