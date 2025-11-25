/**
 * @file GameScreenController.ts
 * @brief Orchestrates the main story flow of the game:
 *        1) Builds a random story template with [noun]/[verb]/[adjective] blanks,
 *        2) Picks the exact words needed from our data banks,
 *        3) Starts the Word Link phase using that word set,
 *        4) Later supports resuming MadLib / WordLink after mini-games and
 *           applying any bonus hearts earned.
 */

import Konva from "konva";
import type { ScreenSwitcher } from "../types";
import WordLinkController from "./WordLinkController";
import MadLibPhaseController from "./MadLibPhaseController";

// Import the word "banks" that we will draw from to fill the story blanks.
// Each of these arrays is defined in ../data and holds strings of that type.
import { nouns } from "../data/nouns";
import { verbs } from "../data/verbs";
import { adjectives } from "../data/adjectives";
import { animals } from "../data/animals";
import { foods } from "../data/foods";
import { subjects } from "../data/subjects";
import { exclamations } from "../data/exclamations";

/**
 * @class GameScreenController
 * @brief High-level controller for the main "story game" screen.
 *
 * Responsibilities:
 *  - Owns a Konva.Group that contains the current story phase (WordLink or MadLib).
 *  - Creates a random story that includes typed blanks like [noun], [verb], etc.
 *  - Computes how many words of each type are required from the data banks.
 *  - Builds the wordSet passed into WordLinkController and later MadLibPhaseController.
 *  - Handles "bonus hearts" earned from mini-games and applies them to the right phase.
 *  - Restores hearts and phase state when resuming after a mini-game via sessionStorage.
 *
 * This controller is *not* directly responsible for drawing hearts, tiles, or text.
 * It delegates UI details to the WordLink and MadLib controllers/views; it just
 * wires up data, Konva containers, and navigation / state persistence.
 */
export default class GameScreenController {
  /** Konva group representing this screen's root container on the main layer. */
  private group: Konva.Group;
  /** Reference to the central App, used to access shared storyData and navigation. */
  private app: ScreenSwitcher;
  /** Reference to the Konva stage (full canvas root). */
  private stage: Konva.Stage;
  /** Reference to the shared Konva layer used for the main game content. */
  private layer: Konva.Layer;

  /** Active WordLinkController instance (if the Word Link phase is currently mounted). */
  private wordLink?: WordLinkController;
  /** Active MadLibPhaseController instance (if the Mad Libs phase is currently mounted). */
  private madLibController?: MadLibPhaseController;

  /**
   * Hearts earned from mini-games that could not be applied immediately.
   * Example: a mini-game finishes, awards +1 heart, and calls App.addHearts(),
   * but at that exact moment the correct phase controller (WordLink/MadLib) might
   * not be created yet. In that case we accumulate them here until resumeToX()
   * is called and then apply them all at once.
   */
  private pendingBonusHearts = 0;

  /**
   * Flag that could be used to indicate a pending request to reopen WordLink
   * (currently not actively used in this file, but reserved for future logic).
   */
  private pendingOpenWordLink = false;

  /**
   * @constructor
   * @param app    Global ScreenSwitcher implementation (the App) used for navigation and shared data.
   * @param stage  Konva.Stage that represents the entire drawing surface.
   * @param layer  Konva.Layer that holds the game's main content groups.
   *
   * The constructor:
   *  - Stores references to the App, stage, and layer.
   *  - Creates a new Konva.Group as this screen's root container.
   *  - Attaches that group to the provided layer.
   *  - Ensures the layer is attached to the stage (idempotent add).
   *  - Immediately kicks off the story flow (calls startStoryFlow()) so that
   *    when the "game" screen is shown for the first time, the WordLink phase
   *    already has a story and word set prepared.
   */
  constructor(app: ScreenSwitcher, stage: Konva.Stage, layer: Konva.Layer) {
    this.app = app;
    this.stage = stage;
    this.layer = layer;

    // Root Konva container for everything this controller draws.
    this.group = new Konva.Group();

    // Attach our group onto the shared main layer.
    // From now on, anything added to this.group will appear on this layer.
    this.layer.add(this.group);

    // Ensure the layer is attached to the stage. If it's already there, Konva
    // will simply keep it; calling add again is safe here.
    this.stage.add(this.layer);

    // Boot up the story logic immediately so the game screen is ready when shown.
    this.startStoryFlow();
  }

