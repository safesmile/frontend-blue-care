import es from "../messages/es.json";
import en from "../messages/en.json";
import de from "../messages/de.json";
import ar from "../messages/ar.json";
// The current application is Spanish; retain the other supported dictionaries.
const dictionaries = { es, en, de, ar };
export function sessionMessages() {
  const language = document.documentElement.lang.split("-")[0];
  return (
    dictionaries[language as keyof typeof dictionaries]?.session ?? es.session
  );
}

export function peopleMessages() {
  const language = document.documentElement.lang.split("-")[0];
  return (
    dictionaries[language as keyof typeof dictionaries]?.people ?? es.people
  );
}
