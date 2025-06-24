import { format } from "date-fns";

// Define a list of holidays (example, you might want a more robust solution)
export const italianHolidays = [
  new Date(2024, 0, 1), // Capodanno
  new Date(2024, 0, 6), // Epifania
  new Date(2024, 3, 1), // Pasquetta (example for 2024)
  new Date(2024, 3, 25), // Festa della Liberazione
  new Date(2024, 4, 1), // Festa dei Lavoratori
  new Date(2024, 5, 2), // Festa della Repubblica
  new Date(2024, 7, 15), // Ferragosto
  new Date(2024, 10, 1), // Ognissanti
  new Date(2024, 11, 8), // Immacolata Concezione
  new Date(2024, 11, 25), // Natale
  new Date(2024, 11, 26), // Santo Stefano
];

export const isDateHoliday = (date: Date) => {
  return italianHolidays.some(holiday => format(holiday, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
};