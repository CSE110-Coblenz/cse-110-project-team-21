import HelpModalView from "../views/HelpModalView";
import type { ScreenSwitcher } from "../types";

export default class HelpModalController {
  private view: HelpModalView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new HelpModalView();

    this.view.onClose(() => this.app.closeHelp());
  }

  getView() {
    return this.view;
  }

  show() {
    const group = this.view.getGroup();

    // ⭐ KEY FIX: always ensure modal is the top-most node in the whole app
    group.moveToTop();

    this.view.show();
    group.getLayer()?.batchDraw();
  }

  hide() {
    this.view.hide();
  }
}
