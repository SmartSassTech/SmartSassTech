import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Footer Top: Brand & Business Info */}
        <div className="footer-top-info">
          <div className="footer-logo-container">
            <img
              src="/assets/images/SST Logo Black & Taupe No Background.svg"
              alt="SmartSass Tech"
              className="footer-logo"
            />
          </div>
          <div className="footer-business-details">
            <h3 className="text-white mb-2">SMARTSASS TECH</h3>
            <p>Serving the Rochester, NY area</p>
            <p><strong>(585) 210-9758</strong></p>
            <p><a href="mailto:smartsasstech@gmail.com" className="footer-email">smartsasstech@gmail.com</a></p>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Footer Bottom: Link Columns */}
        <div className="footer-content">
          {/* Account Links */}
          <div className="footer-section">
            <h3 className="text-white mb-4">Account</h3>
            <ul className="footer-links">
              <li><Link href="/account">Account Settings</Link></li>
              <li><Link href="/my-bookings">My Bookings</Link></li>
              <li><Link href="/subscriptions">My Subscriptions</Link></li>
              <li><Link href="/rewards">My Rewards</Link></li>
              <li><Link href="/pricing">Plans &amp; Pricing</Link></li>
            </ul>
          </div>

          {/* Quizzes */}
          <div className="footer-section">
            <h3 className="text-white mb-4">Quizzes</h3>
            <ul className="footer-links">
              <li><Link href="/quizes/computer-quiz.html">Computer Quiz</Link></li>
              <li><Link href="/quizes/smartwatch-quiz.html">Wearable Quiz</Link></li>
              <li><Link href="/quizes/phone-quiz.html">Phone Quiz</Link></li>
              <li><Link href="/quizes/streaming-quiz.html">Streaming Quiz</Link></li>
              <li><Link href="/quizes/security-camera-quiz.html">Security Cam Quiz</Link></li>
              <li><Link href="/quizes/printer-quiz.html">Printer Quiz</Link></li>
              <li><Link href="/quizes/internet-provider-quiz.html">Internet Quiz</Link></li>
              <li><Link href="/quizes/keyboard-mouse-quiz.html">Keyboard Quiz</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="text-white mb-4">Quick Links</h3>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/articles">Resources</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/booking">Services</Link></li>
              <li><Link href="/booking">Booking Calendar</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SmartSass Tech. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
