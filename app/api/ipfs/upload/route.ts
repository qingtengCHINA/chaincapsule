import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretKey = process.env.PINATA_SECRET_KEY

    if (!pinataApiKey || !pinataSecretKey) {
      return NextResponse.json({ error: 'IPFS服务未配置' }, { status: 500 })
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: { content, timestamp: Date.now() },
        pinataMetadata: { name: `capsule-${Date.now()}` },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `Pinata error: ${error}` }, { status: 502 })
    }

    const data = await response.json()
    return NextResponse.json({ cid: data.IpfsHash })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
}
