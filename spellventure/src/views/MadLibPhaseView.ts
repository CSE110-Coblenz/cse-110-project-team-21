/**
 * @file MadLibPhaseView.ts
 * @brief Renders and manages the Mad Libs story paragraph, word bank, hearts,
 *        feedback messages, timed popups, and mini-game redirects.
 *
 * This class is the **view layer** for the Mad Libs phase:
 *  - It takes a story template string with `[type]` placeholders.
 *  - It draws those placeholders as interactive blanks in a paragraph layout.
 *  - It displays a word bank (currently optional / commented out).
 *  - It tracks hearts and shows feedback when the player makes mistakes.
 *  - It shows a timed popup for choosing words for a blank.
 *  - It redirects to the mini-game selection when hearts reach zero.
 */

import Konva from "konva";

/**
 * @brief Simple data structure used to represent typed words for blanks.
 *
 * Each word carries:
 *  - `word`: the literal string shown to the player.
 *  - `type`: the grammatical/semantic role (e.g., "noun", "verb", "adjective").
 *            This must match the placeholder text inside `[ ]` in the story
 *            for the word to be considered a "correct" match.
 */
interface WordData {
  word: string;
  type: string;
}

export default class MadLibPhaseView {
  /** Root Konva group for everything in the Mad Lib phase. */
  private group: Konva.Group;

  /** Original story template containing `[type]` placeholders. */
  private storyTemplate: string;

  /**
   * Words passed in from GameScreenController:
   *  - Each has `word` + `type`.
   *  - These represent the "correct" answers for blanks in the story.
   */
  private wordBank: WordData[];

  /**
   * Represents each blank in the story.
   * - `node`: the Konva.Text object that renders "__________".
   * - `type`: the placeholder type (e.g., "noun", "verb").
   * - `filled`: whether the blank has already been filled with a word.
   * - `typeNode`: small label showing the expected type under the blank.
   */
  private blanks: {
    node: Konva.Text;
    type: string;
    filled: boolean;
    typeNode?: Konva.Text;
  }[] = [];

  /**
   * Represents each word tile in the optional word bank area.
   *  - `node`: the Konva.Text node for the word.
   *  - `word`: the string value.
   *  - `type`: the word's category, used to match blanks.
   */
  private wordTiles: { node: Konva.Text; word: string; type: string }[] = [];

  /**
   * Callback invoked when the player clicks a word in the word bank.
   * The controller (MadLibPhaseController) registers this to wire up
   * view → controller communication.
   */
  private wordClickHandler: ((word: string, type: string) => void) | null = null;

  /**
   * Callback invoked whenever *any* blank is successfully filled.
   * Used by the controller to detect when all blanks are filled so it
   * can transition to the results screen.
   */
  private blankFilledHandler: (() => void) | null = null;

  /** Flag indicating if a choice popup is currently visible. */
  private isPopupOpen = false;

  /**
   * If a popup is active, this holds a reference to the dedicated popup layer.
   * That layer:
   *   - sits on top of the main game layer,
   *   - contains the dim background overlay, popup rectangle, buttons, timer.
   */
  private activePopupLayer: Konva.Layer | null = null;

  /**
   * Stores the numeric ID of the `setTimeout` used for the popup countdown.
   * If we need to cancel/reschedule the timer (e.g., popup closed early),
   * we clear this timeout.
   */
  private popupTimerId: number | null = null;

  /**
   * Stores the interval ID used to update the on-screen countdown. We keep
   * this as an instance property so other code paths (e.g., button handlers)
   * can cancel it when the popup is closed early.
   */
  private popupCountdownInterval: number | null = null;

  /**
   * @brief Allows external code (controller) to register a callback that fires
   *        whenever any blank in the story is filled.
   *
   * @param cb Function called with no arguments when a blank is filled.
   */
  onBlankFilled(cb: () => void): void {
    this.blankFilledHandler = cb;
  }

