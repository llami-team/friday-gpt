import type { StartResearchContext, StartResearchOptions } from './type'
import puppeteer, { Page, PuppeteerLifeCycleEvent } from 'puppeteer'
import fs from 'fs'
import { summarizeImportantHTML } from './html'

export async function startBrowser({
  context,
  options
}: {
  context: StartResearchContext
  options: StartResearchOptions
}) {
  if (context.thePage) {
    return context.thePage
  }

  context.browser = await puppeteer.launch({
    headless: options.headless ? 'new' : false
  })

  const page = await context.browser.newPage()

  await page.setViewport({
    width: 1200,
    height: 1200,
    deviceScaleFactor: 1
  })

  page.on('request', (request) => {
    if (context.requestBlock) {
      if (request.isNavigationRequest()) {
        request.respond({
          status: 200,
          contentType: 'application/octet-stream',
          body: 'Dummy file to block navigation'
        })
      } else {
        request.continue()
      }
    }
    context.requestCount++
  })

  page.on('load', () => {
    if (options.debug) {
      options.logger('Page loaded')
    }
    context.pageLoaded = true
  })

  page.on('framenavigated', async (frame) => {
    if (frame === page.mainFrame()) {
      await frame.waitForNavigation({ waitUntil: 'networkidle0' })
      if (context.pageLoaded && options.debug) {
        options.logger('Loading page...')
      }
      context.pageLoaded = false
    }
  })

  page.on('response', async (response) => {
    context.responseCount++
    let headers = response.headers()
    if (
      headers['content-disposition']?.includes('attachment') ||
      Number(headers['content-length']) > 1024 * 1024 ||
      headers['content-type'] === 'application/octet-stream'
    ) {
      setTimeout(function () {
        if (context.responseCount == 1) {
          options.logger('DOWNLOAD: A file download has been detected')
          context.downloaStarted = true
        }
      }, 2000)
    }
  })

  context.thePage = page
  return context.thePage
}

export async function getNextTab(page: Page, element, id, selector = '*') {
  let obj = await page.evaluate(
    async (element, id, selector) => {
      if (!element.matches(selector)) {
        return false
      }

      const tagName = element.tagName

      if (tagName === 'BODY') {
        return false
      }

      let textContent = element.textContent.replace(/\s+/g, ' ').trim()

      if (textContent === '' && !element.matches('select, input, textarea')) {
        return false
      }

      element.classList.add('pgpt-element' + id)

      let role = element.role
      let placeholder = element.placeholder
      let title = element.title
      let type = element.type
      let href = element.href
      let value = element.value

      if (href && href.length > 32) {
        href = href.substring(0, 32) + '[..]'
      }

      if (placeholder && placeholder.length > 32) {
        placeholder = placeholder.substring(0, 32) + '[..]'
      }

      if (!textContent && title && title.length > 32) {
        title = title.substring(0, 32) + '[..]'
      }

      if (textContent && textContent.length > 200) {
        textContent = textContent.substring(0, 200) + '[..]'
      }

      let tag = `<${tagName}`

      if (href) {
        tag += ` href="${href}"`
      }
      if (type) {
        tag += ` type="${type}"`
      }
      if (placeholder) {
        tag += ` placeholder="${placeholder}"`
      }
      if (title) {
        tag += ` title="${title}"`
      }
      if (role) {
        tag += ` role="${role}"`
      }
      if (value) {
        tag += ` value="${value}"`
      }

      tag += `>`

      let obj: Record<string, any> = {
        tag: tag,
        id: id
      }

      if (textContent) {
        obj.text = textContent
      }

      return obj
    },
    element,
    id,
    selector
  )

  if (!obj) {
    return false
  }

  const visible = await page.evaluate(async (id) => {
    const element = document.querySelector('.pgpt-element' + id) as HTMLElement

    if (!element) {
      return false
    }

    const visibility = element.style.visibility
    const display = element.style.display
    const clip = element.style.clip
    const rect = element.getBoundingClientRect()

    return (
      visibility !== 'hidden' &&
      display !== 'none' &&
      rect.width != 0 &&
      rect.height != 0 &&
      clip !== 'rect(1px, 1px, 1px, 1px)' &&
      clip !== 'rect(0px, 0px, 0px, 0px)'
    )
  }, id)

  if (!visible) {
    return false
  } else {
    await page.evaluate(async (id) => {
      const element = document.querySelector(
        '.pgpt-element' + id
      ) as HTMLElement
      element.setAttribute('pgpt-id', id)
      element.style.border = '1px solid red'
    }, id)
  }

  return obj
}

export async function getTabbableElements({
  page,
  selector = '*',
  options
}: {
  page: Page
  selector?: string
  options: StartResearchOptions
}) {
  let tabbable_elements = []
  let skipped = []
  let id = 0

  let elements = await page.$$(
    'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), select:not([disabled]), a[href]:not([href="javascript:void(0)"]):not([href="#"])'
  )

  let limit = 400

  for (const element of elements) {
    if (--limit < 0) {
      break
    }

    const next_tab = await getNextTab(page, element, ++id, selector)

    if (next_tab !== false) {
      tabbable_elements.push(next_tab)
    }
  }

  if (options.debug) {
    fs.writeFileSync('skipped.json', JSON.stringify(skipped, null, 2))
  }

  if (options.debug) {
    fs.writeFileSync(
      'tabbable.json',
      JSON.stringify(tabbable_elements, null, 2)
    )
  }

  return tabbable_elements
}

/**
 * get_page_content -> getPageContent
 */
export async function getPageContent(page: Page) {
  const title = await page.evaluate(() => {
    return document.title
  })

  const html = await page.evaluate(() => {
    return document.body.innerHTML
  })

  return (
    '## START OF PAGE CONTENT ##\nTitle: ' +
    title +
    '\n\n' +
    summarizeImportantHTML(html) +
    '\n## END OF PAGE CONTENT ##'
  )
}

/**
 * check_download_error -> checkDownloadError
 */
export function checkDownloadError({
  error,
  options
}: {
  error: Error
  options: StartResearchOptions
}) {
  if (error instanceof Error && error.message.startsWith('net::ERR_ABORTED')) {
    return 'NOTICE: The connection was aborted. If you clicked on a download link, the file has been downloaded to the default Chrome downloads location.'
  } else if (options.debug) {
    options.logger(String(error))
  }

  return null
}

/**
 * wait_for_navigation -> waitForNavigation
 */
export async function waitForNavigation({
  page,
  options
}: {
  page: Page
  options: StartResearchOptions
}) {
  try {
    await page.waitForNavigation({
      timeout: options.navigationTimeout,
      waitUntil: options.waitUntil as PuppeteerLifeCycleEvent
    })
  } catch (error) {
    options.logger('NOTICE: Giving up on waiting for navigation')
  }
}
