var playButtonUrl = 'https://storage.googleapis.com/goobric-icons/play-25x25.png';
var webAppUrl = 'https://script.google.com/macros/s/AKfycby4mwRwQEwtecDQbD5vrA2opzkC8W0v9MfQbrWBPLUPvjTWero/exec';

function testGetAssociations() {
  var e = {};
  e.parameter = {};
  //e.parameters.docId = '1kXBU0knIlSkMrzXm1KLwL9M3SxWeF8rI6M-u3LGlzXY';
  e.parameter.docId = '1fFA9LbM0z8shareZFNm6sBlgg8dDXQc7yxdGuld1TiA';
  e.parameter.rubricType = "numeric";
  e.parameters = e.parameter;
  var test = doGet(e);
  debugger;
}

function testGetDocInfo () {
  var docId = '1fFA9LbM0z8shareZFNm6sBlgg8dDXQc7yxdGuld1TiA';
  getDocList(docId)
}

function doGet(e) {
  setGoobricUid();
  //running in web app mode
  if (e.parameter) {
    if (e.parameter.addLibrary === "true") {
      return addLibraryToMyDrive(e);
    }
    
    if (e.parameter.docId) {
      var html = HtmlService.createTemplateFromFile('newGoobricUi');
      html.docId = e.parameter.docId;
      return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
    } else {
      var html = HtmlService.createTemplateFromFile('goobricHome');
      html.doctopusId = e.parameter.doctopusId ? e.parameter.doctopusId : '';
      return html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
    }
  }
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  .getContent();
}



function webAppSubmitRubric(rubricObj) {
  var e = {};
  var properties = PropertiesService.getUserProperties().getProperties();
  var submissionObj = {
    type : 'submit',
    rubricType : rubricObj.type,
    emailOption : rubricObj.emailOption,
    emailCol : rubricObj.emailCol,
    sheetId : rubricObj.sheetId,
    docId : rubricObj.docId,
    comment : rubricObj.comment,
    docAccess : rubricObj.docAccess,
    rows : 1,
    logWebApp: true
  }
  for (var key in rubricObj) {
    if (key.indexOf('skill')!==-1) {
      submissionObj['score_'+key.split('-')[1]] = rubricObj[key].score;
      submissionObj.rows++;
    }
  }
  if ((rubricObj.newAudioRecordings)&&(rubricObj.newAudioRecordings.length>0)) {
    for (var i=0; i<rubricObj.newAudioRecordings.length; i++) {
      submissionObj['audioWavFile' + (i+1)] = rubricObj.newAudioRecordings[i].key;
      submissionObj['audioWavFile' + (i+1) + '-fileName'] = rubricObj.newAudioRecordings[i].fileName;
    }
  }
  e.parameter = submissionObj;
  e.parameters = submissionObj;
  doGet(e);
  deleteTempScores(rubricObj.docId);
  if (rubricObj.emailOption != properties.emailOption) {
    PropertiesService.getUserProperties().setProperty('emailOption', rubricObj.emailOption);
  } 
  if (rubricObj.autoAdvance != properties.autoAdvance) {
    PropertiesService.getUserProperties().setProperty('autoAdvance', rubricObj.autoAdvance);
  } 
  return rubricObj.autoAdvance;
}

function getFirstDoc(doctopusId, sheetId) {
  var ss = SpreadsheetApp.openById(doctopusId);
  var mappings = new ColumnMappings(sheetId, LANG);
  var sheets = ss.getSheets();
  for (var i=0; i<sheets.length; i++) {
    if (sheets[i].getSheetId() == sheetId) {
      var firstDataRange = sheets[i].getRange(2, 1, 1, sheets[i].getLastColumn());
      var firstRowData = getRowsDataNonNormalized(sheets[i], firstDataRange, 1)[0];
      if (firstRowData[mappings.fileKeyCol]) {
        return firstRowData[mappings.fileKeyCol].split('||')[0];
			}
		}
	}
  return "not found";
}

