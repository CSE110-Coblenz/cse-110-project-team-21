import Konva from "konva";

/**
 * @class MenuScreenView
 * @brief Pure view layer for the main menu.
 *
 * Responsibilities:
 * - Creates the Konva nodes for:
 *   - A faint target "PLAY" text (non-interactive, acts like a shadow/outline).
 *   - A draggable "PLAY" text that the user must drag into the target.
 * - Exposes show/hide/resize/reset methods.
 * - Encapsulates the drag logic and success detection for the "PLAY" mini interaction.
 *
 * IMPORTANT:
 * - This class never navigates screens directly.
 *   It only calls the callback passed into `startPlayIntro`.
 *   The controller (MenuScreenController) decides where to go next.
 */
export default class MenuScreenView {
  /**
   * Root Konva.Group that contains all menu UI.
   * App.ts adds this group to a Konva.Layer, which is added to the Stage.
   */
  private group: Konva.Group;

  /**
   * Non-interactive "shadow" text for PLAY.
   * This is the "target" location where the draggable word should be dropped.
   */
  private targetWord: Konva.Text;

  /**
   * Draggable "PLAY" text.
   * The user drags this toward `targetWord`. When it’s close enough, we snap and animate.
   */
  private draggableWord: Konva.Text;

  /**
   * @brief Constructs the view and builds all Konva nodes for the menu.
   *
   * The constructor creates an empty group and calls `build()` to populate it
   * with the two "PLAY" text nodes (target + draggable).
   */
  constructor() {
    // Group that will hold both the target and draggable text.
    this.group = new Konva.Group();

    // Build the visual elements and add them into the group.
    this.build();
  }

  /**
   * @brief Builds the initial Konva nodes for the menu layout.
   *
   * Layout:
   * - `targetWord` is centered roughly in the top-middle of the screen.
   * - `draggableWord` starts near the bottom-middle as a bright colored word.
   *
   * Notes:
   * - Uses `window.innerWidth`/`innerHeight` directly here.
   *   On resize, `onResize()` updates these positions.
   */
  private build(): void {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Faint "PLAY" target text (acts as the slot where the draggable word snaps into).
    this.targetWord = new Konva.Text({
      text: "PLAY",
      fontSize: 140,
      fontFamily: "Arial Black",
      // Very light fill so it appears like a shadow/outline.
      fill: "rgba(0,0,0,0.1)",
      // Positioned slightly above the vertical center.
      x: centerX - 220,
      y: centerY - 180,
      align: "center",
      // User should not be able to click or drag this.
      listening: false,
    });

    // Draggable "PLAY" word the player interacts with.
    this.draggableWord = new Konva.Text({
      text: "PLAY",
      fontSize: 140,
      fontFamily: "Arial Black",
      // Primary color – visually stands out as an interactive element.
      fill: "#4f46e5",
      x: centerX - 220,
      // Start near bottom of screen to reinforce dragging upward to target.
      y: window.innerHeight - 250,
      draggable: true, // Enables Konva drag handling.
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 10,
    });

    // Add both text nodes into the group so the controller can add the group to the layer.
    this.group.add(this.targetWord, this.draggableWord);
  }

  /**
   * @brief Returns the Konva group so App.ts can attach it to the main layer.
   *
   * @returns Root Konva.Group for this menu screen.
   */
  getGroup(): Konva.Group {
    return this.group;
  }

