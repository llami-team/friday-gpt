import { cli } from 'cleye'
import { input, password, select } from '@inquirer/prompts'
import { logger } from './utils/logger.js'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

// * Set __dirname and __filename
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// * Parse CLI arguments
const argv = cli({
  name: 'friday',
  version: '0.0.1',
  flags: {
    prompt: {
      type: String,
      description: 'Prompt to run',
      alias: 'p'
    }
  }
})
let userRequest = argv._.join(' ')

// * Load config file
const configPath = path.join(__dirname, '../', '.fridayconfig.json')
let isConfigFileExist = existsSync(configPath)

if (isConfigFileExist) {
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'))
    if (config.OPENAI_API_KEY)
      process.env.OPENAI_API_KEY = config.OPENAI_API_KEY
    if (config.OPENAI_CHAT_MODEL)
      process.env.OPENAI_CHAT_MODEL = config.OPENAI_CHAT_MODEL
    if (config.AZURE_SPEECH_KEY)
      process.env.AZURE_SPEECH_KEY = config.AZURE_SPEECH_KEY
    if (config.AZURE_SPEECH_REGION)
      process.env.AZURE_SPEECH_REGION = config.AZURE_SPEECH_REGION
    if (config.AZURE_SPEECH_VOICE)
      process.env.AZURE_SPEECH_VOICE = config.AZURE_SPEECH_VOICE
  } catch (e) {}
}

// * If OPENAI_API_KEY is empty, ask for it
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length === 0) {
  logger(`Friday GPT 를 사용하기 위해선 Open A.I API 키를 입력해야합니다.`)
  logger(`키 발급 페이지: https://platform.openai.com/account/api-keys`)

  process.env.OPENAI_API_KEY = await password({
    message: 'Open A.I API 키를 입력해주세요:'
  })
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.length === 0) {
    logger('API 키가 입력되지 않았습니다. 프로그램을 종료합니다.')
    process.exit(0)
  }
}

// * If OPENAI_CHAT_MODEL is empty, ask for it
if (
  !process.env.OPENAI_CHAT_MODEL ||
  process.env.OPENAI_CHAT_MODEL.length === 0
) {
  process.env.OPENAI_CHAT_MODEL = await input({
    message: '사용하려는 ChatGPT 모델을 입력해주세요:',
    default: 'gpt-4'
  })
  if (
    !process.env.OPENAI_CHAT_MODEL ||
    process.env.OPENAI_CHAT_MODEL.length === 0
  ) {
    logger('모델이 입력되지 않았습니다. 프로그램을 종료합니다.')
    process.exit(0)
  }
}

// * Optional asking section
if (!isConfigFileExist) {
  // * If AZURE_SPEECH_KEY is empty, ask for it
  if (
    process.env.AZURE_SPEECH_KEY === undefined ||
    process.env.AZURE_SPEECH_KEY === ''
  ) {
    logger(`\nAzure Speech API 키를 입력하시면 인공지능이 음성으로 답변합니다.`)
    logger(
      `키 발급 페이지: https://portal.azure.com/?quickstart=true#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/SpeechServices\n`
    )
    const isNeedAzureSpeech = await select({
      message: 'Azure Speech API 키를 입력하고 TTS를 사용하시겠습니까?',
      choices: [
        {
          name: '네',
          value: true
        },
        {
          name: '아니오',
          value: false
        }
      ]
    })
    if (isNeedAzureSpeech) {
      process.env.AZURE_SPEECH_KEY = await password({
        message: 'Azure Speech API 키를 입력해주세요:'
      })
      process.env.AZURE_SPEECH_REGION = await input({
        message: 'Azure Speech API 지역을 입력해주세요:',
        default: 'koreacentral'
      })
      process.env.AZURE_SPEECH_VOICE = await input({
        message: 'Azure Speech API 음성을 입력해주세요:',
        default: 'ko-KR-SeoHyeonNeural'
      })
    }
  }
}

// * If userRequest is empty, use the provided default value
if (userRequest === '') {
  userRequest = await input({
    message: 'A.I가 수행할 개발 업무 요청을 입력해주세요:'
  })

  if (userRequest === '') {
    logger('요청이 없습니다. 프로그램을 종료합니다.')
    process.exit(0)
  }
}

// * Save config file
writeFileSync(
  configPath,
  JSON.stringify(
    {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL,
      AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY,
      AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION,
      AZURE_SPEECH_VOICE: process.env.AZURE_SPEECH_VOICE
    },
    null,
    2
  )
)

export { userRequest }

const draftCount = await input({
  message: '초기 기획서를 몇 개까지 만들고 고민할지 입력해주세요:',
  default: '3'
})

const maxMeetingCount = await input({
  message: '기획서 보완을 위한 회의를 최대 몇 번까지 진행 할지 입력해주세요:',
  default: '10'
})

export const countConfig = {
  architect: {
    // * 초기 기획서를 몇 개까지 만들고 고민할지 설정합니다.
    draftCount: parseInt(draftCount) || 3,
    // * 기획서 보완을 위한 회의를 최대 몇 번까지 진행 할지 설정합니다.
    maxMeetingCount: parseInt(maxMeetingCount) || 10
  }
}
