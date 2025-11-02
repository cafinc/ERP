'use client';

import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import {
  User,
  Bell,
  Shield,
  Mail,
  Phone,
  Database,
  FileText,
  Key,
  Globe,
  Palette,
  Clock,
  MapPin,
  CreditCard,
  Webhook,
  Settings as SettingsIcon,
  HelpCircle,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const settings = [
    {
      category: 'Account',
      items: [
        {
          icon: User,
          title: 'Profile Settings',
          description: 'Manage your personal information and preferences',
          href: '/settings/profile',
          color: 'blue'
        },
        {
          icon: Key,
          title: 'Security',
          description: 'Password, two-factor authentication, and security settings',
          href: '/settings/account',
          color: 'red'
        },
        {
          icon: Bell,
          title: 'Notifications',
          description: 'Configure email and push notification preferences',
          href: '/settings/notifications',
          color: 'purple'
        },
        {
          icon: HelpCircle,
          title: 'Help & Support',
          description: 'Get help, contact support, and access FAQs',
          href: '/settings/support',
          color: 'green'
        }
      ]
    },
    {
      category: 'Company',
      items: [
        {
          icon: Database,
          title: 'Company Information',
          description: 'Business details, logo, and contact information',
          href: '/settings/company',
          color: 'green'
        },
        {
          icon: Palette,
          title: 'Branding',
          description: 'Customize logos, colors, and email templates',
          href: '/settings/branding',
          color: 'pink'
        },
        {
          icon: MapPin,
          title: 'Service Areas',
          description: 'Define service zones and coverage areas',
          href: '/settings/service-areas',
          color: 'orange'
        }
      ]
    },
    {
      category: 'Integrations',
      items: [
        {
          icon: Mail,
          title: 'Email Configuration',
          description: 'SMTP settings and email service providers',
          href: '/settings/email-config',
          color: 'blue'
        },
        {
          icon: Phone,
          title: 'SMS Configuration',
          description: 'Twilio setup for SMS notifications',
          href: '/settings/sms-config',
          color: 'green'
        },
        {
          icon: Globe,
          title: 'Google Workspace',
          description: 'Gmail, Calendar, Drive integration settings',
          href: '/settings/google',
          color: 'red'
        },
        {
          icon: Phone,
          title: 'RingCentral',
          description: 'Phone system and call management',
          href: '/settings/ringcentral',
          color: 'orange'
        },
        {
          icon: CreditCard,
          title: 'QuickBooks',
          description: 'Accounting software integration',
          href: '/settings/quickbooks',
          color: 'green'
        },
        {
          icon: Webhook,
          title: 'Webhooks',
          description: 'Configure API webhooks and integrations',
          href: '/settings/webhooks',
          color: 'purple'
        }
      ]
    },
    {
      category: 'System',
      items: [
        {
          icon: FileText,
          title: 'Document Templates',
          description: 'Manage estimate, invoice, and document templates',
          href: '/templates',
          color: 'blue'
        },
        {
          icon: Clock,
          title: 'Business Hours',
          description: 'Operating hours and schedule settings',
          href: '/settings/business-hours',
          color: 'blue'
        },
        {
          icon: FileText,
          title: 'Terms & Policies',
          description: 'Terms of service, privacy policy, and contracts',
          href: '/settings/legal',
          color: 'gray'
        },
        {
          icon: Shield,
          title: 'Permissions',
          description: 'User roles and access control',
          href: '/settings/permissions',
          color: 'red'
        }
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-100 text-[#3f72af]',
      red: 'bg-red-100 text-red-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      pink: 'bg-pink-100 text-pink-600',
      gray: 'bg-gray-100 text-gray-600'
    };
    return colors[color] || colors.blue;
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        {/* Compact Header */}
        <PageHeader
          title="Settings"
          subtitle="Configure system settings and preferences"
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Settings" }]}
          icon={<SettingsIcon size={28} />}
          badges={[
            { label: 'System Configuration', color: 'blue' },
          ]}
        />

        {/* Settings Categories */}
        <div className="space-y-8 mx-6 mt-6">
          {settings.map((category) => (
            <div key={category.category}>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{category.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="bg-white rounded-xl shadow-sm shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`rounded-lg p-3 ${getColorClasses(item.color)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    </button>
  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}
