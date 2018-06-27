/**
 * @file Contains the functions for formatting lessons item scripts.
 * @version 77
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 * @author Nikolay Prokopyev <nprokopyev@reasoningmind.org>
 */



/********************/
/* Global constants */
/********************/

var INSTRUCTIONS = [
      '@(?:start|grab|glide|move|end|drop\\s+in|correct|count(?:\\s+in)?|connect(?:Start|End)|(?:un)?color|click|\\s*/\\s*@correct)?',
      'remove\\s+[@!]',
      '!(?:count(?:\\s+in)?|\\s*/\\s*@correct)?',
      '#',
      '(?:remove\\s+)?focus',
      '(?:remove\\s+)?highlight',
      '(?:un)?fade',
      '(?:un)?color',
      '/?[Ss]caffolding(?:\\s+[Ss]creen)?(?:\\s+\\d+)?',
      'stop script|show|reminder|question|pc|next|move|invisible|inactive|hide|faded|end glide|correct|change',
      'level\\s+[12]',
      'reset(?:\\s+incorrect|\\s+all)?',
      '/?if',
      'else(?:\\s+if)?',
      '/?SQ\\d',
      'go\\s*to(?:\\s+(?:(?:[Ii]ncorrect|[Cc]orrect)(?:\\s+[123])?|[Ee]nd|[Qq][123]))?'
    ],
    MODIFIERS = [
      '&\\s*keep'
    ];



/**
 * This function searches a given element for a given regular-expression pattern,
 * and applies the given style to the matching text.
 *
 * @param {DocumentApp.Element} element
 *        The element to format the text in
 *
 * @param {String} pattern 
 *        The regular expression pattern to search for
 *
 * @param {Object} style 
 *        The style to apply to the matching text
 *
 * @param {Number} [startOffset=0]
 *        The offset within the element where to start the search
 *
 * @param {Number} [endOffset=element's text length - 1]
 *        The offset within the element where to end the search
 */

function searchAndFormat(element, pattern, style, startOffset, endOffset) {  
  var richText = element.editAsText(),   // rich text, for setting the style
      text = richText.getText();         // plain text, for searching
  
  if (typeof startOffset === 'undefined') startOffset = 0;
  if (typeof endOffset === 'undefined') endOffset = text.length - 1;
  
  var re = new RegExp(pattern, 'gm');
  re.lastIndex = startOffset;
  
  var match = re.exec(text),
      matchStart, matchEnd;
  while (match) {
    matchStart = match.index;
    matchEnd = matchStart + match[0].length - 1;
    
    if (matchEnd > endOffset) break; // if the match extends beyond endOffset, stop
    
    richText.setAttributes(matchStart, matchEnd, style);
    match = re.exec(text);
  }
}



/**
 * This function matches the secondary pattern inside the matches for the primary pattern, and then formats the secondary matches.
 *
 * @param {DocumentApp.Element} element
 *        The element to search for the primary pattern
 *
 * @param {String} primaryPattern
 *        The primary pattern
 *
 * @param {String} secondaryPattern
 *        The pattern we want to look for inside the primary matches
 *
 * @param {Object} style
 *        The style to apply
 */

function findSubpatternsAndFormat(element, primaryPattern, secondaryPattern, style) {
  var text = element.getText();         // plain text, for searching
  
  var re = new RegExp(primaryPattern, 'gm');
  
  var match = re.exec(text),
      matchStart, matchEnd;
  while(match) {
    matchStart = match.index;
    matchEnd = matchStart + match[0].length - 1;
    
    searchAndFormat(element, secondaryPattern, style, matchStart, matchEnd);
    match = re.exec(text);
  }
}



/**
 * This function applies formatting to targetPattern only in specific sections.
 * 
 * @param {DocumentApp.TableCell} cell
 *
 * @param {String} sectionPattern
 *        The pattern to match section header, don't include the ':'
 * 
 * @param {String} targetPattern
 *
 * @param {Object} style
 *        The formatting style properties object
 */

