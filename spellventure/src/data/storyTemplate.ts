/**
 * @file storyTemplate.ts
 * @brief Defines the “school day” Mad Lib story using word bank types.
 */

export type WordType =
  | "adjective"
  | "noun"
  | "verb"
  | "adverb"
  | "animal"
  | "food"
  | "place"
  | "subject"
  | "exclamation";

export interface StoryBlank {
  type: WordType;
  placeholder: string;
}

/**
 * School Day Story (15 blanks total)
 *
 * Today at school, my [ADJECTIVE1] teacher stormed in holding a [NOUN1] and
 * announced we’d be studying [SUBJECT] by training a [ANIMAL1] to [VERB1].
 * The idea sounded [ADJECTIVE2], but she told us to first collect [NOUN2]
 * from the cafeteria and trade them for extra [FOOD]. Everything was fine until
 * the [ANIMAL1] [VERB2] on the projector and someone yelled [EXCLAMATION]!
 * The chaos got worse when [ANIMAL2] from the science room started to [VERB3]
 * on my [NOUN3]. We all ran [ADVERB] to the [PLACE], where the teacher just
 * sighed and said, “Welcome to [SUBJECT2] class.”
 */

export const storyTemplate: (string | StoryBlank)[] = [
  "Today at school, my ",
  { type: "adjective", placeholder: "____ (adjective)" },           // 1
  " teacher stormed in holding a ",
  { type: "noun", placeholder: "____ (noun)" },                     // 2
  " and announced we’d be studying ",
  { type: "subject", placeholder: "____ (subject)" },               // 3
  " by training a ",
  { type: "animal", placeholder: "____ (animal)" },                 // 4
  " to ",
  { type: "verb", placeholder: "____ (verb)" },                     // 5
  ". The idea sounded ",
  { type: "adjective", placeholder: "____ (adjective)" },           // 6
  ", but she told us to first collect ",
  { type: "noun", placeholder: "____ (noun)" },                     // 7
  " from the cafeteria and trade them for extra ",
  { type: "food", placeholder: "____ (food)" },                     // 8
  ". Everything was fine until the ",
  { type: "animal", placeholder: "____ (animal)" },                 // 9
  " ",
  { type: "verb", placeholder: "____ (verb)" },                     // 10
  " on the projector and someone yelled ",
  { type: "exclamation", placeholder: "____ (exclamation)" },       // 11
  "! The chaos got worse when ",
  { type: "animal", placeholder: "____ (animal)" },                 // 12
  " from the science room started to ",
  { type: "verb", placeholder: "____ (verb)" },                     // 13
  " on my ",
  { type: "noun", placeholder: "____ (noun)" },                     // 14
  ". We all ran ",
  { type: "adverb", placeholder: "____ (adverb)" },                 // 15
  " to the ",
  { type: "place", placeholder: "____ (place)" },                   // 16
  ", where the teacher just sighed and said, “Welcome to ",
  { type: "subject", placeholder: "____ (subject)" },               // 17
  " class.”"
];
