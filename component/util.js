function isSameHour(created, date) {
    return created.getHours() == date.getHours();
}

function isSameDay(created, date) {
    return created.getFullYear() == date.getFullYear() &&
        created.getMonth() == date.getMonth() &&
        created.getDate() == date.getDate();
}

export {isSameDay, isSameHour}