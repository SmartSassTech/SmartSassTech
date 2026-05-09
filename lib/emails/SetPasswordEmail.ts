/**
 * Generates a branded HTML email inviting a client to set up their password.
 * Used when an agent creates a client account without providing a password.
 */
export function getSetPasswordEmailHtml(firstName: string, resetLink: string) {
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
        <title>Set Up Your SmartSass Tech Password</title>
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
            margin-bottom: 24px;
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
          }
          .info-box {
            background-color: #F7F8FA;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            border-left: 4px solid ${primaryColor};
          }
          .info-text {
            font-size: 14px;
            color: ${secondaryColor};
            margin: 0;
            line-height: 1.5;
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
            <img src="https://smartsasstech.com/assets/images/logo.svg" alt="SmartSass Tech" style="height: 60px; display: block; margin: 0 auto;" />
          </div>
          <div class="content">
            <h2 class="welcome-msg">Welcome to SmartSass Tech, ${firstName}!</h2>
            <p class="body-text">
              A SmartSass Tech agent has created an account for you. Before you can log in, you'll need to set up a password.
            </p>
            <p class="body-text">
              Click the button below to choose your password and get started:
            </p>
            <div class="button-container">
              <a href="${resetLink}" class="button">Set Up My Password</a>
            </div>
            <div class="info-box">
              <p class="info-text">
                <strong>What happens next?</strong><br>
                After setting your password, you'll be able to log in at 
                <a href="https://smartsasstech.com/login" style="color: ${primaryColor};">smartsasstech.com/login</a> 
                to manage your bookings, view support tickets, and more.
              </p>
            </div>
            <p class="footer-text" style="color: #666; margin-top: 40px; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="font-size: 11px; color: #999;">${resetLink}</span>
            </p>
          </div>
          <div class="footer">
            <div class="footer-links">
              <a href="https://smartsasstech.com/support" class="footer-link">Support Center</a>
              <a href="https://smartsasstech.com/articles" class="footer-link">Resources</a>
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
