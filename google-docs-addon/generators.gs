/**
 * @file Contains the functions for generating lessons item scripts.
 * @version 71
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 */



/**
 * This object contains all the static strings
 * used in a lesson item script, depending on the activity.
 */

var ACTIVITY_SPECIFIC_FIELDS = {
  DnD:                   ['canDrag: ',
                          'canTarget: (? slots each)'],

  DnDCopy:               ['canDragCopy: ',
                          'canTarget:  (? slots each)'],

  DnDMulti:              ['canDragMultiple: ',
                          'canTarget:  (? slots each)'],

  DnDStack:              ['canDrag: ',
                          'canTargetStacked:  (? slots each)'],

  DnDFixed:              ['canDrag: ',
                          'canTargetFixed:  (? slots each)'],

  Arrange:               ['canArrange: ',
                          'canTarget:  (1 slot each)'],

  Rearrange:             ['canRearrange: '],

  ChooseOne:             ['canChooseOne: '],
  
  ChooseAuto:            ['canChooseAuto: '],
  
  ChooseMany:            ['canChooseMany: '],
  
  Spot:                  ['canSpot: '],
  
  Paint:                 ['canPaint: ',
                          'colors: '],

  YesNo:                 ['Yes/No'],
  
  Connect:               ['canConnect: ',
                          '   A: ',
                          '   B: '],
  
  ChoosePlaceholder:     ['canChoosePlaceholder: ',
                          'Placeholder: '],

  ChoosePlaceholderAuto: ['canChoosePlaceholderAuto: ',
                          'Placeholder: '],
  
  CrossPairs:            ['canCrossPairs:',
                          '   A: ',
                          '   B: '],
  
  ConnectTheDot:         ['canConnectTheDot: ',
                          'closedPaths: true/false',
                          'startingDot: '
                          ],
  
  ConnectLabyrinth:      ['canConnectLabyrinth: ',
                          'closedPaths: true/false',
                          'startingSquare: ',
                          'endingSquare: '],

  Other:                 ['can?: ']
};



/**
 * This function appends given strings of text
 * as paragraphs at the end of a given table cell.
 *
 * @param {DocumentApp.TableCell} cell
 * The table cell to append to
 *
 * @param {string[]} strings
 * The array of strings to be appended
 *
 * @param {number} indent
 * How much to indent each paragraph
 *
 * @return {DocumentApp.Paragraph} The last paragraph appended, or, if no paragraphs were appended, the paragraph in which the cursor is now.
 */

function appendToCell(cell, strings, indent) {
  var par = getParagraph();
  
  for (var i = 0; i < strings.length; i++) {
	par = cell.appendParagraph(strings[i]).setIndentStart(indent).setIndentFirstLine(indent);
  }
  
  return par;
}



/**
 * This function places a script placeholder
 * with the common and activity-specific fields at the current cursor's position.
 *
 * @param {string} activityType
 * The activity type to be used
 */

function appendScriptPlaceholder(activityType) {
  var cell = getCell();
  
  if (cell == null) {
    return;
  }
  
  var doc = DocumentApp.getActiveDocument();
  var par;
  
  par = getParagraph();  
  if ((cell.getChildIndex(par) == cell.getNumChildren() - 1) && par.getText().trim() === '') { // if the paragraph is the last one in the cell
    par.setText('Script ?-e?');                                                                // and contains no text, then start the script on the same line
  }
  else {                                                                                       // otherwise, append the script at the end of the cell
    par = cell.appendParagraph('Script ?-e?');
  }
  par.setHeading(DocumentApp.ParagraphHeading.HEADING4);
  
  appendToCell(cell, ['', 
                      'Objects:'], 
               0);
  
  cell.appendListItem('').setIndentStart(36).setGlyphType(DocumentApp.GlyphType.BULLET);
  
  appendToCell(cell, ['Layout:'], 
               0);
  
  cell.appendListItem('').setIndentStart(36).setGlyphType(DocumentApp.GlyphType.BULLET);
  
  appendToCell(cell, [''].concat(
                     ACTIVITY_SPECIFIC_FIELDS[activityType],
                     ['Answer: ',
                      '',
                      'Start:',
                      'L: ',
                      '',
                      'Question:',
                      'L: ',
                      '',
                      'Reminder:',
                      'L: ',
                      '',
                      'Partially Correct: [if ]',
                      '[pc]',
                      'L: ',
                      '',
                      'Incorrect 1:',
                      '[reset]',
                      'L: ',
                      '',
                      'Correct:',
                      '[level ?]',
                      'L: ',
                      '',
                      'End:',
                      'L: ']),
              0);
  
  // Return the cursor to the position after the Objects clause
  doc.setCursor(doc.newPosition(par.getChild(0), 8));
  
  format();
}



/**
 * This function inserts given strings of text as paragraphs in a given table cell,
 * before the paragraph in which the cursor is now.
 *
 * @param {DocumentApp.TableCell} cell
 * The table cell to append to
 * 
 * @param {string[]} strings
 * The array of strings to be appended
 
 * @param {number} indent
 * How much to indent each paragraph
 *
 * @return {DocumentApp.Paragraph}
 * The first paragraph inserted, or, if no paragraphs were inserted, the paragraph in which the cursor is now.
 *
 * @todo Rewrite this to make insertsBeforePar(par, strings, indent). Currently the code is assuming that the cursor is in the given cell, but that's not guaranteed.
 */

function insertIntoCell(cell, strings, indent) {
  var par = getParagraph();
  var parIndex = cell.getChildIndex(par);
  
  for (var i = strings.length - 1; i > -1; i--) {
	par = cell.insertParagraph(parIndex ,strings[i]).setIndentStart(indent).setIndentFirstLine(indent);
  }
  
  var doc = DocumentApp.getActiveDocument();
  doc.setCursor(doc.newPosition(par, 0));
  
  return par;
}



/**
 * This function places a placeholder for a subquestion
 * with the common and activity-specific fields at the current cursor's position.
 *
 * @param {string} activityType 
 * The activity type to be used
 */

function insertSubquestion(activityType) {
  var cell = getCell();
  
  if (cell == null) {
    return;
  }
  
  var doc = DocumentApp.getActiveDocument();
  var par;
  
  // Inserting in reverse order, so the cursor remains at the top of the inserted block
  // and remembering this position to return the cursor here after all the appending is done
  par = insertIntoCell(cell, ['[/SQ?]'], 0);
  
  insertIntoCell(cell, ACTIVITY_SPECIFIC_FIELDS[activityType].concat(
                       ['Answer: ',
                        '',
                        'Question:',
                        'L: ',
                        '',
                        'Reminder:',
                        'L: ',
                        '',
                        'Incorrect:',
                        '[reset]',
                        'L: ',
                        '',
                        'Correct:',
                        '[level ?]',
                        'L: ',
                        '']),
                 36); // this is the number of points to indent the above lines by
  
  insertIntoCell(cell, ['[SQ?]'], 0);
  
  // Return the cursor to the remembered position
  doc.setCursor(doc.newPosition(par.getChild(0), 4));
  
  format();
}