function getDocData (doctopusId, sheetId) {
  var ss = SpreadsheetApp.openById(doctopusId);
  var mappings = new ColumnMappings(sheetId, LANG);
  var sheets = ss.getSheets();
  var student2doc = []
	// docsDict Maps doc ID to student2doc index
	// - we use this to compile groups
	var docsDict = {} 
  var retval = 0;
  for (var i=0; i<sheets.length; i++) {
    if (sheets[i].getSheetId() == sheetId) {
      var firstDataRange = sheets[i].getRange(2, 1, 1, sheets[i].getLastColumn());
      var firstRowData = getRowsDataNonNormalized(sheets[i], firstDataRange, 1)[0];
      if (firstRowData[mappings.fileKeyCol]) {
        retval = firstRowData[mappings.fileKeyCol].split('||')[0]; // Got our return value
        var dataRange = getRowsDataNonNormalized(sheets[i],sheets[i].getDataRange(),1);
        for (var ii=1; ii<dataRange.length; ii++) {
					// Now map the data...
          row = dataRange[ii]
					if (docsDict.hasOwnProperty(row['File Key'])) {
						// Group work! Let's add our name to the list...
						var prior_students = student2doc[docsDict[row['File Key']]][0]
						var student_name = prior_students + ', '+row['First Name']+' '+row['Last Name']
						student2doc[docsDict[row['File Key']]][0] =  student_name
					}
					else {
						student2doc.push([row['First Name']+' '+row['Last Name'],row['Link']])
						docsDict[row['File Key']] = (student2doc.length - 1) // 0-indexed
					}
				} // end for each row...
      } // end if (firstRowData...
    } // end if (sheets[i]...
  } // end for each sheet...
	return student2doc
}

// docList for jump...
function getDocList (docId) {
	// Log each call -- testing purposes
  //logsheet = SpreadsheetApp.openById('15PI0MjUk-Qxr13j29ZSrnJZpwEapaAoAB80w7Ziq9f0')
  //logsheet.getActiveSheet();
  //logsheet.appendRow(['Called getDocList',new Date()]);
	var associations = getAssociationsFromDocId(docId);
	student2doc = getDocData(associations.doctopusId, associations.sheetId)
	return student2doc
}

function testGetRubricObj() {
  var docId = '1mq7esJ4HOZGPMgS5qRMHUlZTgV4hxJxV7H74QmcxDkw';
  var rubricObj = getRubricObject(docId);
  var rubricArray = createRubricArray(rubricObj)
}

function getPrevewLink(url) {
  var urlArray = url.split('/');
  urlArray[urlArray.length-1] = 'preview';
  url = urlArray.join('/');
  return url;
}

function getFolderViewUrl(url) {
  if (url.indexOf('folderview')!=-1) {
    url = url.replace('folderview', 'embeddedfolderview');
  } else {
    url = url.replace('#folders/', 'embeddedfolderview?=');
  }
  url = url.replace('&usp=drivesdk', '#grid');
  return url;
}


