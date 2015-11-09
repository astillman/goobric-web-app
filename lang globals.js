var LANG_EN = {
  emailCol: "Email",
  firstNameCol: "First Name",
  lastNameCol: "Last Name",
  classFolderCol: "Student Folder Key",
  siteUrlCol: "Site URL",
  groupCol: "Group",
  excludeCol: "Exclude",
  classNameCol: "Class Name",
  fileNameCol: "File Name",
  fileKeyCol: "File Key",
  linkCol: "Link",
  authorNamesCol: "Author name(s)",
  lastEditedCol: "Last Edited",
  turnedInStatusCol: "Turned In Status",
  gradeCol: "Grade",
  writtenFeedbackCol: "Written Feedback",
  timestampCol: "Timestamp",
  submittedByCol: "Submitted by"
}


var LANG_ES = {
  emailCol : "Correo electrónico",
  siteUrlCol: "Site URL",
  firstNameCol : "Nombre",
  lastNameCol : "Apellidos",
  classFolderCol : "Identificador de carpeta del alumno",
  groupCol : "Grupo",
  excludeCol : "Excluir",
  classNameCol : "Designación de la Clase",
  fileNameCol : "Nombre de archivo",
  fileKeyCol : "Identificador de archivo",
  linkCol : "Enlace",
  authorNamesCol: "Nombres de los autores",
  lastEditedCol : "Última edición",
  gradeCol : "Calificación",
  writtenFeedbackCol : "Comentarios del profesor",
  timestampCol : "Marca Temporal",
  submittedByCol : "Enviado por"
}


var LANG_PL = {
  emailCol : "Email",
  siteUrlCol: "Site URL",
  firstNameCol : "Imię",
  lastNameCol : "Nazwisko",
  classFolderCol : "Klucz folderu ucznia",
  groupCol : "Grupa",
  excludeCol : "Pomiń",
  classNameCol : "Nazwa klasy",
  fileNameCol : "Nazwa pliku",
  fileKeyCol : "Klucz pliku",
  linkCol : "Link",
  authorNamesCol: "Nazwy autorem",
  lastEditedCol : "Ostatnio edytowane",
  gradeCol : "Wynik",
  writtenFeedbackCol : "Recenzja",
  timestampCol : "Znacznik czasu",
  submittedByCol : "Zgłoszony przez"
}


var LANG_RU = {
  emailCol : "Email",
  siteUrlCol : "Site URL",
  firstNameCol : "Имя",
  lastNameCol : "Фамилия",
  classFolderCol : "Ключ Папки ученика",
  groupCol : "Группа",
  excludeCol : "Не включать",
  classNameCol : "Название курса",
  fileNameCol : "Имя файла",
  fileKeyCol : "Ключ файла",
  linkCol : "Ссылка",
  authorNamesCol: "имена авторов",
  lastEditedCol : "Последнее редактирование",
  gradeCol : "Класс",
  writtenFeedbackCol : "Отзыв",
  timestampCol : "Отметка времени",
  submittedByCol : "Отправлено"
}


var LANG = LANG_EN;
var locale = Session.getActiveUserLocale();
if (locale == 'es') LANG = LANG_ES;
if (locale == 'pl') LANG = LANG_PL;
if (locale == 'ru') LANG = LANG_RU;

