/**
 * @file setup.ts
 * @brief mocking setup used in other testing files
 */

import { vi } from "vitest";

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
    width() { return 0; } 
    fill() {}
  }

  return {
    default: {
      Group: MockNode,
      Rect: MockNode,
      Text: MockNode,
    }
  };
});

/* ---------------------------------------------------------
   MOCK WordLinkView as a class
--------------------------------------------------------- */
vi.mock("../views/WordLinkView", () => {
  return {
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

      getVisibleWord() { return ""; }
      getHintedLetters() { return []; }

      onSubmitClicked() {}
      onRefreshClicked() {}
      onHintClicked() {}
      onLetterClicked() {}

      getGroup() {
        return {
          getLayer: () => ({ batchDraw() {} }),
          add() {},
          destroyChildren() {},
        };
      }
    }
  };
});

/* ---------------------------------------------------------
   MOCK MadLibPhaseController so WordLinkController
   never actually launches MadLibs during testing
--------------------------------------------------------- */
vi.mock("../controllers/MadLibPhaseController", () => {
  return {
    default: class MockMadLibPhaseController {
      constructor() {}
      getView() {
        return {
          getGroup: () => ({
            add() {}
          })
        };
      }
    }
  };
});
