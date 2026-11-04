import { NextRequest, NextResponse } from 'next/server'
import { sendAdminOtp } from '@/lib/admin-otp'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Please provide your email address.' },
        { status: 400 }
      )
    }

    const result = await sendAdminOtp(email)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in send OTP route:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to send login code' },
      { status: 500 }
    )
  }
}
