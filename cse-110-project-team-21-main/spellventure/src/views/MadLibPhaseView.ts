/**
 * @file MadLibPhaseView.ts
 * @brief Renders a clean, readable Mad Libs paragraph and handles word selections + blank filling + heart logic.
 */

import Konva from "konva";

interface WordData {
  word: string;
  type: string;
}

export default class MadLibPhaseView {
  private group: Konva.Group;
  private storyTemplate: string;
  private wordBank: WordData[];
  private blanks: { node: Konva.Text; type: string; filled: boolean; typeNode?: Konva.Text }[] = [];
  private wordTiles: { node: Konva.Text; word: string; type: string }[] = [];
  private wordClickHandler: ((word: string, type: string) => void) | null = null;
  private blankFilledHandler: (() => void) | null = null;
  private isPopupOpen = false;
  private activePopupLayer: Konva.Layer | null = null;
  private popupTimerId: number | null = null;

  onBlankFilled(cb: () => void): void {
    this.blankFilledHandler = cb;
  }

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


  private heartText!: Konva.Text;
  private feedbackText!: Konva.Text;
  private hearts = 3;

  constructor(story: string, words: WordData[]) {
    this.group = new Konva.Group();
    this.storyTemplate = story;
    this.wordBank = words;

    this.drawStory();
    //this.drawWordBank();
    this.drawHUD();
    window.addEventListener("resize", () => this.onResize());
  }

  /** === STORY RENDERING === */
  private drawStory(): void {
    const paragraphY = 100;
    const lineHeight = 40;
    const marginX = window.innerWidth * 0.1;
    const maxWidth = window.innerWidth * 0.8;

    const words = this.storyTemplate.split(" ");
    let x = marginX;
    let y = paragraphY;

    for (const token of words) {
      const match = token.match(/\[(.*?)\]/);
  let display = token;
      let type = "";

      if (match) {
        type = match[1];

        // Create a visible blank and a smaller type label underneath
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

        // If the blank would overflow the line, wrap first
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

        // Make blanks interactive
        blankText.on("click tap", () => {
          const existing = this.blanks.find((b) => b.node === blankText);
          // Don’t open if already filled
          if (existing?.filled) return;

          // Don’t open if a popup is already showing
          if (this.isPopupOpen) return;

          // Otherwise, show it
          this.showChoicePopup(blankText, type);
        });

        this.blanks.push({ node: blankText, type, filled: false, typeNode: typeLabel });

        this.group.add(blankText);
        this.group.add(typeLabel);

        x += blankText.width();
        continue;
      }

      const text = new Konva.Text({
        text: display + " ",
        x,
        y,
        fontSize: 22,
        fontFamily: "system-ui",
        fill: "#111",
        fontStyle: "normal",
        name: "story-node",
      });

      // Line wrap for normal text
      if (x + text.width() > marginX + maxWidth) {
        x = marginX;
        y += lineHeight;
        text.x(x);
        text.y(y);
      }

      this.group.add(text);
      x += text.width();
    }

    this.group.getLayer()?.batchDraw();
  }

  /** === WORD BANK === */
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
        fill: "#16a34a",
        fontStyle: "bold",
        shadowColor: "rgba(0,0,0,0.2)",
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

