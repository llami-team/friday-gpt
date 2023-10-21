import type { Browser, Page } from 'puppeteer'

export interface TokenUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface StartResearchOptions {
  model?: string
  contextLengthLimit?: number
  navigationTimeout?: number
  debug?: boolean
  autopilot?: boolean
  waitUntil?: string
  headless?: boolean
  taskPrefix?: string
  openaiApiKey?: string
  logger?: (message: string) => void
}

export interface StartResearchContext {
  thePrompt: string
  tokenUsage: TokenUsage
  downloaStarted?: boolean
  pageLoaded?: boolean
  requestCount?: number
  requestBlock?: boolean
  responseCount?: number
  browser?: Browser
  thePage?: Page
}
