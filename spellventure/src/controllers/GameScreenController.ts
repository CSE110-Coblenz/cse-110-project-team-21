/**
 * @file GameScreenController.ts
 */

import Konva from "konva";
import type { ScreenSwitcher } from "../types";

import GameScreenView from "../views/GameScreenView";
import WordLinkController from "./WordLinkController";
import MadLibPhaseController from "./MadLibPhaseController";

import { nouns } from "../data/nouns";
import { verbs } from "../data/verbs";
import { adjectives } from "../data/adjectives";
import { animals } from "../data/animals";
import { foods } from "../data/foods";
import { subjects } from "../data/subjects";
import { exclamations } from "../data/exclamations";

export default class GameScreenController {
  private app: ScreenSwitcher;
  private stage: Konva.Stage;
  private layer: Konva.Layer;

  private backgroundView: GameScreenView;

  private rootGroup: Konva.Group;
  private backgroundLayer: Konva.Group;
  private contentLayer: Konva.Group;

  private wordLink?: WordLinkController;
  private madLibController?: MadLibPhaseController;

  constructor(app: ScreenSwitcher, stage: Konva.Stage, layer: Konva.Layer) {
    this.app = app;
    this.stage = stage;
    this.layer = layer;

    this.rootGroup = new Konva.Group({ visible: false });

    // Permanent background
    this.backgroundLayer = new Konva.Group({ listening: false });
    this.backgroundView = new GameScreenView();
    this.backgroundLayer.add(this.backgroundView.getGroup());

    // Foreground layer (WordLink / MadLib)
    this.contentLayer = new Konva.Group();

    this.rootGroup.add(this.backgroundLayer);
    this.rootGroup.add(this.contentLayer);

    this.layer.add(this.rootGroup);
    this.stage.add(this.layer);

    this.startStoryFlow();
  }

  /** Build story + launch WordLink */
  private startStoryFlow(): void {
    const story = `
      ${this.getRandom(exclamations)}! Today at school, my [adjective] teacher stormed in holding a [noun]
      and announced we’d be studying [subject] by training a [animal] to [verb].
      The idea sounded [adjective], but she told us to bring our [noun] and [food].
      During recess, my best friend and I found a [animal] trying to [verb] a [noun],
      which made the whole class [verb]! Everyone shouted "${this.getRandom(exclamations)}!"
    `;

    const required = this.countBlankTypes(story);

    const wordSet: { word: string; type: string }[] = [];
    for (const [type, count] of Object.entries(required)) {
      const list = this.getListByType(type);
      const chosen = this.shuffle(list).slice(0, count);
      chosen.forEach((w) => wordSet.push({ word: w, type }));
    }

    (this.app as any).storyData = { story, wordSet };
    this.startWordLinkPhase(wordSet);
  }

  /** Launch WordLink cleanly */
  private startWordLinkPhase(wordSet: { word: string; type: string }[]): void {
    console.log("🎮 Launching Word Link Phase");

    // ⭐ TRUE FIX: Remove loading text immediately
    this.backgroundView.hideTitle();

    // Clear only foreground
    this.contentLayer.destroyChildren();

    this.wordLink = new WordLinkController(this.app, wordSet);
    this.contentLayer.add(this.wordLink.getView().getGroup());

    this.layer.batchDraw();
  }

  /** Resume directly to MadLib */
  resumeToMadLib(): void {
    const storyData = (this.app as any).storyData;
    if (!storyData) return;

    this.backgroundView.hideTitle(); // safety

    this.contentLayer.destroyChildren();
    this.madLibController = new MadLibPhaseController(
      this.app,
      storyData.story,
      storyData.wordSet
    );
    this.contentLayer.add(this.madLibController.getView().getGroup());

    this.layer.batchDraw();
  }

  /** Resume back to WordLink */
  resumeToWordLink(): void {
    const storyData = (this.app as any).storyData;
    if (!storyData) return;

    this.backgroundView.hideTitle(); // safety

    this.contentLayer.destroyChildren();
    this.wordLink = new WordLinkController(this.app, storyData.wordSet);
    this.contentLayer.add(this.wordLink.getView().getGroup());
    this.layer.batchDraw();
  }

  show(): void {
    this.rootGroup.visible(true);
    this.backgroundView.show();

    // ⭐ EXTRA SAFETY: Always hide title on show
    this.backgroundView.hideTitle();
  }

  hide(): void {
    this.rootGroup.visible(false);
  }

  getView() {
    return { getGroup: () => this.rootGroup };
  }

  /* Utility helpers */
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
    const out: Record<string, number> = {};
    matches.forEach((m) => {
      const t = m.replace(/\[|\]/g, "");
      out[t] = (out[t] || 0) + 1;
    });
    return out;
  }

  private getRandom(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private shuffle<T>(list: T[]): T[] {
    return [...list].sort(() => Math.random() - 0.5);
  }

  onResize(width: number, height: number): void {
    this.backgroundView.onResize(width, height);
  }
}
