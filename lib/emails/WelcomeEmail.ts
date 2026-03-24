/**
 * Generates a branded HTML welcome email for SmartSass Tech.
 */
export function getWelcomeEmailHtml(firstName: string, verificationLink: string) {
  const primaryColor = '#2E3B69';
  const secondaryColor = '#5B6486';
  const bgColor = '#F0F0F0';
  const white = '#FFFFFF';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SmartSass Tech</title>
        <style>
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: ${bgColor};
            margin: 0;
            padding: 0;
            color: #333333;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: ${white};
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          }
          .header {
            background-color: ${primaryColor};
            padding: 40px;
            text-align: center;
          }
          .logo-text {
            color: ${white};
            font-size: 28px;
            font-weight: bold;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px;
          }
          .welcome-msg {
            font-size: 24px;
            font-weight: bold;
            color: ${primaryColor};
            margin-bottom: 24px;
          }
          .body-text {
            font-size: 16px;
            line-height: 1.6;
            color: ${secondaryColor};
            margin-bottom: 32px;
          }
          .button-container {
            text-align: center;
            margin-bottom: 32px;
          }
          .button {
            display: inline-block;
            padding: 16px 32px;
            background-color: ${primaryColor};
            color: ${white} !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.2s;
          }
          .footer {
            padding: 32px;
            background-color: #F9F9F9;
            text-align: center;
            border-top: 1px solid #EEEEEE;
          }
          .footer-links {
            margin-bottom: 16px;
          }
          .footer-link {
            color: ${primaryColor};
            text-decoration: none;
            font-size: 14px;
            margin: 0 10px;
            font-weight: 500;
          }
          .footer-text {
            font-size: 12px;
            color: #999999;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://smartsasstech.com/assets/images/logo_blue_bg.png" alt="SmartSass Tech" style="height: 60px; display: block; margin: 0 auto;" />
          </div>
          <div class="content">
            <h2 class="welcome-msg">Hello ${firstName},</h2>
            <p class="body-text">
              Thank you for joining SmartSass Tech. We're here to provide patient, jargon-free technology support to help you feel confident with all your devices.
            </p>
            <p class="body-text">
              To complete your registration and access your account, please click the button below to verify your email address:
            </p>
            <div class="button-container">
              <a href="${verificationLink}" class="button">Verify Account</a>
            </div>
            <p class="footer-text" style="color: #666; margin-top: 40px; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="font-size: 11px; color: #999;">${verificationLink}</span>
            </p>
          </div>
          <div class="footer">
            <div class="footer-links">
              <a href="https://smartsasstech.com/support" class="footer-link">Support Center</a>
              <a href="https://smartsasstech.com/articles" class="footer-link">Resources</a>
              <a href="https://smartsasstech.com/contact" class="footer-link">Contact Us</a>
            </div>
            <p class="footer-text">
              &copy; ${new Date().getFullYear()} SmartSass Tech. All rights reserved.<br>
              Patient tech help for older adults & beginners.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
