/**
 * @file WordLinkController.ts
 * @brief Handles the main Word Link gameplay logic — now with crossword-style layout.
 */

import Konva from "konva";
import WordLinkView from "../views/WordLinkView";
import { GameState } from "../state/GameState";
import type { ScreenSwitcher } from "../types";
import { getLinkedStoryWords } from "../data";
import { buildWordGrid } from "../utils/WordGridLayout";
import type { PlacedWord } from "../utils/WordGridLayout";
import { isValidEnglishWord } from "../utils/WordValidator";
import MadLibPhaseController from "./MadLibPhaseController";

export default class WordLinkController {
  private view: WordLinkView;
  private state: GameState;
  private app: ScreenSwitcher;

  // Core gameplay state
  private placedWords: PlacedWord[] = [];
  private currentWordIndex = 0;
  private currentGuess = "";
  private score = 0;
  private hearts = 3;
  private usedHints = 0;
  private hintLetters = new Set<string>();

  constructor(app: ScreenSwitcher, wordSet: { word: string; type: string }[]) {
    this.app = app;
    this.view = new WordLinkView();
    this.state = GameState.load();

    // Store typed words
    this.placedWords = wordSet.map((w) => ({
      word: w.word,
      x: 0,
      y: 0,
      direction: "horizontal",
      letters: [],
    }));

    // Sort easier → shorter first
    this.placedWords.sort((a, b) => a.word.length - b.word.length);

    // Draw initial UI
    this.loadCurrentWord();
    this.view.updateHUD(this.score, this.hearts);

    // === Event hooks ===
    let submitting = false;

    this.view.onLetterClicked((letter) => this.handleLetter(letter));

    this.view.onSubmitClicked(async () => {
      if (submitting) return;
      submitting = true;
      await this.submitGuess();
      submitting = false;
    });

    this.view.onRefreshClicked(() => this.refreshWord());
    this.view.onHintClicked(() => this.useHint());
  }

  /** === Core gameplay === */

  /** Loads and draws the current target word. */
  private loadCurrentWord(): void {
    const word = this.placedWords[this.currentWordIndex].word;
    const firstLetter = word[0];
    this.currentGuess = "";
    this.usedHints = 0;
    this.hintLetters.clear();

    this.view.drawWordBoxes(firstLetter, word.length);
    const letters = this.shuffleLetters(word.slice(1).split(""));
    this.view.drawLetterTiles(letters);
  }

  /** Player selects a letter from the bank. */
  private handleLetter(letter: string): void {
    const currentWord = this.placedWords[this.currentWordIndex].word;
    if (this.currentGuess.length >= currentWord.length - 1) return;

    // Prevent reuse of same tile
    if (this.hintLetters.has(letter)) return;

    this.currentGuess += letter;
    this.view.fillNextLetter(letter);
    this.view.removeLetterTile(letter); // remove from letter bank
  }

  /** Refreshes the current word (clears guesses but keeps hints). */
  private refreshWord(): void {
    const currentWord = this.placedWords[this.currentWordIndex].word;
    this.currentGuess = "";
    this.view.clearCurrentWord();

    // Force Konva to flush the clear before redrawing tiles
    const layer = this.view.getGroup().getLayer();
    layer?.batchDraw();

    // Compute remaining unused letters
    const remaining = currentWord
      .slice(1)
      .split("")
      .filter((ch) => !this.hintLetters.has(ch));

    const shuffled = this.shuffleLetters(remaining);

    // Add a short delay so new tiles attach AFTER redraw
    setTimeout(() => {
      this.view.drawLetterTiles(shuffled);
      layer?.batchDraw();
    }, 50);
  }

  /** Uses one hint (reveals one missing letter). */
  private useHint(): void {
    const word = this.placedWords[this.currentWordIndex].word;

    // Limit to 3 hints per word
    if (this.usedHints >= 3) {
      this.view.flashFeedback("No more hints!");
      return;
    }

    // Collect indices of letters not yet shown (excluding first)
    const unrevealed: number[] = [];
    for (let i = 1; i < word.length; i++) {
      const visible = this.view.getVisibleWord()[i];
      if (!visible || visible === "") unrevealed.push(i);
    }

    if (unrevealed.length === 0) {
      this.view.flashFeedback("All letters revealed!");
      return;
    }

    // Pick a random unrevealed position
    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const letter = word[randomIndex];

    // Track hint usage
    this.hintLetters.add(letter);
    this.usedHints++;

    // Reveal visually + remove from bank
    this.view.revealLetter(randomIndex, letter);
    this.view.removeLetterTile(letter);
    this.view.updateHUD(this.score, this.hearts);
  }

