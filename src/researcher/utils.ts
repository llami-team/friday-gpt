import readline from 'readline'

export function round(number: number, decimals: number) {
  return number.toFixed(decimals)
}

export function isInArray<Element>(element: Element, array: Array<Element>) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] == element) {
      return true
    }
  }

  return false
}

export async function input(text: string) {
  let the_prompt

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  await (async () => {
    return new Promise<void>((resolve) => {
      rl.question(text, (prompt) => {
        the_prompt = prompt
        rl.close()
        resolve()
      })
    })
  })()

  return the_prompt
}
