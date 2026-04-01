import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Footer Top: Brand & Business Info */}
        <div className="footer-top-info flex flex-col items-center justify-center text-center">
          <div className="footer-logo-container mb-2 w-full flex justify-center">
            <img
              src="/assets/images/darkLogo-horiz.svg"
              alt="SmartSass Tech"
              className="footer-logo"
            />
          </div>
          <div className="footer-business-details w-full flex flex-col justify-center items-center gap-2">
            <p className="text-center text-white mb-0 text-xl font-medium">
              Serving the Rochester, NY area
            </p>
            <p className="text-center mb-0">
              <strong>(585) 210-9758</strong> &bull; 
              <a href="mailto:smartsasstech@gmail.com" className="footer-email ml-2">smartsasstech@gmail.com</a>
            </p>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* Footer Bottom: Link Columns */}
        <nav aria-label="Footer navigation">
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
              <li><Link href="/quizzes/computer">Computer Quiz</Link></li>
              <li><Link href="/quizzes/smartwatch">Wearable Quiz</Link></li>
              <li><Link href="/quizzes/phone">Phone Quiz</Link></li>
              <li><Link href="/quizzes/streaming">Streaming Quiz</Link></li>
              <li><Link href="/quizzes/security-camera">Security Cam Quiz</Link></li>
              <li><Link href="/quizzes/printer">Printer Quiz</Link></li>
              <li><Link href="/quizzes/internet-provider">Internet Quiz</Link></li>
              <li><Link href="/quizzes/keyboard-mouse">Keyboard Quiz</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="text-white mb-4">Quick Links</h3>
            <ul className="footer-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/articles">Resources</Link></li>
              <li><Link href="/support">Help Center</Link></li>
              <li><Link href="/booking">Booking Calendar</Link></li>
            </ul>
          </div>
        </div>
        </nav>

        <div className="footer-bottom">
          <p className="text-white">&copy; {new Date().getFullYear()} SmartSass Tech. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