  /** === HUD: Hearts + Feedback === */
  private drawHUD(): void {
    this.heartText = new Konva.Text({
      text: `❤️ Hearts: ${this.hearts}`,
      x: window.innerWidth - 250,
      y: 30,
      fontSize: 22,
      fontFamily: "system-ui",
      fill: "#dc2626",
    });

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

  /** === FILL BLANK LOGIC === */
  fillNextBlank(word: string, type: string): boolean {
    const blank = this.blanks.find((b) => !b.filled && b.type === type);
    if (!blank) {
      this.loseHeart(`Wrong type! Looking for a ${type}`);
      return false;
    }

    blank.node.text(word + " ");
    blank.node.fill("#111");
    blank.node.fontStyle("normal");
    blank.filled = true;

    // Remove the used word
    const tile = this.wordTiles.find((t) => t.word === word && t.type === type);
    if (tile) {
      tile.node.destroy();
      this.wordTiles = this.wordTiles.filter((t) => t !== tile);
    }

    this.flashFeedback("✅ Correct!");
    this.group.getLayer()?.batchDraw();
    // Notify listeners that a blank was filled
    if (this.blankFilledHandler) {
      this.blankFilledHandler();
    }
    return true;
  }

  /** === HEART / FEEDBACK SYSTEM === */
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

  /** === CHOICE POPUP  === */
private showChoicePopup(blankNode: Konva.Text, expectedType: string): void {
  if (this.isPopupOpen) return; // block any extra popups
  this.isPopupOpen = true;
  const baseLayer = this.group.getLayer();
  const stage = baseLayer?.getStage();
  if (!stage || !baseLayer) return;

  // Find correct & incorrect words
  const correct = this.wordBank.find((w) => w.type === expectedType);
  if (!correct) return;

  const incorrectPool = this.incorrectWords.filter((w) => w.type !== expectedType);
  const wrong = incorrectPool[Math.floor(Math.random() * incorrectPool.length)];
  const options = Math.random() < 0.5 ? [correct, wrong] : [wrong, correct];

  // Create popup in its own layer
  const popupLayer = new Konva.Layer({ listening: true });
  this.activePopupLayer = popupLayer;
  stage.add(popupLayer);

  // Gray overlay that does NOT block button clicks
  const overlay = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: "rgba(0,0,0,0.3)",
    listening: false,
  });

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

    // Hover effect
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

