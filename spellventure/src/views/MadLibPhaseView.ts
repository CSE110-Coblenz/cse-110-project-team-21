/**
 * @file MadLibPhaseView.ts
 * @brief Renders and manages the Mad Libs story paragraph, word bank, hearts,
 * feedback messages, timed popups, and mini-game redirects.
 *
 * This class is the **view layer** for the Mad Libs phase:
 * - It takes a story template string with `[type]` placeholders.
 * - It draws those placeholders as interactive blanks in a paragraph layout.
 * - It displays a word bank (currently optional / commented out).
 * - It tracks hearts and shows feedback when the player makes mistakes.
 * - It shows a timed popup for choosing words for a blank.
 * - It redirects to the mini-game selection when hearts reach zero.
 */

import Konva from "konva";

/**
 * @brief Simple data structure used to represent typed words for blanks.
 *
 * Each word carries:
 * - `word`: the literal string shown to the player.
 * - `type`: the grammatical/semantic role (e.g., "noun", "verb", "adjective").
 * This must match the placeholder text inside `[ ]` in the story
 * for the word to be considered a "correct" match.
 */
interface WordData {
  word: string;
  type: string;
}

interface LayoutItem {
  type: 'text' | 'blank';
  content: string; 
  width: number;
  height: number;
  node?: Konva.Text; 
}

export default class MadLibPhaseView {
  /** Root Konva group for everything in the Mad Lib phase. */
  private group: Konva.Group;

  private backgroundGroup: Konva.Group;
  private backgroundAnim: Konva.Animation;

  /** Original story template containing `[type]` placeholders. */
  private storyTemplate: string;

  /**
   * Words passed in from GameScreenController:
   * - Each has `word` + `type`.
   * - These represent the "correct" answers for blanks in the story.
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
   * - `node`: the Konva.Text node for the word.
   * - `word`: the string value.
   * - `type`: the word's category, used to match blanks.
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
   * - sits on top of the main game layer,
   * - contains the dim background overlay, popup rectangle, buttons, timer.
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
  
  private cardLayout: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

  /**
   * @brief Constructor wires up the story template, word bank, and HUD.
   *
   * @param story The story template string containing `[type]` placeholders.
   * @param words The word set from the game phase `{ word, type }[]`.
   * These represent the "correct" options for the blanks.
   */
  constructor(story: string, words: WordData[]) {
    this.group = new Konva.Group();
    this.storyTemplate = story;
    this.wordBank = words;

    this.createBackground();
    this.group.add(this.backgroundGroup);

    this.backgroundAnim = new Konva.Animation((frame) => {
      const timeDiff = (frame?.timeDiff || 0) / 1000; 
      this.animateBackground(timeDiff);
    }, this.group.getLayer());
    
    this.drawStory();

    this.drawHUD();

    window.addEventListener("resize", () => this.onResize());
  }

  show(): void {
    this.group.visible(true);
    this.backgroundAnim.start();
  }

  hide(): void {
    this.group.visible(false);
    this.backgroundAnim.stop();
  }

  private createBackground(): void {
    this.backgroundGroup = new Konva.Group({ listening: false });
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ?!@#&";
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = 150; 

    for (let i = 0; i < count; i++) {
      const char = letters.charAt(Math.floor(Math.random() * letters.length));
      const scale = 0.5 + Math.random(); 

      const letter = new Konva.Text({
        text: char,
        x: Math.random() * width,
        y: Math.random() * height,
        fontSize: 40, 
        fontFamily: "Arial Black",
        fill: Math.random() > 0.6 ? "#cbd5e1" : (Math.random() > 0.5 ? "#c7d2fe" : "#f5d0fe"), 
        opacity: 0.15 * scale, 
        rotation: Math.random() * 360,
        scaleX: scale,
        scaleY: scale,
      });

      letter.setAttr('velocity', 20 * scale); 
      letter.setAttr('rotationSpeed', (Math.random() - 0.5) * 50); 

      this.backgroundGroup.add(letter);
    }
  }

  private animateBackground(dt: number): void {
    const height = window.innerHeight;
    
    this.backgroundGroup.getChildren().forEach((node) => {
      const letter = node as Konva.Text;
      const velocity = letter.getAttr('velocity');
      const rotSpeed = letter.getAttr('rotationSpeed');

      let newY = letter.y() - (velocity * dt);
      letter.rotation(letter.rotation() + (rotSpeed * dt));

      if (newY < -50) {
        newY = height + 50;
        letter.x(Math.random() * window.innerWidth); 
      }
      letter.y(newY);
    });
  }

