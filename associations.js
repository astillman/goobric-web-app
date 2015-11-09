/**
* Instantiates the standard mapping object for a user's given locale
* To do: Should we allow the user to specify localized settings on their own?
*
* @param {string} the sheetId of the roster sheet you want to designate a mapping object for
* @param {string} a language code to allow for the expansion of this function to include default mappings for non-English audiences
* @return {object} a structured object containing the column mappings between DriveRoster columns and local spreadsheet headers
*/
function ColumnMappings(sheetId, lang) {
  var sheetMappings = {};
  if (sheetId) {
    this.sheetId = sheetId.toString();
  }
  if (!lang) {
    lang = {};
    lang.emailCol = "Email";
    lang.firstNameCol = "First Name";
    lang.lastNameCol = "Last Name";
    lang.classFolderCol = "Student Folder Key";
    lang.siteUrlCol = "Site URL";
    lang.groupCol = "Group";
    lang.excludeCol = "Exclude";
    lang.classNameCol = "Class Name";
    lang.fileNameCol = "File Name";
    lang.fileKeyCol = "File Key",
    lang.linkCol = "Link",
    lang.lastEditedCol = "Last Edited",
    lang.turnedInStatusCol = "Turned In Status",
    lang.gradeCol = "Grade",
    lang.writtenFeedbackCol = "Written Feedback"
  }
  this.emailCol = lang.emailCol;
  this.firstNameCol = lang.firstNameCol;
  this.lastNameCol = lang.lastNameCol;
  this.classFolderCol = lang.classFolderCol;
  this.siteUrlCol = lang.siteUrlCol;
  this.groupCol = lang.groupCol;
  this.excludeCol = lang.excludeCol;
  this.classNameCol = lang.classNameCol;
  this.fileNameCol = lang.fileNameCol;
  this.fileKeyCol = lang.fileKeyCol;
  this.linkCol = lang.linkCol;
  this.lastEditedCol = lang.lastEditedCol;
  this.turnedInStatusCol = lang.turnedInStatusCol;
  this.gradeCol = lang.gradeCol;
  this.writtenFeedbackCol = lang.writtenFeedbackCol;
}


/**
* Normalizes the column headers referenced in the roster column mapping object
*
* @param {object} a structured object containing the column mappings between DriveRoster columns and local spreadsheet
* @return {object} the classname of the roster (optional) if you want to filter and return only students with a matching classname
*/
function normalizeMappings(mappings) {
  var normalizedMappings = {};
  for (var key in mappings) {
    normalizedMappings[key] = normalizeHeader(mappings[key]);
  }
  return normalizedMappings;
}



