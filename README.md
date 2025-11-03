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
## with 2-Week / 4-Sprint Development Plan

### **Week 1**

####  Sprint 1 (Mon–Wed)
**Goal:** Set up the project foundation  
**Deliverables:**
- TypeScript + Router architecture  
- Homepage / Menu screen (difficulty buttons)

####  Sprint 2 (Thu–Sun)
**Goal:** Build the playable MVP  
**Deliverables:**
- Core game logic (question/answer flow)  
- Results screen  
- Two mini-games (basic version)

---

### **Week 2**

####  Sprint 1 (Mon–Wed)
**Goal:** Add feedback and polish  
**Deliverables:**
- Hearts (lives) and progress bar  
- Sound effects and animations

####  Sprint 2 (Thu–Sun)
**Goal:** Final testing and presentation  
**Deliverables:**
- Bug fixes and UI polish  
- Deploy to Netlify (or another host)  
- Record final demo and presentation prep

---

**Milestone:** Functional, polished, and deployable game demo ready by the end of Week2srpint2

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