function getRubricObject(docId) {
  var userEmail = Session.getEffectiveUser().getEmail();
  var associations = getAssociationsFromDocId(docId);
  if ((!associations)||((associations==='associations not found')||(associations==="No rubric associated")||(associations==="No associations file found matching this document"))) {
    return {error: "No rubric association found", userEmail: userEmail};
  }
  if (associations === 'Drive Apps not allowed') {
    return {error: "Drive Apps not allowed", userEmail: userEmail};
  }
  if (associations === 'No access to student file') {
    return {error: "Student file not accessible", userEmail: userEmail};
  }
  if (associations.isDoctopusSheet) {
    var assignment = DriveRoster.getAssignmentByDoctopusId(docId);
    var rosterName = assignment.rosters[0].name;
    var html = HtmlService.createTemplateFromFile('goobricHome');
    html.doctopusId = docId;
    html =  html.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME).getContent();
    return {homepage: true, content: html};
  }
  try {
    var doctopus = SpreadsheetApp.openById(associations.doctopusId);
  } catch(err) {
    return {error: "No access to Doctopus spreadsheet", doctopusUrl: 'https://docs.google.com/spreadsheets/d/' + associations.doctopusId + '/edit', userEmail: userEmail};
  }
  var rubric = fetchRubric(associations);
 
  if (rubric == "Access denied") {
    return {error: "No rubric access", rubricUrl: 'https://docs.google.com/spreadsheets/d/' + associations.rubricId + '/edit', userEmail: userEmail};
  }
 
  if (rubric) {
    var existingScores = getExistingScores(docId, doctopus, rubric, userEmail);
    var rubricObject = existingScores || rubric.rubricObject;
  }  else {
    var rubricObject = rubric.rubricObject;
  }
  if (rubricObject.docAccess === "NONE") {
    return {error: "Student file not accessible", nextDocUrl: rubricObject.nextDocUrl, userEmail: userEmail};
  }
  try {
    if (associations.fileType === "folder") {
      var file = DriveApp.getFolderById(docId);
    } else {
      var file = DriveApp.getFileById(docId);
    }
  } catch(err) {
    return {error: "Student file not accessible", nextDocUrl: rubricObject.nextDocUrl, userEmail: userEmail};
  }
  rubricObject.bucket = 'goobric-test';
  rubricObject.doctopusId = associations.doctopusId;
  rubricObject.rubricId = associations.rubricId;
  rubricObject.thisDocUrl = file.getUrl(); 
  var fileTypes = ['document','spreadsheet','presentation','drawing','form'];  
  if (rubricObject.fileType == 'folder') {
    rubricObject.thisDocUrl = getFolderViewUrl(rubricObject.thisDocUrl);
  } else if (fileTypes.indexOf(rubricObject.fileType)==-1) {
    rubricObject.thisDocUrl = getPrevewLink(rubricObject.thisDocUrl);
  }
  rubricObject.docId = docId;
  rubricObject.thisDocTitle = file.getName();
  rubricObject.doctopusUrl = doctopus.getUrl();
  rubricObject.emailOption = PropertiesService.getUserProperties().getProperty('emailOption') || 'true';
  rubricObject.autoAdvance = PropertiesService.getUserProperties().getProperty('autoAdvance') || 'false';
  rubricObject.viewerToCommenter = PropertiesService.getUserProperties().getProperty('viewerToCommenter') || 'true';
  rubricObject.thisUserEmail = userEmail;
  var tempScores = PropertiesService.getUserProperties().getProperty(docId);
  rubricObject.rows = 1;
  for (var key in rubricObject) {
    if (key.indexOf('skill') !== -1) {
      rubricObject.rows++;
    }
  }
  if (tempScores) {
    rubricObject.timeStamp = 'temp';
    tempScores = JSON.parse(tempScores);
    rubricObject.newAudioRecordings = [];
    for (var key in tempScores) {
      if (key.indexOf('skill') !== -1) {
        if (rubricObject[key]) {
          if (tempScores[key] === '') {
            rubricObject[key].score = '';
          } else {
            rubricObject[key].score = !isNaN(tempScores[key]) ? Number(tempScores[key]) : tempScores[key];
          }
        }
      }
      if (key.indexOf('audioWavFile') !== -1) {
        if (tempScores[key]) { 
          rubricObject[key] = tempScores[key];
          try {
            var fileName = DriveApp.getFileById(tempScores[key]).getName();
          } catch(err) {
            var fileName = "Unknown";
          }
          var thisRecordingId = tempScores[key] + '_' + new Date().getTime();
          var thisRecording = {
            key : tempScores[key],
            fileName : fileName,
            url: "https://docs.google.com/file/d/" + tempScores[key],
            recordingId: thisRecordingId
          }
          rubricObject.newAudioRecordings.push(thisRecording);
        }
      }
      if (key === 'comment') {
        rubricObject[key] = tempScores[key];
      }
    }
  }
  return rubricObject;
}


function getAllTempScores() {
  var tempScores = PropertiesService.getUserProperties().getProperties();
  return tempScores;
}


function clearTempScores() {
  PropertiesService.getUserProperties().deleteAllProperties();
}

function lengthInUtf8Bytes(str) {
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}


function tempSaveScores(scoresObj) {
  try {
    PropertiesService.getUserProperties().setProperty(scoresObj.docId, JSON.stringify(scoresObj.scores));
  } catch(err) {
    if (err.message.indexOf('Too many arguments provided')!==-1) {
      var allTempScores = JSON.stringify(getAllTempScores());
      var allScoreSize = lengthInUtf8Bytes(allTempScores);
      if (allScoreSize > 400000) {
        clearTempScores();
      }
    }
    return 'failed';
  }
  return 'succeeded';
}


function deleteTempScores(docId) {
  try {
    PropertiesService.getUserProperties().deleteProperty(docId);
  } catch(err) {
  }
}