  /**
   * A static library of "incorrect" words. These are used to populate
   * the multiple-choice popup so there is at least one wrong alternative.
   * Notice that many of these types do *not* match the expected type for
   * a given blank, which is why they are considered "wrong" in context.
   */
  private incorrectWords: WordData[] = [
    { word: "jump", type: "verb" },
    { word: "beautifully", type: "adverb" },
    { word: "cat", type: "noun" },
    { word: "run", type: "verb" },
    { word: "blue", type: "adjective" },
    { word: "quickly", type: "adverb" },
    { word: "happy", type: "adjective" },
    { word: "swim", type: "verb" },
    { word: "tree", type: "noun" },
    { word: "softly", type: "adverb" },
    { word: "angry", type: "adjective" },
    { word: "climb", type: "verb" },
    { word: "rabbit", type: "noun" },
    { word: "fast", type: "adjective" },
    { word: "sing", type: "verb" },
  ];

  /** Text node showing heart count in the HUD. */
  private heartText!: Konva.Text;

  /** Text node used for temporary feedback messages. */
  private feedbackText!: Konva.Text;

  /** Current hearts remaining in the Mad Lib phase. */
  private hearts = 3;

  /**
   * @brief Constructor wires up the story template, word bank, and HUD.
   *
   * @param story The story template string containing `[type]` placeholders.
   * @param words The word set from the game phase `{ word, type }[]`.
   *              These represent the "correct" options for the blanks.
   */
  constructor(story: string, words: WordData[]) {
    this.group = new Konva.Group();
    this.storyTemplate = story;
    this.wordBank = words;

    // Render the paragraph with blanks from the story template
    this.drawStory();

  // Optionally render the word bank below (currently disabled).
  // this.drawWordBank();

    // Show HUD elements (hearts + feedback text)
    this.drawHUD();

    // Handle window resize by re-drawing everything
    window.addEventListener("resize", () => this.onResize());
  }

  /** ===========================
   *  STORY RENDERING
   *  ===========================
   */

  /**
   * @brief Parses `storyTemplate` and renders it as multiple Konva.Text nodes.
   *
   * For each token in the story:
   *  - Normal words are drawn as plain text.
   *  - `[type]` placeholders are turned into interactive blanks:
   *      - A visible blank: "__________"
   *      - A type label (e.g., "noun") just under the blank
   *
   * The method also:
   *  - Handles basic word wrapping using a max line width.
   *  - Attaches click handlers to each blank so that clicking opens
   *    a multiple-choice popup.
   */
  private drawStory(): void {
    // Vertical start for the paragraph and typical line spacing
    const paragraphY = 100;
    const lineHeight = 40;

    // Horizontal margins and text wrapping width
    const marginX = window.innerWidth * 0.1;
    const maxWidth = window.innerWidth * 0.8;

    // We'll walk the string and emit alternating text segments and blanks.
    // This is more robust than a simple split-on-space because it handles
    // punctuation, newlines, and multiple placeholders per token.
    let x = marginX;
    let y = paragraphY;

    const placeholderRe = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    // Helper to render an arbitrary text segment (may contain many words)
    const renderTextSegment = (segment: string) => {
      if (!segment) return;
      const parts = segment.split(/(\s+)/); // keep whitespace tokens
      for (const part of parts) {
        if (part === "") continue;
        // If it's pure whitespace, advance x by measuring a single space
        if (/^\s+$/.test(part)) {
          const space = new Konva.Text({
            text: part,
            x,
            y,
            fontSize: 22,
            fontFamily: "system-ui",
            fill: "#111",
            name: "story-node",
          });

          // wrapping: if the whitespace itself is beyond margin, move to next line
          if (x + space.width() > marginX + maxWidth) {
            x = marginX;
            y += lineHeight;
            space.x(x);
            space.y(y);
          }

          this.group.add(space);
          x += space.width();
          continue;
        }

        // Normal visible word
        const text = new Konva.Text({
          text: part,
          x,
          y,
          fontSize: 22,
          fontFamily: "system-ui",
          fill: "#111",
          name: "story-node",
        });

        if (x + text.width() > marginX + maxWidth) {
          x = marginX;
          y += lineHeight;
          text.x(x);
          text.y(y);
        }

        this.group.add(text);
        x += text.width();
      }
    };

    while ((m = placeholderRe.exec(this.storyTemplate)) !== null) {
      const matchIndex = m.index;
      const type = m[1];

      // Render any text before the placeholder
      const before = this.storyTemplate.slice(lastIndex, matchIndex);
      renderTextSegment(before);

      // Render blank
      const blankText = new Konva.Text({
        text: "__________ ",
        x,
        y,
        fontSize: 22,
        fontFamily: "system-ui",
        fill: "#2563eb",
        fontStyle: "normal",
        name: "story-node",
      });

      if (x + blankText.width() > marginX + maxWidth) {
        x = marginX;
        y += lineHeight;
        blankText.x(x);
        blankText.y(y);
      }

      const typeLabel = new Konva.Text({
        text: type,
        x: blankText.x(),
        y: blankText.y() + blankText.height(),
        fontSize: 14,
        fontFamily: "system-ui",
        fill: "#2563eb",
        fontStyle: "italic",
        name: "story-node",
      });

      blankText.on("click tap", () => {
        const existing = this.blanks.find((b) => b.node === blankText);
        if (existing?.filled) return;
        if (this.isPopupOpen) return;
        this.showChoicePopup(blankText, type);
      });

      this.blanks.push({ node: blankText, type, filled: false, typeNode: typeLabel });
      this.group.add(blankText);
      this.group.add(typeLabel);

      x += blankText.width();

      lastIndex = placeholderRe.lastIndex;
    }

    // Render any trailing text after the last placeholder
    const tail = this.storyTemplate.slice(lastIndex);
    renderTextSegment(tail);

    this.group.getLayer()?.batchDraw();
  }