    btnGroup.on("click tap", () => {
      const correctChoice = opt.type === expectedType;

      if (correctChoice) {
        this.fillBlankWithWord(blankNode, opt.word, true);
      } else {
        this.fillBlankWithWord(blankNode, correct.word, false);
      }

      // Fade out popup for polish
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

  popupLayer.moveToTop();
  popupLayer.batchDraw();
  this.startPopupTimer(blankNode, expectedType, popupLayer);
}



  private fillBlankWithWord(blankNode: Konva.Text, word: string, correct: boolean): void {
    // replace underscores with the filled in word
    blankNode.text(word + " ");
    blankNode.fill("#111");
    blankNode.fontStyle("normal");

    // find the matching blank and mark it as filled
    const b = this.blanks.find((bb) => bb.node === blankNode);
    if (b) {
      b.filled = true;

      // remove or hide its "type" label if it exists
      if (b.typeNode) {
        b.typeNode.destroy();

        // (smooth fade-out)
        // b.typeNode.to({ opacity: 0, duration: 0.3, onFinish: () => b.typeNode?.destroy() });

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

    // Always notify controller that a blank was filled
    if (this.blankFilledHandler) {
      this.blankFilledHandler();
    }
  }

  private wrongFlashAnimation(node: Konva.Text): void {
    const origColor = node.fill();
    node.fill("#dc2626");
    this.group.getLayer()?.batchDraw();
    setTimeout(() => {
      node.fill(origColor as string);
      this.group.getLayer()?.batchDraw();
    }, 800);
  }

  /** Reflow only main story text and blanks (ignore HUD + type labels) */
  private relayoutStory(): void {
    const paragraphY = 100;
    const lineHeight = 40;
    const marginX = window.innerWidth * 0.05;
    const maxWidth = window.innerWidth * 0.9;

    let x = marginX;
    let y = paragraphY;

    const excludedNodes = new Set<Konva.Node>([
      this.heartText,
      this.feedbackText,
      ...this.blanks.map((b) => b.typeNode).filter(Boolean) as Konva.Text[],
    ]);

    // reflow story + blanks
    this.group.getChildren().forEach((node: Konva.Node) => {
      if (!(node instanceof Konva.Text)) return;
      if (excludedNodes.has(node)) return; // skip type labels and HUD

      if (x + node.width() > marginX + maxWidth) {
        x = marginX;
        y += lineHeight;
      }

      node.position({ x, y });
      x += node.width();
    });

    // align type labels directly below their blanks
    this.blanks.forEach((b) => {
      const { node: blank, typeNode } = b;
      if (!typeNode) return;

      const labelX = blank.x() + blank.width() / 2 - typeNode.width() / 2;
      const labelY = blank.y() + blank.height() + 4;

      typeNode.position({ x: labelX, y: labelY });
    });

    this.group.getLayer()?.batchDraw();
  }

  /** Starts a 10s timer for the active popup */
  private startPopupTimer(blankNode: Konva.Text, expectedType: string, popupLayer: Konva.Layer): void {
    if (this.popupTimerId) {
      clearTimeout(this.popupTimerId);
      this.popupTimerId = null;
    }

    // Create a visible countdown
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
    const countdownInterval = setInterval(() => {
      secondsLeft--;
      timerText.text(`⏳ ${secondsLeft}`);
      popupLayer.batchDraw();
    }, 1000);

    // Save timeout ID for cleanup
    this.popupTimerId = window.setTimeout(() => {
      clearInterval(countdownInterval);
      this.popupTimerId = null;

      // User took too long
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

  /** === MINI GAME PLACEHOLDER === */
  private triggerMiniGame(onResume: () => void): void {
    // Redirect to the mini-game selection page instead of showing the placeholder overlay.
    // This navigates back to the main app and asks it to open the mini-game selection screen.
    try {
      // Persist current hearts so we can restore exact state when the player returns.
      try {
        console.log('MadLibPhaseView.triggerMiniGame: saving madlib_prev_hearts ->', this.hearts);
        sessionStorage.setItem('madlib_prev_hearts', String(this.hearts));
      } catch (e) {
        console.warn('MadLibPhaseView.triggerMiniGame: failed to write sessionStorage', e);
        // ignore sessionStorage errors (e.g., in stricter embed contexts)
      }
      const url = new URL('/index.html', window.location.origin);
      url.searchParams.set('screen', 'miniGameSelect');
      // Navigate now — the app will handle loading the mini-game selection UI.
      window.location.href = url.toString();
    } catch (err) {
      // Fallback: if URL construction fails, just call onResume to let the caller recover
      console.error('Failed to redirect to mini game selection, resuming game instead.', err);
      onResume();
    }
  }

  /** Allow external controllers to set hearts explicitly (used when resuming after mini-game) */
  setHearts(n: number): void {
    this.hearts = n;
    if (this.heartText) this.heartText.text(`❤️ Hearts: ${this.hearts}`);
    this.group.getLayer()?.batchDraw();
  }

  /** === HELPERS === */
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
    this.drawStory();
    //this.drawWordBank();
    this.drawHUD();
    this.blankFilledHandler = prevHandler;
    this.hearts = prevHearts;
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  /** Increment hearts (used when returning from mini-games) */
  addHearts(n: number): void {
    if (n <= 0) return;
    this.hearts += n;
    this.flashFeedback(`💖 Gained ${n} heart${n > 1 ? 's' : ''}!`);
    this.heartText.text(`❤️ Hearts: ${this.hearts}`);
    this.group.getLayer()?.batchDraw();
  }

  showCongratsAnimation(onFinish?: () => void) {
    const group = this.getGroup();
    const w = window.innerWidth;
    const h = window.innerHeight;

    // dark overlay
    const overlay = new Konva.Rect({
      x: 0, y: 0,
      width: w,
      height: h,
      fill: "rgba(0,0,0,0.55)",
      opacity: 0,
    });
    group.add(overlay);

    // big text
    const text = new Konva.Text({
      x: w / 2,
      y: h / 2 - 80,
      text: "🎉 Congratulations! 🎉",
      fontSize: 48,
      fontStyle: "bold",
      fill: "#fff",
      offsetX: 240,
      opacity: 0
    });
    group.add(text);

    // button
    const btn = new Konva.Rect({
      x: w / 2 - 130,
      y: h / 2 + 20,
      width: 260,
      height: 60,
      fill: "#ffffff",
      cornerRadius: 12,
      opacity: 0,
    });

    const btnText = new Konva.Text({
      x: w / 2,
      y: h / 2 + 50,
      text: "Back to Level Select",
      fontSize: 22,
      fill: "#333",
      offsetX: 110,
      offsetY: 15,
      opacity: 0,
    });

    group.add(btn, btnText);

    // fade in sequence
    overlay.to({ opacity: 1, duration: 0.4 });
    text.to({ opacity: 1, duration: 0.6 });
    btn.to({ opacity: 1, duration: 0.8 });
    btnText.to({ opacity: 1, duration: 1.0 });

    // click to continue
    const go = () => {
      onFinish?.();
    };

    btn.on("click", go);
    btnText.on("click", go);
  }

}
