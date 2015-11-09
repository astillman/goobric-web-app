function Goobric_createGATrackingUrl(encoded_page_name)
{
  var utmcc = Goobric_createGACookie();
  var eduSetting = UserProperties.getProperty('eduSetting');
   if (eduSetting=="true") {
    encoded_page_name = "edu/" + encoded_page_name;
  }
  if (utmcc == null)
    {
      return null;
    }
 
  var ga_url1 = "http://www.google-analytics.com/__utm.gif?utmwv=5.2.2&utmhn=www.Goobric-analytics.com&utmcs=-&utmul=en-us&utmje=1&utmdt&utmr=0=";
  var ga_url2 = "&utmac=UA-39095451-2&utmcc=" + utmcc + "&utmu=DI~";
  var ga_url_full = ga_url1 + encoded_page_name + "&utmp=" + encoded_page_name + ga_url2;
  
  return ga_url_full;
}


function Goobric_createGACookie()
{
  var a = "";
  var b = "100000000";
  var c = "200000000";
  var d = "";

  var dt = new Date();
  var ms = dt.getTime();
  var ms_str = ms.toString();
 
  var Goobric_uid = UserProperties.getProperty("Goobric_uid");
  if ((Goobric_uid == null) || (Goobric_uid == ""))
    {
      // shouldn't happen unless user explicitly removed Goobric_uid from properties.
      return null;
    }
  
  a = Goobric_uid.substring(0,9);
  d = Goobric_uid.substring(9);
  
  utmcc = "__utma%3D451096098." + a + "." + b + "." + c + "." + d 
          + ".1%3B%2B__utmz%3D451096098." + d + ".1.1.utmcsr%3D(direct)%7Cutmccn%3D(direct)%7Cutmcmd%3D(none)%3B";
 
  return utmcc;
}


function Goobric_logRubricRequested()
{
  var ga_url = Goobric_createGATrackingUrl("Rubric%20Association%20Requested");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}



function Goobric_logRubricSubmitted()
{
  var ga_url = Goobric_createGATrackingUrl("Rubric%20Score%20Submitted");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}


function Goobric_logAudioFileUploaded()
{
  var ga_url = Goobric_createGATrackingUrl("Audio%20File%20Uploaded");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}


function Goobric_logRubricSubmittedWebApp()
{
  var ga_url = Goobric_createGATrackingUrl("Rubric%20Score%20Submitted%2FWeb%20App");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}


function setGoobricUid()
{ 
  var Goobric_uid = UserProperties.getProperty("Goobric_uid");
  if (Goobric_uid == null || Goobric_uid == "")
    {
      // user has never installed Goobric before (in any spreadsheet)
      var dt = new Date();
      var ms = dt.getTime();
      var ms_str = ms.toString();
 
      UserProperties.setProperty("Goobric_uid", ms_str);
      Goobric_logFirstInstall();
    }
}


function Goobric_logFirstInstall()
{
  var ga_url = Goobric_createGATrackingUrl("First%20Install");
  if (ga_url)
    {
      var response = UrlFetchApp.fetch(ga_url);
    }
}


// Returns an Array of normalized Strings.
// Empty Strings are returned for all Strings that could not be successfully normalized.
// Arguments:
//   - headers: Array of Strings to normalize
function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    keys.push(normalizeHeader(headers[i]));
  }
  return keys;
}

// Normalizes a string, by removing all alphanumeric characters and using mixed case
// to separate words. The output will always start with a lower case letter.
// This function is designed to produce JavaScript object property names.
// Arguments:
//   - header: string to normalize
// Examples:
//   "First Name" -> "firstName"
//   "Market Cap (millions) -> "marketCapMillions
//   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum_(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit_(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty_(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum_(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit_(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit_(char) {
  return char >= '0' && char <= '9';
}

 
// getRowsData iterates row by row in the input range and returns an array of objects.
// Each object contains all the data for a given row, indexed by its normalized column name.
// Arguments:
//   - sheet: the sheet object that contains the data to be processed
//   - range: the exact range of cells where the data is stored
//       This argument is optional and it defaults to all the cells except those in the first row
//       or all the cells below columnHeadersRowIndex (if defined).
//   - columnHeadersRowIndex: specifies the row number where the column names are stored.
//       This argument is optional and it defaults to the row immediately above range;
// Returns an Array of objects.
/*
 * @param {sheet} sheet with data to be pulled from.
 * @param {range} range where the data is in the sheet, headers are above
 * @param {row} 
 */