function getExistingScores(docId, doctopusSpreadsheet, rubric, userEmail) {
  var rubricObject = rubric.rubricObject;
  rubricObject.oldAudioRecordings = [];
  rubricObject.newAudioRecordings = [];
  var rubricValues = rubric.values;
  var ss = doctopusSpreadsheet;
  var rubricSheet = ss.getSheetByName('rubricScores');
  if (rubricSheet.getLastRow()>1) {
    var values = getRowsDataNonNormalized(rubricSheet);
  } else {
    values = [];
  }
  var headers = rubricSheet.getRange(1, 1, 1, rubricSheet.getLastColumn()).getValues()[0];
  //added to handle audio files
  var audioHeaders = [];
  var normalizedAudioHeaders = [];
  for (var i=0; i<headers.length; i++) {
    if (headers[i].indexOf("Audio WAV File")!==-1) {
      audioHeaders.push(headers[i]);
      normalizedAudioHeaders.push(normalizeHeader(headers[i]));
    }
  }
  var allScores = [];
  try {
    for (var i=0; i<values.length; i++) {
      if ((values[i]['File Key'].search(docId)!=-1)&&(values[i]['Submitted by']==userEmail)) {
        var thisScoreObj = new Object();
        thisScoreObj.timeStamp = values[i]['Timestamp'] ?  Number(values[i]['Timestamp']) : '';
        for (var j=1; j<rubricValues.length; j++) { 
          var thisIndex = headers.indexOf(rubricValues[j][0]);
          if (thisIndex!=-1) {
            thisScoreObj['skill-'+j] = new Object();
            var thisScore = values[i][rubricValues[j][0]];
            thisScoreObj['skill-'+j]['score'] = thisScore;
          }
        }
        thisScoreObj['comment'] = values[i]['Comment'] || "";
        thisScoreObj['userEmail'] = values[i]['Submitted by'] || "";
        
        for (var a=0; a<audioHeaders.length; a++) {
          thisScoreObj[normalizedAudioHeaders[a]] = values[i][audioHeaders[a]] || "";
        }
        allScores.push(thisScoreObj); 
      }
    }
  } catch(err) {
  }
  allScores = allScores.sort(function(a, b){
    return b.timeStamp-a.timeStamp;
  });
  if (allScores.length>0) {
    for (var i=1; i<rubricValues.length; i++) {
      rubricObject['skill-'+i]['score'] =  allScores[0]['skill-'+i] ? allScores[0]['skill-'+i]['score'] : "";
    }
    for (var i=0; i<audioHeaders.length; i++) {
      rubricObject[normalizedAudioHeaders[i]] = allScores[0][normalizedAudioHeaders[i]] || "";
      if (allScores[0][normalizedAudioHeaders[i]]) {
        var thisOldAudioRecording = {};
        try {
          thisOldAudioRecording.fileName = DriveApp.getFileById(allScores[0][normalizedAudioHeaders[i]]).getName();  
        } catch(err) {
          thisOldAudioRecording.fileName = "Audio File " + (i+1);
        }
        thisOldAudioRecording.url = "https://docs.google.com/file/d/" + allScores[0][normalizedAudioHeaders[i]];
        thisOldAudioRecording.index = (i+1);
        thisOldAudioRecording.key = allScores[0][normalizedAudioHeaders[i]];
        rubricObject.oldAudioRecordings.push(thisOldAudioRecording);
      }
    }
    rubricObject['comment'] = allScores[0]['comment'] ? allScores[0]['comment'] : "";
    rubricObject['timeStamp'] = allScores[0]['timeStamp'] ? allScores[0]['timeStamp'] : "";
    rubricObject['userEmail'] = allScores[0]['userEmail'] ? allScores[0]['userEmail'] : "";
    return rubricObject;
  } else {
    for (var i=1; i<rubricValues.length; i++) {
      rubricObject['skill-'+i]['score'] =  '';
    }
    rubricObject['comment'] = '';
    rubricObject['timeStamp'] = '';
    rubricObject['userEmail'] = '';
    rubricObject['docId'] = docId;
    return rubricObject;
  }
}



function createRubricArray(rubricObj) {
  var rubricArray = new Array(rubricObj.rows);
  var scale = rubricObj.scale.split("||");
  if (rubricObj.type === "numeric") {
    for (var i=0; i<scale.length; i++) {
      scale[i] = +scale[i];
    }
  }
  scale.unshift('');
  rubricArray[0] = scale;
  for (var key in rubricObj) {
    if (key.indexOf("skill")!==-1) {
      var thisRow = new Array(scale.length);
      thisRow[0] = rubricObj[key].skillName;
      var thisRowIndex = key.split("-")[1]
      var descriptors = rubricObj[key].scoreDescriptors;
      for (var descriptor in descriptors) {
        var thisScore = descriptor.split("||")[1]    
        if (rubricObj.type === "numeric") {
          thisScore = +thisScore;
        }
        var thisIndex = scale.indexOf(thisScore);
        thisRow[thisIndex] = descriptors[descriptor];
      }
      rubricArray[thisRowIndex] = thisRow;
    }
  }
  return rubricArray;
}



