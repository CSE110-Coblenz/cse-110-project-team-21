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
    this.view.show();
  }

  hide() {
    this.view.hide();
  }
}