function getRowsData(sheet, range, columnHeadersRowIndex) {
  if (sheet.getLastRow() < 2){
    return [];
  }
  var headersIndex = columnHeadersRowIndex || (range ? range.getRowIndex() - 1 : 1);
  var dataRange = range ||
    sheet.getRange(headersIndex+1, 1, sheet.getLastRow() - headersIndex, sheet.getLastColumn());
  var numColumns = dataRange.getLastColumn() - dataRange.getColumn() + 1;
  var headersRange = sheet.getRange(headersIndex, dataRange.getColumn(), 1, numColumns);
  var headers = headersRange.getValues()[0];
  return getObjects_(dataRange.getValues(), normalizeHeaders(headers));
}


/*
 * @param {sheet} sheet with data to be pulled from.
 * @param {range} range where the data is in the sheet, headers are above
 * @param {row} 
 */
function getRowsDataNonNormalized(sheet, range, columnHeadersRowIndex) {
  if (sheet.getLastRow() < 2){
    return [];
  }
  var headersIndex = columnHeadersRowIndex || (range ? range.getRowIndex() - 1 : 1);
  var dataRange = range ||
    sheet.getRange(headersIndex+1, 1, sheet.getLastRow() - headersIndex, sheet.getLastColumn());
  var numColumns = dataRange.getLastColumn() - dataRange.getColumn() + 1;
  var headersRange = sheet.getRange(headersIndex, dataRange.getColumn(), 1, numColumns);
  var headers = headersRange.getValues()[0];
  return getObjects_(dataRange.getValues(), headers);
}


// setRowsData fills in one row of data per object defined in the objects Array.
// For every Column, it checks if data objects define a value for it.
// Arguments:
//   - sheet: the Sheet Object where the data will be written
//   - objects: an Array of Objects, each of which contains data for a row
//   - optHeadersRange: a Range of cells where the column headers are defined. This
//     defaults to the entire first row in sheet.
//   - optFirstDataRowIndex: index of the first row where data should be written. This
//     defaults to the row immediately below the headers.
function setRowsData(sheet, objects, optHeadersRange, optFirstDataRowIndex) {
  var headersRange = optHeadersRange || sheet.getRange(1, 1, 1, sheet.getMaxColumns());
  var firstDataRowIndex = optFirstDataRowIndex || headersRange.getRowIndex() + 1;
  var headers = normalizeHeaders(headersRange.getValues()[0]);
  var data = [];
  for (var i = 0; i < objects.length; ++i) {
    var values = []
    for (j = 0; j < headers.length; ++j) {
      var header = headers[j];
      // If the header is non-empty and the object value is 0...
       if ((header.length > 0)&&(objects[i][header] === 0)&&(!(isNaN(parseInt(objects[i][header]))))) {
        values.push(0);
      }
      // If the header is empty or the object value is empty...
      else if ((!(header.length > 0)) || (objects[i][header]=='') || (!objects[i][header])) {
        values.push('');
      }
      else {
        values.push(objects[i][header]);
      }
    }
    data.push(values);
  }

  var destinationRange = sheet.getRange(firstDataRowIndex, headersRange.getColumnIndex(),
                                        objects.length, headers.length);
  destinationRange.setValues(data);
}


// setRowsDataNonNormalized fills in one row of data per object defined in the objects Array.
// Assumes headers are not normalized
// For every Column, it checks if data objects define a value for it.
// Arguments:
//   - sheet: the Sheet Object where the data will be written
//   - objects: an Array of Objects, each of which contains data for a row
//   - optHeadersRange: a Range of cells where the column headers are defined. This
//     defaults to the entire first row in sheet.
//   - optFirstDataRowIndex: index of the first row where data should be written. This
//     defaults to the row immediately below the headers.
function setRowsDataNonNormalized(sheet, objects, optHeadersRange, optFirstDataRowIndex) {
  var headersRange = optHeadersRange || sheet.getRange(1, 1, 1, sheet.getMaxColumns());
  var firstDataRowIndex = optFirstDataRowIndex || headersRange.getRowIndex() + 1;
  var headers = headersRange.getValues()[0];
  var data = [];
  for (var i = 0; i < objects.length; ++i) {
    var values = []
    for (j = 0; j < headers.length; ++j) {
      var header = headers[j].toString();
      // If the header is non-empty and the object value is 0...
       if ((header.length > 0)&&(objects[i][header] === 0)&&(!(isNaN(parseInt(objects[i][header]))))) {
        values.push(0);
      }
      // If the header is empty or the object value is empty...
      else if ((!(header.length > 0)) || (objects[i][header]=='') || (!objects[i][header])) {
        values.push('');
      }
      else {
        values.push(objects[i][header]);
      }
    }
    data.push(values);
  }

  var destinationRange = sheet.getRange(firstDataRowIndex, headersRange.getColumnIndex(),
                                        objects.length, headers.length);
  destinationRange.setValues(data);
}



