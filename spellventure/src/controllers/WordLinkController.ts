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
  private letterPositions: (string | null)[] = [];

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
    this.view.onBoxClicked((index) => this.handleBoxClick(index));

    this.view.onSubmitClicked(async () => {
      if (submitting) return;
      submitting = true;
      try {
        await this.submitGuess();
      } finally {
        submitting = false;
      }
    });

    this.view.onRefreshClicked(() => this.refreshWord());
    this.view.onHintClicked(() => this.useHint());
  }

  /** Apply bonus hearts (called when returning from mini-games) */
  addHearts(n: number) {
    if (!n || n <= 0) return;
    this.hearts += n;
    this.view.updateHUD(this.score, this.hearts);
  }

  /** Set exact hearts value (used when restoring previous state) */
  setHearts(n: number) {
    this.hearts = n;
    this.view.updateHUD(this.score, this.hearts);
  }

  /** === Core gameplay === */

  /** Loads and draws the current target word. */
  private loadCurrentWord(): void {
const word = this.placedWords[this.currentWordIndex].word;
    const firstLetter = word[0];
    this.usedHints = 0;
    
    this.letterPositions = new Array(word.length).fill(null);
    this.letterPositions[0] = firstLetter; 

    this.view.drawWordBoxes(firstLetter, word.length);
    const letters = this.shuffleLetters(word.slice(1).split(""));
    this.view.drawLetterTiles(letters);
  }

  /** Player selects a letter from the bank. */
  private handleLetter(letter: string): void {
    let emptyIndex = -1;
    for(let i = 1; i < this.letterPositions.length; i++) {
        if (this.letterPositions[i] === null) {
            emptyIndex = i;
            break;
        }
    }

    if (emptyIndex === -1) return;

    this.letterPositions[emptyIndex] = letter;
    
    this.view.fillNextLetter(letter); 
    this.view.removeLetterTile(letter);
  }

  /** Player clicks a box to remove the letter */
  private handleBoxClick(index: number): void {
    const letter = this.letterPositions[index];

    if (!letter || index === 0) return;

    if (this.view.isLockedHint(index)) {
        this.view.flashFeedback("Can't remove hint!");
        return;
    }

    this.letterPositions[index] = null; 
    this.view.clearLetterAtIndex(index); 
    this.view.addLetterToBank(letter); 
  }

  /** Refreshes the current word (clears guesses but keeps hints). */
  private refreshWord(): void {
    const currentWord = this.placedWords[this.currentWordIndex].word;

    this.view.clearCurrentWord(); 

    const visibleState = this.view.getVisibleWord(); 

    for (let i = 1; i < currentWord.length; i++) {
      if (visibleState[i] && visibleState[i] !== " ") {
        this.letterPositions[i] = visibleState[i];
      } else {
        this.letterPositions[i] = null;
      }
    }

    const neededChars = currentWord.slice(1).split(""); 
    const currentOnBoard = this.letterPositions.slice(1).filter((c) => c !== null) as string[];
    
    currentOnBoard.forEach((char) => {
      const index = neededChars.indexOf(char.toLowerCase()); 
      if (index === -1) {
         const upperIdx = neededChars.indexOf(char.toUpperCase());
         if (upperIdx > -1) neededChars.splice(upperIdx, 1);
      } else {
        neededChars.splice(index, 1);
      }
    });

    const shuffled = this.shuffleLetters(neededChars);

    const layer = this.view.getGroup().getLayer();
    layer?.batchDraw();

    setTimeout(() => {
      this.view.drawLetterTiles(shuffled);
      layer?.batchDraw();
    }, 50);
  }

  /** Uses one hint (reveals one missing letter). */
  private useHint(): void {
    const word = this.placedWords[this.currentWordIndex].word;
    const len = word.length;

    let maxHints = 4; 
    if (len <= 4) {
      maxHints = 1; 
    } else if (len <= 6) {
      maxHints = 2; 
    } else if (len <= 8) {
      maxHints = 3; 
    }

    if (this.usedHints >= maxHints) {
      this.view.flashFeedback("No more hints!");
      return;
    }

    const unrevealed: number[] = [];
    for (let i = 1; i < word.length; i++) {
      const currentVal = this.letterPositions[i];
      if (currentVal?.toLowerCase() !== word[i].toLowerCase()) {
        unrevealed.push(i);
      }
    }

    if (unrevealed.length === 0) {
      this.view.flashFeedback("All letters revealed!");
      return;
    }

    const randomIndex = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    const correctLetter = word[randomIndex];

    this.view.removeLetterTile(correctLetter);

    this.letterPositions[randomIndex] = correctLetter;
    this.usedHints++;

    this.view.revealLetter(randomIndex, correctLetter);
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

    // Case 2: Valid English word (bonus) - must match target word length
    if (fullGuess.length === word.length && await isValidEnglishWord(fullGuess)) {
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
    // Persist current hearts so we can restore exact state when returning.
    try {
      console.log('WordLinkController.triggerMiniGame: saving wordlink_prev_hearts ->', this.hearts);
      sessionStorage.setItem("wordlink_prev_hearts", String(this.hearts));
    } catch (e) {
      // ignore storage errors
    }

    // Redirect to the mini-game selection page and include a returnTo marker
    try {
      const url = new URL("/index.html", window.location.origin);
      url.searchParams.set("screen", "miniGameSelect");
      url.searchParams.set("returnTo", "game_openWordLink");
      console.log('WordLinkController.triggerMiniGame: redirecting to', url.toString());
      window.location.href = url.toString();
    } catch (err) {
      console.error("Failed to redirect to mini game selection, resuming game instead.", err);
      onResume();
    }
  }

  /** Launches the Mad Libs phase. */
  private launchMadLibPhase(): void {
    const layer = this.view.getGroup().getLayer();
    if (!layer) return;

    this.view.getGroup().destroyChildren();
    layer.batchDraw();

    const { story, wordSet } = (this.app as any).storyData;

    const madLib = new MadLibPhaseController(this.app, story, wordSet);
    this.view.getGroup().add(madLib.getView().getGroup());
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