function submitRubricScores(rubricObj) {
  var date = rubricObj.timeStamp;
  var userEmail = Session.getEffectiveUser().getEmail();
  var domain = userEmail.split("@")[1];
  var properties = PropertiesService.getUserProperties().getProperties();
  var submissionObj = {
    type : 'submit',
    rubricType : rubricObj.type,
    emailOption : rubricObj.emailOption,
    emailCol : rubricObj.emailCol,
    sheetId : rubricObj.sheetId,
    docId : rubricObj.docId,
    comment : rubricObj.comment,
    docAccess : rubricObj.docAccess,
    rows : 1,
    logWebApp: true
  }
  for (var key in rubricObj) {
    if (key.indexOf('skill')!==-1) {
      submissionObj['score_'+key.split('-')[1]] = rubricObj[key].score;
      submissionObj.rows++;
    }
  }
  if ((rubricObj.newAudioRecordings)&&(rubricObj.newAudioRecordings.length>0)) {
    for (var i=0; i<rubricObj.newAudioRecordings.length; i++) {
      submissionObj['audioWavFile' + (i+1)] = rubricObj.newAudioRecordings[i].key;
      submissionObj['audioWavFile' + (i+1) + '-fileName'] = rubricObj.newAudioRecordings[i].fileName;
    }
  }
  
  var rubricValues = createRubricArray(rubricObj);
  //var rubricValues = fetchRubricValuesById(rubricObj.rubricId);  //old method 100ms slower
  
  var rubricScaleScores = rubricValues[0].slice(1, rubricValues[0].length);
  //clean newlines
  for (var n=0; n<rubricScaleScores.length; n++) {
    rubricScaleScores[n] = (!isNaN(rubricScaleScores[n])) ? rubricScaleScores[n] : rubricScaleScores[n].replace(/\n/g, "");
  }
  var theseRubricValues = [[]];
  for (var i=0; i<rubricValues.length; i++) {
    theseRubricValues[i] = rubricValues[i].slice(0);
    if (i>0) {
      if (rubricObj.type !== "nonNumeric") {
        var score = submissionObj['score_'+i] !== '' ? submissionObj['score_'+i] : '';
        theseRubricValues[i][0] = rubricValues[i][0] + "\n  Your score: " + score;
      } else {
        var score = submissionObj['score_'+i];
        theseRubricValues[i][0] = rubricValues[i][0] + "\n" + score;
      }
      
    }
  }
  if (rubricObj.fileType=='document') {
    try {
      var doc = DocumentApp.openById(rubricObj.docId);
      var body = doc.getBody();
      body.appendParagraph('Rubric rating submitted on: ' + date + ' by ' + rubricObj.thisUserEmail);
      var rows = parseInt(rubricObj.rows);
      var table = body.appendTable(theseRubricValues).setFontSize(10).setBorderColor('#606060').setBorderWidth(1);
      if (rubricObj.type !== "nonNumeric") {
        for (var i=1; i<theseRubricValues.length; i++) {
          var score = (submissionObj['score_'+i] !== '') ? submissionObj['score_'+i] : '';
          if ((!isNaN(score))&&(rubricScaleScores.indexOf(+score)!==-1)) {  //score is equal to a number in the scale
            var cell = table.getRow(i).getCell(rubricScaleScores.indexOf(+score)+1).setBackgroundColor('#E0E0E0');
          } else if (isNaN(score)||(score=='')) {
            //do nothing;
          } else {  //score is  between scale values
            for (var s=0; s<rubricScaleScores.length; s++) {
              if (rubricScaleScores[s+1]&&(+score < +rubricScaleScores[s+1])&&(+score > +rubricScaleScores[s])) {  //ascending scale
                table.getRow(i).getCell(rubricScaleScores.indexOf(+rubricScaleScores[s+1])+1).setBackgroundColor('#E0E0E0');
                table.getRow(i).getCell(rubricScaleScores.indexOf(+rubricScaleScores[s])+1).setBackgroundColor('#E0E0E0');
                break;
              }
              if (rubricScaleScores[s+1]&&(+score > +rubricScaleScores[s+1])&&(+score < +rubricScaleScores[s])) {  //descending scale
                table.getRow(i).getCell(rubricScaleScores.indexOf(+rubricScaleScores[s+1])+1).setBackgroundColor('#E0E0E0');
                table.getRow(i).getCell(rubricScaleScores.indexOf(+rubricScaleScores[s])+1).setBackgroundColor('#E0E0E0');
                break;
              }
            }
          }
        }
      } else {
        for (var i=1; i<theseRubricValues.length; i++) {
          var score = submissionObj['score_'+i].toString();
          var cell = table.getRow(i).getCell(rubricScaleScores.indexOf(score)+1).setBackgroundColor('#E0E0E0');
        }
      }
      var comment = submissionObj['comment'];
      body.appendParagraph('Comments:');
      body.appendParagraph(comment);
      if (submissionObj['audioWavFile1']) {
        body.appendParagraph("");
        body.appendParagraph("New audio comments:");
        for (var key in submissionObj) {
          if ((key.indexOf('audioWavFile')!==-1)&&(key.indexOf('fileName')===-1)) {
            try {
              var thisFileName = submissionObj[key + '-fileName'];
              body.appendListItem(thisFileName).setLinkUrl('https://docs.google.com/file/d/' + submissionObj[key]);
            } catch(err) {
            }
          }  
        }
      }
      doc.saveAndClose();
    } catch(err) {
    }
  } 
  
  if (rubricObj.fileType!='folder') {
    var doc = DriveApp.getFileById(rubricObj.docId);
  } else {
    var doc = DriveApp.getFolderById(rubricObj.docId);
  }
  var doctopus = SpreadsheetApp.openById(rubricObj.doctopusId);
  var sheets = doctopus.getSheets();
  for (var i=0; i<sheets.length; i++) {
    if (sheets[i].getSheetId()==rubricObj.sheetId) {
      var assignmentSheet = sheets[i];
      break;
    }
  }
  
  if (assignmentSheet) {
    var values = assignmentSheet.getRange(1, 1, assignmentSheet.getLastRow(), assignmentSheet.getLastColumn()).getValues();
    var headers = values.shift();
    var emailColIndex = headers.indexOf(this.LANG.emailCol);
    var fileKeyColIndex = headers.indexOf(this.LANG.fileKeyCol);
    var firstNameColIndex = headers.indexOf(this.LANG.firstNameCol);
    var lastNameColIndex = headers.indexOf(this.LANG.lastNameCol);
    
    var emails = rubricObj.feedbackEmails.split(',');
    var names = [];
    for (var i=0; i<values.length; i++) {
      if (values[i][fileKeyColIndex].split("||")[0]==rubricObj.docId) {
        names.push(values[i][firstNameColIndex] + " " + values[i][lastNameColIndex]);
      }
    }
    if (rubricObj.emailOption=="true") { //send email for non document assignment types.
      var rubricTable = names.join(', ') + ',<div><p>' + rubricObj.thisUserEmail + ' has just submitted the following rubric assessment for your assignment <a href="' + doc.getUrl() + '">' + doc.getName() + '</a></p></div>';
      var numCols = theseRubricValues[0].length + 1;
      var colWidth = Math.floor(100/numCols).toString() + "%";
      rubricTable += '<table border="1px" cellspacing="0px"><tr>';
      rubricTable += '<td width="'+ colWidth +'"></td>';
      for  (var j=1; j<theseRubricValues[0].length; j++) {
        rubricTable += '<td width="'+ colWidth +'">' + theseRubricValues[0][j].toString().replace(/\n/g, "<br/>") + '</td>';
      }
      rubricTable += '</tr>';
      if (rubricObj.type !== "nonNumeric") {
        for (var i=1; i<theseRubricValues.length; i++) {
          rubricTable += '<tr>'
          var score = (submissionObj['score_'+i] !== '') ? submissionObj['score_'+i] : '';
          rubricTable += '<td width="'+ colWidth +'"><div><p>' + theseRubricValues[i][0].replace(/\n/g, '<br /><br />') + '</p>'; //<p style="font-size: large">' + score + '</p></div></td>';
          var oneScoreUp = ((score !=='')&&(!isNaN(score))) ? oneUp(theseRubricValues[0], +score) : '';
          var oneScoreDown = ((score !=='')&&(!isNaN(score))) ? oneDown(theseRubricValues[0], +score) : '';
          for (var j=1; j<theseRubricValues[0].length; j++) {
            var style = ''
            var thisColScore = (theseRubricValues[0][j] !== '') ? theseRubricValues[0][j] : '';
            if ((thisColScore==score)&&(score!=='')) {
              style = 'style="background-color: #E0E0E0;"';
            }
            //score is  between scale values
            if ((score!=='')&&(oneScoreUp!=='')&&(thisColScore==oneScoreUp)) {
              var style = 'style="background-color: #E0E0E0;"';
            } 
            if ((score!=='')&&(oneScoreDown!=='')&&(thisColScore==oneScoreDown)) {
              var style = 'style="background-color: #E0E0E0;"';
            }
            rubricTable += '<td ' + style + ' width="'+ colWidth +'">' + theseRubricValues[i][j] + '</td>';
          }
          rubricTable += '</tr>';
        }
      } else {    
        for (var i=1; i<theseRubricValues.length; i++) {
          rubricTable += '<tr>'
          var score = submissionObj['score_'+i];
          rubricTable += '<td width="'+ colWidth +'"><div><p>' + theseRubricValues[i][0].replace(/\n/g, '<br /><br />') + '</p>'; 
          for (var j=1; j<theseRubricValues[0].length; j++) {
            var style = ''
            var thisColScore = theseRubricValues[0][j];
            //clean newlines
            if (typeof thisColScore === "string") {
              thisColScore = thisColScore.replace(/\n/g, "");
            }
            if (thisColScore==score) {
              style = 'style="background-color: #E0E0E0;"';
            } 
            rubricTable += '<td ' + style + ' width="'+ colWidth +'">' + theseRubricValues[i][j] + '</td>';
          }
          rubricTable += '</tr>';
        }
      }
      rubricTable += '</table>';
      var htmlComment = submissionObj['comment'].toString()  // escape HTML
      htmlComment = htmlComment.replace(/</g,'&lt;')
      htmlComment = htmlComment.replace(/>/g,'&gt;')
      htmlComment = htmlComment.replace(/\n/g,'<br/><br/>')
      rubricTable += '<p><strong>Comments:</strong></p><p>' + htmlComment  + '</p>';
      if (submissionObj['audioWavFile1']) {
        rubricTable += '<p><strong>New audio comments:</strong></p>';
        rubricTable += '<ol>';
        for (var key in submissionObj) {
          if ((key.indexOf('audioWavFile')!==-1)&&(key.indexOf('fileName')===-1)) {
            var thisFileName = submissionObj[key + '-fileName'];
            rubricTable += '<li><a href="https://docs.google.com/file/d/' + submissionObj[key] + '"><img style="vertical-align: middle;" src="' + playButtonUrl + '"> ' + thisFileName + '</a></li>';
          }  
        }
        rubricTable += '</ol>';
      }
      try {
        MailApp.sendEmail(emails.join(','), "Rubric assessment submitted for " + doc.getName(), '', {htmlBody: rubricTable});
				Logger.log("sent");
      } catch(err) {
        try {
          MailApp.sendEmail(userEmail, 'Goobric had trouble emailing scores', 'emails: ' + JSON.stringify(emails) + 'err: ' + err.message + + " Headers: " + headers.join(", ") + "Emailcol: " + emailColIndex + " " + JSON.stringify(rubricObj));
        } catch(err) {
					Logger.log(err.message);
        }
      }
    }
  } // end send email (for non document assignments)
  
  //Begin building score object
  var scoreObj = {};
  
  //Load score sheet and make repairs if necessary
  var runningScoreSheet = doctopus.getSheetByName('rubricScores');
  var expectedSheetHeaders = [LANG.authorNamesCol, LANG.linkCol, LANG.timestampCol, LANG.submittedByCol, LANG.fileKeyCol];
  for (var i=1; i<rubricValues.length; i++) {
    expectedSheetHeaders.push(rubricValues[i][0]);
  }
  //Add author names
  scoreObj[LANG.authorNamesCol] = names.join(', ');
  
  //Check for audio files
  for (var key in submissionObj) {
    if ((key.indexOf('audioWavFile')!==-1)&&(key.indexOf('fileName')===-1)) {
      var waveFileNum = key.substr(12, key.length-12);
      expectedSheetHeaders.push("Audio WAV File " + waveFileNum);
      scoreObj["Audio WAV File " + waveFileNum] = '=HYPERLINK("https://docs.google.com/file/d/' + submissionObj[key] + '"; "' + submissionObj[key] + '")';
    }
  }
  
  if (!runningScoreSheet) {
    runningScoreSheet = doctopus.insertSheet('rubricScores');
    var headersRange = runningScoreSheet.getRange(1, 1, 1, expectedSheetHeaders.length);
    headersRange.setValues([expectedSheetHeaders]);
    SpreadsheetApp.flush();
  } else {
    var actualHeaders = runningScoreSheet.getRange(1, 1, 1, runningScoreSheet.getLastColumn()).getValues()[0];
    var headersAdded = false;
    for (var i=0; i<expectedSheetHeaders.length; i++) {
      if (actualHeaders.indexOf(expectedSheetHeaders[i]) == -1) {
        runningScoreSheet.insertColumnsAfter(runningScoreSheet.getLastColumn(), 1);
        runningScoreSheet.getRange(1, runningScoreSheet.getLastColumn()+1).setValue(expectedSheetHeaders[i]);
        actualHeaders.push(expectedSheetHeaders[i]);
        headersAdded = true;
      }
    }
    if (headersAdded) {
      var headersRange = runningScoreSheet.getRange(1, 1, 1, runningScoreSheet.getLastColumn());
    }
  }
  
  fixTimestampCol(runningScoreSheet);
  
  scoreObj['Link'] = 'https://docs.google.com/open?id=' + rubricObj.docId; 
  scoreObj['Timestamp'] = new Date(date);
  scoreObj['Submitted by'] = rubricObj.thisUserEmail;
  scoreObj['File Key'] = rubricObj.docId + "||" + rubricObj.fileType;
  
  for (var j=1; j<rubricValues.length; j++) { 
    var thisRubricCategory = rubricValues[j][0].toString();
    if (rubricObj.type !== "nonNumeric") {
      scoreObj[thisRubricCategory] = submissionObj['score_'+j]!=='' ? submissionObj['score_'+j] : '';
    } else {
      scoreObj[thisRubricCategory] = submissionObj['score_'+j].toString();
    }
  } 
  scoreObj['Comment'] = submissionObj['comment'];
  
  //Write score to sheet
  var nextRow = runningScoreSheet.getLastRow() + 1;
  setRowsDataNonNormalized(runningScoreSheet, [scoreObj], headersRange, nextRow); 
  Goobric_logRubricSubmittedWebApp();
  var doctopus = SpreadsheetApp.openById(rubricObj.doctopusId);
  
  //Change permissions
  if ((rubricObj.docAccess === "EDIT")&&(rubricObj.studentDocAccess==="VIEW")&&(rubricObj.viewerToCommenter==="true")) {
    var viewers = rubricObj.feedbackEmails.split(',');
    setViewersToCommenters(viewers, rubricObj.docId);
  }
  
  deleteTempScores(rubricObj.docId);
  
  var userProperties = PropertiesService.getUserProperties();
  if (rubricObj.emailOption != properties.emailOption) {
    userProperties.setProperty('emailOption', rubricObj.emailOption);
  } 
  if (rubricObj.autoAdvance != properties.autoAdvance) {
    userProperties.setProperty('autoAdvance', rubricObj.autoAdvance);
  } 
  if (rubricObj.viewerToCommenter !== properties.viewerToCommenter) {
    userProperties.setProperty('viewerToCommenter', rubricObj.viewerToCommenter);
  }
  Libraries.PublishedLibrary.logUserAction("Score Submitted", rubricObj.rubricId, '', domain);
  return rubricObj.autoAdvance;
}



