import { NextResponse } from 'next/server'
import { resend } from '@/lib/resend'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, quizTitle, recommendation, products } = body

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 })
        }

        let productsHtml = ''
        if (products && products.length > 0) {
            productsHtml = products.map((p: any) => `
                <div style="margin-bottom: 20px; padding: 20px; border: 1px solid #D1D6E0; border-radius: 12px; background-color: #ffffff;">
                    <h3 style="color: #2E3B69; margin-top: 0; font-size: 20px;">${p.name}</h3>
                    <p style="font-size: 18px; font-weight: bold; color: #5B6486;">${p.price}</p>
                    <p style="color: #4A4A4A; line-height: 1.5;"><strong>Expert Take:</strong> ${p.why}</p>
                    <a href="${p.link}" style="display: inline-block; margin-top: 10px; padding: 12px 24px; background-color: #2E3B69; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Product</a>
                </div>
            `).join('')
        }

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #4A4A4A; background-color: #F0F0F0; padding: 20px; border-radius: 16px;">
                <div style="text-align: center; padding: 20px 0;">
                    <h1 style="color: #2E3B69; margin-bottom: 10px;">Your SmartSass Tech Quiz Results</h1>
                    <p style="font-size: 16px;">Thank you for taking the <strong>${quizTitle}</strong> quiz!</p>
                </div>
                
                <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; margin: 20px 0; border-top: 4px solid #5B6486;">
                    <h2 style="color: #2E3B69; margin-top: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">Top Recommendation</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #2E3B69; margin-bottom: 0;">${recommendation}</p>
                </div>
                
                <h2 style="color: #2E3B69; padding-left: 10px;">Recommended Products</h2>
                ${productsHtml}
                
                <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #D1D6E0; color: #898CA3; font-size: 14px;">
                    <p>© ${new Date().getFullYear()} SmartSass Tech</p>
                </div>
            </div>
        `

        // We use a verified domain if possible. 
        // Note: info@smartsasstech.com is used here, ensure it's verified on your Resend account!
        const data = await resend.emails.send({
            from: 'SmartSass Tech <info@smartsasstech.com>',
            to: email,
            subject: 'Your Tech Recommendations from SmartSass Tech',
            html: html,
        })

        if (data.error) {
            throw new Error(data.error.message)
        }

        return NextResponse.json({ success: true, data })
    } catch (error: any) {
        console.error('Email error:', error)
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 })
    }
}
