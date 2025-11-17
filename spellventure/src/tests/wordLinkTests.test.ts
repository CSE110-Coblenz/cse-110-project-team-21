/**
 * @file wordLinkTests.test.ts
 * @brief Tests the wordlink logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import WordLinkController from "../controllers/WordLinkController";
import { isValidEnglishWord } from "../utils/WordValidator";

// 1️⃣ Mock WordLinkView class (clean & correct)
vi.mock("../views/WordLinkView", () => {
  return {
    default: class MockWordLinkView {
      drawWordBoxes = vi.fn();
      drawLetterTiles = vi.fn();
      updateHUD = vi.fn();
      fillNextLetter = vi.fn();
      removeLetterTile = vi.fn();
      clearCurrentWord = vi.fn();
      getVisibleWord = vi.fn();
      revealLetter = vi.fn();
      flashFeedback = vi.fn();
      getHintedLetters = vi.fn().mockReturnValue([]);

      // REQUIRED FOR CONTROLLER:
      onLetterClicked = vi.fn();
      onSubmitClicked = vi.fn();
      onRefreshClicked = vi.fn();
      onHintClicked = vi.fn();

      getGroup = vi.fn(() => ({
        getLayer: () => ({
          batchDraw: vi.fn(),
        }),
      }));
    }
  };
});

vi.mock("../utils/WordValidator", () => ({
  isValidEnglishWord: vi.fn()
}));
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

import WordLinkView from "../views/WordLinkView";  

describe("WordLinkController core logic", () => {
  let mockApp: any;
  let view: any;

  beforeEach(() => {
    mockApp = { switchToScreen: vi.fn(), storyData: {} };
    view = new (WordLinkView as any)();
  });

  it("correct guess adds 100 score, keeps hearts, flashes correct, calls nextWord", async () => {
    const controller = new WordLinkController(mockApp, [
      { word: "cat", type: "noun" },
    ]) as any;

    // Replace real view with mock
    controller.view = view;


    view.getVisibleWord.mockReturnValue("cat");

    const nextSpy = vi.spyOn(controller, "nextWord")
      .mockImplementation(() => {});

    const startScore = controller.score;
    const startHearts = controller.hearts;

    await controller.submitGuess();

    expect(controller.score).toBe(startScore + 100);
    expect(controller.hearts).toBe(startHearts);
    expect(view.flashFeedback).toHaveBeenCalledWith("correct");
    expect(nextSpy).toHaveBeenCalled();
  });
  it("valid english word gives +10 points, keeps hearts, flashes correct, does NOT advance word", async () => {
  const controller = new WordLinkController(mockApp, [
    { word: "cat", type: "noun" }
  ]) as any;

  controller.view = view;

  // pretending player typed a valid English word (NOT the target)
  view.getVisibleWord.mockReturnValue("dog");

  // mock validator to return true
  (isValidEnglishWord as any).mockResolvedValue(true);

  // prevent real refreshWord async redraw
  const refreshSpy = vi
    .spyOn(controller, "refreshWord")
    .mockImplementation(() => {});

  const nextSpy = vi
    .spyOn(controller, "nextWord")
    .mockImplementation(() => {});

  const startScore = controller.score;
  const startHearts = controller.hearts;

  await controller.submitGuess();

  expect(controller.score).toBe(startScore + 10);     // +10 bonus
  expect(controller.hearts).toBe(startHearts);        // hearts unchanged
  expect(view.flashFeedback).toHaveBeenCalledWith("correct");

  expect(nextSpy).not.toHaveBeenCalled();             
});

it("incorrect guess loses 1 heart, score unchanged, flashes wrong, and does NOT advance word", async () => {
  const controller = new WordLinkController(mockApp, [
    { word: "cat", type: "noun" },
  ]) as any;

  controller.view = view;

  // player submits wrong guess
  view.getVisibleWord.mockReturnValue("xyz");

  const startScore = controller.score;
  const startHearts = controller.hearts;

  const nextSpy = vi.spyOn(controller, "nextWord").mockImplementation(() => {});

  await controller.submitGuess();

  expect(controller.score).toBe(startScore);           // score unchanged
  expect(controller.hearts).toBe(startHearts - 1);     // lose one heart
  expect(view.flashFeedback).toHaveBeenCalledWith("wrong");

  expect(nextSpy).not.toHaveBeenCalled();
});

it("incorrect guess on last heart triggers game over screen instead of refreshing or advancing", async () => {
  const controller = new WordLinkController(mockApp, [
    { word: "cat", type: "noun" }
  ]) as any;

  controller.view = view;
  controller.hearts = 1;

  view.getVisibleWord.mockReturnValue("dog");
  (isValidEnglishWord as any).mockReturnValue(false);

  const nextSpy = vi.spyOn(controller, "nextWord").mockImplementation(() => {});
  const refreshSpy = vi.spyOn(controller, "refreshWord").mockImplementation(() => {});

  // important — prevent mini-game logic from running
  vi.spyOn(controller, "triggerMiniGame").mockImplementation(() => {});

  const switchSpy = vi.spyOn(mockApp, "switchToScreen");

  await controller.submitGuess();

  expect(controller.hearts).toBe(0);
  expect(view.flashFeedback).toHaveBeenCalledWith("wrong");

  expect(nextSpy).not.toHaveBeenCalled();
  expect(refreshSpy).not.toHaveBeenCalled();
});
});