  /**
   * @brief Main entry point for the story flow:
   *        1) Generate a story string that contains typed blanks ([noun], [verb], etc.),
   *        2) Count how many of each blank type appear,
   *        3) Sample that exact number of words per type from each data bank,
   *        4) Store the (story, wordSet) on the App as shared storyData,
   *        5) Start the WordLink phase using that wordSet.
   *
   * If you changed the story template string, this method automatically
   * picks the correct amount of words based on the new [type] usage.
   */
  private startStoryFlow(): void {
    // === Define story ===
    // This template string includes placeholders like [adjective], [noun], etc.
    // Those bracketed tokens are later detected by countBlankTypes().
    // Note: we also inject random exclamations at the start and end for flavor.
    const story = `
  ${this.getRandom(exclamations)}! Today at school, my [adjective] teacher stormed in holding a [noun]
  and announced we’d be studying [subject] by training a [animal] to [verb].
  The idea sounded [adjective], but she told us to bring our [noun] and [food].
  During recess, my best friend and I found a [animal] trying to [verb] a [noun],
  which made the whole class [verb]! Everyone laughed and shouted "${this.getRandom(exclamations)}!"
`;

    // === Count needed word types ===
    // Example result: { adjective: 2, noun: 3, subject: 1, animal: 2, verb: 3, food: 1 }
    // This count drives how many words we pull from each bank.
    const required = this.countBlankTypes(story);

    // === Select exact number of words by type ===
    // wordSet is the final list of {word, type} pairs sent to WordLink and MadLib.
    const wordSet: { word: string; type: string }[] = [];

    // For each type in the required map, pick "count" words from the corresponding bank.
    for (const [type, count] of Object.entries(required)) {
      const source = this.getListByType(type);               // e.g., nouns[], verbs[], etc.
      const chosen = this.shuffle(source).slice(0, count);   // randomize order, then take the first "count" entries
      chosen.forEach((w) => wordSet.push({ word: w, type })); // store both the word and its type
    }

    // === Store for Mad Libs phase ===
    // We attach storyData onto the App so:
    //  - WordLink knows which words are valid for this story.
    //  - Later, when we resume into MadLib, we can reconstruct the same story/wordSet.
    (this.app as any).storyData = { story, wordSet };

    // ===Launch Word Link ===
    // This is the first phase the player sees when they start the game.
    this.startWordLinkPhase(wordSet);
  }

  /**
   * @brief Starts the Word Link phase using the provided word set.
   *
   * @param wordSet Array of { word, type } objects that the player must use
   *                to fill in the story blanks.
   *
   * Flow:
   *  - Creates a new WordLinkController for the given set of words.
   *  - Pulls its Konva group via getView().getGroup().
   *  - Attaches that group into this GameScreenController's Konva group.
   *  - Calls batchDraw() to force Konva to redraw with the new content.
   *
   * If WordLinkController ever fails to return a view or group, we log an error
   * so it’s easier to debug.
   */
  private startWordLinkPhase(wordSet: { word: string; type: string }[]): void {
    console.log("🎮 Launching Word Link phase with fixed story-based word set...");

    // Instantiate the WordLink controller, passing the App for navigation and wordSet as data.
    this.wordLink = new WordLinkController(this.app, wordSet);

    // Safely fetch the view object and then the Konva group to attach to our group.
    const viewObj = this.wordLink.getView();
    if (viewObj && viewObj.getGroup) {
      this.group.add(viewObj.getGroup());
    } else {
      // If this triggers, it means the controller's public API changed or is broken.
      console.error("❌ WordLinkController did not return a valid view object:", viewObj);
    }

    // Ask Konva to re-render the layer so the new phase appears immediately.
    this.layer.batchDraw();
  }