  /** ===========================
   *  WORD BANK (OPTIONAL)
   *  ===========================
   */

  /**
   * @brief Draws the selectable word bank at the bottom of the screen.
   *
   * NOTE: In the current version, this is not used (call is commented out).
   *       However, it still works and can be re-enabled if you want a more
   *       traditional word bank selection flow instead of popups per blank.
   */
  private drawWordBank(): void {
    // Starting Y coordinate for the word bank area
    const startY = window.innerHeight - 200;
    // Left margin for word bank
    const startX = window.innerWidth * 0.1;
    const spacingX = 140; // horizontal spacing between words
    const spacingY = 50;  // vertical spacing between rows

    // How many words per row can we fit in the central 80% of the width?
    const wordsPerRow = Math.floor((window.innerWidth * 0.8) / spacingX);

    this.wordBank.forEach((item, index) => {
      const row = Math.floor(index / wordsPerRow);
      const col = index % wordsPerRow;

      const node = new Konva.Text({
        text: item.word,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        fontSize: 24,
        fill: "#16a34a",
        fontStyle: "bold",
        shadowColor: "rgba(0,0,0,0.2)",
        shadowBlur: 3,
      });

      // When the player clicks a word tile, bubble the event to the controller
      node.on("click tap", () => {
        this.wordClickHandler?.(item.word, item.type);
      });

      this.wordTiles.push({ node, word: item.word, type: item.type });
      this.group.add(node);
    });

    this.group.getLayer()?.batchDraw();
  }

  /** ===========================
   *  HUD: HEARTS + FEEDBACK
   *  ===========================
   */

  /**
   * @brief Renders the heart counter and the feedback text area at the top.
   *
   * This is called once on construction and re-run on resize via `drawHUD()`
   * so that positions are updated for new window sizes.
   */
  private drawHUD(): void {
    // Heart display in the top-right area
    this.heartText = new Konva.Text({
      text: `❤️ Hearts: ${this.hearts}`,
      x: window.innerWidth - 250,
      y: 30,
      fontSize: 22,
      fontFamily: "system-ui",
      fill: "#dc2626",
    });

    // Feedback message in the top center (status of actions/checks)
    this.feedbackText = new Konva.Text({
      text: "",
      x: window.innerWidth / 2 - 150,
      y: 30,
      width: 300,
      fontSize: 20,
      fontFamily: "system-ui",
      fill: "#333",
      align: "center",
    });

    this.group.add(this.heartText, this.feedbackText);
  }

