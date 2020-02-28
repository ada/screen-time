export function isEmptyObject(obj) {
  return Object.entries(obj).length === 0 && obj.constructor === Object
}

export function parseHostname(url) {
  if(url.indexOf(".") === -1)
    return ""; 
  return (new URL(url)).host.toLowerCase();
}

export function isSameHour(date1, date2) {
  return date1.getHours() == date2.getHours();
}

export function isSameDay(date1, date2) {
  return date1.getFullYear() == date2.getFullYear() &&
    date1.getMonth() == date2.getMonth() &&
    date1.getDate() == date2.getDate();
}