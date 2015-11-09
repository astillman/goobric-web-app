function addLibraryToMyDrive(e) {
  var libraryKey = e.parameter.libraryKey;
  if (!libraryKey) {
    var html = '<p style="margin:25px">Error: Missing library key.</p>';
    return HtmlService.createHtmlOutput(html);
  }
  try {
    var library = DriveApp.getFolderById(libraryKey);
  } catch(err) {
    html = '<p style="margin:25px">Error: Unable to access library with key <strong>' + libraryKey + '</strong></p>';
    return HtmlService.createHtmlOutput(html);
  }
  
  try {
    var root = DriveApp.getRootFolder();
    root.addFolder(library);
  } catch(err) {
    html = '<p style="margin:25px">Error: ' + err.message + '</p>';
  }
  html = HtmlService.createTemplateFromFile('libraryAdded');
  html.libraryName = library.getName();
  html.libraryDescription = library.getDescription();
  html.libraryUrl = "https://drive.google.com/drive/folders/" + libraryKey;
  html.user = root.getOwner().getEmail();
  var domain = html.user.split("@")[1];
  Libraries.PublishedLibrary.logUserAction("Added to Drive", libraryKey, '', domain);
  return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
}
