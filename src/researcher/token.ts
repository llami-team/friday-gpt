import type { TokenUsage } from './type'
import { round } from './utils'

export function getTokenPrice(model: string, direction: string) {
  let token_price_input = 0.0
  let token_price_output = 0.0

  if (model.indexOf('gpt-4-32k') === 0) {
    token_price_input = 0.06 / 1000
    token_price_output = 0.12 / 1000
  } else if (model.indexOf('gpt-4') === 0) {
    token_price_input = 0.03 / 1000
    token_price_output = 0.06 / 1000
  } else if (model.indexOf('gpt-3.5-turbo-16k') === 0) {
    token_price_input = 0.003 / 1000
    token_price_output = 0.004 / 1000
  } else if (model.indexOf('gpt-3.5-turbo') === 0) {
    token_price_input = 0.0015 / 1000
    token_price_output = 0.002 / 1000
  }

  if (direction == 'input') {
    return token_price_input
  } else {
    return token_price_output
  }
}

export function getTotalTokenCost(
  prompt_tokens: number,
  completion_tokens: number,
  model: string
) {
  const prompt_price = getTokenPrice(model, 'input')
  const completion_price = getTokenPrice(model, 'output')

  return prompt_tokens * prompt_price + completion_tokens * completion_price
}

export function printCurrentCost({
  token_usage,
  model,
  logger = console.log
}: {
  token_usage: TokenUsage
  model: string
  logger: (message: string) => unknown
}) {
  let cost = getTotalTokenCost(
    token_usage.prompt_tokens,
    token_usage.completion_tokens,
    model
  )

  logger(
    'Current cost: ' +
      round(cost, 2) +
      ' USD (' +
      token_usage.total_tokens +
      ' tokens)'
  )
}
