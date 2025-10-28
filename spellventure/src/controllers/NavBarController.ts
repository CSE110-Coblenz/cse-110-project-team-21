import NavBarView from "../views/NavBarView";
import type { ScreenSwitcher } from "../types";

export default class NavBarController {
  private view: NavBarView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new NavBarView();

    this.view.onHomeClick(() => this.app.goHome());
    this.view.onBackClick(() => this.app.goBack());
    this.view.onHelpClick(() => this.app.openHelp());
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
