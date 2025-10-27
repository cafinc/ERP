'use client';

import PageHeader from '@/components/PageHeader';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PageHeader
        title="Terms"
        subtitle="Manage terms"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Legal", href: "/legal" }, { label: "Terms" }]}
      />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: December 20, 2024</p>

        <div className="prose prose-blue max-w-none">
          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing or using the F Property Services snow removal management system ("Service"), you agree to
            be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
          <p className="text-gray-700 mb-4">
            F Property Services provides a comprehensive snow removal management platform that includes:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Customer relationship management (CRM)</li>
            <li>Dispatch and route optimization</li>
            <li>Invoicing and payment tracking</li>
            <li>QuickBooks Online integration for accounting</li>
            <li>Equipment and crew management</li>
            <li>Real-time GPS tracking</li>
            <li>Communication tools</li>
            <li>Reporting and analytics</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.1 Registration</h3>
          <p className="text-gray-700 mb-4">
            To use the Service, you must create an account and provide accurate, current, and complete information.
            You are responsible for maintaining the confidentiality of your account credentials.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.2 Account Responsibility</h3>
          <p className="text-gray-700 mb-4">
            You are responsible for all activities that occur under your account. You must notify us immediately of
            any unauthorized use of your account or any security breach.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3.3 Account Types</h3>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li><strong>Admin:</strong> Full access to all features and settings</li>
            <li><strong>Crew Member:</strong> Access to dispatch, routes, and job details</li>
            <li><strong>Customer:</strong> Access to service history and communication</li>
            <li><strong>Subcontractor:</strong> Access to assigned jobs and reporting</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. QuickBooks Integration</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.1 Authorization</h3>
          <p className="text-gray-700 mb-4">
            By connecting your QuickBooks Online account to our Service, you authorize us to:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Access your QuickBooks company data</li>
            <li>Create and update customers, invoices, payments, and estimates</li>
            <li>Read accounting information necessary for synchronization</li>
            <li>Store OAuth tokens securely for maintaining the connection</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.2 Data Synchronization</h3>
          <p className="text-gray-700 mb-4">
            Our QuickBooks integration automatically synchronizes data between our Service and your QuickBooks account.
            You can configure sync settings and choose which entities to sync. You acknowledge that:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Synchronized data will be created or updated in both systems</li>
            <li>You are responsible for reviewing synced data for accuracy</li>
            <li>We are not responsible for data discrepancies caused by manual edits in either system</li>
            <li>You can disconnect the integration at any time through the Settings page</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4.3 QuickBooks Terms</h3>
          <p className="text-gray-700 mb-4">
            Your use of QuickBooks Online is subject to Intuit's Terms of Service. We are not responsible for any
            issues, changes, or interruptions to QuickBooks services.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Acceptable Use</h2>
          <p className="text-gray-700 mb-4">You agree not to:</p>
          <ul className="list-disc pl-6 mb-4 text-gray-700">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Transmit viruses, malware, or harmful code</li>
            <li>Impersonate another person or entity</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Share your account credentials with unauthorized users</li>
            <li>Use automated scripts to access the Service without permission</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Subscription and Payment</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.1 Fees</h3>
          <p className="text-gray-700 mb-4">
            Access to the Service requires a paid subscription. Subscription fees are billed in advance on a monthly
            or annual basis, as selected during signup.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.2 Payment Terms</h3>
          <p className="text-gray-700 mb-4">
            You agree to provide current, complete, and accurate billing information. You authorize us to charge your
            payment method for all fees incurred under your account.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.3 Refunds</h3>
          <p className="text-gray-700 mb-4">
            Subscription fees are non-refundable except as required by law or as expressly stated in these Terms.
            If you cancel your subscription, you will have access to the Service until the end of your billing period.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6.4 Price Changes</h3>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify subscription fees. We will provide at least 30 days' notice of any price
            increases. Continued use of the Service after the price change constitutes acceptance of the new fees.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data Ownership and License</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.1 Your Data</h3>
          <p className="text-gray-700 mb-4">
            You retain all rights to data you submit to the Service ("Your Data"). You grant us a license to use,
            store, and process Your Data solely to provide the Service and as described in our Privacy Policy.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.2 Our Rights</h3>
          <p className="text-gray-700 mb-4">
            We retain all rights to the Service, including software, features, design, and content. You may not
            copy, modify, reverse engineer, or create derivative works based on the Service.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7.3 Feedback</h3>
          <p className="text-gray-700 mb-4">
            If you provide feedback or suggestions about the Service, we may use that information without obligation
            to you.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Service Availability</h2>
          <p className="text-gray-700 mb-4">
            We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the Service. We may
            perform maintenance, updates, or modifications that temporarily affect availability. We will provide
            notice of scheduled maintenance when possible.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Termination</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.1 By You</h3>
          <p className="text-gray-700 mb-4">
            You may cancel your subscription at any time through the Settings page or by contacting support. Your
            access will continue until the end of your current billing period.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.2 By Us</h3>
          <p className="text-gray-700 mb-4">
            We may suspend or terminate your account if you violate these Terms, fail to pay fees, or for any other
            reason with or without notice. Upon termination, your right to access the Service will immediately cease.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">9.3 Data After Termination</h3>
          <p className="text-gray-700 mb-4">
            After termination, we will retain Your Data for 90 days to allow for account reactivation. After 90 days,
            Your Data will be permanently deleted, except as required for legal or accounting purposes.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Disclaimers and Limitations of Liability</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">10.1 Service "As Is"</h3>
          <p className="text-gray-700 mb-4">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
            WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">10.2 Limitation of Liability</h3>
          <p className="text-gray-700 mb-4">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, F PROPERTY SERVICES SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA LOSS, OR BUSINESS
            INTERRUPTION, ARISING FROM YOUR USE OF THE SERVICE.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">10.3 Maximum Liability</h3>
          <p className="text-gray-700 mb-4">
            Our total liability for any claims arising from these Terms or the Service shall not exceed the amount
            you paid us in the 12 months preceding the claim.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Indemnification</h2>
          <p className="text-gray-700 mb-4">
            You agree to indemnify and hold harmless F Property Services from any claims, damages, losses, or expenses
            (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of
            any third-party rights.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Third-Party Services</h2>
          <p className="text-gray-700 mb-4">
            The Service integrates with third-party services including QuickBooks Online, Google services, RingCentral,
            and others. Your use of these services is subject to their respective terms and policies. We are not
            responsible for third-party services or their availability.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Modifications to Terms</h2>
          <p className="text-gray-700 mb-4">
            We may modify these Terms at any time by posting updated Terms on our website. Material changes will be
            communicated via email or in-app notification. Your continued use of the Service after changes constitutes
            acceptance of the updated Terms.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Governing Law and Dispute Resolution</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.1 Governing Law</h3>
          <p className="text-gray-700 mb-4">
            These Terms are governed by the laws of Alberta, Canada, without regard to conflict of law principles.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">14.2 Dispute Resolution</h3>
          <p className="text-gray-700 mb-4">
            Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in
            Calgary, Alberta, except that either party may seek injunctive relief in court for intellectual property
            violations.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">15. General Provisions</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">15.1 Entire Agreement</h3>
          <p className="text-gray-700 mb-4">
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and F Property
            Services regarding the Service.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">15.2 Severability</h3>
          <p className="text-gray-700 mb-4">
            If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full
            force and effect.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">15.3 Waiver</h3>
          <p className="text-gray-700 mb-4">
            Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.
          </p>

          <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">15.4 Assignment</h3>
          <p className="text-gray-700 mb-4">
            You may not assign or transfer these Terms or your account without our written consent. We may assign
            these Terms at any time without notice.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">16. Contact Information</h2>
          <p className="text-gray-700 mb-4">
            For questions about these Terms or the Service, contact us:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-gray-800 font-semibold mb-2">F Property Services</p>
            <p className="text-gray-700">Email: support@cafinc.ca</p>
            <p className="text-gray-700">Phone: +1 (587) 877-0293</p>
            <p className="text-gray-700">Address: Calgary, Alberta, Canada</p>
            <p className="text-gray-700 mt-2">Website: https://fieldview-3.preview.emergentagent.com</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">17. Acknowledgment</h2>
          <p className="text-gray-700 mb-4">
            BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE
            TERMS OF SERVICE.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © 2024 F Property Services. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
