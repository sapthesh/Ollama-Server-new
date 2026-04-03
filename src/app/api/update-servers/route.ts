import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const { server } = await request.json()
    const encodedServer = encodeURIComponent(server)
    
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
