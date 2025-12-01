/**
 * @file miniGameTests.test.ts
 * @brief Tests the minigame behavior
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameSelectController } from "../../src/screens/GameSelectScreen/GameSelectController";

/**
 * Mocks each game's controller for testing
 */
vi.mock("../../src/screens/WordsDropGame/IntroScreenController", () => {
  return {
    IntroScreenController: vi.fn()
  };
});

vi.mock("../../src/screens/WordBubbleGame/WordBubbleGameController", () => {
  return {
    WordBubbleGameController: vi.fn()
  };
});
vi.mock("../../src/screens/GameSelectScreen/GameSelectModel", () => {
  return {
    GameSelectModel: class {
      games = [
        { id: "drop", label: "Drop Game" },
        { id: "bubble", label: "Bubble Game" }
      ];
    }
  };
});

vi.mock("../../src/screens/GameSelectScreen/GameSelectView", () => {
  return {
    GameSelectView: class {
      render(games: any[], onSelect: (id: string) => void) {
        // store the callback globally so tests can trigger it
        (globalThis as any).__selectCallback = onSelect;
      }
      click(id: string) {
        (globalThis as any).__selectCallback?.(id);
      }
    }
  };
});

// Import mocks so we can assert calls
const { IntroScreenController } = await import(
  "../../src/screens/WordsDropGame/IntroScreenController"
);

const { WordBubbleGameController } = await import(
  "../../src/screens/WordBubbleGame/WordBubbleGameController"
);
/**
 *                Tests
 */

describe("GameSelectController", () => {
  let root: HTMLDivElement;
  let fakeApp: any;

  beforeEach(() => {
    root = document.createElement("div");
    fakeApp = {};
    vi.clearAllMocks();
  });

  // DROP game
  it("launches Drop game when selected", () => {
    const ctrl = new GameSelectController(root, fakeApp);
    ctrl.start();

    const view = ctrl.view as any;
    view.click("drop");

    expect(IntroScreenController).toHaveBeenCalledTimes(1);
    expect(IntroScreenController).toHaveBeenCalledWith(root, fakeApp);
  });

  // BUBBLE game
  it("launches Bubble game when selected", () => {
    const ctrl = new GameSelectController(root, fakeApp);
    ctrl.start();

    const view = ctrl.view as any;
    view.click("bubble");

    expect(WordBubbleGameController).toHaveBeenCalledTimes(1);
    expect(WordBubbleGameController).toHaveBeenCalledWith(root, fakeApp);
  });
});