/**
* Returns a rubric object, given an associations object
*
* @param {object} the associations object for a given document
*
*/
function fetchRubric(associations) {
  var currentUserEmail = Session.getActiveUser().getEmail();
  var currentDoctopusId = associations.doctopusId;
  var currentRubricId =  associations.rubricId;
  var fileType = associations.fileType;
  var sheetId = associations.sheetId;
  var emailCol = associations.emailCol;
  var feedbackEmails = associations.feedbackEmails;
  var nextDocUrl = associations.nextDocUrl;
  var prevDocUrl = associations.prevDocUrl;
  try {
    var rubricSS = SpreadsheetApp.openById(currentRubricId);
  } catch(err) {
    return "Access denied";
  }
  var rubricValues = rubricSS.getSheets()[0].getDataRange().getValues();
  var rubricScaleScores = rubricValues[0].slice(1, rubricValues[0].length);
  
  var rubricObject = new Object();
  var type = "numeric";
  for (var i=0; i<rubricScaleScores.length; i++) {
    if (isNaN(rubricScaleScores[i])) {
      type = "nonNumeric";
      break;
    }
  }
  
  var docPermissions = "NONE";
  try {
    var file = DriveApp.getFileById(associations.fileId);
    docPermissions = "VIEW";
    var users = file.getEditors();
    docPermissions = "EDIT";
  } catch(err) {
  }
  
  var studentDocPermissions = "NONE";
  try {
    var firstFeedbackEmail = feedbackEmails.split(',')[0];
    studentDocPermissions = file.getAccess(firstFeedbackEmail).toString();
  } catch(err) {
  }
  
  rubricObject.docAccess = docPermissions;
  rubricObject.studentDocAccess = studentDocPermissions;
  rubricObject.type = type;
  rubricObject.assignmentId = currentDoctopusId;
  rubricObject.scale = rubricScaleScores.join("||");
  rubricObject.fileType = fileType;
  rubricObject.sheetId = sheetId;
  rubricObject.emailCol = emailCol;
  rubricObject.feedbackEmails = feedbackEmails;
  rubricObject.nextDocUrl = nextDocUrl;
  rubricObject.prevDocUrl = prevDocUrl;
  rubricObject.rubricId = currentRubricId;
  for (var i=1; i<rubricValues.length; i++) {
    var skillObject = new Object();
    rubricObject['skill-'+i] = new Object();
    rubricObject['skill-'+i]['index'] = i;
    
    for (var j=1; j<rubricValues[0].length; j++) {
      skillObject['score||'+rubricValues[0][j]] = rubricValues[i][j];
    }
    rubricObject['skill-'+i]['skillName'] = rubricValues[i][0];
    rubricObject['skill-'+i]['score'] = '';
    rubricObject['skill-'+i]['scoreDescriptors'] = skillObject;
  }
  var rubric = {};
  rubric.values = rubricValues;
  rubric.rubricObject = rubricObject;
  return rubric;
}



function fetchRubricValuesById(rubricId) {
  try {
    var rubricSS = SpreadsheetApp.openById(rubricId);
  } catch(err) {
    return "Access denied";
  }
  var rubricValues = rubricSS.getSheets()[0].getDataRange().getValues();
  return rubricValues;
}


function test3() {
  
  CacheService.getUserCache().remove('doctopusId');
  Drive.Properties.remove('1dvsyI3fWSFxejq68_RdlkgphF1vd7IIQUNTs2k9ITrs', 'doctopusId', {visibility: 'PUBLIC'});
   var test = getAssociationsFromDocId('1dvsyI3fWSFxejq68_RdlkgphF1vd7IIQUNTs2k9ITrs');
  debugger;
}




