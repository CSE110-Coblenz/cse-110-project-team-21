import { describe, it, expect, vi } from "vitest";

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
    width() { return 10; }
    height() { return 20; }  
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

import MadLibPhaseView from "../views/MadLibPhaseView";

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