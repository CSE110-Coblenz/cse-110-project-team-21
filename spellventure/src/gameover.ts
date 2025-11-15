// global preloads and setup (Yanhua)
(async () => {
    const { SoundManager } = await import("./utils/SoundManager");
    SoundManager.installGlobalBridge();     // global sound control
    SoundManager.preload(["click", "beep", "correct", "wrong"]);

    const { GameSelectController } = await import("./screens/GameSelectScreen/GameSelectController");

    const root = document.getElementById("container") as HTMLDivElement;
    if (!root) throw new Error("Missing #container");

    const select = new GameSelectController(root);
    select.start();
})();
