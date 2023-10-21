import type { Page, PuppeteerLifeCycleEvent } from 'puppeteer'
import { TimeoutError } from 'puppeteer'
import type { StartResearchContext, StartResearchOptions } from './type'
import { input } from './utils'
import fs from 'fs'
import {
  checkDownloadError,
  getPageContent,
  getTabbableElements,
  waitForNavigation
} from './browser'
import { printCurrentCost } from './token'
import { sendChatMessage } from './chat'

export async function doNextStep({
  page,
  context,
  aiContext,
  next_step,
  links_and_inputs,
  element,
  options
}: {
  page: Page
  aiContext
  next_step
  links_and_inputs
  element
  options: StartResearchOptions
  context: StartResearchContext
}) {
  let message
  let msg
  let no_content = false

  if (next_step.hasOwnProperty('function_call')) {
    let function_call = next_step.function_call
    let function_name = function_call.name
    let func_arguments

    try {
      func_arguments = JSON.parse(function_call.arguments)
    } catch (e) {
      if (function_name === 'answer_user') {
        func_arguments = {
          answer: function_call.arguments
        }
      }
    }

    if (function_name === 'make_plan') {
      message = 'OK. Please continue according to the plan'
    } else if (function_name === 'read_file') {
      let filename = func_arguments.filename

      if (
        options.autopilot ||
        (await input(
          '\nGPT: I want to read the file ' +
            filename +
            '\nDo you allow this? (y/n): '
        )) == 'y'
      ) {
        console.log()
        console.log(options.taskPrefix + 'Reading file ' + filename)

        if (fs.existsSync(filename)) {
          let file_data = fs.readFileSync(filename, 'utf-8')
          file_data = file_data.substring(0, options.contextLengthLimit)
          message = file_data
        } else {
          message = 'ERROR: That file does not exist'
        }
      } else {
        console.log()
        message = 'ERROR: You are not allowed to read this file'
      }
    } else if (function_name === 'goto_url') {
      let url = func_arguments.url

      console.log(options.taskPrefix + 'Going to ' + url)

      try {
        await page.goto(url, {
          waitUntil: options.waitUntil as PuppeteerLifeCycleEvent
        })

        url = await page.url()

        message = `You are now on ${url}`
      } catch (error) {
        message = checkDownloadError({ error, options })
        message = message ?? 'There was an error going to the URL'
      }

      console.log(options.taskPrefix + 'Scraping page...')
      links_and_inputs = await getTabbableElements({
        page,
        options
      })
    } else if (function_name === 'click_link') {
      let link_id = func_arguments.pgpt_id
      let link_text = func_arguments.text

      if (!link_id) {
        message = 'ERROR: Missing parameter pgpt_id'
      } else if (!link_text) {
        message = ''
        aiContext.pop()
        msg = {
          role: 'user',
          content:
            'Please the correct link on the page. Remember to set both the text and the pgpt_id parameter.'
        }
      } else {
        const link = links_and_inputs.find((elem) => elem && elem.id == link_id)

        try {
          console.log(options.taskPrefix + `Clicking link "${link.text}"`)

          context.requestCount = 0
          context.responseCount = 0
          context.downloaStarted = false

          if (!page.$('.pgpt-element' + link_id)) {
            throw new Error('Element not found')
          }

          page.click('.pgpt-element' + link_id)

          await waitForNavigation({ page, options })

          let url = await page.url()

          if (context.downloaStarted) {
            context.downloaStarted = false
            message = 'Link clicked and file download started successfully!'
            no_content = true
          } else {
            message = 'Link clicked! You are now on ' + url
          }
        } catch (error) {
          if (options.debug) {
            console.log(error)
          }
          if (error instanceof TimeoutError) {
            message = 'NOTICE: The click did not cause a navigation.'
          } else {
            let link_text = link ? link.text : ''

            message = `Sorry, but link number ${link_id} (${link_text}) is not clickable, please select another link or another command. You can also try to go to the link URL directly with "goto_url".`
          }
        }
      }

      console.log(options.taskPrefix + 'Scraping page...')
      links_and_inputs = await getTabbableElements({
        page,
        options
      })
    } else if (function_name === 'type_text') {
      let form_data = func_arguments.form_data
      let prev_input

      for (let data of form_data) {
        let element_id = data.pgpt_id
        let text = data.text

        message = ''

        try {
          element = await page.$('.pgpt-element' + element_id)

          if (!prev_input) {
            prev_input = element
          }

          const name = await element.evaluate((el) => {
            return el.getAttribute('name')
          })

          const type = await element.evaluate((el) => {
            return el.getAttribute('type')
          })

          const tagName = await element.evaluate((el) => {
            return el.tagName
          })

          // ChatGPT sometimes tries to type empty string
          // to buttons to click them
          if (tagName === 'BUTTON' || type === 'submit' || type === 'button') {
            func_arguments.submit = true
          } else {
            prev_input = element
            await element.type(text)
            let sanitized = text.replace('\n', ' ')
            console.log(options.taskPrefix + `Typing "${sanitized}" to ${name}`)
            message += `Typed "${text}" to input field "${name}"\n`
          }
        } catch (error) {
          if (options.debug) {
            console.log(error)
          }
          message += `Error typing "${text}" to input field ID ${data.element_id}\n`
        }
      }

      if (func_arguments.submit !== false) {
        console.log(options.taskPrefix + `Submitting form`)

        try {
          const form = await prev_input.evaluateHandle((input) =>
            input.closest('form')
          )

          await form.evaluate((form) => form.submit())
          await waitForNavigation({ page, options })

          let url = await page.url()

          message += `Form sent! You are now on ${url}\n`
        } catch (error) {
          if (options.debug) {
            console.log(error)
          }
          console.log(options.taskPrefix + `Error submitting form`)
          message += 'There was an error submitting the form.\n'
        }

        console.log(options.taskPrefix + 'Scraping page...')
        links_and_inputs = await getTabbableElements({ page, options })
      }
    } else if (function_name === 'answer_user') {
      let text = func_arguments.answer

      if (!text) {
        text = func_arguments.summary
      }

      printCurrentCost({
        token_usage: context.tokenUsage,
        model: options.model,
        logger: options.logger
      })

      if (options.autopilot) {
        message = await input('<!_RESPONSE_!>' + JSON.stringify(text) + '\n')
      } else {
        message = await input('\nGPT: ' + text + '\nYou: ')
      }

      console.log()
    } else {
      message = 'That is an unknown function. Please call another one'
    }

    message = message.substring(0, options.contextLengthLimit)
    msg = msg ?? {
      role: 'function',
      name: function_name,
      content: JSON.stringify({
        status: 'OK',
        message: message
      })
    }
  } else {
    printCurrentCost({
      token_usage: context.tokenUsage,
      model: options.model,
      logger: options.logger
    })

    let next_content = next_step.content.trim()

    if (next_content === '') {
      next_content = '<empty response>'
    }

    if (options.autopilot) {
      message = await input(
        '<!_RESPONSE_!>' + JSON.stringify(next_content) + '\n'
      )
    } else {
      message = await input('GPT: ' + next_content + '\nYou: ')
      console.log()
    }

    msg = {
      role: 'user',
      content: message
    }
  }

  if (no_content !== true) {
    const page_content = await getPageContent(page)
    msg.content +=
      '\n\n' + page_content.substring(0, options.contextLengthLimit)
  }

  msg.url = await page.url()
  next_step = await sendChatMessage({
    message: msg,
    aiContext,
    options,
    context
  })
  ;(msg.content = message), aiContext.push(msg)
  aiContext.push(next_step)

  if (options.debug) {
    fs.writeFileSync('context.json', JSON.stringify(aiContext, null, 2))
  }

  await doNextStep({
    page,
    aiContext,
    next_step,
    links_and_inputs,
    element,
    options,
    context
  })
}
