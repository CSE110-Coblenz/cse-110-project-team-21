/**
 * @file MadLibsTests.test.ts
 * @brief Unit tests for MadLibPhaseView.
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import MadLibPhaseView from "../views/MadLibPhaseView";

beforeAll(() => {
  global.innerWidth = 1200;
  global.innerHeight = 800;

  vi.spyOn(globalThis, "setTimeout").mockImplementation((fn: any) => {
    fn();
    return {} as NodeJS.Timeout;
  });

  global.addEventListener = vi.fn();
  global.removeEventListener = vi.fn();
});

/*                              KONVA MOCK                                    */
/*   - Provides minimal functionality needed for testing                      */
/*   - Supports event handlers, position, text, and layer simulation          */
vi.mock("konva", () => {
  class MockNode {
    _text = "";
    _fill = "";
    _x = 0;
    _y = 0;
    _fontStyle = "normal";
    children: any[] = [];
    _handlers: Record<string, Function> = {};

    constructor(config: any = {}) {
      if (config.text !== undefined) this._text = config.text;
      if (config.fill !== undefined) this._fill = config.fill;
      if (config.x !== undefined) this._x = config.x;
      if (config.y !== undefined) this._y = config.y;
    }

    on(event: string, fn: Function) {
      this._handlers[event] = fn;
    }
    trigger(event: string) {
      if (this._handlers[event]) this._handlers[event]();
    }

    text(v?: any) { if (v !== undefined) this._text = v; return this._text; }
    fill(v?: any) { if (v !== undefined) this._fill = v; return this._fill; }
    fontStyle(v?: any) { if (v !== undefined) this._fontStyle = v; return this._fontStyle; }
    x(v?: any) { if (v !== undefined) this._x = v; return this._x; }
    y(v?: any) { if (v !== undefined) this._y = v; return this._y; }

    width() { return 100; }
    height() { return 20; }

    destroy() {}
    destroyChildren() { this.children = []; }

    add(child: any) { this.children.push(child); }
    getChildren() { return this.children; }

    getLayer() {
      return {
        batchDraw: vi.fn(),
        getStage: () => ({
          width: () => 1200,
          height: () => 800,
          add: vi.fn(),
        }),
      };
    }
  }

  class MockLayer {
    children: any[] = [];

    add(child: any) { this.children.push(child); }
    destroy() {}
    batchDraw() {}
    moveToTop() {}
    to() {}

    width() { return 1200; }
    height() { return 800; }

    getStage() {
      return {
        width: () => 1200,
        height: () => 800,
        add: vi.fn(),
      };
    }
  }

  return {
    default: {
      Group: MockNode,
      Rect: MockNode,
      Text: MockNode,
      Layer: MockLayer,
      Stage: MockLayer,
    },
  };
});

//                              Tests                                         

describe("MadLibPhaseView Tests", () => {

  it("reduces hearts by 1 when type is incorrect", () => {
    const view: any = new MadLibPhaseView("The [noun] jumped.", [
      { word: "dog", type: "noun" },
    ]);

    expect(view.hearts).toBe(3);

    view.fillNextBlank("run", "verb");

    expect(view.hearts).toBe(2);
    expect(view.heartText.text()).toBe("❤️ Hearts: 2");
  });

  it("fills blank correctly and does NOT reduce hearts", () => {
    const view: any = new MadLibPhaseView("The [noun] jumped.", [
      { word: "dog", type: "noun" },
    ]);

    const result = view.fillNextBlank("dog", "noun");

    expect(result).toBe(true);
    expect(view.hearts).toBe(3);
    expect(view.blanks[0].filled).toBe(true);
    expect(view.blanks[0].node.text()).toBe("dog ");
  });

  it("calls blankFilledHandler for each blank filled", () => {
    const view: any = new MadLibPhaseView("The [noun] is [adjective].", [
      { word: "dog", type: "noun" },
      { word: "happy", type: "adjective" },
    ]);

    const handler = vi.fn();
    view.onBlankFilled(handler);

    view.fillNextBlank("dog", "noun");
    view.fillNextBlank("happy", "adjective");

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("returns true for allBlanksFilled", () => {
    const view: any = new MadLibPhaseView("The [noun] is [adjective].", [
      { word: "dog", type: "noun" },
      { word: "happy", type: "adjective" },
    ]);

    view.fillNextBlank("dog", "noun");
    view.fillNextBlank("happy", "adjective");

    expect(view.allBlanksFilled()).toBe(true);
  });

  it("setHearts updates HUD", () => {
    const view: any = new MadLibPhaseView("The [noun] jumped.", [
      { word: "dog", type: "noun" },
    ]);

    view.setHearts(5);

    expect(view.hearts).toBe(5);
    expect(view.heartText.text()).toBe("❤️ Hearts: 5");
  });

  it("addHearts increases hearts & HUD", () => {
    const view: any = new MadLibPhaseView("The [noun] jumped.", [
      { word: "dog", type: "noun" },
    ]);

    view.addHearts(2);

    expect(view.hearts).toBe(5);
    expect(view.heartText.text()).toBe("❤️ Hearts: 5");
  });

  it("opens popup when clicking a blank", () => {
    const view: any = new MadLibPhaseView("The [noun] jumped.", [
      { word: "dog", type: "noun" },
    ]);

    const spy = vi
      .spyOn(view as any, "showChoicePopup")
      .mockImplementation(() => { view.isPopupOpen = true; });

    const blankNode = view.blanks[0].node;
    blankNode.trigger("click tap");
    expect(spy).toHaveBeenCalled();
    expect(view.isPopupOpen).toBe(true);
  });

  it("loses a heart when popup timer expires", () => {
    const view: any = new MadLibPhaseView("The [noun] jumped.", [
      { word: "dog", type: "noun" },
    ]);

    const loseSpy = vi.spyOn(view as any, "loseHeart");

    const fakeLayer = {
      width: () => 800,
      height: () => 600,
      add: vi.fn(),
      destroy: vi.fn(),
      to: vi.fn(),
      batchDraw: vi.fn(),
    };

    view.activePopupLayer = fakeLayer;
    view.isPopupOpen = true;

    (view as any).startPopupTimer(view.blanks[0].node, "noun", fakeLayer);

    expect(loseSpy).toHaveBeenCalled();
    expect(view.hearts).toBe(2);
  });

});
