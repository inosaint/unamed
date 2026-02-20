# Agent B - Boggle Core
## Tasks
- [x] Create `js/data/dice.js` - 16 Boggle dice (post-1987 New Boggle distribution), each die is a 6-char string. Q is just Q (no Qu special case). Assign to `Game.DICE`
- [x] Create `js/data/wordlist.js` - Embedded array of ~10-12K common English words (3-8 letters), lowercase, assigned to `Game.WORDS`. Include common 3-letter words. Source from standard Scrabble/Boggle word lists
- [x] Create `js/objects/Dictionary.js` - Trie-based dictionary. `Game.Dictionary` object with: `build(wordList)` to construct trie, `isWord(str)` for exact match, `isPrefix(str)` for prefix checking. All lookups case-insensitive
- [x] Create `js/objects/BoggleGrid.js` - `Game.BoggleGrid` class. Constructor generates a 4x4 board by shuffling dice (Fisher-Yates) and picking random face per die. Methods: `getLetterAt(row, col)`, `isAdjacent(r1,c1,r2,c2)` (within 1 step horizontally/vertically/diagonally, not same cell), `isInPath(row, col)` checks if cell is already selected, `getWordFromPath(path)` builds word string from array of {row,col} objects. Property `grid` is a 4x4 2D array of single uppercase letters
## Notes
