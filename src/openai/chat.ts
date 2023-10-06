import axios, { isAxiosError } from 'axios'
import axiosRetry from 'axios-retry'

import { logger } from '../utils/logger.js'
export const openai = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
  }
})

axiosRetry(openai, {
  retries: 3,
  retryCondition: (error) => {
    logger(`네트워크 요청 불량으로 재시도 중입니다. (에러코드 ${error.code}}`)
    return true
  }
})

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export const chat = async (option: {
  messages: ChatMessage[]
  nested?: number
}) => {
  const { messages, nested } = option

  if (nested) {
    logger(`현재 ${nested}번째 ChatGPT 로 이어지는 호출 중 입니다.`)
    if (nested > 10) {
      logger('debug', { messages })
      throw new Error('ChatGPT 호출이 너무 많습니다.')
    }
  }

  try {
    const { data } = await openai.post('/chat/completions', {
      model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-3.5-turbo',
      messages
    })

    const answer = `${data.choices?.[0].message?.content ?? ''}`
    const finishReason = data.choices?.[0].finish_reason as string

    if (finishReason === 'length') {
      const addedChat = await chat({
        messages: [...messages, { role: 'assistant', content: answer }],
        nested: nested ? nested + 1 : 1
      })
      return answer + addedChat
    }

    return answer
  } catch (error) {
    if (isAxiosError(error)) {
      logger(
        `\nOpen A.I 서버와 3회 연속 요청에 실패하였습니다. 프로그램을 종료합니다.
다음과 같은 원인이 있을 수 있으니 확인을 부탁드립니다.

1. Open A.I 인증키 유효성 문제 ( .env 파일 설정 확인 )
2. Open A.I 서버 접속 문제 ( 인터넷 연결 확인 )
3. Open A.I 서버 과부하 문제 ( ai.com 확인 )
`,
        error.response.data
      )
      process.exit(1)
    }
  }
}
