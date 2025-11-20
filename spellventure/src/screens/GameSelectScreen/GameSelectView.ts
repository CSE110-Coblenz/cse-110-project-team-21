// src/screens/GameSelectScreen/GameSelectView.ts

export class GameSelectView {
    static stylesInjected = false;
    container: HTMLDivElement;

    constructor(container: string | HTMLDivElement) {
        // Convert selector or element to HTMLElement
        this.container = typeof container === "string"
            ? document.querySelector(container)!
            : container;
    }

    render(games: { id: string; name: string }[], onSelect: (id: string) => void) {
        // Clear previous UI
        this.container.innerHTML = `
        <div class="mini-select-wrapper">
            <h1 class="mini-select-title">Choose a Mini Game</h1>
            <div class="mini-select-buttons">
                ${games.map(g => `<button class="mini-btn" data-id="${g.id}">${g.name}</button>`).join("")}
            </div>
        </div>
        `;

        // Attach click handlers
        this.container.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                onSelect(String((btn as HTMLButtonElement).dataset.id));
            });
        });

        // Apply CSS styles dynamically (no external stylesheets required)
        this.applyStyles();
    }

    // ----- UI Styles -----
      private applyStyles() {
        
        if (GameSelectView.stylesInjected) return;   // ⭐ 只插入一次
        GameSelectView.stylesInjected = true;

        const style = document.createElement("style");
        style.innerHTML = `
        /* Background gradient unicorn style */
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #ffd6ff, #c8b5ff, #a0e9ff, #d0ffd6);
            background-size: 400% 400%;
            animation: gradientFlow 10s ease infinite;
        }

        @keyframes gradientFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

            .mini-select-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                height: 100vh;
                padding-top: 15vh;
                text-align: center;
            }

            .mini-select-title {
                font-size: 3rem;
                font-weight: 700;
                margin-bottom: 40px;
                color: #4b3b6b;
                text-shadow: 2px 2px 5px rgba(255,255,255,0.6);
            }

            .mini-select-buttons {
                display: flex;
                gap: 20px;
            }

            /* --- BUTTON BASE STYLE --- */
            .mini-btn {
                position: relative;
                font-size: 1.4rem;
                padding: 14px 34px;
                border-radius: 16px;
                border: none;
                cursor: pointer;
                color: #fff;
                box-shadow: 0 6px 14px rgba(0,0,0,0.18);
                transition: transform 0.2s ease, opacity 0.3s;
                background-size: 300% 300%;
                /* IMPORTANT: do NOT set background-color here,
                gradients below will be visible immediately */
            }

            /* --- Hover cartoon golden glow --- */
            .mini-btn:hover {
                transform: scale(1.12);

                /* Thick cartoon outline */
                outline: 4px solid #ffd84f;
                outline-offset: 4px;

                /* Glow + shadow stack */
                box-shadow:
                    0 0 12px rgba(255, 225, 90, 0.9),
                    0 0 24px rgba(255, 200, 60, 0.7),
                    0 0 36px rgba(255, 180, 50, 0.6);

                /* Slight bloom */
                filter: drop-shadow(0 0 12px rgba(255, 220, 100, 0.8));
                animation: glowPulse 1.2s infinite ease-in-out;
            }

            /* Pulsing keyframes */
            @keyframes glowPulse {
                0% {
                    box-shadow:
                        0 0 10px rgba(255, 230, 120, 0.7),
                        0 0 18px rgba(255, 210, 100, 0.6),
                        0 0 30px rgba(255, 190, 80, 0.5);
                }
                50% {
                    box-shadow:
                        0 0 20px rgba(255, 240, 140, 1),
                        0 0 40px rgba(255, 215, 100, 0.9),
                        0 0 60px rgba(255, 200, 70, 0.8);
                }
                100% {
                    box-shadow:
                        0 0 10px rgba(255, 230, 120, 0.7),
                        0 0 18px rgba(255, 210, 100, 0.6),
                        0 0 30px rgba(255, 190, 80, 0.5);
                }
            }


            /* --- BUTTON 1: Pink → Purple (always visible) --- */
            .mini-btn[data-id="drop"] {
                background: linear-gradient(135deg, #ff9ecd, #c28dff, #ff7ab8, #d6a4ff);
                background-size: 300% 300%;
                animation: btnGradientA 8s ease infinite;
            }

            /* --- BUTTON 2: Blue → Mint (always visible) --- */
            .mini-btn[data-id="bubble"] {
                background: linear-gradient(135deg, #7ed9ff, #a0ffe6, #5fb8ff, #9ffff1);
                background-size: 300% 300%;
                animation: btnGradientB 12s ease infinite;
            }

            /* （less priority) nav buttons */
            .mini-nav-row {
            margin-top: 60px;
            display: flex;
            gap: 14px;
            justify-content: center;
            }

            .mini-nav-btn {
            font-size: 0.95rem;
            padding: 10px 18px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.4);
            background: rgba(255,255,255,0.08);
            color: #2e2a4f;
            cursor: pointer;
            transition: 0.25s ease;
            backdrop-filter: blur(6px);
            }

            /* Hover subtle glow */
            .mini-nav-btn:hover {
            background: rgba(255,255,255,0.18);
            transform: translateY(-2px);
            }

        `;
        document.head.appendChild(style);
    }

    
}
