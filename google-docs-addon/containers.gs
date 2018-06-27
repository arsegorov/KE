/**
 * @file Contains the functions that help determine various container elements
 *       at the cursor's current position or current selection.
 * @version 61
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 */



/**
 * This function returns the element containing the current cursor position or the first element in the selection.
 * 
 * @return {DocumentApp.Element}
 *         The element containing the current cursor position or the first element in the selection.
 */

function getElement() {
  var doc = DocumentApp.getActiveDocument(),
      selection = doc.getSelection();
  
  if (selection) {
    return selection.getRangeElements()[0].getElement();
  }
  else if (doc.getCursor()) {
    return doc.getCursor().getElement();
  }
  else {                //     This case is needed due to a Google Apps Script bug,
                        //     https://code.google.com/p/google-apps-script-issues/issues/detail?id=3808
                        //     which makes it possible to have both the selection and the cursor position be 'null'
    
    DocumentApp.getUi().alert('The script has run into a known issue with Google Apps Script. Please make sure the selection isn\'t an empty line and try again.');
  }
}



/**
 * This function returns the innermost table cell containing the editor cursor's current position.
 * 
 * @param {DocumentApp.Element} element
 *        An optional range element to start the search from, instead of the cursor position
 * 
 * @return {DocumentApp.TableCell}
 *         The innermost table cell containing the current cursor position, or null, if the cursor isn't inside any table cell.
 */

function getCell(element) {
  if (!element) {
    element = getElement();
  }
  
  while (element !== null && element.getType() != DocumentApp.ElementType.TABLE_CELL) {
    element = element.getParent();
  }
  
  if (!element) {
    DocumentApp.getUi().alert('This function only works inside table cells.');
    return null;
  }
  
  return element.asTableCell();
}



/**
 * This function returns the paragraph containing the editor cursor's current position.
 * 
 * @param {DocumentApp.Element} element
 *        An optional range element to start the search from, instead of the cursor position
 * 
 * @return {DocumentApp.Paragraph}
 *         The paragraph containing the current cursor position.
 */

function getParagraph(element) {
  if (!element) {
    element = getElement();
  }
  
  while (element !== null && element.getType() != DocumentApp.ElementType.PARAGRAPH && element.getType != DocumentApp.ElementType.LIST_ITEM) {
    element = element.getParent();
  }
  
  if (!element) {
    DocumentApp.getUi().alert('An unexpected result in \'KE Helper Scripts.Container fns.getParagraph\'. Please let me know the details of the issue.');
    return null;
  }
  
  return element.asParagraph();
}