/**
* Returns an associations object, given an associations object
*
* @param {string} the docId of the document for which we want to return an associations object
*
*/
function getAssociationsFromDocId(docId, retry) {
  
  //first assess whether use has access to requested doc
  try {
    var doc = DriveApp.getFileById(docId);
  } catch(err) {
    if (err.message.indexOf('Access denied') !== -1) {
      return "Drive Apps not allowed";
    } else {
      return "No access to student file";
    }
  }
  
  //look for cached doctopus id
  var doctopusId = CacheService.getUserCache().get('doctopusId');
  if (!doctopusId) {  //look for doctopus id as drive property on file
    doctopusId = getPublicDriveProperty(docId, 'doctopusId');
  }
 
  //easy case - doctopus id is visible
  if (doctopusId) {
    var associationsFile = getAssociationsFile(docId, doctopusId);
    if ((associationsFile)&&(associationsFile !== "No associations file found matching this document")) {
      var associationsString = call(function() { return associationsFile.getBlob().getDataAsString();});
    } else {
      CacheService.getUserCache().remove('doctopusId');
    }
  } 
  //case where user clicks on Goobric from the Doctopus spreadsheet context
  if (!associationsString) {
    var associationsFile = getAssociationsFile('', docId);
    if (associationsFile !== "No associations file found matching this document") {
      var tempAssociationsString = call(function() { return associationsFile.getBlob().getDataAsString();});
      if (tempAssociationsString.indexOf(docId)!=-1) {
        associationsString = tempAssociationsString;
        var associations = JSON.parse(associationsString);
        var count = 0;
        for (var key in associations) {
          if (count == 0) {
            var firstKey = key;
          }
          if (count>0) {
            var urlArray = associations[key].nextDocUrl.split('/')
            associations[firstKey].fileId = urlArray[urlArray.length - 2];
            associations[firstKey].isDoctopusSheet = true;
            return associations[firstKey];
          }
          count++;
        }
      }
    }
  }
  

  if (!associationsString) {
    if (doc) {
      var docCreationDate = doc.getDateCreated().toISOString();
      var associationsFiles = DriveApp.searchFiles("mimeType = 'application/doctopus.associations' and modifiedDate >= '" + docCreationDate + "'");
      var n=0;
      while (associationsFiles.hasNext()) {
        var associationsFile = associationsFiles.next();
        var tempAssociationsString = call(function() { return associationsFile.getBlob().getDataAsString();});
        if (tempAssociationsString.indexOf(docId)!=-1) {
          associationsString = tempAssociationsString;
          break;
        } 
      }
    }
  }

  
  if (associationsString) {
    var associations = JSON.parse(associationsString);
    if (associations[docId]) {
      if (associations[docId].rubricId) {
        var doctopusId = associations[docId].doctopusId;
        CacheService.getUserCache().put('doctopusId', doctopusId);
        setPublicDriveProperty(docId, 'doctopusId', doctopusId);
        associations[docId].fileId = docId;
        return associations[docId];
      } else {
        CacheService.getUserCache().remove('doctopusId');
        return "No rubric associated";
      }
    } else {
      CacheService.getUserCache().remove('doctopusId');
      if (!retry) {
        return getAssociationsFromDocId(docId, true);
      } else {
        return "No associations file found matching this document";
      }
    }
  } else {
    CacheService.getUserCache().remove('doctopusId');
    return "No associations file found matching this document";
  }
}


/**
* Returns an associations file, given either a docId or a doctopusId
*
* @param {string} the docId of the document for which we want to return an associations file
* @param {string} the doctopusId of the spreadsheet for which we want to return an associations file
*
*/
function getAssociationsFile(docId, doctopusId) {
  var fileArray = [];
  if (doctopusId) {
    //Try returning the file by name, if doctopusId is provided
    var associationsFiles = call(function() { return DriveApp.getFilesByName("associations||" + doctopusId);}); //if doctopusId is provided, get files by exact name
    while (associationsFiles.hasNext()) {
      var thisFile = associationsFiles.next();
      if ((thisFile)&&(thisFile.isTrashed() !== true)) {
        fileArray.push(thisFile);
      }
    }
  } else {
    //Try searching for the docId inside every available associations file if not
    var associationsFiles =  call(function() { return DriveApp.getFilesByType('application/doctopus.associations');});
    while (associationsFiles.hasNext()) {
      var associationsFile = associationsFiles.next();
      var associationsString = call(function() { return associationsFile.getBlob().getDataAsString();});
      if ((associationsFile.isTrashed()!== true)&&(docId)&&(docId!=="")&&(associationsString.indexOf(docId)!==-1)) {
        fileArray.push(associationsFile);
      }
    }
  }
  if (fileArray.length === 1) {
    return fileArray[0];
  } else if (fileArray.length > 1) {
    //de-duplicate files
    for (var i=1; i<fileArray.length; i++) {
      fileArray[i].setTrashed(true);
    }
    return fileArray[0];
  } else {
    return "No associations file found matching this document";
  }
}




function setPublicDriveProperty(fileId, key, value) {
  var property = {
    key: key,
    value: value,
    visibility: "PUBLIC"
  }
  try {
    Drive.Properties.insert(property, fileId);
  } catch(err) {
  }
}


function getPublicDriveProperty(fileId, key) {
  try {
    var property = Drive.Properties.get(fileId, key, {visibility : "PUBLIC"} );
  } catch(err) {
    return;
  }
  return property.value;
}