  /** ===========================
   *  BLANK FILLING LOGIC
   *  ===========================
   */

  /**
   * @brief Attempts to fill the next available blank that matches the requested type.
   *
   * @param word The word the player is trying to fill into a blank.
   * @param type The type of that word (must match the blank's `type`).
   * @return `true` if a matching blank was found and filled, `false` otherwise.
   *
   * Behavior:
   *  - If there is an unfilled blank of that `type`, it is filled with `word`.
   *  - The used word tile is removed from the word bank (if present).
   *  - A "Correct!" feedback message is shown.
   *  - If no matching blank is found, the player loses a heart and receives
   *    an error feedback message about the wrong type.
   */
  fillNextBlank(word: string, type: string): boolean {
    // Find the first blank that:
    //   - is not yet filled, and
    //   - expects the same type as the provided word
    const blank = this.blanks.find((b) => !b.filled && b.type === type);
    if (!blank) {
      // No matching blank found → deduct a heart and show reason
      this.loseHeart(`Wrong type! Looking for a ${type}`);
      return false;
    }

    // Fill the blank text with the chosen word
    blank.node.text(word + " ");
    blank.node.fill("#111");
    blank.node.fontStyle("normal");
    blank.filled = true;

    // Remove used word from word bank display
    const tile = this.wordTiles.find((t) => t.word === word && t.type === type);
    if (tile) {
      tile.node.destroy();
      this.wordTiles = this.wordTiles.filter((t) => t !== tile);
    }

    // Positive feedback to the player
    this.flashFeedback("✅ Correct!");
    this.group.getLayer()?.batchDraw();

    // Notify the controller so it can check if all blanks are filled
    if (this.blankFilledHandler) {
      this.blankFilledHandler();
    }
    return true;
  }

  /** ===========================
   *  HEART / FEEDBACK SYSTEM
   *  ===========================
   */

  /**
   * @brief Deducts a heart and shows a feedback message.
   *
   * This method is used whenever the player:
   *  - selects a wrong type,
   *  - runs out of time on a popup,
   *  - or otherwise triggers an error condition.
   *
   * If hearts drop to 0 or below, this method triggers the mini-game
   * selection flow via `triggerMiniGame()`, and on success/resume,
   * resets hearts to at least 1.
   *
   * @param message A readable explanation (shown to the player) of what went wrong.
   */
  private loseHeart(message: string): void {
    // Decrement hearts and show why
    this.hearts--;
    this.flashFeedback(`❌ ${message}`);
    this.heartText.text(`❤️ Hearts: ${this.hearts}`);

    // When hearts are gone, redirect to mini-game selection
    if (this.hearts <= 0) {
      this.triggerMiniGame(() => {
        // If redirect fails and fallback is used, at least restore 1 heart
        this.hearts = 1;
        this.heartText.text(`❤️ Hearts: ${this.hearts}`);
      });
    }

    this.group.getLayer()?.batchDraw();
  }

  /**
   * @brief Temporarily displays a message in the feedback text area.
   *
   * @param message The message to show (e.g., "✅ Correct!", "❌ Wrong!").
   *
   * The message is automatically cleared after ~1.5 seconds.
   */
  flashFeedback(message: string): void {
    this.feedbackText.text(message);
    this.group.getLayer()?.batchDraw();
    setTimeout(() => {
      this.feedbackText.text("");
      this.group.getLayer()?.batchDraw();
    }, 1500);
  }

  /** ===========================
   *  POPUP CHOICE SYSTEM
   *  ===========================
   */