  /**
   * @brief Starts the intro interaction where the user drags "PLAY" into the target outline.
   *
   * Behavior:
   * - Resets the draggable word’s position/visibility/color.
   * - Removes any existing "dragend" handlers to avoid multiple triggers.
   * - Attaches a new "dragend" handler:
   *   - Checks if the draggable word is close enough to `targetWord`.
   *   - If close: snaps the draggable word into position, changes its color,
   *     plays a small pulsing animation, then calls `onComplete`.
   *
   * @param onComplete Callback invoked when the user successfully completes the drag.
   *                   The controller passes a function that navigates to the
   *                   difficulty screen.
   */
  startPlayIntro(onComplete: () => void): void {
    // Reset draggable word to starting position and visibility at the bottom.
    this.draggableWord.position({
      x: window.innerWidth / 2 - 220,
      y: window.innerHeight - 250,
    });
    this.draggableWord.visible(true);

    // Reset to the default blue/purple color for a "fresh" interaction.
    this.draggableWord.fill("#4f46e5");

    // Remove any old dragend listeners that might still be attached
    // from previous runs, so we don't trigger multiple callbacks.
    this.draggableWord.off("dragend");

    // Attach a new dragend handler for this run of the intro.
    this.draggableWord.on("dragend", () => {
      // Compute the distance between draggable and target along X and Y.
      // This is a simple "hitbox" check instead of using Konva collision detection.
      const dx = Math.abs(this.draggableWord.x() - this.targetWord.x());
      const dy = Math.abs(this.draggableWord.y() - this.targetWord.y());

      // If the draggable word is close enough in both X and Y,
      // treat that as a "success" and snap into place.
      //
      // If you changed this 80 threshold:
      // - Smaller number → player has to be more precise.
      // - Larger number → easier for player to succeed.
      if (dx < 80 && dy < 80) {
        // Snap the draggable word exactly on top of the target.
        this.draggableWord.position({
          x: this.targetWord.x(),
          y: this.targetWord.y(),
        });

        // Change color to a darker blue to give a "locked in" feeling.
        this.draggableWord.fill("#1e3a8a");

        // Create a small pulsing animation while the word is snapped.
        const anim = new Konva.Animation((frame) => {
          // frame.time is the elapsed time in ms since animation start.
          // We use a sine wave to make a smooth pulse effect.
          const scale = 1 + 0.1 * Math.sin(frame.time * 0.02);
          this.draggableWord.scale({ x: scale, y: scale });
        }, this.group.getLayer());

        // Start the pulsing animation immediately when the drop succeeds.
        anim.start();

        // After a short delay, stop the animation, reset scale, and call onComplete().
        setTimeout(() => {
          anim.stop();
          this.draggableWord.scale({ x: 1, y: 1 });
          // Let the controller decide what happens next (usually go to difficulty screen).
          onComplete();
        }, 800);
      }
    });
  }

  /**
   * @brief Makes the entire menu screen visible.
   *
   * This is called by the controller/App when switching TO the menu screen.
   */
  show(): void {
    this.group.visible(true);
  }

  /**
   * @brief Hides the entire menu screen.
   *
   * This is called by the controller/App when switching AWAY FROM the menu screen.
   */
  hide(): void {
    this.group.visible(false);
  }

  /**
   * @brief Adjusts layout when the stage/container is resized.
   *
   * Behavior:
   * - Recomputes positions for both `targetWord` and `draggableWord`
   *   based on the new width/height, keeping them centered.
   *
   * @param width  New width of the stage/container.
   * @param height New height of the stage/container.
   */
  onResize(width: number, height: number): void {
    // Keep target "PLAY" centered horizontally and slightly above vertical center.
    this.targetWord.x(width / 2 - 220);
    this.targetWord.y(height / 2 - 180);

    // Reset the draggable word's position to a point near the bottom center.
    // NOTE: This assumes we want the starting position relative to new height.
    this.draggableWord.x(width / 2 - 220);
    this.draggableWord.y(height - 250);
  }

  /**
   * @brief Resets the draggable "PLAY" word to its initial starting state.
   *
   * Used when returning home from other screens so the intro interaction
   * looks like it is starting over from scratch.
   *
   * Behavior:
   * - Moves the draggable word back to its original bottom-center position.
   * - Restores the default fill color.
   * - Resets scale to (1,1) in case any animation modified it.
   */
  resetPlayPosition(): void {
    this.draggableWord.position({
      x: window.innerWidth / 2 - 220,
      y: window.innerHeight - 250,
    });

    // Reset to the default blue color users see the first time.
    this.draggableWord.fill("#4f46e5");

    // Clear any leftover scale from animations.
    this.draggableWord.scale({ x: 1, y: 1 });
  }
}
