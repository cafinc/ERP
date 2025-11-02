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
  Zap,
  GitBranch,
  BarChart3,
  FileSearch,
  Workflow,
  History,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();

  const settings = [
    {
      category: 'Workflow Automation',
      description: 'Enterprise-grade workflow automation with version control, analytics, and templates',
      items: [
        {
          icon: Workflow,
          title: 'Custom Workflows',
          description: 'Create, edit, and manage automated workflows',
          href: '/automation/workflows',
          color: 'blue',
          badge: 'Enterprise'
        },
        {
          icon: Zap,
          title: 'Workflow Templates',
          description: 'Browse and use pre-built workflow templates',
          href: '/automation/workflows',
          color: 'purple',
          badge: '11 Templates'
        },
        {
          icon: History,
          title: 'Execution History',
          description: 'View workflow execution logs and history',
          href: '/automation/workflows',
          color: 'green'
        },
        {
          icon: GitBranch,
          title: 'Version Control',
          description: 'Manage workflow versions and rollbacks',
          href: '/automation/workflows',
          color: 'orange',
          badge: 'New'
        },
        {
          icon: BarChart3,
          title: 'Analytics & Insights',
          description: 'Performance metrics and error analysis',
          href: '/automation/workflows',
          color: 'red'
        },
        {
          icon: FileSearch,
          title: 'Audit Logs',
          description: 'Compliance and audit trail management',
          href: '/automation/workflows',
          color: 'gray',
          badge: 'Compliance'
        }
      ]
    },
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
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{category.category}</h2>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                </div>
                {category.category === 'Workflow Automation' && (
                  <button
                    onClick={() => router.push('/automation')}
                    className="px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2d5a8f] transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Dashboard
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`${category.category}-${item.title}`}
                      onClick={() => router.push(item.href)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`rounded-lg p-3 ${getColorClasses(item.color)}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-[#3f72af] rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
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
