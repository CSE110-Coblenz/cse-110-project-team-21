# Team 21 SpellVenture

**Spellventure** is an educational web app that teaches spelling and grammar through interactive, Mad Lib–style storytelling.  
Designed for children aged 6–10, our app encourages literacy and creativity with drag-and-drop gameplay, visual feedback, and playful narration.

---

## 🎯 Purpose

To make spelling practice fun and accessible by combining interactive stories, colorful animations, and positive reinforcement.

---

## 🧩 Features

- 🧠 **Difficulty Levels** – Easy, Medium, Hard (word bank, hints, or free-spell (no hints) mode)
- ✏️ **Drag & Drop Gameplay** – Built using [Konva.js](https://konvajs.org/)
- 🔊 **Text-to-Speech Playback** – Hear your completed story read aloud
- 🌟 **Visual Feedback** – Animations and colors for correct/incorrect answers
- 💾 **Progress Saving** – Uses browser local storage to remember stories and achievements

---

## 🧱 Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Konva.js
- **Backend (future):** Node.js
- **Storage:** Browser LocalStorage
- **Design Mockups:** Figma

---

## User Stroies（Backlog） 
priority levels from the most to the least

#### 1️. Difficulty Selection
**As a student, I want to have different difficulty levels so that I can challenge myself.**  
*Acceptance Criteria*
- UI with Easy / Medium / Hard buttons  
- Switch difficulty and start game  
- Integrated with gameplay


#### 2️. Story Selection & Reading
**As a student, I want to read short stories so I can practice reading.**  
*Acceptance Criteria*
- Story selection page with titles  
- “(viewed)” tag for read stories  
- Reading page with next/previous navigation


#### 3️. Progress Bar
**As a student or teacher, I want to see a progress bar so that I can track progress.**  
*Acceptance Criteria*
- Animated progress bar during reading  
- Updates dynamically  
- Optional persistent storage


#### 4️. Spelling & Rewards
**As a user, I want to be rewarded for correct answers so that I stay motivated.**  
*Acceptance Criteria*
- Fill-in-the-blank sentences  
- Correct answers added to word bank  
- Animation or sound feedback on success


### 5️. Quiz Mode (Testing Page)
**As a student, I want to practice spelling by filling in blanks to test my understanding.**  
*Acceptance Criteria*
- One sentence per question  
- 3 multiple-choice options or drag-and-drop  
- Life hearts decrease on wrong answers  
- “Next” and “Return” buttons


### 6️. Completion & Mini Games
**As a student, I want a fun completion page and bonus mini games so that I feel rewarded.**  
*Acceptance Criteria*
- Congratulations message  
- “Next Story” and “Return Home” buttons  
- Mini-games (Shooting / Bouncing Ball) to earn the life back but adding up the fun into the game

---

## Plan

Sprint 1 >>> Monday–Wednesday
Sprint 2 >>> Thursday–Sunday

- **MileStone1-Core MVP (week5)**
  
  sprint1
  
    -Goal: Set up architecture and homepage
  
    -Deliverable: TypeScript + Router, Menu screen (difficulty buttons)


  sprint2
  
    -Goal: Game logic , result screen , 2 mini games
  
    -Deliverable: Basic question/answer flow + Results screen / the minimum version of the mini games
  
  
- **MileStone2-Game Polish (week6)**

  sprint1

    -Goal: Add lives (hearts) and progress bar

    -Deliverable: Visual progress and challenge system


  sprint2
  
    -Goal: Add sound effects & animations
    
    -Deliverable: Audio/visual feedback for correct/incorrect answers
    
    
- **MileStone3-UI/UX Enhancement(week7)**

  sprint1
  
    -Goal: Improve visual design
    
    -Deliverable: Cartoon-style interface, colors, typography

    
  sprint2
  
    -Goal: Accessibility and responsive layout
    
    -Deliverable: Works on tablet and keyboard navigation

    
- **MileStone4-Testing(week8)**

  sprint2
  
    -Goal: Bug fixes and testing
    
    -Deliverable: Functional testing

    
  sprint2
  
    -Goal: feedback from peers / users
    
    -Deliverable: Functional testing and polish
    
    
- **MileStone5-Launch and Demo(week9-10)**

  sprint1
  
    -Goal: Final testing and deployment
    
    -Deliverable: Host on Netlify or other online server

    
  sprint2
  
    -Goal: Record demo & presentation prep
    
    -Deliverable: Final playable demo for the showcase


    ---


## MVC structure
```bash
  spelling-game/
├─ index.html
├─ style.css
└─ src/
   ├─ types.ts
   ├─ constants.ts
   ├─ router.ts            # controls screen switching
   ├─ main.ts              # app entry point
   │
   ├─ models/              # NEW — data layer / game state
   │  ├─ GameState.ts      # lives, score, currentStory, currentQuestion
   │  ├─ ProgressModel.ts  # handles progress bar + word bank
   │  └─ Storage.ts        # optional localStorage wrapper
   │
   ├─ screens/
   │  ├─ Menu/
   │  │  ├─ MenuScreenController.ts
   │  │  └─ MenuScreenView.ts
   │  ├─ StorySelect/
   │  │  ├─ StorySelectController.ts
   │  │  └─ StorySelectView.ts
   │  ├─ Game/
   │  │  ├─ GameScreenController.ts   # manages reading + fill-in-blank logic
   │  │  └─ GameScreenView.ts
   │  └─ Results/
   │     ├─ ResultsScreenController.ts
   │     └─ ResultsScreenView.ts
   │
   ├─ ui/
   │  └─ dom.ts            # DOM helpers (qs, createBtn, etc.)
   │
   └─ assets/              # NEW — images, sounds, stories
      ├─ sounds/
      │   ├─ correct.mp3
      │   └─ wrong.mp3
      ├─ images/
      │   ├─ heart.png
      │   └─ progress-bg.png
      └─ stories/
          ├─ easy.json
          ├─ medium.json
          └─ hard.json
