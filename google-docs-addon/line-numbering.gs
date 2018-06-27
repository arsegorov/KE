/**
 * @file Contains the functions for numbering voice lines.
 * @version 71
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 */



/**
 * Finds the largest line number used in the cell.
 * 
 * @param {DocumentApp.TableCell} cell
 *        The cell in which the lookup is performed
 *
 * @return {Number} 
 *         The greatest number for the numbered voice lines
 */

function largestLineNumber(cell) {
  var pattern = '^\\s*L\\d+',
      numberedLine = cell.findText(pattern), // search for a match to the pattern 'L followed by some digits' ('L#' later for short)
      lineNumbers = [];                      // the array to store the found numbers
  
  while (numberedLine) {
    lineNumbers.push(
      parseInt(                                      // Parsing an integer
        numberedLine.getElement().asText().getText() //   the 'L#' string
                    .slice(1),                       //   the # (slice drops 1 symbol at the beginning and 1 at the end)
        10)                                          // base 10
    );
    
    numberedLine = cell.findText(pattern, numberedLine); // next instance matching the pattern
  }
  
  return lineNumbers.reduce(function(x, y) {return Math.max(x, y)}, 0); // 0-based max of the numbers in the array (0 for an empty array)
}



/**
 * Inserts a line number for each line without a number, starting with the next available number.
 * 
 * @param {DocumentApp.TableCell} [cell=current cell]
 *        The table cell in which to add line numbers
 */

function addNewLineNumbers(cell) {
  if (typeof cell === 'undefined') cell = getCell();
  if (!cell) return;
  
  var nextLineNumber = largestLineNumber(cell) + 1;
  
  var pattern = '^\\s*L[:=]',
      unnumberedLine = cell.findText(pattern);
  while (unnumberedLine) {
    var container = unnumberedLine.getElement().asText(),
        matchLocation = unnumberedLine.getStartOffset();
    
    container.insertText(matchLocation + 1, nextLineNumber); // Insert line number after the 'L'
    nextLineNumber++;
    
    unnumberedLine = cell.findText(pattern, unnumberedLine);
  }
}



/**
 * Inserts a line number for each line without a number, throughout the lesson.
 */

function addAllNewLineNumbers() {
  var body = DocumentApp.getActiveDocument().getBody();
  var scriptHeader = body.findText('^\\s*Script \\d+-e\\d+');
  
  while (scriptHeader) {
    addNewLineNumbers(getCell(scriptHeader.getElement()));
    scriptHeader = body.findText('^\\s*Script \\d+-e\\d+', scriptHeader);
  }
}



var INVALID_REFERENCE_BG_COLOR = '#ead1dc',
    ORIGINAL_LINE_MARKER_BG_COLOR = '#d9d2e9',
    REUSED_LINE_MARKER_BG_COLOR = '#ffff00';

/**
 * In the specified/current cell, highlights the line numbers for lines that are reused in other scripts.
 * 
 * @param {DocumentApp.TableCell} [cell=current cell]
 *        The table cell in which to highlight
 */

