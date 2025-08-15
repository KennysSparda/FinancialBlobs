export function getRotatedMonthIndex(columnIndex, startMonth = new Date().getMonth()) {
  console.log(startMonth)
  return (startMonth + columnIndex) % 12
}
