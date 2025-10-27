'use client';

import PageHeader from '@/components/PageHeader';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Privacy"
        subtitle="Manage privacy"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Legal", href: "/legal" }, { label: "Privacy" }]}
      />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: December 20, 2024</p>

        <div className="prose prose-blue max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            F Property Services ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our snow removal
            management system and QuickBooks integration.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Account information (name, email address, phone number)</li>
            <li>Business information (company name, address, tax ID)</li>
            <li>Customer data (names, contact information, service addresses)</li>
            <li>Financial data (invoices, payments, estimates)</li>
            <li>Service records and dispatch information</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.2 QuickBooks Integration Data</h3>
          <p className="text-gray-700 mb-4">
            When you connect your QuickBooks account, we collect and process:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>QuickBooks company information</li>
            <li>Customer records from QuickBooks</li>
            <li>Invoice and payment data</li>
            <li>Accounting information necessary for synchronization</li>
            <li>OAuth tokens for maintaining the connection</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2.3 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Log data (IP address, browser type, access times)</li>
            <li>Device information</li>
            <li>Usage data and analytics</li>
            <li>GPS location data (with your permission, for dispatch and routing)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">We use the collected information to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Provide and maintain our snow removal management services</li>
            <li>Synchronize data between our system and QuickBooks Online</li>
            <li>Process transactions and send notifications</li>
            <li>Improve our services and develop new features</li>
            <li>Communicate with you about your account and services</li>
            <li>Comply with legal obligations</li>
            <li>Prevent fraud and enhance security</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. QuickBooks Integration</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Data Synchronization</h3>
          <p className="text-gray-700 mb-4">
            Our QuickBooks integration automatically syncs the following data:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Customers: Names, contact information, and addresses</li>
            <li>Invoices: Invoice details, line items, amounts, and due dates</li>
            <li>Payments: Payment records and transaction details</li>
            <li>Estimates: Quote information and service details</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 Data Access and Storage</h3>
          <p className="text-gray-700 mb-4">
            We access your QuickBooks data through secure OAuth 2.0 authentication. Your QuickBooks access tokens
            are encrypted and stored securely in our database. We only access the data necessary for synchronization
            and never share your QuickBooks credentials with third parties.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.3 Revoking Access</h3>
          <p className="text-gray-700 mb-4">
            You can disconnect your QuickBooks integration at any time through the Settings page in our application.
            This will revoke our access to your QuickBooks data, though previously synchronized data will remain in
            our system unless you request deletion.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Information Sharing and Disclosure</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.1 Third-Party Services</h3>
          <p className="text-gray-700 mb-4">We share information with:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Intuit QuickBooks:</strong> For accounting integration and data synchronization</li>
            <li><strong>Cloud Hosting Providers:</strong> For secure data storage and processing</li>
            <li><strong>Communication Services:</strong> For email and SMS notifications</li>
            <li><strong>Analytics Providers:</strong> For service improvement (anonymized data only)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.2 Legal Requirements</h3>
          <p className="text-gray-700 mb-4">
            We may disclose your information if required by law, court order, or governmental authority, or to
            protect our rights, property, or safety.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5.3 Business Transfers</h3>
          <p className="text-gray-700 mb-4">
            In the event of a merger, acquisition, or sale of assets, your information may be transferred to the
            acquiring entity, subject to the same privacy protections.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement industry-standard security measures to protect your information:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Encryption in transit (HTTPS/TLS) and at rest</li>
            <li>Secure OAuth 2.0 authentication for QuickBooks</li>
            <li>Regular security audits and updates</li>
            <li>Access controls and authentication requirements</li>
            <li>Automated backups and disaster recovery procedures</li>
          </ul>
          <p className="text-gray-700 mb-4">
            However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute
            security.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
          <p className="text-gray-700 mb-4">
            We retain your information for as long as your account is active or as needed to provide services.
            Financial records are retained for seven years to comply with accounting and tax regulations. You may
            request deletion of your data at any time, subject to legal retention requirements.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Your Rights and Choices</h2>
          <p className="text-gray-700 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Access:</strong> Request a copy of your personal information</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your information (subject to legal requirements)</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
            <li><strong>Data Portability:</strong> Request your data in a machine-readable format</li>
            <li><strong>Disconnect:</strong> Revoke QuickBooks integration access at any time</li>
          </ul>
          <p className="text-gray-700 mb-4">
            To exercise these rights, contact us at privacy@cafinc.ca
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our services are not intended for individuals under 18 years of age. We do not knowingly collect
            personal information from children.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. International Data Transfers</h2>
          <p className="text-gray-700 mb-4">
            Your information may be transferred to and processed in countries other than your country of residence.
            We ensure appropriate safeguards are in place for such transfers.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Changes to This Privacy Policy</h2>
          <p className="text-gray-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by
            posting the new policy on this page and updating the "Last Updated" date. Continued use of our services
            after changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-gray-800 font-semibold mb-2">F Property Services</p>
            <p className="text-gray-700">Email: privacy@cafinc.ca</p>
            <p className="text-gray-700">Phone: +1 (587) 877-0293</p>
            <p className="text-gray-700">Address: Calgary, Alberta, Canada</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Compliance</h2>
          <p className="text-gray-700 mb-4">
            We comply with applicable privacy laws including:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Personal Information Protection and Electronic Documents Act (PIPEDA) - Canada</li>
            <li>Alberta's Personal Information Protection Act (PIPA)</li>
            <li>Intuit's Privacy and Security Requirements for app developers</li>
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2024 F Property Services. All rights reserved.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
