/* 
  Check wheter an object is empty or undefined
*/
export function isEmptyObject(obj) {
  return Object.entries(obj).length === 0 && obj.constructor === Object
}

/* 
  Parse hostname from a give URL
*/
export function parseHostname(url) {
  if(url.indexOf(".") === -1)
    return ""; 
  return (new URL(url)).host.toLowerCase();
}

/* 
  Check wether two date objects are within the same hour
*/
export function isSameHour(date1, date2) {
  return date1.getHours() == date2.getHours();
}

/* 
  Check wheter two date objects are within the same day
*/
export function isSameDay(date1, date2) {
  return date1.getFullYear() == date2.getFullYear() &&
    date1.getMonth() == date2.getMonth() &&
    date1.getDate() == date2.getDate();
}