import { GameState } from "../state/GameState";

export class WordLinkController{

static initialize(){
    const state = GameState.load();
    //starter words tentative
    const words = ["cat", "catch", "crab","giraffe"];
    const randomWord = words[Math.floor(Math.random()*words.length)];
    state.setCurrentWord(randomWord);
    state.resetWordLink();
    state.setCurrentWord(randomWord);

    //set current word
}

static validateWord(newWord: string): boolean{
    const state = GameState.load();
    //get currentWord
    const current = state.getWordLinkCurrentWord(); 
    //case for first word
    if(current == null){
        return true;
    }
    const lastLetter = current.slice(-1).toLowerCase();
    const first = newWord[0].toLowerCase();

    return first == lastLetter;
}

static progress(newWord: string){
    const state = GameState.load();
    state.setCurrentWord(newWord);
    state.incrementWordsCollected();
}
static incorrect(){
    const state = GameState.load();
    state.removeLinkHealth(1);

}
static isGameOver(): boolean {

    const state = GameState.load();
    return state.getHealth() <= 0;
}

}





