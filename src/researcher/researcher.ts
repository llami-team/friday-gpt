'use strict'

import fs from 'fs'
import { StartResearchContext, StartResearchOptions } from './type'
import { input } from './utils'
import { sendChatMessage } from './chat'
import { startBrowser } from './browser'
import { doNextStep } from './step'
import { researchPrompt } from './prompt'

export const startResearch = async (_options: StartResearchOptions) => {
  // * 옵션 설정
  const options: StartResearchOptions = {
    model: 'gpt-3.5-turbo-16k',
    contextLengthLimit: 15000,
    navigationTimeout: 10000,
    debug: false,
    autopilot: false,
    waitUntil: 'load',
    headless: true,
    taskPrefix: '',
    openaiApiKey: process.env.OPENAI_API_KEY,
    logger: console.log,
    ..._options
  }
  // * 작업 간 공유되는 컨텍스트
  const context: StartResearchContext = {
    thePrompt: '',
    tokenUsage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    },
    downloaStarted: false,
    pageLoaded: false,
    requestCount: 0,
    requestBlock: false,
    responseCount: 0,
    browser: null,
    thePage: null
  }

  if (options.autopilot) options.taskPrefix = '<!_TASK_!>'

  options.logger('Using model: ' + options.model + '\n')

  if (options.autopilot) {
    context.thePrompt = await input('<!_PROMPT_!>\n')
  } else {
    context.thePrompt = await input(
      'GPT: Hello! What would you like to browse today?\nYou: '
    )
    options.logger('')
  }

  ;(async () => {
    const aiContext = [
      {
        role: 'system',
        content: researchPrompt
      }
    ]

    const message = {
      role: 'user',
      content: `Task: ${context.thePrompt}.`
    }

    let accept_plan = 'n'
    let response

    while (accept_plan !== 'y') {
      response = await sendChatMessage({
        message,
        aiContext,
        functionCall: {
          name: 'make_plan',
          arguments: ['plan']
        },
        context,
        options
      })

      const args = JSON.parse(response.function_call.arguments)

      options.logger('\n## PLAN ##')
      options.logger(args.plan)
      options.logger('## PLAN ##\n')

      if (options.autopilot) {
        accept_plan = 'y'
      } else {
        accept_plan = await input(
          'Do you want to continue with this plan? (y/n): '
        )
      }
    }

    aiContext.push(message)
    aiContext.push(response)

    if (options.debug) {
      fs.writeFileSync('context.json', JSON.stringify(aiContext, null, 2))
    }

    const page = await startBrowser({
      context,
      options
    })
    await doNextStep({
      page,
      aiContext,
      next_step: response,
      links_and_inputs: [],
      element: null,
      options,
      context
    })

    context.browser.close()
  })()
}
