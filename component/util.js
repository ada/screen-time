export function isEmptyObject(obj) {
  return Object.entries(obj).length === 0 && obj.constructor === Object
}

export function parseHostname(url) {
  return (new URL(url)).hostname.toLowerCase();
}

export function isSameHour(date1, date2) {
  return date1.getHours() == date2.getHours();
}

export function isSameDay(date1, date2) {
  return date1.getFullYear() == date2.getFullYear() &&
    date1.getMonth() == date2.getMonth() &&
    date1.getDate() == date2.getDate();
}

export function generateRandomData(hostname) {
  for (let index = 0; index < 10; index++) {
    let a = new Date();
    a.setHours(Math.floor(Math.random() * 23) + 1);
    let d = Math.floor(Math.random() * 3000) + 1;
    console.log(hostname, a, d);
    add(hostname, a, d);
  }

  for (let index = 0; index < 30; index++) {
    let a = new Date();
    a.setDate(a.getDate() - index);
    let d = Math.floor(Math.random() * 3000) + 1;
    console.log(hostname, a, d);
    add(hostname, a, d);
  }
}