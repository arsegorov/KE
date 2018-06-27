/**
 * @file Contains the functions used to detect object identifiers in the script.
 * @version 43
 * @author Nikolay Prokopyev <nprokopyev@reasoningmind.org>
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 */



/**
 * This function expands a range string in the format 'X-Y' to an array of the format [X, ..., Y].
 *
 * @param {String} rangeString
 *                 The range string being expanded
 */

function expandRange(rangeString) {
  var result = [];
  var numbers = rangeString.split('-');
  
  if (numbers.length != 2) {
    return [];
  }
  
  var first = parseInt(numbers[0]);
  var second = parseInt(numbers[1]);
  
  for (var i = first; i <= second; i++) {
    result.push(i.toString());
  }
  
  return result;
}



/**
 * This function extracts the Objects and Colors sections from a table cell.
 * 
 * @param {DocumentApp.TableCell} cell
 *        The table cell to search in
 * 
 * @return {String}
 *         A string containing the text of the Objects and Colors sections
 */

function getObjectSections(cell) {
  var cellAsString = cell.getText(),
      lines = cellAsString.split('\n'),
      line;
  
  var result = [];
  var inObjectsSection = false;
  for (var i = 0; i < lines.length; i++) {
    line = lines[i];
    
    if (inObjectsSection && line.search(':') != -1) { // if found the next section, wait until another object section is found
      inObjectsSection = false;
    }
    if (line.search('Objects:') != -1) {
      inObjectsSection = true;
    }
    if (inObjectsSection) {
      result.push(line);
    }
  }
  
  var inColorsSection = false;  
  for(var i = 0; i < lines.length; i++) {
    line = lines[i];
    
    if (inColorsSection && line.search(':') != -1) { // if found the next section, wait until another colors section is found
      inColorsSection = false;
    }
    if (line.search('Colors:') != -1) {
      inColorsSection = true;
    }
    if (inColorsSection) {
      result.push(line);
    }    
  }
  
  return result.join('\n');
}



/**
 * This function extracts the object references from a string containing object sections.
 *
 * @param {String} objectSectionsText
 *                 A string containing sections with object declarations
 *
 * @return {Array}
 *                 The array of the object references contained in the specified string
 */

function listObjectReferences(objectSectionsText) {
  // strip the section names and [modifiers]
  var result = replaceAllRegex(objectSectionsText, 'Colors:|Objects:|\\[[^\\[]*\\]|\\([^\\(]*\\)', '');
  
  
  // replace all possible separators with commas
  result = replaceAllRegex(result, 'with|above|below|[;\\n\\r]+', ',');
  
  return result.trim().split(/\s*,\s*/);       // Arseny - I suggest returning an array right away
}



/**
 * This function splits a camel case word into an array of the word's chunks.
 * 
 * @param {String} name
 *                 The string to be split at the uppercase letters
 * 
 * @return {Array}
 *                 The array of the name's chunks
 */

function splitCamelCase(name) {
//  var tmp = name.replace(/\d/g, '');             // Arseny - not sure, but I think we should avoid numbers in partial references (or maybe not?)
  var result = [[]];
  
  for (var i = 0; i < name.length; i++) {
    var char = name.charAt(i);
    
    if (char == char.toUpperCase()) {
      result[result.length - 1] = result[result.length - 1].join('');
      result.push([]);
    }
    
    result[result.length - 1].push(char);
  }
  
  result[result.length - 1] = result[result.length - 1].join('');  
  return result;
}



/**
 * This function generates all partial recombinations of camelCase names.
 * 
 * 'bigYellowTruck' will produce:
 *   'big'
 *   'yellow'
 *   'truck'
 *   'bigYellow'
 *   'bigTruck'
 *   'yellowTruck'
 *   'bigYellowTruck'
 * 
 * The first letter in a valid combination should be lowercase, so
 * Big, Yellow, YellowTruck and BigTruck are invalid combinations.
 * 
 * @param {string} name
 *                 A string in camelCase.
 * 
 * @return {Array}
 *                 The arrary of all admissible recombinations, each preceded with the 'all' keyword
 */

function referencesByNameParts(name) {                  // Arseny - renamed 'combineCamelCase' to better represent what the function does
  var parts = splitCamelCase(name);
  var result = [];
  
  for (var i = 0; i < parts.length; i++) {
    if(parts[i] == '') {
      continue;
    }
      
    var partLower = parts[i].toLowerCase(),
        combinationGroups = [partLower];
    
    // push one word
    result.push(partLower);
    
    // build admissible combinations
    for (var j = i + 1; j < parts.length; j++) {
      var fixedLen = combinationGroups.length;
      
      for (var k = 0; k < fixedLen; k++) {
        var comb = combinationGroups[k] + parts[j];
        
        result.push(comb);
        combinationGroups.push(comb);
      } 
    }
  }
  
  return result;
}



