// for format: 28 Oct 2023
export function getDateTimeInFormat(dateTimeISO) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const dateTime = new Date(dateTimeISO);
    return dateTime.toLocaleDateString(undefined, options);
  }