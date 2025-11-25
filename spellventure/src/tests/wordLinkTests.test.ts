import { vi, describe, it, expect } from "vitest";

// --- Mock Konva (simple no-op class) ---
vi.mock("konva", () => {
  class MockNode {
    destroy() {}
    destroyChildren() {}
    add() {}
    on() {}
    x() { return 0; }
    y() { return 0; }
    text() { return ""; }
    fill() {}
    getLayer() {
      return { batchDraw() {} };
    }
  }

  return {
    default: {
      Group: MockNode,
      Rect: MockNode,
      Text: MockNode,
      Stage: MockNode,
      Layer: MockNode,
    }
  };
});

// --- Mock WordLinkView AS A CLASS (constructor) ---
vi.mock("../views/WordLinkView", () => ({
  default: class MockWordLinkView {
    drawWordBoxes() {}
    drawLetterTiles() {}
    fillNextLetter() {}
    removeLetterTile() {}
    clearCurrentWord() {}
    revealLetter() {}
    addWordToGrid() {}
    drawGridPreview() {}
    flashFeedback() {}
    updateHUD() {}

    getVisibleWord() {
      return "";
    }
    getHintedLetters() {
      return [];
    }

    onSubmitClicked() {}
    onRefreshClicked() {}
    onHintClicked() {}
    onLetterClicked() {}

    getGroup() {
      return {
        getLayer() {
          return { batchDraw() {} };
        },
        add() {},
        destroyChildren() {},
      };
    }
  }
}));

// --- Mock WordValidator (OVERRIDDEN inside specific tests when needed) ---
vi.mock("../utils/WordValidator", () => ({
  isValidEnglishWord: async () => false
}));

// ==========================
//   NOW IMPORT CONTROLLER
// ==========================
import WordLinkController from "../controllers/WordLinkController";

// Fake app for constructor
const fakeApp: any = {
  storyData: { story: "", wordSet: [] }
};

// ==========================
//        TESTS
// ==========================
describe("WordLinkController – Core Logic", () => {

  it("initializes with 3 hearts", () => {
    const ctrl = new WordLinkController(fakeApp, [
      { word: "cat", type: "noun" }
    ]);
    expect((ctrl as any).hearts).toBe(3);
  });

  it("adds hearts correctly", () => {
    const ctrl = new WordLinkController(fakeApp, [
      { word: "cat", type: "noun" }
    ]);
    ctrl.addHearts(2);
    expect((ctrl as any).hearts).toBe(5);
  });

  it("correct word → +100 points, hearts unchanged", async () => {
    const ctrl = new WordLinkController(fakeApp, [
      { word: "cat", type: "noun" }
    ]);

    const view = (ctrl as any).view;
    view.getVisibleWord = vi.fn().mockReturnValue("cat");

    await (ctrl as any).submitGuess();

    expect((ctrl as any).score).toBe(100);
    expect((ctrl as any).hearts).toBe(3);
  });

  it("valid English word (not exact) → +10 points", async () => {
    // override validator for ONLY this test
    const { isValidEnglishWord } = await import("../utils/WordValidator");
    vi.spyOn(await import("../utils/WordValidator"), "isValidEnglishWord")
      .mockResolvedValue(true);

    const ctrl = new WordLinkController(fakeApp, [
      { word: "cat", type: "noun" }
    ]);

    const view = (ctrl as any).view;
    view.getVisibleWord = vi.fn().mockReturnValue("car");

    await (ctrl as any).submitGuess();

    expect((ctrl as any).score).toBe(10);
  });

  it("wrong word → loses 1 heart", async () => {
    const ctrl = new WordLinkController(fakeApp, [
      { word: "cat", type: "noun" }
    ]);

    const view = (ctrl as any).view;
    view.getVisibleWord = vi.fn().mockReturnValue("zzz");

    // isValidEnglishWord should be false → wrong word
    vi.spyOn(await import("../utils/WordValidator"), "isValidEnglishWord")
      .mockResolvedValue(false);

    await (ctrl as any).submitGuess();

    expect((ctrl as any).hearts).toBe(2);
  });

});