function setViewersToCommenters(viewers, fileId) {
  var permissions = Drive.Permissions.list(fileId).items;
  if (permissions) {
    for (var i=0; i<permissions.length; i++) {
      if (viewers.indexOf(permissions[i].emailAddress.toLowerCase()) !== -1) {
        var permissionId = permissions[i].id;
        var resource = permissions[i];
        resource.additionalRoles = ['commenter'];
        try {
          Drive.Permissions.update(resource, fileId, permissionId);
        } catch(err) {
        }
      }
    }
  }
}


function testOneUp() {
  var arr = ["",""];
  var test = oneUp(arr, 3.5);
  var test = oneDown(arr, 3.5);
  debugger;
}


function oneUp(array, value) {
  if ((!array)||(array.indexOf(value)!==-1)) {
    return '';
  }
  var copy = JSON.parse(JSON.stringify(array));
  copy.sort();
  for (var i=0; i<copy.length; i++) {
    if (copy[i+1]&&(value < copy[i+1])&&(value > copy[i])) {
      return copy[i+1];
    }
  }
  return '';
}


function oneDown(array, value) {
  if ((!array)||(array.indexOf(value)!==-1)) {
    return '';
  }
  var copy = JSON.parse(JSON.stringify(array));
  copy.sort();
  for (var i=0; i<copy.length; i++) {
    if (copy[i+1]&&(value < copy[i+1])&&(value > copy[i])) {
      return copy[i];
    }
  }
  return '';
}



function fixTimestampCol(sheet) {
  var values = sheet.getDataRange().getValues();
  var headers = values.shift();
  var timeStampIndex = headers.indexOf("Timestamp");
  for (var i=0; i<values.length; i++) {
    if (typeof values[i][timeStampIndex].getMonth !== 'function') {
      sheet.getRange(i+2, timeStampIndex+1).setValue(new Date(values[i][timeStampIndex]));
    }
  }
}
