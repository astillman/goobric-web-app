function getHomeGlobal() {
  try {
    var global = {};
    var rosters = DriveRoster.getRosters();
    var classRoomRosterNames = getClassroomRosterNames();
    rosters = rosters.concat(classRoomRosterNames);
    rosters.sort(function(a, b) {
      var textA = a.className.toUpperCase();
      var textB = b.className.toUpperCase();
      return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
    global.rosters = rosters;
    global.userEmail = Session.getEffectiveUser().getEmail();
    return global;
  } catch(err) {
    var errInfo = catchToString_(err);
    logErrInfo_(errInfo);
  }
}


function getClassroomRosterNames() {
  try {
    var crFolder = DriveApp.getFoldersByName('Classroom');
    var folder;
    var courseNames = [];
    var found = false;
    while (crFolder.hasNext()) {
      folder = crFolder.next();
      found = true;
    } 
    if (!found) {
      var crFolder2 = DriveApp.getFoldersByName('Google Classroom');
      while (crFolder2.hasNext()) {
        folder = crFolder2.next();
        found = true;
      }
    }
    if (folder) {
      var rosters = [];
      var classFolders = folder.getFolders();
      while (classFolders.hasNext()) {
        var thisRoster = {};
        thisRoster.className = "Google Classroom - " + classFolders.next().getName();
        rosters.push(thisRoster);
      }
      return rosters;
    } else {
      return [];
    }
  } catch(err) {
    var errInfo = catchToString_(err) 
    logErrInfo_(errInfo)
  }
}

function getPropopulationValues(doctopusId) {
  try {
    var prepopValues = {};
    var assignment = DriveRoster.getAssignmentByDoctopusId(doctopusId);
    prepopValues.className = assignment.rosters[0].className;
    prepopValues.assignments = getRosterAssignments(prepopValues.className);
    prepopValues.selectedIndex = -1;
    for (var i=0; i<prepopValues.assignments.length; i++) {
      if (prepopValues.assignments[i].name === assignment.name) {
        prepopValues.selectedIndex = i;
        break
      }
    }
    return prepopValues;
  } catch(err) {
    var errInfo = catchToString_(err) 
    logErrInfo_(errInfo)
  }
}


function getRosterAssignments(className) {
  try {
    var assignments = DriveRoster.getAssignments(className);
    return assignments;
  } catch(err) {
    var errInfo = catchToString_(err) 
    logErrInfo_(errInfo)
  }
}

function testGetRosterAssignments() {
  var assmts = getRosterAssignments("Large roster");
  var deets = getAssignmentDetails(assmts[0]);
  debugger;
}

function getAssignmentDetails(assignment, optIntervalId) {
  try {
    if (optIntervalId) {
      assignment.intervalId = optIntervalId;
    }
    var ssKey = assignment.ssKey;
    var rubricKey = assignment.rubricId ? assignment.rubricId : assignment.rubrics ? assignment.rubrics[0] : '';
    if (rubricKey) {
      try {
        var rubric = SpreadsheetApp.openById(rubricKey);
        assignment.rubricName = rubric.getName();
        assignment.rubricUrl = rubric.getUrl();
        assignment.hasRubric = true;
      } catch(err) {
        assignment.rubricName = "Rubric not accessible";
        assignment.rubricUrl = "#";
      }
    }
    var detailsArray = [];
    try {
      var ss = SpreadsheetApp.openById(ssKey);
      var sheetId = assignment.colMappings.sheetId;
      var sheet = getSheetById(ss, sheetId);
      if (assignment.hasRubric) {
        var rubricScoreSheet = ss.getSheetByName('rubricScores');
        var rubricScoreData = getRowsDataNonNormalized(rubricScoreSheet);
      }
      var data = getRowsDataNonNormalized(sheet);
      var mappings = new ColumnMappings(sheet.getSheetId());
      var timeZone = ss.getSpreadsheetTimeZone();
      for (var i=0; i<data.length; i++) {
        var theseScores = assignment.hasRubric ? getScores(data[i][mappings.fileKeyCol], rubricScoreData) : [];
        var theseDetails = {};
        theseDetails.firstName = data[i][mappings.firstNameCol];
        theseDetails.lastName = data[i][mappings.lastNameCol];
        theseDetails.fileName = data[i][mappings.fileNameCol];
        theseDetails.link = data[i][mappings.linkCol];
        theseDetails.goobricLink = webAppUrl + "?docId=" + data[i][mappings.fileKeyCol].split('||')[0] + "&webApp=true";
        theseDetails.count = data[i]['Count'];
        theseDetails.lastSubmitted = theseScores.length ? (Utilities.formatDate(theseScores[0]['Timestamp'], timeZone, "M/d/YYYY h:mm a") + " by " + theseScores[0]['Submitted by'].split("@")[0]) : '';
        detailsArray.push(theseDetails);
      }
      assignment.details = detailsArray;
      return assignment;
    } catch(err) {
      return assignment;
    }
  } catch(err) {
    var errInfo = catchToString_(err) 
    logErrInfo_(errInfo)
  }
}


function getScores(fileKey, scoreData) {
  try {
    var theseScores = [];
    for (var i=0; i<scoreData.length; i++) {
      if (scoreData[i]['File Key'] === fileKey) {
        theseScores.push(scoreData[i]);
      }
    }
    theseScores.sort(function(a, b) {
      return new Date(b['Timestamp']) - new Date(a['Timestamp']);
    })
    return theseScores;
  } catch(err) {
    var errInfo = catchToString_(err) 
    logErrInfo_(errInfo)
  }
}