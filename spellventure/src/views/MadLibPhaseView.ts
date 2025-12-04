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

  /** Soft rounded panel behind the story text. */
  private storyPanel: Konva.Rect | null = null;

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
    // Leave room for NavBar (70px) + HUD (~40px)
    const paragraphY = 130;
    const lineHeight = 44;

    // Horizontal margins and text wrapping width
    const marginX = window.innerWidth * 0.1;
    const maxWidth = window.innerWidth * 0.8;

    // Soft rounded story panel behind text
    const panelWidth = maxWidth + 40;
    const panelHeight = Math.max(window.innerHeight - 220, 220);
    const panelX = marginX - 20;
    const panelY = paragraphY - 20;

    this.storyPanel = new Konva.Rect({
      x: panelX,
      y: panelY,
      width: panelWidth,
      height: panelHeight,
      fill: "#f9fafb",
      cornerRadius: 24,
      shadowColor: "rgba(15,23,42,0.2)",
      shadowBlur: 16,
      shadowOffsetY: 6,
      listening: false,
      name: "story-panel",
    });
    this.group.add(this.storyPanel);

    // We'll walk the string and emit alternating text segments and blanks.
    let x = marginX;
    let y = paragraphY;

    const placeholderRe = /\[([^\]]+)\]/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;

    const baseFont = {
      fontSize: 24,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#111827",
      name: "story-node",
    } as const;

    // Helper to render an arbitrary text segment (may contain many words)
    const renderTextSegment = (segment: string) => {
      if (!segment) return;
      const parts = segment.split(/(\s+)/); // keep whitespace tokens
      for (const part of parts) {
        if (part === "") continue;

        if (/^\s+$/.test(part)) {
          const space = new Konva.Text({
            text: part,
            x,
            y,
            ...baseFont,
          });

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

        const text = new Konva.Text({
          text: part,
          x,
          y,
          ...baseFont,
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
        fontSize: 24,
        fontFamily: "Comic Sans MS, system-ui, sans-serif",
        fill: "#6366f1",
        fontStyle: "bold",
        name: "story-node",
        shadowColor: "rgba(129,140,248,0.0)",
        shadowBlur: 0,
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
        fontSize: 16,
        fontFamily: "Comic Sans MS, system-ui, sans-serif",
        fill: "#818cf8",
        fontStyle: "italic",
        name: "story-node",
      });

      // Gentle hover highlight for blanks
      blankText.on("mouseenter", () => {
        const existing = this.blanks.find((b) => b.node === blankText);
        if (existing?.filled) return;
        document.body.style.cursor = "pointer";
        blankText.scale({ x: 1.05, y: 1.05 });
        blankText.shadowColor("rgba(129,140,248,0.7)");
        blankText.shadowBlur(8);
        this.group.getLayer()?.batchDraw();
      });

      blankText.on("mouseleave", () => {
        document.body.style.cursor = "default";
        blankText.scale({ x: 1, y: 1 });
        blankText.shadowColor("rgba(129,140,248,0.0)");
        blankText.shadowBlur(0);
        this.group.getLayer()?.batchDraw();
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

  private drawWordBank(): void {
    const startY = window.innerHeight - 200;
    const startX = window.innerWidth * 0.1;
    const spacingX = 140;
    const spacingY = 50;

    const wordsPerRow = Math.floor((window.innerWidth * 0.8) / spacingX);

    this.wordBank.forEach((item, index) => {
      const row = Math.floor(index / wordsPerRow);
      const col = index % wordsPerRow;

      const node = new Konva.Text({
        text: item.word,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        fontSize: 24,
        fontFamily: "Comic Sans MS, system-ui, sans-serif",
        fill: "#22c55e",
        fontStyle: "bold",
        shadowColor: "rgba(0,0,0,0.15)",
        shadowBlur: 3,
      });

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

  private drawHUD(): void {
    // Place HUD just under the NavBar (70px tall)
    const hudY = 80;

    this.heartText = new Konva.Text({
      text: `❤️ Hearts: ${this.hearts}`,
      x: window.innerWidth - 260,
      y: hudY,
      fontSize: 24,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#f97373",
      shadowColor: "rgba(248,113,113,0.4)",
      shadowBlur: 6,
    });

    this.feedbackText = new Konva.Text({
      text: "",
      x: window.innerWidth / 2 - 180,
      y: hudY,
      width: 360,
      fontSize: 22,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#111827",
      align: "center",
    });

    this.group.add(this.heartText, this.feedbackText);
  }

  /** ===========================
   *  BLANK FILLING LOGIC
   *  ===========================
   */

  fillNextBlank(word: string, type: string): boolean {
    const blank = this.blanks.find((b) => !b.filled && b.type === type);
    if (!blank) {
      this.loseHeart(`Wrong type! Looking for a ${type}`);
      return false;
    }

    blank.node.text(word + " ");
    blank.node.fill("#111827");
    blank.node.fontStyle("bold");
    blank.filled = true;

    const tile = this.wordTiles.find((t) => t.word === word && t.type === type);
    if (tile) {
      tile.node.destroy();
      this.wordTiles = this.wordTiles.filter((t) => t !== tile);
    }

    this.flashFeedback("✅ Correct!");
    this.group.getLayer()?.batchDraw();

    if (this.blankFilledHandler) {
      this.blankFilledHandler();
    }
    return true;
  }

  /** ===========================
   *  HEART / FEEDBACK SYSTEM
   *  ===========================
   */

  private loseHeart(message: string): void {
    this.hearts--;
    this.flashFeedback(`❌ ${message}`);
    this.heartText.text(`❤️ Hearts: ${this.hearts}`);

    if (this.hearts <= 0) {
      this.triggerMiniGame(() => {
        this.hearts = 1;
        this.heartText.text(`❤️ Hearts: ${this.hearts}`);
      });
    }

    this.group.getLayer()?.batchDraw();
  }

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

  private showChoicePopup(blankNode: Konva.Text, expectedType: string): void {
    if (this.isPopupOpen) return;
    this.isPopupOpen = true;

    const baseLayer = this.group.getLayer();
    const stage = baseLayer?.getStage();
    if (!stage || !baseLayer) return;

    const correct = this.wordBank.find((w) => w.type === expectedType);
    if (!correct) return;

    const incorrectPool = this.incorrectWords.filter((w) => w.type !== expectedType);
    const wrong = incorrectPool[Math.floor(Math.random() * incorrectPool.length)];

    const options = Math.random() < 0.5 ? [correct, wrong] : [wrong, correct];

    const popupLayer = new Konva.Layer({ listening: true });
    this.activePopupLayer = popupLayer;
    stage.add(popupLayer);

    const overlay = new Konva.Rect({
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
      fill: "rgba(15,23,42,0.28)",
      listening: false,
    });

    const popup = new Konva.Rect({
      x: stage.width() / 2 - 190,
      y: stage.height() / 2 - 110,
      width: 380,
      height: 220,
      fill: "#f9fafb",
      stroke: "#818cf8",
      strokeWidth: 2,
      cornerRadius: 18,
      shadowColor: "rgba(15,23,42,0.35)",
      shadowBlur: 14,
      shadowOffsetY: 8,
      listening: true,
    });

    const title = new Konva.Text({
      text: `Choose the correct ${expectedType}`,
      x: popup.x(),
      y: popup.y() + 20,
      width: popup.width(),
      align: "center",
      fontSize: 22,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#111827",
    });

    popupLayer.add(overlay, popup, title);

    options.forEach((opt, i) => {
      const btnGroup = new Konva.Group({
        x: popup.x() + 40,
        y: popup.y() + 70 + i * 64,
        width: popup.width() - 80,
        height: 52,
        listening: true,
      });

      const btnRect = new Konva.Rect({
        width: btnGroup.width(),
        height: btnGroup.height(),
        fill: i === 0 ? "#a5b4fc" : "#f9a8d4",
        opacity: 1,
        cornerRadius: 14,
        shadowColor: "rgba(15,23,42,0.25)",
        shadowBlur: 6,
        shadowOffsetY: 3,
      });

      const btnLabel = new Konva.Text({
        text: opt.word,
        width: btnGroup.width(),
        align: "center",
        y: 14,
        fontSize: 22,
        fontFamily: "Comic Sans MS, system-ui, sans-serif",
        fill: "#111827",
        listening: false,
      });

      btnGroup.on("mouseenter", () => {
        document.body.style.cursor = "pointer";
        btnRect.to({
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 0.1,
        });
        popupLayer.batchDraw();
      });
      btnGroup.on("mouseleave", () => {
        document.body.style.cursor = "default";
        btnRect.to({
          scaleX: 1,
          scaleY: 1,
          duration: 0.1,
        });
        popupLayer.batchDraw();
      });

      btnGroup.on("click tap", () => {
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
          this.fillBlankWithWord(blankNode, opt.word, true);
        } else {
          this.fillBlankWithWord(blankNode, correct.word, false);
        }

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

    // Animated popup scale + fade-in
    popupLayer.opacity(0);
    popupLayer.scale({ x: 0.9, y: 0.9 });
    popupLayer.to({
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.25,
      easing: Konva.Easings.EaseOut,
    });

    popupLayer.moveToTop();
    popupLayer.batchDraw();

    this.startPopupTimer(blankNode, expectedType, popupLayer);
  }

  private fillBlankWithWord(blankNode: Konva.Text, word: string, correct: boolean): void {
    blankNode.text(word + " ");
    blankNode.fill("#111827");
    blankNode.fontStyle("bold");

    const b = this.blanks.find((bb) => bb.node === blankNode);
    if (b) {
      b.filled = true;
      if (b.typeNode) {
        b.typeNode.destroy();
        b.typeNode = undefined;
      }
    }

    if (correct) {
      this.flashFeedback("✅ Correct!");
    } else {
      this.flashFeedback("❌ Wrong! But here’s the correct word.");
      this.wrongFlashAnimation(blankNode);
      this.loseHeart("That was the wrong word!");
    }

    this.relayoutStory();
    this.group.getLayer()?.batchDraw();

    if (this.blankFilledHandler) {
      this.blankFilledHandler();
    }
  }

  private wrongFlashAnimation(node: Konva.Text): void {
    const origColor = node.fill();
    node.fill("#ef4444");
    this.group.getLayer()?.batchDraw();
    setTimeout(() => {
      node.fill(origColor as string);
      this.group.getLayer()?.batchDraw();
    }, 800);
  }

  private relayoutStory(): void {
    const paragraphY = 130;
    const lineHeight = 44;
    const marginX = window.innerWidth * 0.1;
    const maxWidth = window.innerWidth * 0.8;

    let x = marginX;
    let y = paragraphY;

    const excludedNodes = new Set<Konva.Node>([
      this.heartText,
      this.feedbackText,
      ...((this.blanks.map((b) => b.typeNode).filter(Boolean) as Konva.Text[])),
      this.storyPanel as Konva.Node,
    ]);

    this.group.getChildren().forEach((node: Konva.Node) => {
      if (!(node instanceof Konva.Text)) return;
      if (excludedNodes.has(node)) return;

      if (x + node.width() > marginX + maxWidth) {
        x = marginX;
        y += lineHeight;
      }

      node.position({ x, y });
      x += node.width();
    });

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

  private startPopupTimer(
    _blankNode: Konva.Text,
    _expectedType: string,
    popupLayer: Konva.Layer
  ): void {
    if (this.popupTimerId) {
      clearTimeout(this.popupTimerId);
      this.popupTimerId = null;
    }

    const timerText = new Konva.Text({
      text: "⏳ 10",
      x: popupLayer.width() / 2 - 20,
      y: popupLayer.height() / 2 - 140,
      fontSize: 22,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#f97373",
    });
    popupLayer.add(timerText);
    popupLayer.batchDraw();

    let secondsLeft = 10;

    this.popupCountdownInterval = window.setInterval(() => {
      secondsLeft--;
      timerText.text(`⏳ ${secondsLeft}`);
      popupLayer.batchDraw();
    }, 1000);

    this.popupTimerId = window.setTimeout(() => {
      if (this.popupCountdownInterval) {
        clearInterval(this.popupCountdownInterval);
        this.popupCountdownInterval = null;
      }
      this.popupTimerId = null;

      this.flashFeedback("⏰ Time's up!");
      this.loseHeart("You ran out of time!");

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

  private triggerMiniGame(onResume: () => void): void {
    try {
      try {
        console.log("MadLibPhaseView.triggerMiniGame: saving madlib_prev_hearts ->", this.hearts);
        sessionStorage.setItem("madlib_prev_hearts", String(this.hearts));
      } catch (e) {
        console.warn("MadLibPhaseView.triggerMiniGame: failed to write sessionStorage", e);
      }

      const url = new URL("/index.html", window.location.origin);
      url.searchParams.set("screen", "miniGameSelect");
      window.location.href = url.toString();
    } catch (err) {
      console.error("Failed to redirect to mini game selection, resuming game instead.", err);
      onResume();
    }
  }

  /** ===========================
   *  HEART SETTERS / GETTERS
   *  ===========================
   */

  setHearts(n: number): void {
    this.hearts = n;
    if (this.heartText) this.heartText.text(`❤️ Hearts: ${this.hearts}`);
    this.group.getLayer()?.batchDraw();
  }

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

  allBlanksFilled(): boolean {
    return this.blanks.every((b) => b.filled);
  }

  onWordClicked(cb: (word: string, type: string) => void): void {
    this.wordClickHandler = cb;
  }

  private onResize(): void {
    const prevHandler = this.blankFilledHandler;
    const prevHearts = this.hearts;

    this.group.destroyChildren();
    this.blanks = [];
    this.storyPanel = null;

    this.drawStory();
    // this.drawWordBank(); // optional
    this.drawHUD();

    this.blankFilledHandler = prevHandler;
    this.hearts = prevHearts;
    if (this.heartText) this.heartText.text(`❤️ Hearts: ${this.hearts}`);
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}
