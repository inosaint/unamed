/**
 * Dictionary.js
 *
 * Trie-based dictionary for fast word and prefix lookups.
 * Used by the Boggle solver and path validator to check whether
 * a sequence of letters forms a valid English word or could
 * potentially lead to one.
 *
 * Namespace: Game.Dictionary
 */

window.Game = window.Game || {};

Game.Dictionary = {
  /** Root node of the trie. Each node is a plain object whose keys
   *  are single lowercase letters. A node with `_end: true` marks
   *  the terminus of a complete word. */
  _root: {},

  /**
   * build(wordList)
   * Constructs (or rebuilds) the trie from an array of words.
   * Previous trie data is discarded.
   *
   * @param {string[]} wordList - Array of words to insert (any case).
   */
  build: function (wordList) {
    // Reset the trie
    this._root = {};

    for (var i = 0; i < wordList.length; i++) {
      var word = wordList[i].toLowerCase();
      var node = this._root;

      for (var j = 0; j < word.length; j++) {
        var ch = word[j];
        if (!node[ch]) {
          node[ch] = {};
        }
        node = node[ch];
      }

      // Mark the end of a complete word
      node._end = true;
    }
  },

  /**
   * isWord(str)
   * Returns true if the given string is a complete word in the trie.
   *
   * @param  {string}  str - The string to look up (case-insensitive).
   * @return {boolean} True when the string is a valid word.
   */
  isWord: function (str) {
    var word = str.toLowerCase();
    var node = this._root;

    for (var i = 0; i < word.length; i++) {
      var ch = word[i];
      if (!node[ch]) {
        return false;
      }
      node = node[ch];
    }

    return node._end === true;
  },

  /**
   * isPrefix(str)
   * Returns true if the given string is a prefix of at least one word
   * in the trie (the string itself does not need to be a complete word).
   *
   * @param  {string}  str - The prefix to check (case-insensitive).
   * @return {boolean} True when the string is a valid prefix.
   */
  isPrefix: function (str) {
    var prefix = str.toLowerCase();
    var node = this._root;

    for (var i = 0; i < prefix.length; i++) {
      var ch = prefix[i];
      if (!node[ch]) {
        return false;
      }
      node = node[ch];
    }

    // If we traversed the whole string, the prefix exists in the trie
    return true;
  }
};
