/**
 * @file Contains the functions used in the KE Helper Scripts Google Docs add-on.
 *       The add-on is developed to automate some of the Reasoning Mind KEs' tasks in the
 *       Early Learning project.
 * @version 73
 * @author Arseny A. Egorov <aegorov@reasoningmind.org>
 */


/**
 * This function is required for publishing an add-on.
 *
 * @param {Object} e
 *        Required by the system, but isn't used in this script
 */
function onInstall (e) {
  onOpen(e);
}



/**
 * This function is required for publishing an add-on.
 * It is also called when the document gets open in the browser.
 * 
 * When the script is manually attached to an individual document
 * (i.e., is created via the "Tools > Script editor..." menu in the doc editor),
 * this creates a custom item in the menu bar of the doc editor, "KE helper scripts."
 * 
 * When the script is deployed as an add-on, this creates a submenu
 * with the same name under the "Add-ons" menu in the doc editor.
 * 
 * That menu contains items bound to parameterless functions and submenus. E.g.:
 * - "Run syntax formatter" is an item bound to the function format()---defined in 'Formatting.gs'
 * - "Insert new script" is a submenu
 * 
 * @param {Object} e
 *        Required by the system, but isn't used in this script
 */
function onOpen(e) {
  var ui = DocumentApp.getUi();
  ui.createAddonMenu()
    .addSubMenu(ui.createMenu('Insert new script')
                  .addSubMenu(ui.createMenu('DnD')
                                .addItem('@d DnD',                   'scriptDnD')        // The '@d' at the beginning of a menu item
                                .addItem('@d DnD w/single copy',     'scriptDnDCopy')    // helps using the menu from the keyboard
                                .addItem('@d DnD w/multiple copies', 'scriptDnDMulti')   // (Alt+'/' allows searching for menu items in Google Docs)
                                .addItem('@d DnD w/stacked target',  'scriptDnDStack')
                                .addItem('@d DnD w/fixed targets',   'scriptDnDFixed')
                                .addItem('@a Arrange',               'scriptArrange')
                                .addItem('@r Rearrange',             'scriptRearrange'))
                  .addSubMenu(ui.createMenu('Choose/Cross')
                                .addItem('@c Choose one',              'scriptChooseOne')
                                .addItem('@c Choose one w/autosubmit', 'scriptChooseAuto')
                                .addItem('@c Choose many',             'scriptChooseMany')
                                .addItem('@c Cross pairs',             'scriptCrossPairs'))
                  .addSubMenu(ui.createMenu('Placeholder')
                                .addItem('@h placeHolder',              'scriptChoosePlaceholder')
                                .addItem('@h placeHolder w/autosubmit', 'scriptChoosePlaceholderAuto'))
                  .addSubMenu(ui.createMenu('Connect')
                                .addItem('@n coNnect',           'scriptConnect')
                                .addItem('@n coNnect the dots',  'scriptConnectTheDot')
                                .addItem('@n coNnect labyrinth', 'scriptConnectLabyrinth'))
                  .addItem('@s Spot',                         'scriptSpot')
                  .addItem('@p Paint',                        'scriptPaint')
                  .addItem('@y Yes/No',                       'scriptYesNo')
                  .addItem('@x Other (not any of the above)', 'scriptOther'))
  
    .addSubMenu(ui.createMenu('Insert scaffolding')
                  .addSubMenu(ui.createMenu('DnD')
                                .addItem('@@d (sub) DnD',                   'subquestionDnD')
                                .addItem('@@d (sub) DnD w/single copy',     'subquestionDnDCopy')
                                .addItem('@@d (sub) DnD w/multiple copies', 'subquestionDnDMulti')
                                .addItem('@@d (sub) DnD w/stacked target',  'subquestionDnDStack')
                                .addItem('@@a (sub) Arrange',               'subquestionArrange')
                                .addItem('@@r (sub) Rearrange',             'subquestionRearrange'))
                  .addSubMenu(ui.createMenu('Choose/Cross')
                                .addItem('@@c (sub) Choose one',              'subquestionChooseOne')
                                .addItem('@@c (sub) Choose one w/autosubmit', 'subquestionChooseAuto')
                                .addItem('@@c (sub) Choose many',             'subquestionChooseMany')
                                .addItem('@@c (sub) Cross pairs',             'subquestionCrossPairs'))
                  .addSubMenu(ui.createMenu('Placeholder')
                                .addItem('@@h (sub) placeHolder',              'subquestionChoosePlaceholder')
                                .addItem('@@h (sub) placeHolder w/autosubmit', 'subquestionChoosePlaceholderAuto'))
                  .addSubMenu(ui.createMenu('Connect')
                                .addItem('@@n (sub) coNnect',           'subquestionConnect')
                                .addItem('@@n (sub) coNnect the dots',  'subquestionConnectTheDot')
                                .addItem('@@n (sub) coNnect labyrinth', 'subquestionConnectLabyrinth'))
                  .addItem('@@s (sub) Spot',                         'subquestionSpot')
                  .addItem('@@p (sub) Paint',                        'subquestionPaint')
                  .addItem('@@y (sub) Yes/No',                       'subquestionYesNo')
                  .addItem('@@x (sub) Other (not any of the above)', 'subquestionOther'))
    .addSeparator()
    .addSubMenu(ui.createMenu('Line numbering and highlighting')
                  .addItem('# Add line numbers (this script)',          'addNewLineNumbers')
                  .addItem('## Add line numbers (lesson)',              'addAllNewLineNumbers')
                  .addItem('#r highlight Reused line #s (this script)', 'formatLineNumbering')
                  .addItem('##r highlight Reused line #s (lesson)',     'formatAllLineNumbering'))
    .addSeparator()
    .addSubMenu(ui.createMenu('Substitute placeholder values')
                  .addItem('| Substitute in script',               'substituteScriptPlaceholders')
                  .addItem('|| Substitute in scaffolding screens', 'substituteScaffoldingPlaceholders')
                  .addItem('$ Generate script placeholder header', 'generatePlaceholderHeader'))
    .addSeparator()
    .addItem('[] Run syntax formatter', 'format')
    .addItem('_ Underline links',       'fixLinks')
    .addToUi();
}