function formatInSections(cell, sectionPattern, targetPattern, style) { 
  var text = cell.getText();
  
  var matchingSection = new RegExp('^\\s*' + sectionPattern + ':', 'gm'),
      anySection = /^\s*[A-Za-z0-9]+:/gm;
  
  var sectionHeader = matchingSection.exec(text),  // the header of the target section
      sectionStart, sectionEnd, nextSectionHeader;
  while (sectionHeader) {                          // the target section is found
    sectionStart = sectionHeader.index;
    
    anySection.lastIndex = sectionStart + sectionHeader[0].length;
    nextSectionHeader = anySection.exec(text);     // the header of the next section
    sectionEnd = nextSectionHeader ?nextSectionHeader.index :text.length - 1;
    
    searchAndFormat(cell, targetPattern, style, sectionStart, sectionEnd);
    sectionHeader = matchingSection.exec(text);
  }
}



var DEFAULT_FG_COLOR = '#000000',
    
    DEFAULT_ANIMATOR_NOTES_COLOR = '#93c47d',
    
    DEFAULT_OBJ_REF_COLOR = '#007fcf',
    LAYOUT_OBJ_REF_COLOR = '#6c71c4', // green: #6aa84f, steel-blue: #4bacc6, purple: #6c71c4, grey: #839496
    
    RECOGNIZED_KEYWORD_COLOR = '#7f7f3f',
    
    INPUT_CLAUSE_COLOR = '#d33682',
    PC_CLAUSE_COLOR = '#df6f00',
    INCORRECT_CLAUSE_COLOR = '#dc322f',
    CORRECT_CLAUSE_COLOR = '#007f00',
    OTHER_CLAUSE_COLOR = '#606060',
    
    LINE_MARKER_COLOR = '#ba8c00', // old GDocs script: '#ffbf00', Word'16 scheme: '#70ad47', other: '#ba8c00'
    
    PLACEHOLDER_COLOR = '#ff0000',
    TEMPLATE_COMMENT_BG_COLOR = '#ead1dc';
    

/**
 * This function formats the text in lesson scripts.
 * 
 * The function searches the text of the table cell that contains the current cursor position
 * for predefined words, and applies predefined formatting to the matching ranges of text.
 * 
 * @param {DocumentApp.TableCell} [cell]
 *        The cell in which to perform formatting
 *        If not set, the cell containing the cursor position is used.
 */

function format(cell) {
//  var timeInMS = new Date().getTime(); // for performance debugging

  if (typeof cell === 'undefined') cell = getCell();
  if (cell == null) return;
  
  var animatorNoteStyle = {},
      objRefStyle = {},
      layoutObjectStyle = {},
      keywordStyle = {},
      headerClauseStyle = {},
      partiallyCorrectClauseStyle = {},
      incorrectClauseStyle = {},
      correctClauseStyle = {},
      otherClauseStyle = {},
      inputTypeStyle = {},
      actorNoteStyle = {},
      lineMarkerStyle = {},
      resetStyle = {},
      placeholderStyle = {},
      templateCommentStyle = {};
    
  resetStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = DEFAULT_FG_COLOR;
  resetStyle[DocumentApp.Attribute.ITALIC] = false;
  cell.setAttributes(resetStyle);
    
  /***************
   Animator notes
  ***************/
  animatorNoteStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = DEFAULT_ANIMATOR_NOTES_COLOR;
  searchAndFormat(cell, '\\[[^\\[]*\\]', animatorNoteStyle);
  
  /******************
   Object references
  ******************/
  var objectSectionsText = getObjectSections(cell),
      objRefs = getExpanededObjectReferences(objectSectionsText), labirynthSquares = labyrinthObjects(cell),
      objRefsPattern = '\\b' + buildPattern(objRefs) + labirynthSquares;
  
  // log(objRefsPattern);
  
  var extendedPattern = objRefsPattern                                                   // extendedPattern allows replacing the numbers in numbered object references with capital letters
                        .replace(/(\(\?:\d+\|[^\)]*)\)/g, '$1|[A-Z]+\)')                 // It adds [A-Z]+ to the end of the lists i[1]|...|i[n]
                        .replace(/([a-zA-Z]+)(\d+)([a-zA-Z]*)/g, '$1$2$3|$1[A-Z]+$3');   // and adds a reference with a capital letter for each standalone numbered reference
  
  /************
   - in Layout (or anywhere an object reference if prepended with a period)
  ************/
  layoutObjectStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = LAYOUT_OBJ_REF_COLOR;    
