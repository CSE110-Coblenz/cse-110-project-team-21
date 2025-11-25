import { describe, it, expect, vi } from "vitest";

/* ---------------------------------------------------------
   Mock Konva (very small mock so no DOM/canvas needed)
--------------------------------------------------------- */
vi.mock("konva", () => {
  class MockNode {
    destroy() {}
    destroyChildren() {}
    add() {}
    getLayer() { return { batchDraw() {} }; }
    on() {}
    x() { return 0; }
    y() { return 0; }
    text() { return ""; }
    width() { return 10; } // prevent NaN layout issues
    height() { return 20; }   // <-- ⭐ ADD THIS ⭐
    fill() {}
    fontStyle() {}
  }

  return {
    default: {
      Group: MockNode,
      Text: MockNode,
      Rect: MockNode,
      Layer: MockNode,
    }
  };
});

/* ---------------------------------------------------------
   Import the REAL MadLibPhaseView
--------------------------------------------------------- */
import MadLibPhaseView from "../views/MadLibPhaseView";

/* ---------------------------------------------------------
   TEST #1 — wrong guess loses heart
--------------------------------------------------------- */
describe("MadLibPhaseView – wrong guess reduces hearts", () => {

  it("should decrease hearts by 1 when wrong type is chosen", () => {
    const story = "The [adjective] fox";
    const words = [{ word: "dog", type: "noun" }];

    const view = new MadLibPhaseView(story, words);

    // Hearts start at 3
    expect((view as any).hearts).toBe(3);

    // WRONG: providing noun when blank expects adjective
    view.fillNextBlank("dog", "noun");

    expect((view as any).hearts).toBe(2);
  });

});
