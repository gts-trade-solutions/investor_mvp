
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — InvestMatch',
  description:
    'Terms and Conditions for the founder–investor matching application (global).',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 text-foreground">
      <div className="container-fluid px-4 px-sm-5 py-5 py-lg-6">
        {/* Header */}
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8 text-center mb-4 mb-lg-5">
            <h1
              className="
                font-bold tracking-tight text-4xl sm:text-5xl lg:text-4xl
                bg-[linear-gradient(to_right,theme(colors.emerald.600)_0%,theme(colors.emerald.600)_50%,white_50%,white_100%)]
                bg-clip-text text-transparent
              "
            >
               Terms and Conditions — Founder–Investor Matching Application (Global)
            </h1>
            {/* <p className="mt-2 text-muted-foreground small">
              Last updated: October 16, 2025
            </p> */}
          </div>
        </div>

        {/* Content Card */}
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            <div className="rounded-4 border border-border bg-background shadow-sm p-4 p-sm-5 p-lg-5">
              {/* 1. Acceptance of Terms */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">1. Acceptance of Terms</h2>
                <p className="mb-0">
                  By accessing or using <strong>Invest Match</strong>, you agree to these Terms and our Privacy Policy. If you
                  do not agree, you must discontinue use of the Service.
                </p>
              </section>

              <hr className="my-4 border-border" />

              {/* 2. Nature of the Service */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">2. Nature of the Service</h2>
                <p className="mb-0">
                  Invest Match is a digital platform designed to connect entrepreneurs, founders, and investors worldwide. We
                  do not guarantee successful funding, partnerships, or outcomes from connections made through the Service.
                </p>
              </section>

              <hr className="my-4 border-border" />

              {/* 3. User Eligibility */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">3. User Eligibility</h2>
                <p className="mb-0">
                  You must be at least 18 years old and legally capable of entering into binding agreements under the laws of
                  your country.
                </p>
              </section>

              <hr className="my-4 border-border" />

              {/* 4. Account Responsibilities */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">4. Account Responsibilities</h2>
                <p className="mb-2">You agree to:</p>
                <ul className="ps-4 mb-2">
                  <li>Provide accurate and updated information.</li>
                  <li>Maintain confidentiality of your account credentials.</li>
                  <li>Use the Service only for lawful business or professional purposes.</li>
                  <li>Not engage in spam, harassment, or fraudulent activities.</li>
                </ul>
                <p className="mb-0">We reserve the right to suspend or terminate accounts for violations.</p>
              </section>

              <hr className="my-4 border-border" />

              {/* 5. User Content */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">5. User Content</h2>
                <p>
                  You are solely responsible for content you share, including messages and profile information.
                </p>
                <p className="mb-0">
                  You grant Invest Match a non-exclusive, worldwide, royalty-free license to display and distribute such content
                  within the platform for the purpose of matchmaking and communication.
                </p>
              </section>

              <hr className="my-4 border-border" />

              {/* 6. Prohibited Conduct */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">6. Prohibited Conduct</h2>
                <p className="mb-2">You must not:</p>
                <ul className="ps-4 mb-0">
                  <li>Impersonate other individuals or entities.</li>
                  <li>Upload harmful code, bots, or automated scripts.</li>
                  <li>Solicit or advertise outside the permitted context.</li>
                  <li>Misuse personal information of other users.</li>
                </ul>
              </section>

              <hr className="my-4 border-border" />

              {/* 7. Intellectual Property */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">7. Intellectual Property</h2>
                <p className="mb-0">
                  All content, branding, and software on the platform are owned by Invest Match or its licensors. Users retain
                  ownership of their own submitted content.
                </p>
              </section>

              <hr className="my-4 border-border" />

              {/* 8. Disclaimers */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">8. Disclaimers</h2>
                <ul className="ps-4 mb-0">
                  <li>The Service is provided “as is” without warranties of any kind.</li>
                  <li>We make no guarantees about matchmaking results or investment outcomes.</li>
                  <li>You use the Service at your own risk.</li>
                </ul>
              </section>

              <hr className="my-4 border-border" />

              {/* 9. Limitation of Liability */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">9. Limitation of Liability</h2>
                <p className="mb-2">To the maximum extent permitted by law, Invest Match and its affiliates are not liable for:</p>
                <ul className="ps-4 mb-0">
                  <li>Any indirect, incidental, or consequential damages.</li>
                  <li>Loss of profits, reputation, or business opportunity.</li>
                  <li>Disputes or damages arising from user interactions.</li>
                </ul>
              </section>

              <hr className="my-4 border-border" />

              {/* 10. Termination */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">10. Termination</h2>
                <p className="mb-0">
                  We may suspend or terminate your access without notice if you violate these Terms, misuse the Service, or if
                  required by law.
                </p>
              </section>

              <hr className="my-4 border-border" />

              {/* 11. Governing Law and Jurisdiction */}
              <section className="mb-4">
                <h2 className="fs-5 fw-semibold mb-2">11. Governing Law and Jurisdiction</h2>
                <p className="mb-0">
                  These Terms shall be governed by and construed in accordance with the laws of India, without regard to
                  conflict of law rules. You agree that any disputes shall be resolved through binding arbitration or competent
                  courts in the governing jurisdiction.
                </p>
              </section>

              <hr className="my-4 border-border" />

              {/* 12. Modifications */}
              <section className="mb-2">
                <h2 className="fs-5 fw-semibold mb-2">12. Modifications</h2>
                <p className="mb-0">
                  We reserve the right to update these Terms at any time. Updates will be posted on our website or app, and
                  continued use constitutes acceptance.
                </p>
              </section>

              {/* Footer links */}
              <div className="mt-4 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 small">
                <p className="text-muted-foreground mb-0">
                  Questions about these Terms?{' '}
                  <a href="mailto:support@investmatch.com" className="text-decoration-underline">
                    support@investmatch.com
                  </a>
                </p>
                <div className="d-flex align-items-center gap-3">
                  <Link href="/" className="text-muted-foreground text-decoration-none hover:underline">
                    Home
                  </Link>
                  <Link href="/privacy-policy" className="text-muted-foreground text-decoration-none hover:underline">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
