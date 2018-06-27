/**
 * @file Contains auxiliary functions used to shorten code expressions.
 * @version 37
 * @author Nikolay Prokopyev <nprokopyev@reasoningmind.org>
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 */



/**
 * This is a convenience function for logging messages in the Apps Script's internal logger.
 *
 * @param msg The logged message
 */

function log(msg) {
  Logger.log('\n' + msg);
}



/**
 * This function replaces each pattern matched substring with replacement string.
 *
 * @param {string} str
 * @param {string} pattern
 * @param {string} replacement
 */

function replaceAllRegex(str, pattern, replacement) {
  return str.replace(new RegExp(pattern, 'g'), replacement);
}



/**
 * This function removes duplicate entries from a sorted array.
 * Taken from http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array
 *
 * @param {Array} a
 *                The array to be pruned
 * 
 * @return
 *         This array pruned of duplicate entries (careful, the array is changed)
 */
function unique(a) {
    return a.filter(function(item, pos, array) {
        return !pos || item != array[pos - 1];
    })
}