// For every row of data in data, generates an object that contains the data. Names of
// object fields are defined in keys.
// Arguments:
//   - data: JavaScript 2d array
//   - keys: Array of Strings that define the property names for the objects to create
function getObjects_(data, keys) {
  var objects = [];
  var timeZone = Session.getScriptTimeZone();

  for (var i = 0; i < data.length; ++i) {
    var object = {};
    var hasData = false;
    for (var j = 0; j < data[i].length; ++j) {
      var cellData = data[i][j];
      if (isCellEmpty_(cellData)) {
        object[keys[j]] = '';
        continue;
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}



// Given a JavaScript 2d Array, this function returns the transposed table.
// Arguments:
//   - data: JavaScript 2d Array
// Returns a JavaScript 2d Array
// Example: arrayTranspose([[1,2,3],[4,5,6]]) returns [[1,4],[2,5],[3,6]].
function arrayTranspose(data) {
  if (data.length == 0 || data[0].length == 0) {
    return null;
  }

  var ret = [];
  for (var i = 0; i < data[0].length; ++i) {
    ret.push([]);
  }

  for (var i = 0; i < data.length; ++i) {
    for (var j = 0; j < data[i].length; ++j) {
      ret[j][i] = data[i][j];
    }
  }

  return ret;
}



/**
* Invokes a function, performing up to 5 retries with exponential backoff.
* Retries with delays of approximately 1, 2, 4, 8 then 16 seconds for a total of 
* about 32 seconds before it gives up and rethrows the last error. 
* See: https://developers.google.com/google-apps/documents-list/#implementing_exponential_backoff 
* <br>Author: peter.herrmann@gmail.com (Peter Herrmann)
<h3>Examples:</h3>
<pre>//Calls an anonymous function that concatenates a greeting with the current Apps user's email
var example1 = GASRetry.call(function(){return "Hello, " + Session.getActiveUser().getEmail();});
</pre><pre>//Calls an existing function
var example2 = GASRetry.call(myFunction);
</pre><pre>//Calls an anonymous function that calls an existing function with an argument
var example3 = GASRetry.call(function(){myFunction("something")});
</pre>
*
* @param {Function} func The anonymous or named function to call.
* @param {Function} optLoggerFunction Optionally, you can pass a function that will be used to log 
to in the case of a retry. For example, Logger.log (no parentheses) will work.
* @return {*} The value returned by the called function.
*/
function call(func, optLoggerFunction) {
  for (var n=0; n<4; n++) {
    try {
      return func();
    } catch(e) {
      if (optLoggerFunction) {optLoggerFunction("GASRetry " + n + ": " + e)}
      if (n == 3) {
        throw e;
      } 
      Utilities.sleep((Math.pow(2,n)*500) + (Math.round(Math.random() * 500)));
    }    
  }
}


function logError(err) {
  var error = catchToString_(err);
  logErrInfo_(error);
  return;
}


function catchToString_(err) {
  var errInfo = "Caught something:\n"; 
  for (var prop in err)  {  
    errInfo += "  property: "+ prop+ "\n    value: ["+ err[prop]+ "]\n"; 
  } 
  errInfo += "  toString(): " + " value: [" + err.toString() + "]"; 
  return errInfo;
}



function logErrInfo_(errInfo) {
  var ss = SpreadsheetApp.openById('1VM80DvE41-rBe9pa9ggap77hz5yiHh1J3tKr0EoKO30');
  var sheet = ss.getSheets()[0];
  var date = new Date();
  var thisObj = {};
  thisObj.timestamp = date;
  thisObj.errorMessage = errInfo;
  setRowsData(sheet, [thisObj], sheet.getRange(1, 1, 1, sheet.getLastColumn()), sheet.getLastRow()+1);
}


function getSheetById(ss, sheetId) {
  var sheets = ss.getSheets();
  for (var i=0; i<sheets.length; i++) {
    if (sheets[i].getSheetId().toString() === sheetId.toString()) {
      return sheets[i];
    }
  }
  return;
}