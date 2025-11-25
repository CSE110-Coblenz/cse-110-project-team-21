/**
 * @file WordLinkController.ts
 * @brief Controls the Word Link phase of the Spellventure game.
 *
 * The Word Link phase is the FIRST gameplay part of the story flow.
 * Given a list of words (wordSet) tied to the story’s blanks, this
 * controller:
 *   - Handles how each word must be solved letter-by-letter.
 *   - Manages hearts, hints, score, and guesses.
 *   - Manages transition to the Mad Libs phase.
 *   - Handles redirect & state preservation when a mini-game is triggered.
 *
 * This controller is the “brain” of the WordLink portion. It interacts
 * heavily with WordLinkView for everything related to UI and rendering.
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
  /** View responsible for all Konva drawing in the Word Link phase. */
  private view: WordLinkView;
  /** Persistent cross-screen game state container. */
  private state: GameState;
  /** Reference to the App controller for navigation and shared data. */
  private app: ScreenSwitcher;

  // ---------------------------------------------------------------------------
  // Core gameplay state
  // ---------------------------------------------------------------------------

  /**
   * placedWords
   * Array of objects describing each story word the player must solve.
   * Each entry stores:
   *   - the word,
   *   - its placed x/y (later used for crossword layout),
   *   - its direction,
   *   - an array of letter cell metadata.
   *
   * NOTE: In WordLink we initially use them mostly as "words to solve";
   * later the crossword grid is built as they are solved.
   */
  private placedWords: PlacedWord[] = [];

  /** Index of the current word the player is trying to solve. */
  private currentWordIndex = 0;
  /** Current partial guess (letters player has clicked this round). */
  private currentGuess = "";
  /** Overall gameplay score (WordLink-only). */
  private score = 0;
  /** Player’s remaining hearts — reduced on mistakes, restored by mini-games. */
  private hearts = 3;
  /** How many hints have been used on the current word (max = 3). */
  private usedHints = 0;

  constructor(app: ScreenSwitcher, wordSet: { word: string; type: string }[]) {
    /**
     * Save reference to App so we can:
     *  - switch screens (miniGameSelect, MadLib, etc.)
     *  - read storyData
     *  - restore heart/score state after mini-games
     */
    this.app = app;

    /**
     * Load the view that handles all UI rendering.
     * WordLinkView controls:
     *  - drawing word boxes
     *  - drawing letter tiles
     *  - drawing the crossword grid as solved words are placed
     *  - HUD updates (score/hearts)
     */
    this.view = new WordLinkView();

    /** Load or create the persistent GameState object. */
    this.state = GameState.load();

    // -------------------------------------------------------------------------
    // Convert story-provided wordSet → internal PlacedWord structures
    // -------------------------------------------------------------------------

    this.placedWords = wordSet.map((w) => ({
      word: w.word,      // actual string (e.g. "pizza")
      x: 0,              // initial grid placement (0,0), updated later
      y: 0,
      direction: "horizontal",
      letters: [],       // letter cell objects created later during grid drawing
    }));

    /**
     * Sort words by increasing length.
     *
     * WHY?
     *  - Shorter words are easier → good early practice.
     *  - Helps generate cleaner crossword layouts (anchor short words first).
     */
    this.placedWords.sort((a, b) => a.word.length - b.word.length);

    // -------------------------------------------------------------------------
    // Initial rendering setup
    // -------------------------------------------------------------------------

    /** Draw the boxes and tiles for the first word. */
    this.loadCurrentWord();

    /** Draw hearts + score on the HUD. */
    this.view.updateHUD(this.score, this.hearts);

    // -------------------------------------------------------------------------
    // Event handlers wired from WordLinkView
    // -------------------------------------------------------------------------

    let submitting = false; // prevents double submissions from rapid clicking

    /** When a letter tile is clicked → append letter to guess. */
    this.view.onLetterClicked((letter) => this.handleLetter(letter));

    /** When “Submit” is clicked → validate guess. */
    this.view.onSubmitClicked(async () => {
      if (submitting) return;
      submitting = true;
      try {
        await this.submitGuess();
      } finally {
        submitting = false;
      }
    });

    /** When “Refresh” is clicked → clear guess and redraw tiles (preserve hints). */
    this.view.onRefreshClicked(() => this.refreshWord());

    /** When “Hint” is clicked → reveal a random letter (max 3). */
    this.view.onHintClicked(() => this.useHint());
  }

  // ---------------------------------------------------------------------------
  // Heart handling (used by App/GameScreenController during mini-game return)
  // ---------------------------------------------------------------------------

  /** Adds hearts awarded from mini-games and updates the HUD. */
  addHearts(n: number) {
    if (!n || n <= 0) return;
    this.hearts += n;
    this.view.updateHUD(this.score, this.hearts);
  }

  /** Sets an exact number of hearts (used for restoring pre-mini-game state). */
  setHearts(n: number) {
    this.hearts = n;
    this.view.updateHUD(this.score, this.hearts);
  }

  // ---------------------------------------------------------------------------
  // Core WordLink Gameplay Logic
  // ---------------------------------------------------------------------------

  /**
   * @brief Loads the next word into the UI and prepares its letter tiles.
   *
   * Process:
   *   1. Reset per-word state (guess, hint counters).
   *   2. Draw empty word boxes → one box per character.
   *   3. Generate letter tiles for everything EXCEPT the first letter.
   *      (First letter is always shown as a fixed clue.)
   *   4. Shuffle tiles randomly.
   */
  private loadCurrentWord(): void {
    const word = this.placedWords[this.currentWordIndex].word;
    const firstLetter = word[0];

    this.currentGuess = "";
    this.usedHints = 0;

    // Draw the empty (underscored) word UI — leaving firstLetter fixed.
    this.view.drawWordBoxes(firstLetter, word.length);

    // Shuffle remaining letters to prevent guessing patterns
    const letters = this.shuffleLetters(word.slice(1).split(""));
    this.view.drawLetterTiles(letters);
  }

  /**
   * @brief Called whenever a tile is clicked.
   * @param letter The letter the player chose.
   *
   * Adds the letter to the current guess, fills in the next box,
   * and removes that tile from the tile bank.
   */
  private handleLetter(letter: string): void {
    const currentWord = this.placedWords[this.currentWordIndex].word;

    // Prevent placing more letters than the word length (minus the fixed first letter)
    if (this.currentGuess.length >= currentWord.length - 1) return;

    this.currentGuess += letter;

    /** Update UI: fill next empty letter box. */
    this.view.fillNextLetter(letter);

    /** Ensure tile can't be used again. */
    this.view.removeLetterTile(letter);
  }

  /**
   * @brief Clears the player's guess but preserves hint-revealed letters.
   *
   * WHY A DELAY?
   *  Konva sometimes does not redraw removed nodes instantly. The small timeout
   *  ensures the layer finishes clearing before new tiles reattach.
   */
  private refreshWord(): void {
    const currentWord = this.placedWords[this.currentWordIndex].word;

    this.currentGuess = "";
    this.view.clearCurrentWord();

    const layer = this.view.getGroup().getLayer();
    layer?.batchDraw();

    // Build list of letters not already shown by hints
    const needed = currentWord.slice(1).split("");
    const hinted = this.view.getHintedLetters();
    const remaining = needed.filter((ch) => {
      const idx = hinted.indexOf(ch);
      if (idx !== -1) {
        hinted.splice(idx, 1);
        return false;
      }
      return true;
    });

    const shuffled = this.shuffleLetters(remaining);

    // Wait for Konva to finish clearing before placing tiles again
    setTimeout(() => {
      this.view.drawLetterTiles(shuffled);
      layer?.batchDraw();
    }, 50);
  }

  /**
   * @brief Reveals 1 random letter (max 3 per word).
   */
  private useHint(): void {
    const word = this.placedWords[this.currentWordIndex].word;

    if (this.usedHints >= 3) {
      this.view.flashFeedback("No more hints!");
      return;
    }

    // Find positions in the word that are NOT yet revealed
    const unrevealedPositions: number[] = [];
    for (let i = 1; i < word.length; i++) {
      const currentlyShown = this.view.getVisibleWord()[i];
      if (!currentlyShown) unrevealedPositions.push(i);
    }

    if (unrevealedPositions.length === 0) {
      this.view.flashFeedback("All letters revealed!");
      return;
    }

    const randomIndex = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
    const letter = word[randomIndex];

    this.usedHints++;

    this.view.revealLetter(randomIndex, letter);
    this.view.removeLetterTile(letter);
    this.view.updateHUD(this.score, this.hearts);
  }

  // ---------------------------------------------------------------------------
  // Guess Submission Logic
  // ---------------------------------------------------------------------------

  /**
   * @brief Handles the “Submit” button logic.
   *
   * Three possible outcomes:
   *
   *  FULL MATCH (correct word)
   *    - Award +100 points
   *    - Add solved word to crossword grid
   *    - Move on to next word or launch MadLib phase
   *
   *  VALID ENGLISH WORD (via dictionary API)
   *    - Award +10 points (easter-egg bonus)
   *    - Refresh tiles so player can try again
   *
   *  INVALID WORD
   *    - Lose 1 heart
   *    - Trigger mini-game if hearts reach 0
   */
  private async submitGuess(): Promise<void> {
    const word = this.placedWords[this.currentWordIndex].word;

    const visibleLetters = this.view.getVisibleWord();
    const fullGuess = visibleLetters.toLowerCase();

    // Case 1: correct target word
    if (fullGuess === word) {
      this.score += 100;
      this.view.flashFeedback("correct");
      this.nextWord();
      return;
    }

    // Case 2: valid English word but not the target
    if (await isValidEnglishWord(fullGuess)) {
      this.score += 10;
      this.view.flashFeedback("correct");
      setTimeout(() => this.refreshWord(), 1000);
      this.view.updateHUD(this.score, this.hearts);
      return;
    }

    // Case 3: wrong word
    this.hearts--;
    this.view.flashFeedback("wrong");
    this.view.updateHUD(this.score, this.hearts);

    // Mini-game trigger when hearts reach zero
    if (this.hearts <= 0) {
      this.triggerMiniGame(() => {
        this.hearts = 1;
        this.view.updateHUD(this.score, this.hearts);
      });
    }
  }

  /**
   * @brief Moves to next word or transitions into Mad Libs if done.
   *
   * Each solved word is drawn into the crossword using addWordToGrid().
   */
  private nextWord(): void {
    const solvedWord = this.placedWords[this.currentWordIndex];

    // Draw solved word into crossword before moving on
    this.view.addWordToGrid(solvedWord);

    this.currentWordIndex++;
    this.currentGuess = "";

    // All words complete → start the Mad Libs phase
    if (this.currentWordIndex >= this.placedWords.length) {
      console.log("✅ All words completed — launching Mad Libs phase...");
      this.launchMadLibPhase();
      return;
    }

    // Otherwise continue to the next word
    this.loadCurrentWord();
    this.view.updateHUD(this.score, this.hearts);
  }

  // ---------------------------------------------------------------------------
  // Mini-Game Handling + State Persistence
  // ---------------------------------------------------------------------------

  /**
   * @brief Redirects player to the mini-game selection screen.
   *
   * Behavior:
   *   - Saves current hearts into sessionStorage (wordlink_prev_hearts)
   *     so that when player returns we can restore EXACT state.
   *
   *   - Navigates to /index.html?screen=miniGameSelect&returnTo=game_openWordLink
   *
   *   - If redirect fails (rare), fallback to onResume().
   */
  private triggerMiniGame(onResume: () => void): void {
    // Save hearts before redirecting
    try {
      console.log(
        "WordLinkController.triggerMiniGame: saving wordlink_prev_hearts ->",
        this.hearts
      );
      sessionStorage.setItem("wordlink_prev_hearts", String(this.hearts));
    } catch (e) {
      /* ignore storage errors */
    }

    // Build redirect URL
    try {
      const url = new URL("/index.html", window.location.origin);
      url.searchParams.set("screen", "miniGameSelect");
      url.searchParams.set("returnTo", "game_openWordLink");

      console.log(
        "WordLinkController.triggerMiniGame: redirecting to",
        url.toString()
      );
      window.location.href = url.toString();
    } catch (err) {
      console.error("Failed to redirect to mini game selection:", err);
      onResume();
    }
  }

  // ---------------------------------------------------------------------------
  // Transition to Mad Lib Phase
  // ---------------------------------------------------------------------------

  /**
   * @brief Destroys all WordLink UI and mounts the MadLibPhaseController.
   */
  private launchMadLibPhase(): void {
    const layer = this.view.getGroup().getLayer();
    if (!layer) return;

    // Clear WordLink UI from the group
    this.view.getGroup().destroyChildren();
    layer.batchDraw();

    // Pull storyData from App (created earlier in GameScreenController)
    const { story, wordSet } = (this.app as any).storyData;

    // Create MadLib phase controller with the same story + wordSet
    const madLib = new MadLibPhaseController(this.app, story, wordSet);

    this.view.getGroup().add(madLib.getView().getGroup());
    layer.batchDraw();
  }

  // ---------------------------------------------------------------------------
  // Utility functions
  // ---------------------------------------------------------------------------

  /** Fisher-Yates shuffle for good random tile ordering. */
  private shuffleLetters(arr: string[]): string[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * @returns An object exposing only getGroup()
   * This matches the API the App expects when showing/hiding screens.
   */
  getView() {
    return { getGroup: () => this.view.getGroup() };
  }
}
