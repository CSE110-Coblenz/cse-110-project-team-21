import { describe, it, expect, vi } from "vitest";
import MadLibPhaseView from "../views/MadLibPhaseView";

// ======================================================
//                KONVA MOCK (FINAL WORKING)
// ======================================================
vi.mock("konva", () => {
  class MockNode {
    _text = "";
    _fill = "";
    _x = 0;
    _y = 0;
    children: any[] = [];

    constructor(config: any = {}) {
      Object.assign(this, config);
    }

    on() {}
    destroy() {}
    destroyChildren() { this.children = []; }

    add(child: any) {
      this.children.push(child);
    }

    getChildren() {
      return this.children;
    }

    text(v?: any) {
      if (v !== undefined) this._text = v;
      return this._text;
    }

    fill(v?: any) {
      if (v !== undefined) this._fill = v;
      return this._fill;
    }

    width() { return 80; }
    height() { return 20; }

    x(v?: any) {
      if (v !== undefined) this._x = v;
      return this._x;
    }

    y(v?: any) {
      if (v !== undefined) this._y = v;
      return this._y;
    }

    position(pos: any) {
      if (pos) {
        this._x = pos.x;
        this._y = pos.y;
      }
    }

    getLayer() {
      return {
        batchDraw: vi.fn(),
        getStage: () => ({
          width: () => 800,
          height: () => 600,
          add: vi.fn(),
        })
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

    getStage() {
      return {
        width: () => 800,
        height: () => 600,
        add: vi.fn(),
      };
    }

    width() { return 800; }
    height() { return 600; }
  }

  // IMPORTANT: Your view uses:
  // import Konva from "konva"
  //
  // Vitest error says it EXPECTS "default".
  // So we MUST export under default:
  return {
    default: {
      Group: MockNode,
      Rect: MockNode,
      Text: MockNode,
      Layer: MockLayer,
    }
  };
});

// ======================================================
//                  TEST CASE
// ======================================================
describe("MadLibPhaseView — incorrect answer behavior", () => {

  it("reduces hearts by 1 when wrong answer is filled", () => {
    const story = "The [noun] jumped.";
    const words = [{ word: "dog", type: "noun" }];

    const view: any = new MadLibPhaseView(story, words);

    // initial hearts
    expect(view.hearts).toBe(3);

    const blankNode = view.blanks[0].node;

    // Simulate wrong answer
    view.fillBlankWithWord(blankNode, "wrongword", false);

    // hearts should drop
    expect(view.hearts).toBe(2);

    // HUD should update
    expect(view.heartText.text()).toBe("❤️ Hearts: 2");
  });

});
