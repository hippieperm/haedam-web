import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({
        message: 'API is working',
        timestamp: new Date().toISOString()
    })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        return NextResponse.json({
            message: 'POST API is working',
            receivedData: body,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to parse JSON',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 })
    }
}