//  findSubpatternsAndFormat(cell,                                             // Arseny - using this instead of 'formatInSections' because
//                                                                             // the Layout section might contain a ':'
//                                                                             // which will shadow the rest of the section
//                           '\\.(?:all\\s+)?\\w[\\w\\d]*(?:\\s+\\d+-\\d+)?',
//                           '\\.' + extendedPattern, layoutObjectStyle);
  searchAndFormat(cell, '\\.' + extendedPattern, layoutObjectStyle);           // replaced the above mostrocity, but keeping it just in case (maybe there was some deep thought behid it, I forget)
  
  /************
   - elsewhere
  ************/
  // Apply objRefStyle to refs in Layout, Controls definition and in Answer
  objRefStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = DEFAULT_OBJ_REF_COLOR;
  findSubpatternsAndFormat(cell, '\\[[^\\[]*\\]', objRefsPattern, objRefStyle);
  formatInSections(cell, '(?:can\\w*\\??|Placeholder|(?:start|end)ingSquare)', objRefsPattern, objRefStyle);
  formatInSections(cell, '[Aa]nswer\\d?', extendedPattern, objRefStyle);
  formatInSections(cell, '[AaBb]', extendedPattern, objRefStyle);
  
  /*********
   Keywords
  **********/
  // Apply keywordStyle to instruction keywords
  keywordStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = RECOGNIZED_KEYWORD_COLOR;
  keywordStyle[DocumentApp.Attribute.UNDERLINE] = false;
  keywordStyle[DocumentApp.Attribute.BOLD] = false;
  findSubpatternsAndFormat(cell, '\\[[^\\[]*\\]', '\\[\\s*(?:then)?\\s*' + buildPattern(INSTRUCTIONS) + '|' + buildPattern(MODIFIERS), keywordStyle);
  // Need to reapply the animatorNoteStyle to the opening '[' and ending ']'
  searchAndFormat(cell, '[\\[\\]]', objRefStyle);
  
  /*******************************
   Object, Layout, Answer headers
  *******************************/
  headerClauseStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = DEFAULT_FG_COLOR;
  headerClauseStyle[DocumentApp.Attribute.UNDERLINE] = false;
  headerClauseStyle[DocumentApp.Attribute.ITALIC] = false;
  headerClauseStyle[DocumentApp.Attribute.BOLD] = false;
  searchAndFormat(cell, '(?:[Oo]bjects|[Ll]ayout|[Aa]nswer(?:\\s*\\d)?):', headerClauseStyle);
  
  /*******
   can...
  *******/
  inputTypeStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = INPUT_CLAUSE_COLOR;
  inputTypeStyle[DocumentApp.Attribute.UNDERLINE] = false;
  inputTypeStyle[DocumentApp.Attribute.ITALIC] = false;
  inputTypeStyle[DocumentApp.Attribute.BOLD] = false;
  searchAndFormat(cell, 
                  '(?:[Yy]es/[Nn]o' + 
                    '|[Cc]olors:' +
                    '|[Pp]laceholder(?:\\s*\\d)?:' +
                    '|can' +
                      '(?:Drag(?:Copy|Multiple)?' +
                        '|(?:Rea|A)rrange' +
                        '|Choose(?:One|Many|Auto|Placeholder(?:Auto)?)' +
                        '|Target(?:Stacked|Fixed)?' +
                        '|Spot|Paint|Connect(?:TheDot|Labyrinth)?|CrossPairs|\\?' +
                        ')(?:\\s*\\d)?:' +
                  '|[AB]:' +
                  '|closedPaths:|starting(?:Dot|Square):|endingSquare:' +
                  ')', 
                  inputTypeStyle);
  
  /*******************************************
   Transition, Start, End, Question, Reminder
  *******************************************/
  otherClauseStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = OTHER_CLAUSE_COLOR;
  otherClauseStyle[DocumentApp.Attribute.UNDERLINE] = false;
  otherClauseStyle[DocumentApp.Attribute.ITALIC] = true;
  otherClauseStyle[DocumentApp.Attribute.BOLD] = true;
  searchAndFormat(cell, '(?:Transition|Start|Question|Reminder|End):', otherClauseStyle);
  
  /******************
   Partially Correct
  ******************/
  // This must be formatted _after_ "Correct:" is formatted, to avoid applying that style over this one
  partiallyCorrectClauseStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = PC_CLAUSE_COLOR;
  partiallyCorrectClauseStyle[DocumentApp.Attribute.UNDERLINE] = false;
  partiallyCorrectClauseStyle[DocumentApp.Attribute.ITALIC] = true;
  partiallyCorrectClauseStyle[DocumentApp.Attribute.BOLD] = true;
  searchAndFormat(cell, 'Partially [Cc]orrect(?:\\s+\\d)?:', partiallyCorrectClauseStyle);
  
  /**********
   Incorrect
  **********/
  incorrectClauseStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = INCORRECT_CLAUSE_COLOR;
  incorrectClauseStyle[DocumentApp.Attribute.UNDERLINE] = false;
  incorrectClauseStyle[DocumentApp.Attribute.ITALIC] = true;
  incorrectClauseStyle[DocumentApp.Attribute.BOLD] = true;
  searchAndFormat(cell, 'Incorrect(?:\\s+\\d)?:', incorrectClauseStyle);
  
  /********
   Correct
  ********/
  correctClauseStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = CORRECT_CLAUSE_COLOR;
  correctClauseStyle[DocumentApp.Attribute.UNDERLINE] = false;
  correctClauseStyle[DocumentApp.Attribute.ITALIC] = true;
  correctClauseStyle[DocumentApp.Attribute.BOLD] = true;
  searchAndFormat(cell, '^(?:(?!\\n|\\r)\\s)*Correct(?:\\s+\\d)?:', correctClauseStyle);
  
  /****
    L:
  ****/
  lineMarkerStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = LINE_MARKER_COLOR;
  lineMarkerStyle[DocumentApp.Attribute.UNDERLINE] = false;
  lineMarkerStyle[DocumentApp.Attribute.ITALIC] = false;
  lineMarkerStyle[DocumentApp.Attribute.BOLD] = false;
  searchAndFormat(cell, '^(?:(?!\\n|\\r)\\s)*L\\d*(?:=[^:]*)?:', lineMarkerStyle);
  
  /************
   Actor notes
  ************/
  actorNoteStyle[DocumentApp.Attribute.ITALIC] = true;
  searchAndFormat(cell, '\\([^\\(]+\\)', actorNoteStyle);
  
  /**************
   $placeholder$
  **************/
  placeholderStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = PLACEHOLDER_COLOR;
  placeholderStyle[DocumentApp.Attribute.UNDERLINE] = false;
  findSubpatternsAndFormat(cell, '\\$[\\w\\+\\-]+\\$', '[\\w\\+\\-]+', placeholderStyle);
  
  /*************************
   <! Template comments ->
  *************************/
  templateCommentStyle[DocumentApp.Attribute.BACKGROUND_COLOR] = TEMPLATE_COMMENT_BG_COLOR;
  templateCommentStyle[DocumentApp.Attribute.UNDERLINE] = false;
  searchAndFormat(cell, '<!?-(?:-[^>]|[^-])*->', templateCommentStyle);
  
//  log((new Date().getTime() - timeInMS)/1000);
}



/**
 * Restores links formatting.
 * 
 * @param {DocumentApp.Element} [element=current cell]
 *        If not set, the cell containing the cursor position is used.
 */

function fixLinks(element) {
  if (typeof element === 'undefined') element = getCell();
  if (element == null) return;
  
  var richText = element.editAsText(),
      text = richText.getText();
  
  // collect all the links in the current textElement to links[]
  var inURL = false,
      links = [];
  for (var i = 0; i < text.length; i++) {
    if (richText.getLinkUrl(i)) {
      if (!inURL) {
        links.push(i);          
        inURL = true;
      }
    }
    else {
      if (inURL) {
        links.push(i - 1);          
        inURL = false;
      }
    }
  }
  
  // if the last link ended at the end of the paragraph,
  // we didn't get a chance to store the link's end offset,
  // so we do it here
  if (links.length % 2 != 0) {
    links.push(text.length - 1);
  }
  
  // apply the linkStyle to all links in the current textElement
  for (var i = 0; i < links.length/2; i++) {
    richText.setUnderline(links[2*i], links[2*i + 1], true);
  }
}
