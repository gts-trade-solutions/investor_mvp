import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">IM</span>
              </div>
              <span className="text-lg font-bold">InvestMatch</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Matching innovative startups with the right investors.
            </p>
          </div>

          {/* Address */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide">Address</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  Olympia Platina, Guindy, Chennai 600032, TN
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+911234567890" className="hover:underline">91 44 66108114 / +91 8072098352
                  +91 9003031527 (Whatsapp)</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@investmatch.com" className="hover:underline">
                  info@investmatch.com
                </a>
              </p>
            </address>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground hover:underline">
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} InvestMatch. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
