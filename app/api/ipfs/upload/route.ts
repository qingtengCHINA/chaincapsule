import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    if (content.length > 10000) {
      return NextResponse.json({ error: '内容不能超过 10000 字符' }, { status: 400 })
    }

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretKey = process.env.PINATA_SECRET_KEY

    // Try Pinata if keys are configured and look valid
    if (pinataApiKey && pinataSecretKey && pinataApiKey.length > 10 && pinataSecretKey.length > 10) {
      try {
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretKey,
          },
          body: JSON.stringify({
            pinataContent: { content, timestamp: Date.now() },
            pinataMetadata: { name: `capsule-${Date.now()}` },
          }),
        })

        if (response.ok) {
          const data = await response.json()
          return NextResponse.json({ cid: data.IpfsHash })
        }
        // If Pinata fails, fall through to local fallback
        console.warn('Pinata API error:', response.status, await response.text())
      } catch (e) {
        console.warn('Pinata fetch failed:', e)
      }
    }

    // Fallback: local hash (for development / when Pinata is not configured)
    const encoder = new TextEncoder()
    const data = encoder.encode(content + Date.now())
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    const cid = `demo_${hashHex.slice(0, 40)}`

    return NextResponse.json({
      cid,
      warning: 'Pinata 未配置或密钥无效，使用本地哈希（仅用于开发测试）',
    })
  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败，请稍后重试' },
      { status: 500 }
    )
  }
}
