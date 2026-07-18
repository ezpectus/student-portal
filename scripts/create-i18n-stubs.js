const fs = require('fs');
const path = require('path');

const messagesDir = path.join(__dirname, '..', 'src', 'messages');
const enPath = path.join(messagesDir, 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const plTranslations = {
  'global.metadata.title': 'Portal Studenta',
  'global.metadata.description': 'Portal Studenta',
  'global.server-error.title': 'Coś poszło nie tak',
  'global.server-error.description': 'Wystąpił problem z Twoim żądaniem',
  'global.error.title': 'Wystąpił błąd',
  'global.error.description': 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie lub odśwież stronę.',
  'global.error.retry': 'Spróbuj ponownie',
  'global.navigation.back': 'Wstecz',
  'global.navigation.next': 'Dalej',
  'global.misc.download': 'Pobierz',
  'global.misc.view': 'Wyświetl',
};

const deTranslations = {
  'global.metadata.title': 'Studentenportal',
  'global.metadata.description': 'Studentenportal',
  'global.server-error.title': 'Etwas ist schiefgelaufen',
  'global.server-error.description': 'Bei Ihrer Anfrage ist ein Problem aufgetreten',
  'global.error.title': 'Ein Fehler ist aufgetreten',
  'global.error.description': 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder laden Sie die Seite neu.',
  'global.error.retry': 'Erneut versuchen',
  'global.navigation.back': 'Zurück',
  'global.navigation.next': 'Weiter',
  'global.misc.download': 'Herunterladen',
  'global.misc.view': 'Ansehen',
};

const setNested = (obj, path, value) => {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
};

const pl = JSON.parse(JSON.stringify(en));
for (const [key, value] of Object.entries(plTranslations)) {
  setNested(pl, key, value);
}

const de = JSON.parse(JSON.stringify(en));
for (const [key, value] of Object.entries(deTranslations)) {
  setNested(de, key, value);
}

fs.writeFileSync(path.join(messagesDir, 'pl.json'), JSON.stringify(pl, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(messagesDir, 'de.json'), JSON.stringify(de, null, 2) + '\n', 'utf8');

console.log('Created pl.json and de.json');
