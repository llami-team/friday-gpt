import { doArchitect } from './architect/index.js'
import { userRequest } from './input.js'
import { logger } from './utils/logger.js'

const architect = async () => {
  logger('Friday 인공지능 작동을 시작합니다...\n')
  logger(`요청사항: ${userRequest}`)

  await doArchitect()
}

architect()