function formatLineNumbering(cell) {
  if (typeof cell === 'undefined') cell = getCell();
  if (!cell) return;
  
  var body = DocumentApp.getActiveDocument().getBody();
  var cellText = cell.editAsText().getText();
  
  var reusedLineMarkerStyle = {};
  reusedLineMarkerStyle[DocumentApp.Attribute.BACKGROUND_COLOR] = REUSED_LINE_MARKER_BG_COLOR;
  searchAndFormat(cell, '^\\s*L\\d*=[^:]+:', reusedLineMarkerStyle);
  
  var originalLineMarkerStyle = {};
  originalLineMarkerStyle[DocumentApp.Attribute.BACKGROUND_COLOR] = ORIGINAL_LINE_MARKER_BG_COLOR;
  
  var invalidLineReferenceStyle = {};
  invalidLineReferenceStyle[DocumentApp.Attribute.BACKGROUND_COLOR] = INVALID_REFERENCE_BG_COLOR;
  
  var re = /L\d*=(?:(?:(\d+)-)?e(\d+)-)?L(\d+):/g; // Looking for a string 'L(#)=((#-)e#-)L#', where the parts in parentheses are optional
                                                   // (the parentheses are not included in the search)
                                                   // The numbers on the right of the equals sign are indexed as match[1], match[2], and match[3]
  var match = re.exec(cellText);
  var b, e;
  
  while (match) {
    var reference = match[0],
        lineNumber = match[3],
        exerciseNumber = match[2],
        activityNumber = match[1];
    
    if (!exerciseNumber) {     // the reference is to the current script
                               // (only the last part of the reference is present, L#)
      
      var originalLineLabel = cell.findText('^\\s*L' + lineNumber + ':');
      
      if (originalLineLabel) {       // if the referred line number is found
        b = originalLineLabel.getStartOffset();
        e = originalLineLabel.getEndOffsetInclusive();
        originalLineLabel.getElement().setAttributes(b, e, originalLineMarkerStyle);
      }
      else {                         // the referred line number is not found
        
        var thisScript = cell.findText('^\\s*Script \\d+-e\\d+');
        
        if (thisScript) {               // correctly formatted script header was found
          b = thisScript.getStartOffset() + 7;
          e = thisScript.getEndOffsetInclusive();
          activityNumber = cellText.slice(b, e).split('-')[0];
        }
        else {                          // script header is missing or is formatted incorrectly
          
          DocumentApp.getUi().alert('Error: incorrect script header format. Should be \'Script #-e#\'.');
          
          e = match.index + reference.length - 2;
          b = e - lineNumber.length - exerciseNumber.length - 2;
          cell.editAsText().setAttributes(b, e, invalidLineReferenceStyle);
          
          break;
        }
        
        DocumentApp.getUi().alert('Error: no original line L' + lineNumber + ' in ' + cellText.slice(thisScript.getStartOffset(), thisScript.getEndOffsetInclusive() + 1));
        
        e = match.index + reference.length - 2;
        b = e - lineNumber.length;
        cell.editAsText().setAttributes(b, e, invalidLineReferenceStyle);
      }
    }
    else {                     // the reference is to another script
      
      if (!activityNumber) {        // the referred script is in the same activity as the current script
                                    // (only the first two parts of the reference are present, e#-L#)
        
                                    // look up the current script's header
        var thisScript = cell.findText('Script \\d+-e\\d+');
        
        if (thisScript) {               // correctly formatted script header was found
          b = thisScript.getStartOffset() + 7;
          e = thisScript.getEndOffsetInclusive();
          activityNumber = cellText.slice(b, e).split('-')[0];
        }
        else {                          // script header is missing or is formatted incorrectly
          
          DocumentApp.getUi().alert('Error: incorrect script header format. Should be \'Script #-e#\'.');
          
          e = match.index + reference.length - 2;
          b = e - lineNumber.length - exerciseNumber.length - 2;
          cell.editAsText().setAttributes(b, e, invalidLineReferenceStyle);
          
          break;
        }
      }
      
      var scriptReference = 'Script ' + activityNumber + '-e' + exerciseNumber;
      var scriptHeader = body.findText('^\\s*' + scriptReference);
      
      if (scriptHeader) {       // a script with the given activity and exercise numbers exists
        
        var otherCell = getCell(scriptHeader.getElement()); // find the cell containing that script
        var originalLineLabel = otherCell.findText('^\\s*L' + lineNumber + ':');
        
        if (originalLineLabel) {       // the referred line number exists in that script
          b = originalLineLabel.getStartOffset();
          e = originalLineLabel.getEndOffsetInclusive();
          originalLineLabel.getElement().setAttributes(b, e, originalLineMarkerStyle);
        }
        else {                         // the referred line number is not found in that script
          
          DocumentApp.getUi().alert('Error: no original line L' + lineNumber + ' in ' + scriptReference);
          
          e = match.index + match[0].length - 2;
          b = match[1] ? e - lineNumber.length - exerciseNumber.length - activityNumber.length - 3 // if the sctivity number is given by the reference
                       : b = e - lineNumber.length - exerciseNumber.length - 2;                    // if the activity number is inferred from the current script
          cell.editAsText().setAttributes(b, e, invalidLineReferenceStyle);
        }
      }
      else {                   // there is no script with the given activity and exercise numbers
        
        DocumentApp.getUi().alert('Error: bad reference, ' + scriptReference + ' doesn\'t exist.');
        
        e = match.index + match[0].length - 2;
        b = match[1] ? e - lineNumber.length - exerciseNumber.length - activityNumber.length - 3 // if the sctivity number is given by the reference
                     : b = e - lineNumber.length - exerciseNumber.length - 2;                    // if the activity number is inferred from the current script
        cell.editAsText().setAttributes(b, e, invalidLineReferenceStyle);
      }
    }
    
    match = re.exec(cellText);
  }
}



/**
 * Highlights the line numbers for lines that are reused in other scripts throughout the document.
 */

function formatAllLineNumbering() {
  var body = DocumentApp.getActiveDocument().getBody();
  
  var lineMarkerStyle = {};
  lineMarkerStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = LINE_MARKER_COLOR;
  lineMarkerStyle[DocumentApp.Attribute.UNDERLINE] = false;
  lineMarkerStyle[DocumentApp.Attribute.ITALIC] = false;
  lineMarkerStyle[DocumentApp.Attribute.BOLD] = false;
  lineMarkerStyle[DocumentApp.Attribute.BACKGROUND_COLOR] = null;
  searchAndFormat(body, '^\\s*L\\d*(?:=[^:]*)?:', lineMarkerStyle); // Reset line numbering formatting, in case references have change
  
  var scriptHeader = body.findText('^\\s*Script \\d+-e\\d+');
  
  while (scriptHeader) {
    formatLineNumbering(getCell(scriptHeader.getElement()));
    
    scriptHeader = body.findText('^\\s*Script \\d+-e\\d+', scriptHeader);
  }
}