  /**
   * @brief Opens a multiple-choice popup for the given blank.
   *
   * The popup:
   *  - dims the background with a semi-transparent overlay.
   *  - shows a card asking for the correct word type (e.g., "noun").
   *  - shows two buttons: one correct word, one incorrect word.
   *  - starts a 10-second timer; if the player does not choose in time,
   *    they lose a heart and the popup closes.
   *
   * @param blankNode    The Konva.Text node representing the blank in the story.
   * @param expectedType The type the blank expects (e.g., "noun", "verb").
   */
  private showChoicePopup(blankNode: Konva.Text, expectedType: string): void {
    // Do not open if another popup is currently active
    if (this.isPopupOpen) return;
    this.isPopupOpen = true;

    const baseLayer = this.group.getLayer();
    const stage = baseLayer?.getStage();
    if (!stage || !baseLayer) return;

    // Find one "correct" candidate from the word bank that matches expectedType
    const correct = this.wordBank.find((w) => w.type === expectedType);
    if (!correct) return;

    // Find a pool of candidate wrong words (type != expectedType)
    const incorrectPool = this.incorrectWords.filter((w) => w.type !== expectedType);
    const wrong = incorrectPool[Math.floor(Math.random() * incorrectPool.length)];

    // Randomize ordering so the correct one is not always first
    const options = Math.random() < 0.5 ? [correct, wrong] : [wrong, correct];

    // Create a dedicated layer for the popup so it sits above everything else
    const popupLayer = new Konva.Layer({ listening: true });
    this.activePopupLayer = popupLayer;
    stage.add(popupLayer);

    // Dimmed overlay (visual only; does not capture events)
    const overlay = new Konva.Rect({
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
      fill: "rgba(0,0,0,0.3)",
      listening: false,
    });

    // Centered popup card
    const popup = new Konva.Rect({
      x: stage.width() / 2 - 180,
      y: stage.height() / 2 - 100,
      width: 360,
      height: 200,
      fill: "#ffffff",
      stroke: "#2563eb",
      strokeWidth: 2,
      cornerRadius: 16,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 10,
      listening: true,
    });

    const title = new Konva.Text({
      text: `Choose the correct ${expectedType}`,
      x: popup.x(),
      y: popup.y() + 20,
      width: popup.width(),
      align: "center",
      fontSize: 20,
      fontFamily: "system-ui",
      fill: "#111",
    });

    popupLayer.add(overlay, popup, title);

  // Create interactive buttons for each option in the popup
    options.forEach((opt, i) => {
      const btnGroup = new Konva.Group({
        x: popup.x() + 40,
        y: popup.y() + 70 + i * 60,
        width: popup.width() - 80,
        height: 50,
        listening: true,
      });

      const btnRect = new Konva.Rect({
        width: btnGroup.width(),
        height: btnGroup.height(),
        fill: "#4f46e5",
        opacity: 1,
        cornerRadius: 8,
        shadowColor: "rgba(0,0,0,0.25)",
        shadowBlur: 4,
        shadowOffsetY: 2,
      });

      const btnLabel = new Konva.Text({
        text: opt.word,
        width: btnGroup.width(),
        align: "center",
        y: 12,
        fontSize: 22,
        fill: "#fff",
        fontFamily: "system-ui",
      });

      // Simple hover effect for feedback
      btnGroup.on("mouseenter", () => {
        document.body.style.cursor = "pointer";
        btnRect.fill("#4338ca");
        popupLayer.batchDraw();
      });
      btnGroup.on("mouseleave", () => {
        document.body.style.cursor = "default";
        btnRect.fill("#4f46e5");
        popupLayer.batchDraw();
      });

      // When a button is clicked, decide correctness and fill the blank accordingly
      btnGroup.on("click tap", () => {
        // Clear any running countdowns so the timeout won't also fire later
        if (this.popupCountdownInterval) {
          clearInterval(this.popupCountdownInterval);
          this.popupCountdownInterval = null;
        }
        if (this.popupTimerId) {
          clearTimeout(this.popupTimerId);
          this.popupTimerId = null;
        }

        const correctChoice = opt.type === expectedType;

        if (correctChoice) {
          // Player picked correct word
          this.fillBlankWithWord(blankNode, opt.word, true);
        } else {
          // Player picked wrong word — we still fill with the correct one,
          // but penalize them via loseHeart() inside fillBlankWithWord().
          this.fillBlankWithWord(blankNode, correct.word, false);
        }

        // Fade out and then destroy the popup layer for a polished exit
        popupLayer.to({
          opacity: 0,
          duration: 0.25,
          onFinish: () => {
            popupLayer.destroy();
            this.isPopupOpen = false;
            this.activePopupLayer = null;
          },
        });
        stage.batchDraw();
      });

      btnGroup.add(btnRect, btnLabel);
      popupLayer.add(btnGroup);
    });

    // Ensure the popup is in front of other layers
    popupLayer.moveToTop();
    popupLayer.batchDraw();

    // Start the 10-second countdown timer for this popup
    this.startPopupTimer(blankNode, expectedType, popupLayer);
  }

