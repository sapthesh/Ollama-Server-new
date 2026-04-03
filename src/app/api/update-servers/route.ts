import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redisUrl = process.env.UPSTASH_REDIS_URL
const redisToken = process.env.UPSTASH_REDIS_TOKEN

const redis = redisUrl && redisToken 
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

if (!redis) {
  console.warn('Redis environment variables are missing. Redis-based server storage is disabled.')
}

export async function POST(request: Request) {
  try {
    const { server } = await request.json()
    const encodedServer = encodeURIComponent(server)
    
    if (!redis) {
      console.log(`Redis not configured. Skipping server storage for: ${server}`)
      return NextResponse.json({ success: true, exists: false, message: 'Redis not configured' })
    }

    // Check if server already exists
    const exists = await redis.sismember('ollama:servers', encodedServer)
    if (exists) {
      console.log(`Server already exists: ${server}`)
      return NextResponse.json({ success: true, exists: true })
    }

    // If it doesn't exist, add it
    await redis.sadd('ollama:servers', encodedServer)
    console.log(`New server added: ${server}`)
    return NextResponse.json({ success: true, exists: false })
  } catch (error) {
    console.error('Failed to update server list:', error)
    return NextResponse.json({ error: 'Failed to update servers' }, { status: 500 })
  }
}
