export const findWhatIdo = (text: string) => {
  var regex = /---WHAT I DO\n(.*?)\n/gs
  var result = regex.exec(text)
  if (result) return result[1]
  return null
}

export const findIsGoodToGo = (text: string) => {
  return text.includes('----IS GOOD TO GO\nYES')
}