  /**
   * @brief Fills a specific blank with a given word and handles correctness effects.
   *
   * This is called from the popup logic:
   *  - For correct choices: `correct = true`.
   *  - For wrong choices: `correct = false` and we apply a heart penalty.
   *
   * @param blankNode The specific blank being filled.
   * @param word      The word to write into that blank.
   * @param correct   Whether the choice is considered correct.
   */
  private fillBlankWithWord(blankNode: Konva.Text, word: string, correct: boolean): void {
    // Replace underscores with the chosen word + trailing space
    blankNode.text(word + " ");
    blankNode.fill("#111");
    blankNode.fontStyle("normal");

    // Update our internal blank tracking
    const b = this.blanks.find((bb) => bb.node === blankNode);
    if (b) {
      b.filled = true;

      // If there is a type label under this blank, remove it now
      if (b.typeNode) {
        b.typeNode.destroy();
        b.typeNode = undefined;
      }
    }

    // Visual feedback and heart penalty (if incorrect)
    if (correct) {
      this.flashFeedback("✅ Correct!");
    } else {
      this.flashFeedback("❌ Wrong! But here’s the correct word.");
      this.wrongFlashAnimation(blankNode);
      this.loseHeart("That was the wrong word!");
    }

    // After filling, we may need to reflow lines, since the word width differs
    this.relayoutStory();
    this.group.getLayer()?.batchDraw();

    // Always notify controller that a blank was filled
    if (this.blankFilledHandler) {
      this.blankFilledHandler();
    }
  }

  /**
   * @brief Briefly flashes the blank in red to indicate a mistake, then restores its color.
   *
   * @param node The text node representing the blank that was just filled incorrectly.
   */
  private wrongFlashAnimation(node: Konva.Text): void {
    const origColor = node.fill();
    node.fill("#dc2626");
    this.group.getLayer()?.batchDraw();
    setTimeout(() => {
      node.fill(origColor as string);
      this.group.getLayer()?.batchDraw();
    }, 800);
  }

  /**
   * @brief Repositions all story text + blanks to maintain readable line wrapping.
   *
   * We do this after blanks are filled because:
   *   - Filled words may have different width than "__________".
   *   - That can cause lines to overflow or look awkward.
   *
   * Behavior:
   *  - Iterates over all text nodes that are part of the story.
   *  - Calculates new X/Y positions with simple word wrapping.
   *  - Repositions type labels so they remain under their blanks.
   *  - Skips non-story HUD elements (hearts, feedback).
   */
  private relayoutStory(): void {
    const paragraphY = 100;
    const lineHeight = 40;
    const marginX = window.innerWidth * 0.05;
    const maxWidth = window.innerWidth * 0.9;

    let x = marginX;
    let y = paragraphY;

    // These nodes should not be moved during story reflow:
    // - Heart counter
    // - Feedback message
    // - Type labels under blanks (we reposition those separately)
    const excludedNodes = new Set<Konva.Node>([
      this.heartText,
      this.feedbackText,
      ...((this.blanks.map((b) => b.typeNode).filter(Boolean) as Konva.Text[])),
    ]);

    // Iterate over all children; reposition only story text nodes
    this.group.getChildren().forEach((node: Konva.Node) => {
      if (!(node instanceof Konva.Text)) return;
      if (excludedNodes.has(node)) return; // skip HUD + type labels

      // Wrap to next line if we exceed maxWidth
      if (x + node.width() > marginX + maxWidth) {
        x = marginX;
        y += lineHeight;
      }

      node.position({ x, y });
      x += node.width();
    });

    // Now reposition all type labels to remain under their blanks
    this.blanks.forEach((b) => {
      const { node: blank, typeNode } = b;
      if (!typeNode) return;

      const labelX = blank.x() + blank.width() / 2 - typeNode.width() / 2;
      const labelY = blank.y() + blank.height() + 4;

      typeNode.position({ x: labelX, y: labelY });
    });

    this.group.getLayer()?.batchDraw();
  }

