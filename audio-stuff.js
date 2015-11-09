function transferFileFromAppEngine(fileName, recordingId, docId, studentEmails) {
  try {
    Goobric_logAudioFileUploaded()
  } catch(err) {
  }
  var userEmail = Session.getEffectiveUser().getEmail();
  var doctopusUserId = DriveRoster.getDoctopusUserId();
  var bucket = 'goobric-test';
  var blob = getFileFromCloudStorage(bucket, recordingId);
  deleteFileFromCloudStorage(bucket, recordingId);
  var goobricFolder = doctopusUserId ? DriveApp.getFolderById(doctopusUserId) : DriveApp.getRootFolder();
  var folders = DriveApp.getFoldersByName('Goobric Audio Files');
  var folder;
  while (folders.hasNext()) {
    folder = folders.next();
  }
  if (!folder) {
    folder = goobricFolder.createFolder('Goobric Audio Files');
  }
  var file = folder.createFile(blob);
  file.setName(fileName);
  var coTeachers = DriveApp.getFileById(docId).getEditors();
  var emailsAdded = [];
  for (var i=0; i<coTeachers.length; i++) {
    try {
      var thisEmail = coTeachers[i].getEmail();
      if (thisEmail !== userEmail) {
        file.addViewer(thisEmail);
        emailsAdded.push(thisEmail);
      }
    } catch(err) {
    }
  }
  studentEmails = studentEmails.split(",");
  for (var i=0; i<studentEmails.length; i++) {
    try {
      if (emailsAdded.indexOf(studentEmails[i])===-1) {
        file.addViewer(studentEmails[i]);
      }
    } catch(err) {
    }
  }
  var url = file.getUrl();
  var fileObj = {
    url: url,
    recordingId: recordingId,
    fileName: fileName,
    key: file.getId()
  }
  return fileObj;
}



function getFileFromCloudStorage(bucket, recordingId) {
  var getUrl = 'https://www.googleapis.com/storage/v1/b/' + bucket + '/o/' + recordingId;
  var response = JSON.parse(UrlFetchApp.fetch(getUrl));
  var mediaLink = response.mediaLink;  
  var blob = UrlFetchApp.fetch(mediaLink).getAs('audio/wav').copyBlob();
  return blob;
}


function deleteFileFromCloudStorage(bucket, recordingId) {
  var deleteUrl = 'https://www.googleapis.com/storage/v1/b/' + bucket + '/o/' + recordingId;
  var params = {
    method: 'DELETE'
  }
  try {
    var request = UrlFetchApp.fetch(deleteUrl, params);
  } catch(err) {
  }
}


function removeFromDrive(recordingId, fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch(err) {
  }
  return recordingId;
}
