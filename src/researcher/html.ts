import * as cheerio from 'cheerio'

export function convertHTMLAsDOM(_html: string) {
  const html = _html.replace(/<\//g, ' </')
  const $ = cheerio.load(html)

  $('script, style').remove()

  const important = [
    'main',
    '[role="main"]',
    '#bodyContent',
    '#search',
    '#searchform',
    '.kp-header'
  ]

  // move important content to top
  important.forEach((im) => {
    $(im).each((i, el) => {
      $(el).prependTo('body')
    })
  })

  return $
}

export function makeTag(element: cheerio.Element) {
  const $ = cheerio.load('<body></body>')

  let textContent = $(element).text().replace(/\s+/g, ' ').trim()
  let placeholder = $(element).attr('placeholder')
  let tagName = element.name
  let title = $(element).attr('title')
  let value = $(element).attr('value')
  let role = $(element).attr('role')
  let type = $(element).attr('type')
  let href = $(element).attr('href')
  let pgpt_id = $(element).attr('pgpt-id')

  if (href && href.length > 32) {
    href = href.substring(0, 32) + '[..]'
  }

  if (placeholder && placeholder.length > 32) {
    placeholder = placeholder.substring(0, 32) + '[..]'
  }

  if (title && title.length > 32) {
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
  if (pgpt_id) {
    tag += ` pgpt-id="${pgpt_id}"`
  }

  tag += `>`

  let obj: Record<string, any> = {
    tag: tag
  }

  if (textContent) {
    obj.text = textContent
    obj.tag += `${textContent}</${tagName}>`
  }

  return obj
}

export function summarizeImportantHTML(html: string) {
  const $ = convertHTMLAsDOM('<body>' + html + '</body>')

  function traverse(element: cheerio.Element) {
    let output = ''
    let children = element.children

    if ($(element).is('h1, h2, h3, h4, h5, h6')) {
      output += '<' + element.name + '>'
    }

    if ($(element).is('form')) {
      output += '\n<' + element.name + '>\n'
    }

    if ($(element).is('div, section, main')) {
      output += '\n'
    }

    let the_tag = makeTag(element)

    if ($(element).attr('pgpt-id')) {
      output += ' ' + (the_tag.tag ? the_tag.tag : '')
    } else if (
      (element.type as any) === 'text' &&
      !$(element.parent).attr('pgpt-id')
    ) {
      output += ' ' + (element as any).data.trim()
    }

    if (children) {
      children.forEach((child) => {
        output += traverse(child as cheerio.Element)
      })
    }

    if ($(element).is('h1, h2, h3, h4, h5, h6')) {
      output += '</' + element.name + '>'
    }

    if ($(element).is('form')) {
      output += '\n</' + element.name + '>\n'
    }

    if ($(element).is('h1, h2, h3, h4, h5, h6, div, section, main')) {
      output += '\n'
    }

    return output
      .replace(/[^\S\n]+/g, ' ')
      .replace(/ \n+/g, '\n')
      .replace(/[\n]+/g, '\n')
  }

  return traverse($('body')[0])
}