/**
 * This function looks up a labyrinth definition for labyrinth dimensions.
 * If a definition is present, the dimensions are expanded into individual cell references.
 * Also, the object references 'up', 'down', 'left', and 'right' are added.
 * 
 * @param {DocumentApp.TableCell} cell
 */
function labyrinthObjects(cell) {
  var labDims = cell.findText('labyrinth[\\s\\[\\w,]+[A-Z][0-9]\\s*\\.\\.\\s*[A-Z][0-9]');
  
  if (labDims) {
    var range = /[A-Z][0-9]\s*\.\.\s*[A-Z][0-9]/.exec(labDims.getElement().asText().getText())[0],
        rangeBounds = range.split(/[\.\s]+/);
    
    return '|[' + rangeBounds[0].slice(0, 1) + '-' + rangeBounds[1].slice(0, 1) + ']' +                                  // Alpha bounds, e.g., [A-N]
           '(?:' + expandRange('' + rangeBounds[0].slice(1) + '-' + rangeBounds[1].slice(1)).reverse().join('|') + ')' + // Numerical bounds, e.g. (?:1|2|3|4|5|6|7|8|9|10)
           '|up|down|left|right';
  }
  else {
    return '';
  }
}



/**
 * This function returns list of valid object references from Objects section raw string source.
 * 
 * @param {string} objectSectionsText
 * 
 * 
 * @return {Array}
 * 
 */

function getExpanededObjectReferences(objectSectionsText) {
  var objectReferenses = listObjectReferences(objectSectionsText),
      len = objectReferenses.length;
  var names = [],  // will collect simple references
      camels = []; // will collect group references by name parts
  
  for (var refIndex = 0; refIndex < len; refIndex++) {
    var elem = objectReferenses[refIndex];
    
    // skip empty references
    if (elem.length == 0) {
      continue;
    }
    
    // process object definitions
    if (elem.indexOf(' ') == -1) {          // for simple references
      if (elem.indexOf('num') == 0) {
        names.push(elem.replace(/num(\d+)(.*)/, 'num$2$1'));
        names.push(elem.replace(/num(.*)(\d+)/, 'num$2$1'));
      }
      names.push(elem);
      
      camels = camels.concat(referencesByNameParts(elem));
    }
    else {                                  // for ranged references
      // skip invalid definitions
      var parts = elem.split(' ');
      if (parts.length != 2) {
        continue;
      }
      
      var name = parts[0],
          rangeString = parts[1],
          indexes = expandRange(rangeString);
      
      if (indexes.length == 0) {
        continue;
      }
      
      // listing existing indexes in the format (?:i[n]|i[n-1]|...|i[1])
      // the order is reversed because the alteration in javaScript is lazy:
      // it stops at the first match, so 2-digit indexes are often not matched (usually when there's index 1)
      var tmp = '(?:';      
      for (var i = indexes.length - 1; i > -1; i--) { // Interestingly, this is faster than join('|') by ~0.3s
        tmp = tmp + indexes[i] + '|';
      }
      tmp = tmp.slice(0, -1) + ')';
      
      if (name.indexOf('num') == 0) {            // putting the index in the middle of numCard, numButton, numHouse, etc.
        names.push('num' + tmp + name.slice(3));
      }
      else if (name == 'dotCard') {              // or dotCard
        names.push('dot' + tmp + 'Card');
      }
      names.push(name + tmp);
      
      // listing all possible ranges of indexes in the format (?:i[1]-i[n]|i[2]-i[n]|...|i[n-1]-i[n])
      tmp = '\\s+(?:';
      for (var i = indexes.length - 1; i > -1; i--) {
         for (var j = i - 1; j > -1; j--) {
           tmp = tmp + indexes[j] + '-' + indexes[i] + '|';
         }
      }
      names.push(name + tmp.slice(0, -1) + ')');
      
      // add all possible 'all' notations
      // (with partial camelCase, like 'camel' and 'case')
      camels = camels.concat(referencesByNameParts(name));
    }
  }
  
  names.push('all\\s+(?:' + unique(camels.sort()).reverse().join('|') + ')'); // the reverse sort is needed to match longer names first
  return names;                                                               // unique(a) removes duplicates from the sorted array for speedier matching
}



/**
 * This function builds a pattern by concatenating the individual fragments with '|'.
 * 
 * @param {string []} fragments
 *                    The list of pattern fragments
 */

function buildPattern(fragments) {
  return '(?:' + fragments.sort().reverse().join('|') + ')'; // the reverse sort is needed to match longer names first
}