  /** ===========================
   * STORY RENDERING
   * ===========================
   */

  /**
   * @brief Parses `storyTemplate` and renders it as multiple Konva.Text nodes.
   *
   * For each token in the story:
   * - Normal words are drawn as plain text.
   * - `[type]` placeholders are turned into interactive blanks:
   * - A visible blank: "__________"
   * - A type label (e.g., "noun") just under the blank
   *
   * The method also:
   * - Handles basic word wrapping using a max line width.
   * - Attaches click handlers to each blank so that clicking opens
   * a multiple-choice popup.
   */
  private drawStory(): void {
    const maxWidth = 800; 
    const lineHeight = 60; 
    const startX = (window.innerWidth - maxWidth) / 2;
    
    const items: LayoutItem[] = [];
    
    const parts = this.storyTemplate.split(/(\[[^\]]+\]|\s+)/).filter(p => p.length > 0);
    
    parts.forEach(part => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const type = part.slice(1, -1);
        items.push({
          type: 'blank',
          content: type,
          width: 140, 
          height: 40
        });
      } else if (!/^\s+$/.test(part)) {
        const tempText = new Konva.Text({
            text: part,
            fontSize: 24,
            fontFamily: "Montserrat, sans-serif",
            fontStyle: "500",
        });
        items.push({
          type: 'text',
          content: part,
          width: tempText.width(),
          height: tempText.height()
        });
      }
    });

    const storyGroup = new Konva.Group();
    let currentLine: LayoutItem[] = [];
    let currentLineWidth = 0;
    let y = 0;

    const flushLine = () => {
      if (currentLine.length === 0) return;

      const lineStartX = (maxWidth - currentLineWidth) / 2;
      let xObj = lineStartX;

      currentLine.forEach(item => {
        if (item.type === 'text') {
           const textNode = new Konva.Text({
             text: item.content,
             x: xObj,
             y: y + (40 - item.height) / 2, 
             fontSize: 24,
             fontFamily: "Montserrat, sans-serif",
             fontStyle: "500",
             fill: "#1e293b", 
           });
           storyGroup.add(textNode);
        } else {
           this.renderBlank(storyGroup, xObj, y, item.width, item.content);
        }
        xObj += item.width + 10; 
      });

      y += lineHeight;
      currentLine = [];
      currentLineWidth = 0;
    };

    items.forEach(item => {
      const potentialWidth = currentLineWidth + item.width + (currentLine.length > 0 ? 10 : 0);
      
      if (potentialWidth > maxWidth) {
        flushLine();
      }
      
      if (currentLine.length > 0) currentLineWidth += 10;
      currentLineWidth += item.width;
      currentLine.push(item);
    });
    flushLine();

    const cardHeight = y + 40; 
    const startY = (window.innerHeight - cardHeight) / 2;

    this.cardLayout = {
        x: startX - 40,
        y: startY - 40,
        width: maxWidth + 80,
        height: cardHeight + 40
    };

    const card = new Konva.Rect({
        x: this.cardLayout.x,
        y: this.cardLayout.y,
        width: this.cardLayout.width,
        height: this.cardLayout.height,
        fill: "white",
        cornerRadius: 20,
        shadowColor: "rgba(0,0,0,0.1)",
        shadowBlur: 20,
        shadowOffsetY: 10,
        stroke: "#e2e8f0",
        strokeWidth: 1
    });

    storyGroup.position({ x: startX, y: startY });

    this.group.add(card, storyGroup);
    this.group.getLayer()?.batchDraw();
  }

  private renderBlank(container: Konva.Group, x: number, y: number, width: number, type: string) {
      const blankLine = new Konva.Line({
        points: [x, y + 32, x + width, y + 32],
        stroke: "#4f46e5",
        strokeWidth: 2,
      });

      const clickRect = new Konva.Rect({
          x: x,
          y: y,
          width: width,
          height: 40,
          fill: "transparent",
      });

      const blankText = new Konva.Text({
        text: "", 
        x: x + 5,
        y: y + 5,
        fontSize: 24,
        fontFamily: "Montserrat",
        fill: "#4f46e5",
        fontStyle: "bold",
      });

      const typeLabel = new Konva.Text({
        text: type,
        x: x,
        y: y + 36, 
        width: width,
        align: "center",
        fontSize: 12,
        fontFamily: "Montserrat",
        fill: "#64748b",
        fontStyle: "italic",
      });

      clickRect.on("mouseenter", () => document.body.style.cursor = "pointer");
      clickRect.on("mouseleave", () => document.body.style.cursor = "default");
      clickRect.on("click tap", () => {
        const existing = this.blanks.find((b) => b.node === blankText);
        if (existing?.filled) return;
        if (this.isPopupOpen) return;
        this.showChoicePopup(blankText, type);
      });

      this.blanks.push({ node: blankText, type, filled: false, typeNode: typeLabel });
      container.add(blankLine, blankText, typeLabel, clickRect);
  }

  /** ===========================
   * HUD: HEARTS + FEEDBACK
   * ===========================
   */

  /**
   * @brief Renders the heart counter and the feedback text area at the top.
   *
   * This is called once on construction and re-run on resize via `drawHUD()`
   * so that positions are updated for new window sizes.
   */
  private drawHUD(): void {
    const cardRight = this.cardLayout.x + this.cardLayout.width;
    const cardTop = this.cardLayout.y;
    
    this.heartText = new Konva.Text({
      text: `❤️ Hearts: ${this.hearts}`,
      fontSize: 24,
      fontFamily: "Montserrat",
      fontStyle: "bold",
      fill: "#dc2626",
      shadowColor: "white",
      shadowBlur: 2,
    });
    
    this.heartText.position({
        x: cardRight - this.heartText.width(),
        y: cardTop - 35
    });

    this.feedbackText = new Konva.Text({
      text: "",
      width: 400,
      fontSize: 24,
      fontFamily: "Montserrat",
      fontStyle: "bold",
      fill: "#1e293b",
      align: "center",
      shadowColor: "white",
      shadowBlur: 10,
    });

    this.feedbackText.position({
        x: this.cardLayout.x + (this.cardLayout.width - 400) / 2,
        y: cardTop - 40
    });

    this.group.add(this.heartText, this.feedbackText);
  }

  /**
   * @brief Allows external code (controller) to register a callback that fires
   * whenever any blank in the story is filled.
   *
   * @param cb Function called with no arguments when a blank is filled.
   */
  onBlankFilled(cb: () => void): void {
    this.blankFilledHandler = cb;
  }

  /** ===========================
   * BLANK FILLING LOGIC
   * ===========================
   */

  /**
   * @brief Attempts to fill the next available blank that matches the requested type.
   *
   * @param word The word the player is trying to fill into a blank.
   * @param type The type of that word (must match the blank's `type`).
   * @return `true` if a matching blank was found and filled, `false` otherwise.
   *
   * Behavior:
   * - If there is an unfilled blank of that `type`, it is filled with `word`.
   * - The used word tile is removed from the word bank (if present).
   * - A "Correct!" feedback message is shown.
   * - If no matching blank is found, the player loses a heart and receives
   * an error feedback message about the wrong type.
   */
  fillNextBlank(word: string, type: string): boolean {
    const blank = this.blanks.find((b) => !b.filled && b.type === type);
    if (!blank) {
      this.loseHeart(`Wrong type! Looking for a ${type}`);
      return false;
    }
    blank.node.text(word);
    blank.filled = true;
    
    if(blank.typeNode) blank.typeNode.visible(false);

    this.wordTiles = this.wordTiles.filter((t) => {
        if(t.word === word && t.type === type) {
            t.node.destroy();
            return false;
        }
        return true;
    });

    this.flashFeedback("✅ Correct!");
    this.group.getLayer()?.batchDraw();

    if (this.blankFilledHandler) this.blankFilledHandler();
    return true;
  }

  /** ===========================
   * HEART / FEEDBACK SYSTEM
   * ===========================
   */

  /**
   * @brief Deducts a heart and shows a feedback message.
   *
   * This method is used whenever the player:
   * - selects a wrong type,
   * - runs out of time on a popup,
   * - or otherwise triggers an error condition.
   *
   * If hearts drop to 0 or below, this method triggers the mini-game
   * selection flow via `triggerMiniGame()`, and on success/resume,
   * resets hearts to at least 1.
   *
   * @param message A readable explanation (shown to the player) of what went wrong.
   */
  private loseHeart(message: string): void {
    this.hearts--;
    this.flashFeedback(`❌ ${message}`);
    this.updateHeartText();

    if (this.hearts <= 0) {
      this.triggerMiniGame(() => {
        this.hearts = 1;
        this.updateHeartText();
      });
    }
    this.group.getLayer()?.batchDraw();
  }

  private updateHeartText() {
      this.heartText.text(`❤️ Hearts: ${this.hearts}`);
      const cardRight = this.cardLayout.x + this.cardLayout.width;
      this.heartText.x(cardRight - this.heartText.width());
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
   * POPUP CHOICE SYSTEM
   * ===========================
   */

  /**
   * @brief Opens a multiple-choice popup for the given blank.
   *
   * The popup:
   * - dims the background with a semi-transparent overlay.
   * - shows a card asking for the correct word type (e.g., "noun").
   * - shows two buttons: one correct word, one incorrect word.
   * - starts a 10-second timer; if the player does not choose in time,
   * they lose a heart and the popup closes.
   *
   * @param blankNode    The Konva.Text node representing the blank in the story.
   * @param expectedType The type the blank expects (e.g., "noun", "verb").
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
      fill: "rgba(30, 41, 59, 0.6)",
      listening: true,
    });

    const popup = new Konva.Rect({
      x: stage.width() / 2 - 200,
      y: stage.height() / 2 - 120,
      width: 400,
      height: 240,
      fill: "#ffffff",
      cornerRadius: 20,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 30,
      listening: true,
    });

    const title = new Konva.Text({
      text: `Select a ${expectedType.toUpperCase()}`,
      x: popup.x(),
      y: popup.y() + 25,
      width: popup.width(),
      align: "center",
      fontSize: 22,
      fontFamily: "Montserrat",
      fontStyle: "bold",
      fill: "#4f46e5",
    });

    popupLayer.add(overlay, popup, title);

    options.forEach((opt, i) => {
      const btnGroup = new Konva.Group({
        x: popup.x() + 50,
        y: popup.y() + 80 + i * 70,
        width: popup.width() - 100,
        height: 55,
        listening: true,
      });

      const btnRect = new Konva.Rect({
        width: btnGroup.width(),
        height: btnGroup.height(),
        fill: "#f8fafc",
        stroke: "#e2e8f0",
        strokeWidth: 2,
        cornerRadius: 12,
      });

      const btnLabel = new Konva.Text({
        text: opt.word,
        width: btnGroup.width(),
        align: "center",
        y: 16,
        fontSize: 20,
        fontFamily: "Montserrat",
        fill: "#334155",
        fontStyle: "600"
      });

      btnGroup.on("mouseenter", () => {
        document.body.style.cursor = "pointer";
        btnRect.fill("#e0e7ff");
        btnRect.stroke("#6366f1");
        popupLayer.batchDraw();
      });
      btnGroup.on("mouseleave", () => {
        document.body.style.cursor = "default";
        btnRect.fill("#f8fafc");
        btnRect.stroke("#e2e8f0");
        popupLayer.batchDraw();
      });

      btnGroup.on("click tap", () => {
        this.clearPopupTimers();
        const correctChoice = opt.type === expectedType;
        this.fillBlankWithWord(blankNode, correctChoice ? opt.word : correct.word, correctChoice);
        this.closePopup(popupLayer);
      });

      btnGroup.add(btnRect, btnLabel);
      popupLayer.add(btnGroup);
    });

    popupLayer.batchDraw();
    this.startPopupTimer(blankNode, expectedType, popupLayer);
  }

  private clearPopupTimers() {
      if (this.popupCountdownInterval) {
          clearInterval(this.popupCountdownInterval);
          this.popupCountdownInterval = null;
      }
      if (this.popupTimerId) {
          clearTimeout(this.popupTimerId);
          this.popupTimerId = null;
      }
  }

  private closePopup(layer: Konva.Layer) {
      layer.destroy();
      this.isPopupOpen = false;
      this.activePopupLayer = null;
  }

  /**
   * @brief Fills a specific blank with a given word and handles correctness effects.
   *
   * This is called from the popup logic:
   * - For correct choices: `correct = true`.
   * - For wrong choices: `correct = false` and we apply a heart penalty.
   *
   * @param blankNode The specific blank being filled.
   * @param word      The word to write into that blank.
   * @param correct   Whether the choice is considered correct.
   */
  private fillBlankWithWord(blankNode: Konva.Text, word: string, correct: boolean): void {
    blankNode.text(word);
    blankNode.fill(correct ? "#4f46e5" : "#dc2626");

    const b = this.blanks.find((bb) => bb.node === blankNode);
    if (b) {
      b.filled = true;
      if (b.typeNode) b.typeNode.visible(false);
    }

    if (correct) {
      this.flashFeedback("✅ Correct!");
    } else {
      this.flashFeedback("❌ Wrong choice!");
      this.loseHeart("Wrong word choice!");
      setTimeout(() => {
          blankNode.fill("#4f46e5");
          this.group.getLayer()?.batchDraw();
      }, 1000);
    }

    this.group.getLayer()?.batchDraw();

    if (this.blankFilledHandler) this.blankFilledHandler();
  }

  /** ===========================
   * POPUP TIMER (10 SECONDS)
   * ===========================
   */

  /**
   * @brief Starts a 10-second countdown timer for the active popup.
   *
   * Behavior:
   * - Shows a "⏳ N" timer near the popup card.
   * - Updates every second via `setInterval`.
   * - After 10 seconds, if the popup is still open:
   * - The timer stops.
   * - The player loses a heart.
   * - A "Time's up!" feedback message is shown.
   * - The popup fades out and closes.
   *
   * @param blankNode    The blank associated with this popup (not changed here).
   * @param expectedType The type required for that blank (not changed here).
   * @param popupLayer   The top layer containing this popup UI.
   */
  private startPopupTimer(_blankNode: Konva.Text, _expectedType: string, popupLayer: Konva.Layer): void {
    this.clearPopupTimers();

    const timerText = new Konva.Text({
      text: "10",
      x: popupLayer.width() / 2 - 20,
      y: popupLayer.height() / 2 + 130,
      fontSize: 24,
      fontFamily: "Montserrat",
      fontStyle: "bold",
      fill: "#94a3b8",
    });
    popupLayer.add(timerText);

    let secondsLeft = 10;
    this.popupCountdownInterval = window.setInterval(() => {
      secondsLeft--;
      timerText.text(String(secondsLeft));
      if(secondsLeft <= 3) timerText.fill("#dc2626");
      popupLayer.batchDraw();
    }, 1000);

    this.popupTimerId = window.setTimeout(() => {
      this.clearPopupTimers();
      this.flashFeedback("⏰ Time's up!");
      this.loseHeart("You ran out of time!");
      this.closePopup(popupLayer);
    }, 10000);
  }

  /** ===========================
   * MINI-GAME REDIRECT
   * ===========================
   */

  /**
   * @brief Redirects to the mini-game selection screen when hearts run out.
   *
   * The logic:
   * 1. Save the current hearts to `sessionStorage` under "madlib_prev_hearts".
   * 2. Build a URL to `/index.html?screen=miniGameSelect`.
   * 3. Navigate window.location to that URL.
   * 4. If anything fails (URL construction, sessionStorage in strict contexts),
   * call `onResume()` to allow fallback (e.g., resume game locally).
   *
   * The App class will interpret `screen=miniGameSelect` and show the
   * mini-game selection UI. After mini-game completion, hearts can be
   * restored using the saved value and possibly incremented with bonus hearts.
   *
   * @param onResume Function called if redirect fails (fallback behavior).
   */
  private triggerMiniGame(onResume: () => void): void {
    try {
      try {
        sessionStorage.setItem("madlib_prev_hearts", String(this.hearts));
      } catch (e) {
        console.warn("Storage failed", e);
      }
      const url = new URL("/index.html", window.location.origin);
      url.searchParams.set("screen", "miniGameSelect");
      window.location.href = url.toString();
    } catch (err) {
      console.error("Redirect failed", err);
      onResume();
    }
  }

  /** ===========================
   * HEART SETTERS / GETTERS
   * ===========================
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
    this.updateHeartText();
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
    this.updateHeartText();
    this.group.getLayer()?.batchDraw();
  }

  /** ===========================
   * SIMPLE HELPERS & EVENTS
   * ===========================
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
   * Popup logic currently handles most interaction instead.
   */
  onWordClicked(cb: (word: string, type: string) => void): void {
    this.wordClickHandler = cb;
  }

  /**
   * @brief Handles window resize: rebuilds the story and HUD.
   *
   * This is a blunt approach:
   * - Destroys all child nodes.
   * - Reconstructs the story from the original template and wordBank.
   * - Rebuilds the HUD.
   * - Restores hearts and retains the blank-filled callback.
   *
   * NOTE: This does NOT re-fill previously filled blanks yet; it simply
   * redraws the story from the original template. If you want to
   * fully preserve filled state across resizes, you would need to
   * store which blanks had which words and reapply them here.
   */
  private onResize(): void {
    const prevHandler = this.blankFilledHandler;
    const prevHearts = this.hearts;

    this.group.destroyChildren();
    this.blanks = [];

    this.createBackground();
    this.group.add(this.backgroundGroup);
    
    this.drawStory();
    this.drawHUD(); 

    this.blankFilledHandler = prevHandler;
    this.hearts = prevHearts;
    this.updateHeartText();
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