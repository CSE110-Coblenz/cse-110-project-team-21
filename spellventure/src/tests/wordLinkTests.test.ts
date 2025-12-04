/**
 * @file WordLinkController.test.ts
 * @brief Unit tests for core wordlink gameplay logic
 */

import { vi, describe, it, expect } from "vitest";

/**
 * Konva mock for testing
 */
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
/**
 * Wordlink view mock
 */
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

/**
 * Valid English Word validator mock
 */
vi.mock("../utils/WordValidator", () => ({
  isValidEnglishWord: async () => false
}));

import WordLinkController from "../controllers/WordLinkController";

const fakeApp: any = {
  storyData: { story: "", wordSet: [] }
};
/**
 *           Tests
 */
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

it("empty guess → deducts 1 heart, score/hints unchanged", async () => {
    const ctrl = new WordLinkController(fakeApp, [
      { word: "raccoon", type: "noun" }
    ]);

    const view = (ctrl as any).view;
    view.getVisibleWord = vi.fn().mockReturnValue("");

    (ctrl as any).score = 50;
    (ctrl as any).hearts = 3;
    (ctrl as any).hints = 3;

    await (ctrl as any).submitGuess();

    expect((ctrl as any).hearts).toBe(2);   // loses 1 heart  
    expect((ctrl as any).score).toBe(50);   // unchanged  
    expect((ctrl as any).hints).toBe(3);    // unchanged  
  });

it("progress persists between words", async () => {
  const WordValidator = await import("../utils/WordValidator");
  vi.spyOn(WordValidator, "isValidEnglishWord").mockResolvedValue(true);

    const ctrl = new WordLinkController(fakeApp, [
      { word: "raccoon", type: "noun" },
      {word: "cat", type: "noun"}
    ]);
    //first word
    const view = (ctrl as any).view;
    view.getVisibleWord = vi.fn().mockReturnValue("raccoon");
    (ctrl as any).score = 50;
    (ctrl as any).hearts = 3;
    (ctrl as any).hints = 3;
    const FirstScore = (ctrl as any).score;
    const FirstHearts = (ctrl as any).hearts;
    const FirstHints = (ctrl as any).hints;
    await(ctrl as any).submitGuess();

    //second word
    view.getVisibleWord = vi.fn().mockReturnValue("cat");
    await (ctrl as any).submitGuess();

    const afterSecondScore = (ctrl as any).score;
    const afterSecondHearts = (ctrl as any).hearts;

    expect(afterSecondScore).toBeGreaterThan(FirstScore);
    expect(afterSecondHearts).toBe(FirstHearts);
    expect((ctrl as any).hints).toBe(FirstHints);
  });

  it("hint should remove exactly one tile per use (logic only)", () => {
  const ctrl = new (WordLinkController as any)(fakeApp, [
    { word: "theater", type: "noun" }
  ]);

  const view = (ctrl as any).view;

  // The correct mock: empty strings = unrevealed!
  view.getVisibleWord = vi.fn(() => ["t", "", "", "", "", "", ""]);
  view.revealLetter = vi.fn();

  let removes = 0;
  view.removeLetterTile = vi.fn(() => {
    removes++;
  });

  // Spam hint 5 times (only 3 should do anything)
  for (let i = 0; i < 5; i++) {
    (ctrl as any).useHint();
  }

  // Max hints = 3
  expect(removes).toBe(3);
});

it.skip("rejects valid English words if the length does not match the target word", async () => {
  const ctrl = new WordLinkController(fakeApp, [
    { word: "trip", type: "noun" }
  ]);

  const view = (ctrl as any).view;

  // Shorter valid English word
  view.getVisibleWord = vi.fn().mockReturnValue("tip");

  // Validator says it's a real English word (true)
  vi.spyOn(await import("../utils/WordValidator"), "isValidEnglishWord")
    .mockResolvedValue(true);

  (ctrl as any).score = 0;
  (ctrl as any).hearts = 3;

  await (ctrl as any).submitGuess();

  // Should NOT be rewarded
  expect((ctrl as any).score).toBe(0);

  // Should lose a heart
  expect((ctrl as any).hearts).toBe(2);
});



});