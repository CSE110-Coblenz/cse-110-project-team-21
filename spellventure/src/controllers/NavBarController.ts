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

  getView(): NavBarView {
    return this.view;
  }

  show(): void {
    this.view.show();
  }

  hide(): void {
    this.view.hide();
  }

  //Responsive support
  onResize(width: number, height: number): void {
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }
}
