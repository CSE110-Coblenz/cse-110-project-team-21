import Konva from "konva";
import type { ScreenSwitcher } from "../types";
import GameScreenView from "../views/GameScreenView";
import WordLinkController from "./WordLinkController";

// Import your word banks
import { nouns } from "../data/nouns";
import { verbs } from "../data/verbs";
import { adjectives } from "../data/adjectives";
import { animals } from "../data/animals";
import { foods } from "../data/foods";
import { subjects } from "../data/subjects";
import { exclamations } from "../data/exclamations";

export default class GameScreenController {
  private view: GameScreenView;
  private app: ScreenSwitcher;
  private stage: Konva.Stage;
  private layer: Konva.Layer;
  private wordLink?: WordLinkController;

  constructor(app: ScreenSwitcher, stage: Konva.Stage, layer: Konva.Layer) {
    this.app = app;
    this.stage = stage;
    this.layer = layer;

    // ✅ Instantiate GameScreenView with background
    this.view = new GameScreenView();
    this.layer.add(this.view.getGroup());

    // Start story + word flow
    this.startStoryFlow();
  }

  getView(): GameScreenView {
    return this.view;
  }

  show(): void {
    this.view.show();
  }

  hide(): void {
    this.view.hide();
  }

  onResize(width: number, height: number): void {
    this.view.onResize(width, height);
  }

  /** ===== Story & WordLink Logic ===== */
  private startStoryFlow(): void {
    const story = `
${this.getRandom(exclamations)}! Today at school, my [adjective] teacher stormed in holding a [noun]
and announced we’d be studying [subject] by training a [animal] to [verb].
The idea sounded [adjective], but she told us to bring our [noun] and [food].
During recess, my best friend and I found a [animal] trying to [verb] a [noun],
which made the whole class [verb]! Everyone laughed and shouted "${this.getRandom(exclamations)}!"
`;

    const required = this.countBlankTypes(story);
    const wordSet: { word: string; type: string }[] = [];

    for (const [type, count] of Object.entries(required)) {
      const source = this.getListByType(type);
      const chosen = this.shuffle(source).slice(0, count);
      chosen.forEach((w) => wordSet.push({ word: w, type }));
    }

    (this.app as any).storyData = { story, wordSet };
    this.startWordLinkPhase(wordSet);
  }

  private startWordLinkPhase(wordSet: { word: string; type: string }[]): void {
    console.log("🎮 Launching Word Link phase with fixed story-based word set...");
    this.wordLink = new WordLinkController(this.app, wordSet);

    const viewObj = this.wordLink.getView();
    if (viewObj && viewObj.getGroup) {
      this.view.getGroup().add(viewObj.getGroup()); // Add on top of background
    } else {
      console.error("❌ WordLinkController did not return a valid view object:", viewObj);
    }

    this.layer.batchDraw();
  }

  /** ===== Utilities ===== */
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
}