  /** ===========================
   *  POPUP TIMER (10 SECONDS)
   *  ===========================
   */

  /**
   * @brief Starts a 10-second countdown timer for the active popup.
   *
   * Behavior:
   *  - Shows a "⏳ N" timer near the popup card.
   *  - Updates every second via `setInterval`.
   *  - After 10 seconds, if the popup is still open:
   *      - The timer stops.
   *      - The player loses a heart.
   *      - A "Time's up!" feedback message is shown.
   *      - The popup fades out and closes.
   *
   * @param blankNode    The blank associated with this popup (not changed here).
   * @param expectedType The type required for that blank (not changed here).
   * @param popupLayer   The top layer containing this popup UI.
   */
  private startPopupTimer(
    _blankNode: Konva.Text,
    _expectedType: string,
    popupLayer: Konva.Layer
  ): void {
    // Clear any previous timer to avoid overlapping countdowns
    if (this.popupTimerId) {
      clearTimeout(this.popupTimerId);
      this.popupTimerId = null;
    }

    // Create an on-screen countdown text
    const timerText = new Konva.Text({
      text: "⏳ 10",
      x: popupLayer.width() / 2 - 20,
      y: popupLayer.height() / 2 - 120,
      fontSize: 22,
      fontFamily: "system-ui",
      fill: "#dc2626",
    });
    popupLayer.add(timerText);
    popupLayer.batchDraw();

    let secondsLeft = 10;

    // Interval updates timerText every second. Stored on the instance so
    // it can be cleared from other code paths (e.g., when a choice is made).
    this.popupCountdownInterval = window.setInterval(() => {
      secondsLeft--;
      timerText.text(`⏳ ${secondsLeft}`);
      popupLayer.batchDraw();
    }, 1000);

    // Timeout fires once after 10 seconds to handle time expiration
    this.popupTimerId = window.setTimeout(() => {
      if (this.popupCountdownInterval) {
        clearInterval(this.popupCountdownInterval);
        this.popupCountdownInterval = null;
      }
      this.popupTimerId = null;

      // Inform the player via feedback + heart penalty
      this.flashFeedback("⏰ Time's up!");
      this.loseHeart("You ran out of time!");

      // Fade out the popup, then destroy its layer and reset popup flags
      popupLayer.to({
        opacity: 0,
        duration: 0.25,
        onFinish: () => {
          popupLayer.destroy();
          this.isPopupOpen = false;
          this.activePopupLayer = null;
        },
      });
    }, 10000);
  }

  /** ===========================
   *  MINI-GAME REDIRECT
   *  ===========================
   */