  // ---------------------------------------------------------------------------
  // Utility helpers for story + word selection
  // ---------------------------------------------------------------------------

  /**
   * @brief Returns the word list (array of strings) that corresponds to a given type.
   *
   * @param type The placeholder name from the story, e.g. "noun", "verb", "adjective".
   * @returns The matching array from our data banks, or [] if type is unknown.
   *
   * If you add a new placeholder type (e.g. [color]), you must:
   *  - create a new data file (colors.ts),
   *  - import it at the top,
   *  - and add a new case here to route "color" → colors array.
   */
  private getListByType(type: string): string[] {
    switch (type) {
      case "noun": return nouns;
      case "verb": return verbs;
      case "adjective": return adjectives;
      case "animal": return animals;
      case "food": return foods;
      case "subject": return subjects;
      default: return []; // Unknown placeholder; we silently ignore rather than crash.
    }
  }

  /**
   * @brief Counts how many times each [type] placeholder appears in the story.
   *
   * @param story The full story template string that may contain tokens like [noun].
   * @returns Map from placeholder type → number of occurrences.
   *
   * Implementation details:
   *  - Uses a regex to find all "[...]" chunks.
   *  - Strips off the brackets to get "noun", "verb", "adjective", etc.
   *  - Builds a frequency map so we can later pick exactly that many words per type.
   *
   * If the story has no brackets, this returns an empty object and no words are selected.
   */
  private countBlankTypes(story: string): Record<string, number> {
    // Match all substrings like "[noun]", "[verb]", "[adjective]" etc.
    const matches = story.match(/\[(.*?)\]/g) || [];

    const counts: Record<string, number> = {};
    matches.forEach((m) => {
      // Remove the surrounding [ and ] to get the raw type name.
      const type = m.replace(/\[|\]/g, "");
      // Increment the counter for this type.
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  }

  /**
   * @brief Returns a random element from an array.
   *
   * @param arr Non-empty array of strings (e.g., exclamations).
   * @returns One random element.
   *
   * If you passed an empty array, this would return undefined, which would show
   * up as "undefined" in the story — so we only call this with non-empty data banks.
   */
  private getRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * @brief Shuffles an array in place using a simple random sort comparator.
   *
   * @param arr Array to shuffle.
   * @returns The same array instance, now in randomized order.
   *
   * This is not a perfectly uniform shuffle, but is fine for our use-case.
   * Because we only ever use .slice(0, count) after shuffling, this gives us
   * a random subset of the source data bank.
   */
  private shuffle<T>(arr: T[]): T[] {
    return arr.sort(() => Math.random() - 0.5);
  }

  // ---------------------------------------------------------------------------
  // ScreenSwitcher integration: show/hide hooks
  // ---------------------------------------------------------------------------

  /**
   * @brief Returns a thin "view" wrapper exposing this controller's Konva group.
   *
   * @returns An object with getGroup(): Konva.Group, so App.ts can treat this
   *          similarly to other controllers that implement getView().getGroup().
   *
   * Note: We don't have a full GameScreenView class anymore; instead, this
   * controller owns the group directly and returns a minimal view adapter.
   */
  getView() {
    return { getGroup: () => this.group };
  }

  /**
   * @brief Makes the game screen visible and initializes story flow if needed.
   *
   * Behavior:
   *  - If this.group has no children (e.g., first time showing or after a reset),
   *    we call startStoryFlow() to rebuild the story/WordLink phase.
   *  - Sets this.group.visible(true) so the Konva group is rendered.
   */
  show(): void {
    // If something completely cleared our group, recreate the story and phases.
    if (this.group.getChildren().length === 0) {
      this.startStoryFlow();
    }
    this.group.visible(true);
  }

  /**
   * @brief Hides the game screen without destroying any internal state.
   *
   * This simply toggles the group's visibility off. Any underlying WordLink or
   * MadLib state stays in memory so we can show it again later if needed.
   */
  hide(): void {
    this.group.visible(false);
  }

  // ---------------------------------------------------------------------------
  // Heart handling across mini-games and phases
  // ---------------------------------------------------------------------------

  /**
   * @brief Applies bonus hearts earned from mini-games to the correct phase.
   *
   * @param amount Number of hearts to add. Values <= 0 are ignored.
   *
   * Logic:
   *  - If the MadLib phase is active (madLibController exists), forward the
   *    hearts directly to its addHearts() method.
   *  - Else, if the WordLink phase is active, forward them to WordLinkController.
   *  - If neither phase is currently active (e.g., we are between screens),
   *    we add the hearts to pendingBonusHearts and they will be applied later
   *    inside resumeToMadLib() or resumeToWordLink().
   *
   * This buffering ensures hearts are never "lost" just because the target
   * controller isn't mounted at the exact moment the mini-game ends.
   */
  addHearts(amount: number) {
    console.log(`GameScreenController.addHearts called with +${amount} hearts`);
    if (!amount || amount <= 0) return;

    // If MadLib phase is already instantiated under this controller, forward immediately.
    if (this.madLibController) {
      try {
        (this.madLibController as any).addHearts(amount);
      } catch (err) {
        console.warn("Failed to apply hearts to existing MadLib controller:", err);
      }
      return;
    }

    // If WordLink phase is instantiated, forward hearts to it instead.
    if (this.wordLink) {
      try {
        (this.wordLink as any).addHearts(amount);
      } catch (err) {
        console.warn("Failed to apply hearts to existing WordLink controller:", err);
      }
      return;
    }

    // No phase is active: stash hearts and let resumeToX() apply them later.
    console.log(
      `No active phase controller: queueing ${amount} pending hearts (was ${this.pendingBonusHearts})`
    );
    this.pendingBonusHearts += amount;
  }

  // ---------------------------------------------------------------------------
  // Resume helpers: coming back from mini-games into MadLib / WordLink
  // ---------------------------------------------------------------------------

  /**
   * @brief Rebuilds and shows the MadLib phase after returning from a mini-game.
   *
   * Flow:
   * 1. Reads this.app.storyData to get the saved story + wordSet.
   * 2. Clears our Konva group, so we remove any previous phase children.
   * 3. Instantiates MadLibPhaseController with the same story/wordSet.
   * 4. Attaches its Konva group to our group and redraws the layer.
   * 5. Tries to restore previous hearts from sessionStorage ("madlib_prev_hearts"),
   *    so the number of hearts before redirect is preserved exactly.
   * 6. Applies any pendingBonusHearts that were earned while the mini-game ran.
   */
  resumeToMadLib(): void {
    // storyData is injected earlier in startStoryFlow and also set by App when needed.
    const storyData = (this.app as any).storyData;
    if (!storyData) {
      console.warn("No storyData available to resume MadLib phase.");
      return;
    }

    // Clear existing children (e.g., any old WordLink or placeholder groups)
    // and ensure the layer is visually refreshed.
    this.group.destroyChildren();
    this.layer.batchDraw();

    // Create a brand-new MadLib controller bound to the same story and wordSet.
    this.madLibController = new MadLibPhaseController(
      this.app,
      storyData.story,
      storyData.wordSet
    );
    // Attach the new MadLib view's group under our main group.
    this.group.add(this.madLibController.getView().getGroup());
    this.layer.batchDraw();

    // Restore previous exact MadLib hearts if available (saved to sessionStorage before redirect).
    // This is needed because the mini-game is loaded in a different route / screen and
    // we want to keep the same hearts value upon return.
    try {
      const prev = sessionStorage.getItem("madlib_prev_hearts");
      console.log("resumeToMadLib: read madlib_prev_hearts from sessionStorage ->", prev);

      if (prev !== null) {
        const prevN = parseInt(prev, 10);
        if (!isNaN(prevN)) {
          try {
            console.log(
              "resumeToMadLib: setting MadLib hearts to previous value",
              prevN
            );
            (this.madLibController as any).setHearts(prevN);
          } catch (err) {
            console.warn("Failed to set previous MadLib hearts:", err);
          }
        }
      }

      // Once we've restored hearts, we remove the saved value so future resumes
      // don't keep applying the same old number repeatedly.
      sessionStorage.removeItem("madlib_prev_hearts");
    } catch (err) {
      console.warn("resumeToMadLib: sessionStorage error", err);
    }

    // If any bonus hearts accumulated while we were in a mini-game, apply them now.
    if (this.pendingBonusHearts > 0) {
      console.log(
        "resumeToMadLib: applying pendingBonusHearts ->",
        this.pendingBonusHearts
      );
      try {
        (this.madLibController as any).addHearts(this.pendingBonusHearts);
      } catch (err) {
        console.warn("Failed to apply pending bonus hearts to MadLib:", err);
      }
      // Reset the queue so we don't double-apply hearts later.
      this.pendingBonusHearts = 0;
    }
  }

  /**
   * @brief Rebuilds and shows the WordLink phase after returning from a mini-game.
   *
   * Flow:
   * 1. Reads this.app.storyData to recover wordSet.
   * 2. Clears the group's children to remove any old phase nodes.
   * 3. Creates a new WordLinkController with the same wordSet.
   * 4. Attaches the WordLink view group under our main group.
   * 5. Restores previous WordLink hearts from sessionStorage ("wordlink_prev_hearts").
   * 6. Applies any pendingBonusHearts queued while the mini-game ran.
   */
  resumeToWordLink(): void {
    const storyData = (this.app as any).storyData;
    if (!storyData) {
      console.warn("No storyData available to resume WordLink phase.");
      return;
    }

    // Clear out any previously drawn children (e.g., old MadLib nodes).
    this.group.destroyChildren();
    this.layer.batchDraw();

    // Recreate the WordLink controller using the same wordSet we used originally.
    this.wordLink = new WordLinkController(this.app, storyData.wordSet);
    this.group.add(this.wordLink.getView().getGroup());
    this.layer.batchDraw();

    // Restore previous exact WordLink hearts if available (saved to sessionStorage before redirect).
    try {
      const prev = sessionStorage.getItem("wordlink_prev_hearts");
      console.log(
        "resumeToWordLink: read wordlink_prev_hearts from sessionStorage ->",
        prev
      );

      if (prev !== null) {
        const prevN = parseInt(prev, 10);
        if (!isNaN(prevN)) {
          try {
            console.log(
              "resumeToWordLink: setting WordLink hearts to previous value",
              prevN
            );
            (this.wordLink as any).setHearts(prevN);
          } catch (err) {
            console.warn("Failed to set previous WordLink hearts:", err);
          }
        }
      }

      // Remove stored value so it is applied at most once.
      sessionStorage.removeItem("wordlink_prev_hearts");
    } catch (err) {
      console.warn("resumeToWordLink: sessionStorage error", err);
    }

    // Apply any deferred bonus hearts.
    if (this.pendingBonusHearts > 0) {
      console.log(
        "resumeToWordLink: applying pendingBonusHearts ->",
        this.pendingBonusHearts
      );
      try {
        (this.wordLink as any).addHearts(this.pendingBonusHearts);
      } catch (err) {
        console.warn("Failed to apply pending bonus hearts to WordLink:", err);
      }
      this.pendingBonusHearts = 0;
    }
  }
}
