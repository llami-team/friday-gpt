import { userRequest } from './input.js'
import { logger } from './utils/logger.js'
import fs from 'node:fs'

;(async () => {
  if (!fs.existsSync('./result')) fs.mkdirSync('./result')

  logger('Friday 인공지능 작동을 시작합니다...\n')
  logger(`요청사항: ${userRequest}`)

  const { doArchitect } = await import('./architect/index.js')
  const { doTechEvangelist } = await import('./evangelist/index.js')
  const { doProgramming, doProgrammingReview } = await import(
    './programmer/index.js'
  )

  await doArchitect()
  await doTechEvangelist()
  await doProgramming()
  await doProgrammingReview()
})()