  /**
   * @brief Redirects to the mini-game selection screen when hearts run out.
   *
   * The logic:
   *  1. Save the current hearts to `sessionStorage` under "madlib_prev_hearts".
   *  2. Build a URL to `/index.html?screen=miniGameSelect`.
   *  3. Navigate window.location to that URL.
   *  4. If anything fails (URL construction, sessionStorage in strict contexts),
   *     call `onResume()` to allow fallback (e.g., resume game locally).
   *
   * The App class will interpret `screen=miniGameSelect` and show the
   * mini-game selection UI. After mini-game completion, hearts can be
   * restored using the saved value and possibly incremented with bonus hearts.
   *
   * @param onResume Function called if redirect fails (fallback behavior).
   */
  private triggerMiniGame(onResume: () => void): void {
    try {
      // Persist current hearts for restore when returning from mini-game
      try {
        console.log("MadLibPhaseView.triggerMiniGame: saving madlib_prev_hearts ->", this.hearts);
        sessionStorage.setItem("madlib_prev_hearts", String(this.hearts));
      } catch (e) {
        console.warn("MadLibPhaseView.triggerMiniGame: failed to write sessionStorage", e);
        // If session storage fails, we still proceed with the redirect.
      }

      // Build URL pointing back to the main app entry (index.html)
      const url = new URL("/index.html", window.location.origin);
      url.searchParams.set("screen", "miniGameSelect");

      // Navigate to mini-game selection; App will handle the rest
      window.location.href = url.toString();
    } catch (err) {
      // If anything goes wrong (e.g., invalid URL, restricted environment),
      // just call onResume to let the caller restore state locally.
      console.error("Failed to redirect to mini game selection, resuming game instead.", err);
      onResume();
    }
  }

  /** ===========================
   *  HEART SETTERS / GETTERS
   *  ===========================
   */

  /**
   * @brief Allows external code (controller) to set hearts explicitly.
   *
   * This is typically called when returning from mini-games, where the
   * updated heart count was computed externally (e.g., add bonus hearts,
   * clamp to some max, etc.).
   *
   * @param n The new hearts total to display.
   */
  setHearts(n: number): void {
    this.hearts = n;
    if (this.heartText) this.heartText.text(`❤️ Hearts: ${this.hearts}`);
    this.group.getLayer()?.batchDraw();
  }

  /**
   * @brief Increments hearts by `n` and shows a short gain feedback message.
   *
   * This is used when the mini-game rewards hearts and GameScreenController
   * forwards those hearts back to the Mad Libs view.
   *
   * @param n Number of hearts to add (ignored if <= 0).
   */
  addHearts(n: number): void {
    if (n <= 0) return;
    this.hearts += n;
    this.flashFeedback(`💖 Gained ${n} heart${n > 1 ? "s" : ""}!`);
    this.heartText.text(`❤️ Hearts: ${this.hearts}`);
    this.group.getLayer()?.batchDraw();
  }

  /** ===========================
   *  SIMPLE HELPERS & EVENTS
   *  ===========================
   */

  /**
   * @brief Returns true if all blanks in the story have been filled.
   *
   * Used by the controller to decide when to transition to the results screen.
   */
  allBlanksFilled(): boolean {
    return this.blanks.every((b) => b.filled);
  }

  /**
   * @brief Registers the handler to call when a word in the word bank is clicked.
   *
   * @param cb Handler with `(word, type)` parameters.
   *
   * NOTE: If `drawWordBank()` is not invoked, this handler will never be used.
   *       Popup logic currently handles most interaction instead.
   */
  onWordClicked(cb: (word: string, type: string) => void): void {
    this.wordClickHandler = cb;
  }

  /**
   * @brief Handles window resize: rebuilds the story and HUD.
   *
   * This is a blunt approach:
   *  - Destroys all child nodes.
   *  - Reconstructs the story from the original template and wordBank.
   *  - Rebuilds the HUD.
   *  - Restores hearts and retains the blank-filled callback.
   *
   * NOTE: This does NOT re-fill previously filled blanks yet; it simply
   *       redraws the story from the original template. If you want to
   *       fully preserve filled state across resizes, you would need to
   *       store which blanks had which words and reapply them here.
   */
  private onResize(): void {
    const prevHandler = this.blankFilledHandler;
    const prevHearts = this.hearts;

    // Remove all render nodes and reset blank tracking
    this.group.destroyChildren();
    this.blanks = [];

    // Re-render the story and HUD
    this.drawStory();
    // this.drawWordBank(); // optional, currently disabled
    this.drawHUD();

    // Restore the previously registered completion handler and hearts
    this.blankFilledHandler = prevHandler;
    this.hearts = prevHearts;
  }

  /**
   * @brief Returns the root Konva group for this Mad Libs view.
   *
   * The controller uses this to attach the view into the main Konva layer.
   */
  getGroup(): Konva.Group {
    return this.group;
  }
}