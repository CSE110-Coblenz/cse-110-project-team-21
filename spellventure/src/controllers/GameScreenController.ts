/**
 * @file GameScreenController.ts
 * @brief Initializes the story + word set, starts Word Link, and transitions to Mad Libs.
 */

import Konva from "konva";
import type { ScreenSwitcher } from "../types";
import WordLinkController from "./WordLinkController";

// Import your data banks
import { nouns } from "../data/nouns";
import { verbs } from "../data/verbs";
import { adjectives } from "../data/adjectives";
import { animals } from "../data/animals";
import { foods } from "../data/foods";
import { subjects } from "../data/subjects";
import { exclamations } from "../data/exclamations";

export default class GameScreenController {
  private group: Konva.Group;
  private app: ScreenSwitcher;
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private wordLink?: WordLinkController;

  constructor(app: ScreenSwitcher, stage: Konva.Stage, layer: Konva.Layer) {
    this.app = app;
    this.stage = stage;
    this.layer = layer;
    this.group = new Konva.Group();

    this.layer.add(this.group);
    this.stage.add(this.layer);

    this.startStoryFlow();
  }

  /** Initializes the story + required words, then launches Word Link */
  private startStoryFlow(): void {
    // === 1️⃣ Define story ===
    const story = `
  ${this.getRandom(exclamations)}! Today at school, my [adjective] teacher stormed in holding a [noun]
  and announced we’d be studying [subject] by training a [animal] to [verb].
  The idea sounded [adjective], but she told us to bring our [noun] and [food].
  During recess, my best friend and I found a [animal] trying to [verb] a [noun],
  which made the whole class [verb]! Everyone laughed and shouted "${this.getRandom(exclamations)}!"
`;

    // === 2️⃣ Count needed word types ===
    const required = this.countBlankTypes(story);

    // === 3️⃣ Select exact number of words by type ===
    const wordSet: { word: string; type: string }[] = [];
    for (const [type, count] of Object.entries(required)) {
      const source = this.getListByType(type);
      const chosen = this.shuffle(source).slice(0, count);
      chosen.forEach((w) => wordSet.push({ word: w, type }));
    }

    // === 4️⃣ Store for Mad Libs phase ===
    (this.app as any).storyData = { story, wordSet };

    // === 5️⃣ Launch Word Link ===
    this.startWordLinkPhase(wordSet);
  }

/** Starts Word Link phase with selected words */
private startWordLinkPhase(wordSet: { word: string; type: string }[]): void {
  console.log("🎮 Launching Word Link phase with fixed story-based word set...");

  // Properly instantiate WordLinkController
  this.wordLink = new WordLinkController(this.app, wordSet);

  // Safely add the WordLink group
  const viewObj = this.wordLink.getView();
  if (viewObj && viewObj.getGroup) {
    this.group.add(viewObj.getGroup());
  } else {
    console.error("❌ WordLinkController did not return a valid view object:", viewObj);
  }

  this.layer.batchDraw();
}


  /** Utilities */
  private getListByType(type: string): string[] {
    switch (type) {
      case "noun": return nouns;
      case "verb": return verbs;
      case "adjective": return adjectives;
      case "animal": return animals;
      case "food": return foods;
      case "subject": return subjects;
      default: return [];
    }
  }

  private countBlankTypes(story: string): Record<string, number> {
    const matches = story.match(/\[(.*?)\]/g) || [];
    const counts: Record<string, number> = {};
    matches.forEach((m) => {
      const type = m.replace(/\[|\]/g, "");
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }

  private getRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private shuffle<T>(arr: T[]): T[] {
    return arr.sort(() => Math.random() - 0.5);
  }

  /** Show/hide for screen switching */
  getView() {
    return { getGroup: () => this.group };
  }
  show(): void {
    this.group.visible(true);
  }
  hide(): void {
    this.group.visible(false);
  }
}
