/**
 * @file Contains the functions used for substituting the values of the variables in scaffolding screens.
 * @version 76
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 */



/**
 * This function returns an object containing an object listing all the placeholders
 * found in the header string and the values of each variable as key-value pairs.
 * 
 * The header is searched for definitions in the format:
 *   $<word>$ = <a_word>|<a phrase in single or double quotes>
 * 
 * The word used for the placeholder may contain hyphens and plus signs.
 * 
 * @param {string} header
 *        The string in which to search for definitions of variables
 * 
 * @return {Object}
 *         The returned object is in the format
 *           {<name-of-variable1>: <value1> [, ..., <name-of-variableN>: <valueN>]}
 */

function getPlaceholderValues(header) {
  var res = {};                // stores the variables found in header; e.g. {'$A$': '2', '$B$': '3'}
  
  var re = /\$([\w+-]+)\$\s*=\s*(?:(\w+)|(['`‘’"“”][\s\w]*['`‘’"“”]))/g, // matches
                                                                         //   $<word>$ = <a_word>|<a phrase in single or double quotes>
                                                                         // and captures both sides of the '='
      match = re.exec(header); // looking up the first match
  
  while (match) {              // a match is found
    log('match: ' + typeof match[0] +
        '\n  name: ' + typeof match[1] +
        '\n    value: ' + typeof match[2] +
        '\n       or: ' + typeof match[3]);
    
    res[match[1]] = match[2]
                      ?match[2].indexOf('___') == 0
                        ?match[1].replace('_', ' ') // adding another entry to the list of variables
                        :match[2] 
                      :match[3].slice(1, -1); // if the entry is enclosed in quotes, strip the quotes
    match = re.exec(header);                         // looking up the next match
  }
  
  return res;
}



/**
 * This function searches for scaffoding screens,
 * parses the placeholder values from each header,
 * and substitutes the values in the rest of the scaffolding screen.
 * 
 * @param {DocumentApp.TableCell} cell
 *        The cell in which the lookup is performed
 */

function substituteScaffoldingPlaceholders(cell) {
  if (typeof cell === 'undefined') {
    cell = getCell();
  }
  if (!cell) {
    return;
  }
  
  var ssCount = 0;       // Scaffolding Screen counter
  
  var ssStart = cell.findText('\\[[Ss]caffolding\\s+[Ss]creen');        // Finding the first Scaffolding Screen header line
  while (ssStart) {
    ssCount++;
    
    var par = getParagraph(ssStart.getElement()),                       // Getting the entire header paragraph,
        ssHeader = par.getText(),                                       // the full text of the header,
        vals = getPlaceholderValues(ssHeader),                          // the placeholders' values from the header
        keys = Object.keys(vals);
    
    par.replaceText('[Ss]caffolding\\s+[Ss]creen\\s*-', 'Scaffolding Screen ' + ssCount + ' -');
    
    par = par.getNextSibling();                                         // Getting the first paragraph following the header
    while (par) {
      if (/\[\/[Ss]caffolding/.test(par.getText())) {                   // Checking if the paragraph contains the closing tag '/Scaffolding' 
        par.replaceText('[Ss]caffolding\\s+[Ss]creen', 'Scaffolding Screen ' + ssCount);
        break;
      }
      
      var richText = par.editAsText();
      var lineNumberMatch = /^(\s*L)(\d+)[^:]*:/.exec(richText.getText());
      if (lineNumberMatch) {
        richText.deleteText(lineNumberMatch[1].length,
                            lineNumberMatch[1].length + lineNumberMatch[2].length - 1); // removing any line numbers left from the template
      }
      
      for (var i = 0; i < keys.length; i++) {                           // substituting the value for each variable
                                                                        // (need to escape the placeholders containing +'s)
        par.replaceText('\\$' + keys[i].replace('+', '\\+') + '\\$', vals[keys[i]]);
        par.replaceText('\\$' + keys[i].toLowerCase().replace('+', '\\+') + '\\$', (vals[keys[i]]).toLowerCase());
      }
      
      par = par.getNextSibling();                                       // Getting the next paragraph (or list item)
    }
    
    ssStart = cell.findText('\\[[Ss]caffolding\\s+[Ss]creen', ssStart); // Finding the next Scaffolding Screen header line
  }  
}



/**
 * This function parses the placeholder values from the header,
 * and substitutes the values in the entire script.
 * 
 * @param {DocumentApp.TableCell} [cell=current cell]
 *        The cell in which the lookup is performed
 */

function substituteScriptPlaceholders(cell) {
  if (typeof cell === 'undefined') cell = getCell();
  if (!cell) return;
  
  var cellText = cell.getText();
  var re = /\[\s*placeholder\s+values:[^\]]*\]/gi,
      match = re.exec(cellText); // the text containing placeholders with thier values, if any
  
  if (match) {
    var valuesText = match[0],
        cellRichText = cell.editAsText(),        // the rich formatted text of the cell, needed for inserting and deleting pieces of text into the cell
        vals = getPlaceholderValues(valuesText), // the placeholders names and values from the header
        keys = Object.keys(vals);                // just the placeholder names
    
    var lowerVals = {};
    for (key in vals) {                                       // populating lowercase values
      lowerVals[key.toLowerCase()] = vals[key].toLowerCase();
    }
    var lowerKeys = Object.keys(lowerVals);
    
    var placeholderMatch, v, k;
    
    var uppercase = new RegExp('\\$(?:' + keys.join('|').replace('+', '\\+') + ')\\$', 'g');      // the pattern containing the original placeholders (for the placeholders containing +'s we need to add escaping)
    uppercase.lastIndex = match.index + match[0].length;                                          // the starting position of the search is just behind the header
    
    placeholderMatch = uppercase.exec(cellRichText.getText());
    while (placeholderMatch) {
      k = placeholderMatch[0].slice(1, -1); // the placeholder stripped of the surrounding $'s
      v = vals[k];                          // the value of the placeholder
      
      cellRichText.insertText(placeholderMatch.index + k.length + 2, v)                       // inserting the value right after the found placeholder (preserving the placeholder's formatting)
                  .deleteText(placeholderMatch.index, placeholderMatch.index + k.length + 1); // removing the placeholder
      uppercase.lastIndex -= k.length + 2 - v.length;                                         // the text has changed, so the search starting position needs to adjust accordingly
      
      placeholderMatch = uppercase.exec(cellRichText.getText());
    }
    
    var lowercase = new RegExp('\\$(?:' + lowerKeys.join('|').replace('+', '\\+') + ')\\$', 'g'); // the pattern containing the lowercase versions of the placeholders (for the placeholders containing +'s we need to add escaping)
    lowercase.lastIndex = match.index + match[0].length;                                          // the starting position of the search is just behind the header
    
    placeholderMatch = lowercase.exec(cellRichText.getText());
    while (placeholderMatch) {
      k = placeholderMatch[0].slice(1, -1); // the placeholder stripped of the surrounding $'s
      v = lowerVals[k];                     // the value of the placeholder
      
      cellRichText.insertText(placeholderMatch.index + k.length + 2, v)                       // inserting the value right after the found placeholder (preserving the placeholder's formatting)
                  .deleteText(placeholderMatch.index, placeholderMatch.index + k.length + 1); // removing the placeholder
      lowercase.lastIndex -= k.length + 2 - v.length;                                         // the text has changed, so the search starting position needs to adjust accordingly
      
      placeholderMatch = lowercase.exec(cellRichText.getText());
    }
  }
  
}



/**
 * This function looks up placeholders in the given script,
 * drops the ones that only have a single occurrence,
 * and inserts the resulting list of placeholders at the cursor.
 * 
 * @param {DocumentApp.TableCell} [cell=current cell]
 *        The cell in which the lookup is performed
 */

function generatePlaceholderHeader (cell) {
  if (typeof cell === 'undefined') cell = getCell();
  if (!cell) return;
  
  var res = {};
  var re = /\$[\w+-]+\$/g,
      text = cell.getText(),
      match = re.exec(text);
  
  while (match) {
    if (res.hasOwnProperty(match[0])) {
      res[match[0]] += 1;
    }
    else {
      res[match[0]] = 1;
    }
    
    match = re.exec(text);
  }
  
  for (key in res) {
    if (res[key] == 1) {
      delete res[key];
    }
  }
  
  var cursor = DocumentApp.getActiveDocument().getCursor();
  
  cursor.insertText('[Placeholder Values:\n ' + Object.keys(res).join(' = ___ , ') + ' = ___ ]');
}
