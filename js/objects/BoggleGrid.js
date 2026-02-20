/**
 * BoggleGrid.js
 *
 * Represents the 4x4 Boggle letter grid. On construction (or when
 * generate() is called) the 16 standard dice are shuffled using a
 * Fisher-Yates shuffle, then one random face is chosen from each die
 * to populate the grid.
 *
 * Namespace: Game.BoggleGrid
 */

window.Game = window.Game || {};

/**
 * @constructor
 * Creates a new 4x4 Boggle grid.
 * The grid is generated immediately on construction.
 */
Game.BoggleGrid = function () {
  /** @type {string[][]} 4x4 2D array of single uppercase letters */
  this.grid = [];
  this.generate();
};

/**
 * generate()
 * (Re)generates the board. Shuffles the 16 dice, picks a random face
 * from each one, and fills the 4x4 grid left-to-right, top-to-bottom.
 */
Game.BoggleGrid.prototype.generate = function () {
  // Copy the dice array so we don't mutate the original
  var dice = Game.DICE.slice();

  // Fisher-Yates shuffle
  for (var i = dice.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = dice[i];
    dice[i] = dice[j];
    dice[j] = temp;
  }

  // Build the 4x4 grid
  this.grid = [];
  var index = 0;

  for (var row = 0; row < 4; row++) {
    var rowArr = [];
    for (var col = 0; col < 4; col++) {
      var die = dice[index];
      // Pick a random face (single character) from this die
      var face = die[Math.floor(Math.random() * die.length)];
      rowArr.push(face); // already uppercase in Game.DICE
      index++;
    }
    this.grid.push(rowArr);
  }
};

/**
 * getLetterAt(row, col)
 * Returns the uppercase letter at the given grid position.
 *
 * @param  {number} row - Row index (0-3).
 * @param  {number} col - Column index (0-3).
 * @return {string} Single uppercase character.
 */
Game.BoggleGrid.prototype.getLetterAt = function (row, col) {
  return this.grid[row][col];
};

/**
 * isAdjacent(r1, c1, r2, c2)
 * Returns true if the two cells are neighbours (horizontally,
 * vertically, or diagonally — within 1 step) and are NOT the
 * same cell.
 *
 * @param  {number}  r1 - Row of first cell.
 * @param  {number}  c1 - Column of first cell.
 * @param  {number}  r2 - Row of second cell.
 * @param  {number}  c2 - Column of second cell.
 * @return {boolean} True when the cells are adjacent.
 */
Game.BoggleGrid.prototype.isAdjacent = function (r1, c1, r2, c2) {
  // Same cell is not adjacent
  if (r1 === r2 && c1 === c2) {
    return false;
  }

  var rowDiff = Math.abs(r1 - r2);
  var colDiff = Math.abs(c1 - c2);

  return rowDiff <= 1 && colDiff <= 1;
};

/**
 * isInPath(row, col, path)
 * Checks whether a given cell is already part of the current path.
 *
 * @param  {number}   row  - Row index to check.
 * @param  {number}   col  - Column index to check.
 * @param  {{row:number, col:number}[]} path - Array of visited positions.
 * @return {boolean}  True if (row, col) is already in the path.
 */
Game.BoggleGrid.prototype.isInPath = function (row, col, path) {
  for (var i = 0; i < path.length; i++) {
    if (path[i].row === row && path[i].col === col) {
      return true;
    }
  }
  return false;
};

/**
 * getWordFromPath(path)
 * Concatenates the letters along the given path into a single
 * uppercase word string.
 *
 * @param  {{row:number, col:number}[]} path - Ordered array of grid positions.
 * @return {string} The word formed by the path (uppercase).
 */
Game.BoggleGrid.prototype.getWordFromPath = function (path) {
  var word = '';
  for (var i = 0; i < path.length; i++) {
    word += this.grid[path[i].row][path[i].col];
  }
  return word;
};