  /** Handles player submitting their guess. */
  private async submitGuess(): Promise<void> {
    const word = this.placedWords[this.currentWordIndex].word;

    // Rebuild guess directly from the boxes the player sees
    const visibleLetters = this.view.getVisibleWord();
    const fullGuess = visibleLetters.toLowerCase();

    // Case 1: Correct target word
    if (fullGuess === word) {
      this.score += 100;
      this.view.flashFeedback("correct");
      this.nextWord();
      return;
    }

    // Case 2: Valid English word (bonus)
    if (await isValidEnglishWord(fullGuess)) {
      this.score += 10;
      this.view.flashFeedback("correct");
      setTimeout(() => this.refreshWord(), 1000);
      this.view.updateHUD(this.score, this.hearts);
      return;
    }

    // Case 3: Invalid word
    this.hearts--;
    this.view.flashFeedback("wrong");
    this.view.updateHUD(this.score, this.hearts);

    if (this.hearts <= 0) {
      this.triggerMiniGame(() => {
        this.hearts = 1;
        this.view.updateHUD(this.score, this.hearts);
      });
    }
  }

  /** Goes to next word or transitions to Mad Lib phase. */
  private nextWord(): void {
    const solved = this.placedWords[this.currentWordIndex];
    this.view.addWordToGrid(solved); // 👈 draw solved word before moving on    

    this.currentWordIndex++;
    this.currentGuess = "";

    if (this.currentWordIndex >= this.placedWords.length) {
      console.log("✅ All words completed — launching Mad Libs phase...");
      this.launchMadLibPhase();
      return;
    }

    this.loadCurrentWord();
    this.view.updateHUD(this.score, this.hearts);
  }

  /** Adds the solved word to the growing crossword layout */
  private addSolvedWordToGrid(word: string): void {
    const index = this.currentWordIndex;
    const placed = this.placedWords[index];
    this.view.addWordToGrid(placed);
  }

  /** Mini-game placeholder when hearts reach 0. */
  private triggerMiniGame(onResume: () => void): void {
    const layer = this.view.getGroup().getLayer();
    if (!layer) return;

    const overlay = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fill: "rgba(0,0,0,0.8)",
    });

    const text = new Konva.Text({
      text: "💥 Mini Game Placeholder 💥\nTap Resume to Continue",
      fontSize: 28,
      fill: "#fff",
      width: window.innerWidth,
      align: "center",
      y: window.innerHeight / 2 - 80,
    });

    const button = new Konva.Rect({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 + 40,
      width: 200,
      height: 60,
      fill: "#4f46e5",
      cornerRadius: 10,
    });

    const label = new Konva.Text({
      text: "Resume",
      fontSize: 26,
      fill: "#fff",
      width: 200,
      align: "center",
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 + 55,
    });

    button.on("click tap", () => {
      overlay.destroy();
      text.destroy();
      button.destroy();
      label.destroy();
      layer.draw();
      onResume();
    });

    layer.add(overlay, text, button, label);
    layer.draw();
  }

  /** Launches the Mad Libs phase. */
  private launchMadLibPhase(): void {
    const layer = this.view.getGroup().getLayer();
    if (!layer) return;

    this.view.getGroup().destroyChildren();
    layer.batchDraw();

    const { story, wordSet } = (this.app as any).storyData;

    const madLib = new MadLibPhaseController(this.app, story, wordSet);
    layer.add(madLib.getView().getGroup());
    layer.batchDraw();
  }

  /** Utility: shuffles an array. */
  private shuffleLetters(arr: string[]): string[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /** Returns this controller's Konva group (for screen switching). */
  getView() {
    return { getGroup: () => this.view.getGroup() };
  }
}
