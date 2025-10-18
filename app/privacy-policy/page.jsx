// app/privacy-policy/page.jsx
import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy — InvestMatch',
    description:
        'Privacy Policy for the founder–investor matching application (global).',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 text-foreground">
            <div className="container-fluid px-4 px-sm-5 py-5 py-lg-6">
                {/* Header */}
                <div className="row justify-content-center">
                    <div className="col-12 col-lg-10 col-xl-8 text-center mb-4 mb-lg-5">
                        <h1 className="font-bold tracking-tight text-emerald-600 text-4xl sm:text-5xl lg:text-4xl">
                            Privacy Policy — Founder–Investor Matching Application (Global)
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
                            {/* 1. Introduction */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">1. Introduction</h2>
                                <p>
                                    Welcome to <strong>Invest match</strong>. We value your privacy and are committed to protecting your
                                    personal data in accordance with global data protection standards, including the General Data Protection
                                    Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable laws.
                                </p>
                                <p>
                                    This Privacy Policy describes how we collect, use, and protect your information when you use our platform,
                                    website, or mobile application (“Service”).
                                </p>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 2. Information We Collect */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">2. Information We Collect</h2>
                                <p>We may collect and process the following categories of data:</p>

                                <h3 className="fw-medium mt-3">a. Personal Data</h3>
                                <ul className="ps-4 mb-3">
                                    <li>Name, email, phone number, job title, and company name.</li>
                                    <li>Investor or founder profile details, business sector, funding interests, and region.</li>
                                </ul>

                                <h3 className="fw-medium">b. Automatically Collected Data</h3>
                                <ul className="ps-4 mb-3">
                                    <li>Device information, IP address, browser type, and usage statistics.</li>
                                    <li>Location (when permission is granted).</li>
                                </ul>

                                <h3 className="fw-medium">c. Communications</h3>
                                <ul className="ps-4 mb-0">
                                    <li>Messages exchanged with other users or with our support team.</li>
                                    <li>Feedback, ratings, or survey responses.</li>
                                </ul>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 3. Legal Basis */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">3. Legal Basis for Processing (GDPR)</h2>
                                <p>We process data under the following lawful bases:</p>
                                <ul className="ps-4 mb-0">
                                    <li><strong>Consent</strong> – when you register or opt into communications.</li>
                                    <li><strong>Contract</strong> – to provide matchmaking and platform functionality.</li>
                                    <li><strong>Legitimate Interests</strong> – to maintain, secure, and improve the Service.</li>
                                    <li><strong>Legal Obligation</strong> – to comply with applicable laws or regulatory requirements.</li>
                                </ul>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 4. How We Use */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">4. How We Use Your Information</h2>
                                <p>We use collected data to:</p>
                                <ul className="ps-4 mb-0">
                                    <li>Facilitate networking and matching between founders and investors.</li>
                                    <li>Maintain account functionality and personalize user experience.</li>
                                    <li>Send notifications, updates, or relevant investment opportunities.</li>
                                    <li>Detect and prevent fraud, abuse, or security incidents.</li>
                                    <li>Conduct analytics to improve platform performance and usability.</li>
                                </ul>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 5. Sharing & Transfers */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">5. Data Sharing and International Transfers</h2>
                                <p>We may share limited personal information with:</p>
                                <ul className="ps-4 mb-3">
                                    <li>Matched users, to enable professional connection.</li>
                                    <li>Service providers, such as hosting, analytics, and cloud partners.</li>
                                    <li>Authorities or regulators, when legally required.</li>
                                </ul>
                                <p className="mb-0">
                                    Data may be transferred globally, including to countries outside your own. We ensure appropriate
                                    safeguards (such as Standard Contractual Clauses) for international data transfers.
                                </p>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 6. Retention */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">6. Data Retention</h2>
                                <p className="mb-0">
                                    We retain personal data only as long as necessary for the purposes described or as required by law. You
                                    may request deletion of your account and data at any time.
                                </p>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 7. Your Rights */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">7. Your Rights</h2>
                                <p>Depending on your jurisdiction, you may have the following rights:</p>
                                <ul className="ps-4 mb-0">
                                    <li>Access, rectify, or delete your personal data.</li>
                                    <li>Withdraw consent for processing.</li>
                                    <li>Request data portability.</li>
                                    <li>Object to processing based on legitimate interests.</li>
                                    <li>Lodge a complaint with your local data protection authority.</li>
                                </ul>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 8. Security */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">8. Data Security</h2>
                                <p className="mb-0">
                                    We implement appropriate technical and organizational measures, including encryption, access controls, and
                                    anonymization, to protect your information.
                                </p>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 9. Children */}
                            <section className="mb-4">
                                <h2 className="fs-5 fw-semibold mb-2">9. Children’s Privacy</h2>
                                <p className="mb-0">
                                    Our Service is not intended for individuals under 18 years of age. We do not knowingly collect personal
                                    data from minors.
                                </p>
                            </section>

                            <hr className="my-4 border-border" />

                            {/* 10. Updates */}
                            <section className="mb-2">
                                <h2 className="fs-5 fw-semibold mb-2">10. Updates to This Policy</h2>
                                <p className="mb-0">
                                    We may update this Privacy Policy periodically. Changes will be effective upon posting to the app or
                                    website. Continued use of the Service indicates acceptance of the revised terms.
                                </p>
                            </section>

                            {/* Footer actions / links */}
                            <div className="mt-4 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 small">
                                <p className="text-muted-foreground mb-0">
                                    Need help or want to exercise your rights?{' '}
                                    <a href="mailto:support@investmatch.com" className="text-decoration-underline">
                                        support@investmatch.com
                                    </a>
                                </p>
                                <div className="d-flex align-items-center gap-3">
                                    <Link href="/" className="text-muted-foreground text-decoration-none hover:underline">
                                        Home
                                    </Link>
                                    <Link href="/terms" className="text-muted-foreground text-decoration-none hover:underline">
                                        Terms &amp; Conditions
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
