'use client';

import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  Mail,
  Inbox,
  Send,
  Star,
  Trash2,
  Archive,
  RefreshCw,
  Search,
  Plus,
  Tag,
  User,
  Paperclip,
  Reply,
  Forward,
  MoreVertical,
  Check,
  X,
  Download,
  FileText,
  Link as LinkIcon,
  Users,
  Save,
  Edit2,
  Trash,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body?: string;
  date: string;
  is_unread: boolean;
  is_starred: boolean;
  labels: string[];
  has_attachments: boolean;
  attachments?: Attachment[];
}

interface Label {
  id: string;
  name: string;
  type: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  color?: { backgroundColor: string; textColor: string };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category?: string;
  placeholders: string[];
  is_shared: boolean;
  usage_count: number;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
}

interface EmailCustomerLink {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  auto_linked: boolean;
  notes?: string;
}

export default function GmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [replyingTo, setReplyingTo] = useState<Email | null>(null);
  
  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    category: '',
    is_shared: false
  });
  
  // CRM state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [linkedCustomers, setLinkedCustomers] = useState<EmailCustomerLink[]>([]);
  const [showCustomerLink, setShowCustomerLink] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  
  // Attachments state
  const [showAttachments, setShowAttachments] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadTemplates();
      loadCustomers();
    }
  }, [isConnected]);

  useEffect(() => {
    if (selectedEmail) {
      loadLinkedCustomers(selectedEmail.id);
    }
  }, [selectedEmail]);

  const checkConnection = async () => {
    try {
      const response = await api.get('/gmail/status');
      setIsConnected(response.data.connected);
      
      if (response.data.connected) {
        await loadLabels();
        await loadEmails();
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
      setIsConnected(false);
    } finally {
      setInitialLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      const response = await api.get('/gmail/connect');
      window.location.href = response.data.authorization_url;
    } catch (error) {
      console.error('Error connecting Gmail:', error);
    }
  };

  const disconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail?')) {
      return;
    }
    
    try {
      const response = await api.get('/gmail/status');
      if (response.data.connections && response.data.connections.length > 0) {
        const connectionId = response.data.connections[0].id;
        await api.post(`/gmail/disconnect/${connectionId}`);
        alert('Gmail disconnected successfully. Please refresh to reconnect.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      alert('Failed to disconnect Gmail');
    }
  };

  const loadLabels = async () => {
    try {
      const response = await api.get('/gmail/labels');
      setLabels(response.data.labels || []);
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  };

  const loadEmails = async (labelId: string = 'INBOX') => {
    try {
      setLoading(true);
      const response = await api.get(`/gmail/labels/${labelId}/emails`);
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelChange = (labelId: string) => {
    setSelectedLabel(labelId);
    setSelectedEmail(null);
    loadEmails(labelId);
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (email.is_unread) {
      markAsRead(email.id);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await api.post(`/gmail/mark-read/${messageId}`);
      setEmails(emails.map(e => e.id === messageId ? { ...e, is_unread: false } : e));
      if (selectedEmail?.id === messageId) {
        setSelectedEmail({ ...selectedEmail, is_unread: false });
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAsUnread = async (messageId: string) => {
    try {
      await api.post(`/gmail/mark-unread/${messageId}`);
      setEmails(emails.map(e => e.id === messageId ? { ...e, is_unread: true } : e));
    } catch (error) {
      console.error('Error marking as unread:', error);
    }
  };

  const toggleStar = async (messageId: string, isStarred: boolean) => {
    try {
      if (isStarred) {
        await api.post(`/gmail/unstar/${messageId}`);
      } else {
        await api.post(`/gmail/star/${messageId}`);
      }
      setEmails(emails.map(e => e.id === messageId ? { ...e, is_starred: !isStarred } : e));
      if (selectedEmail?.id === messageId) {
        setSelectedEmail({ ...selectedEmail, is_starred: !isStarred });
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const archiveEmail = async (messageId: string) => {
    try {
      await api.post(`/gmail/archive/${messageId}`);
      setEmails(emails.filter(e => e.id !== messageId));
      if (selectedEmail?.id === messageId) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Error archiving email:', error);
    }
  };

  const deleteEmail = async (messageId: string) => {
    try {
      if (confirm('Are you sure you want to delete this email?')) {
        await api.post(`/gmail/delete/${messageId}`);
        setEmails(emails.filter(e => e.id !== messageId));
        if (selectedEmail?.id === messageId) {
          setSelectedEmail(null);
        }
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const sendEmail = async () => {
    try {
      await api.post('/gmail/send', composeData);
      setShowCompose(false);
      setComposeData({ to: '', subject: '', body: '' });
      setReplyingTo(null);
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleReply = (email: Email) => {
    setReplyingTo(email);
    setShowCompose(true);
    setComposeData({
      to: email.from,
      subject: `Re: ${email.subject}`,
      body: `\n\n---\nOn ${email.date}, ${email.from} wrote:\n${email.body || email.snippet}`
    });
  };

  const handleForward = (email: Email) => {
    setReplyingTo(email);
    setShowCompose(true);
    setComposeData({
      to: '',
      subject: `Fwd: ${email.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${email.from}\nDate: ${email.date}\nSubject: ${email.subject}\n\n${email.body || email.snippet}`
    });
  };

  const handleSelectEmail = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleBulkAction = async (action: 'read' | 'unread' | 'archive' | 'delete') => {
    const selectedArray = Array.from(selectedEmails);
    if (selectedArray.length === 0) return;

    try {
      for (const emailId of selectedArray) {
        if (action === 'read') await markAsRead(emailId);
        else if (action === 'unread') await markAsUnread(emailId);
        else if (action === 'archive') await archiveEmail(emailId);
        else if (action === 'delete') await deleteEmail(emailId);
      }
      setSelectedEmails(new Set());
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  // === Template Functions ===
  const loadTemplates = async () => {
    try {
      const response = await api.get('/gmail/templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const createTemplate = async () => {
    try {
      await api.post('/gmail/templates', templateForm);
      setTemplateForm({ name: '', subject: '', body: '', category: '', is_shared: false });
      setShowTemplateManager(false);
      loadTemplates();
      alert('Template created successfully!');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Failed to create template');
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;
    
    try {
      await api.put(`/gmail/templates/${editingTemplate.id}`, templateForm);
      setEditingTemplate(null);
      setTemplateForm({ name: '', subject: '', body: '', category: '', is_shared: false });
      setShowTemplateManager(false);
      loadTemplates();
      alert('Template updated successfully!');
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.delete(`/gmail/templates/${templateId}`);
      loadTemplates();
      alert('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      const response = await api.post(`/gmail/templates/${templateId}/use`, {
        customer_name: 'Customer Name',
        company_name: 'Company Name',
      });
      setComposeData({
        ...composeData,
        subject: response.data.subject,
        body: response.data.body
      });
      setShowTemplates(false);
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  // === CRM Functions ===
  const loadCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadLinkedCustomers = async (messageId: string) => {
    try {
      const response = await api.get(`/gmail/email-links/${messageId}`);
      setLinkedCustomers(response.data.links || []);
    } catch (error) {
      console.error('Error loading linked customers:', error);
    }
  };

  const linkCustomer = async (customerId: string) => {
    if (!selectedEmail) return;
    
    try {
      await api.post('/gmail/link-customer', {
        message_id: selectedEmail.id,
        customer_id: customerId,
        notes: 'Manually linked'
      });
      loadLinkedCustomers(selectedEmail.id);
      setShowCustomerLink(false);
      setCustomerSearchQuery('');
      alert('Customer linked successfully!');
    } catch (error) {
      console.error('Error linking customer:', error);
      alert('Failed to link customer');
    }
  };

  const unlinkCustomer = async (linkId: string) => {
    try {
      await api.delete(`/gmail/email-links/${linkId}`);
      if (selectedEmail) {
        loadLinkedCustomers(selectedEmail.id);
      }
      alert('Customer unlinked successfully!');
    } catch (error) {
      console.error('Error unlinking customer:', error);
      alert('Failed to unlink customer');
    }
  };

  const autoLinkEmails = async () => {
    try {
      const response = await api.post('/gmail/auto-link-emails');
      alert(response.data.message);
      if (selectedEmail) {
        loadLinkedCustomers(selectedEmail.id);
      }
    } catch (error) {
      console.error('Error auto-linking emails:', error);
      alert('Failed to auto-link emails');
    }
  };

  // === Attachment Functions ===
  const downloadAttachment = async (messageId: string, attachmentId: string, filename: string) => {
    try {
      const response = await api.get(`/gmail/attachments/${messageId}/${attachmentId}`);
      
      // Decode base64 and create download link
      const byteCharacters = atob(response.data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Failed to download attachment');
    }
  };

  // Loading state
  if (initialLoading) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading Gmail...</div></div>
      );
  }

  // Not connected state
  if (!isConnected) {
    return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="bg-white rounded-lg shadow-sm shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow rounded-2xl shadow-2xl max-w-md text-center hover:shadow-md transition-shadow">
            <Mail className="w-16 h-16 text-[#3f72af] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Gmail</h1>
            <p className="text-gray-600 mb-4">
              Connect your Gmail account to manage emails, send messages, and integrate with your CRM.
            </p>
            <button
              onClick={connectGmail}
              className="w-full bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md rounded-lg font-medium transition-colors"
            >
              Connect Gmail Account
            </button></div></div>
      );
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  return (
      <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
        {/* Sidebar - Labels */}
        <div className="w-56 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex-shrink-0 space-y-2">
            <button
              onClick={() => setShowCompose(true)}
              className="w-full bg-[#3f72af] hover:bg-[#3f72af]/90 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md rounded-lg font-medium flex items-center justify-center space-x-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Compose</span>
            </button>
            <button
              onClick={() => setShowTemplateManager(true)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Templates</span>
            </button>
            <button
              onClick={autoLinkEmails}
              className="w-full bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 text-sm"
              title="Auto-link emails to customers based on email addresses"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Auto-Link</span>
            </button></div>

          <div className="flex-1 overflow-y-auto p-2">
            <div
              onClick={() => handleLabelChange('INBOX')}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer ${
                selectedLabel === 'INBOX' ? 'bg-blue-50 text-[#3f72af]' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Inbox className="w-5 h-5" />
              <span className="font-medium">Inbox</span>
            </div>

            <div
              onClick={() => handleLabelChange('STARRED')}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer ${
                selectedLabel === 'STARRED' ? 'bg-blue-50 text-[#3f72af]' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Star className="w-5 h-5" />
              <span className="font-medium">Starred</span>
            </div>

            <div
              onClick={() => handleLabelChange('SENT')}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer ${
                selectedLabel === 'SENT' ? 'bg-blue-50 text-[#3f72af]' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Send className="w-5 h-5" />
              <span className="font-medium">Sent</span>
            </div>

            <div
              onClick={() => handleLabelChange('TRASH')}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer ${
                selectedLabel === 'TRASH' ? 'bg-blue-50 text-[#3f72af]' : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Trash</span>
            </div>

            {labels.filter(l => l.type === 'user').map(label => (
              <div
                key={label.id}
                onClick={() => handleLabelChange(label.id)}
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer ${
                  selectedLabel === label.id ? 'bg-blue-50 text-[#3f72af]' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Tag className="w-5 h-5" />
                <span>{label.name}</span>
              </div>
            ))}
          </div></div>

        {/* Email List */}
        <div className="w-[480px] bg-white border-r border-gray-200 flex flex-col">
          {/* Toolbar */}
          <div className="p-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-sm"
                />
              </div>
              <button
                onClick={() => loadEmails(selectedLabel)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={disconnectGmail}
                className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                title="Disconnect Gmail"
              >
                <X className="w-5 h-5" />
              </button></div>

            {selectedEmails.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{selectedEmails.size} selected</span>
                <button
                  onClick={() => handleBulkAction('read')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  title="Archive"
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button></div>
            )}
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Mail className="w-16 h-16 mb-4" />
                <p>No emails in this folder</p>
              </div>
            ) : (
              emails
                .filter(email => 
                  !searchQuery || 
                  email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  email.from.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(email => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                      selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                    } ${email.is_unread ? 'bg-blue-25' : ''}`}
                  >
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(email.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectEmail(email.id);
                        }}
                        className="mt-1 flex-shrink-0"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(email.id, email.is_starred);
                        }}
                        className="mt-1 flex-shrink-0"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            email.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                          }`}
                        />
                      </button>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium text-sm truncate ${email.is_unread ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                            {email.from}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{new Date(email.date).toLocaleDateString()}</span>
                        </div>
                        <div className={`text-sm mb-1 truncate ${email.is_unread ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
                          {email.subject || '(no subject)'}
                        </div>
                        <div className="text-xs text-gray-600 truncate">{email.snippet}</div>
                        {email.has_attachments && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Paperclip className="w-3 h-3 mr-1" />
                            <span>Attachment</span>
                          </div>
                        )}
                      </div></div></div>
                ))
            )}
          </div></div>

        {/* Email Detail */}
        <div className="flex-1 bg-white flex flex-col">
          {selectedEmail ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmail.subject}</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleReply(selectedEmail)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Reply"
                    >
                      <Reply className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleForward(selectedEmail)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Forward"
                    >
                      <Forward className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setShowCustomerLink(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Link to Customer"
                    >
                      <LinkIcon className="w-5 h-5 text-[#3f72af]" />
                    </button>
                    <button
                      onClick={() => archiveEmail(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Archive"
                    >
                      <Archive className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => deleteEmail(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button></div></div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{selectedEmail.from}</span>
                  </div>
                  <span>•</span>
                  <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                </div>

                {/* Linked Customers */}
                {linkedCustomers.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm font-medium text-blue-900 mb-2">
                      <Users className="w-4 h-4" />
                      <span>Linked Customers:</span>
                    </div>
                    {linkedCustomers.map(link => (
                      <div key={link.id} className="flex items-center justify-between py-1">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{link.customer_name}</span>
                          <span className="text-xs text-gray-600 ml-2">({link.customer_email})</span>
                          {link.auto_linked && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Auto</span>
                          )}
                        </div>
                        <button
                          onClick={() => unlinkCustomer(link.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button></div>
                    ))}
                  </div>
                )}

                {/* Attachments */}
                {selectedEmail.has_attachments && selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowAttachments(!showAttachments)}
                      className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>{selectedEmail.attachments.length} Attachment{selectedEmail.attachments.length > 1 ? 's' : ''}</span>
                      {showAttachments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showAttachments && (
                      <div className="mt-2 space-y-2">
                        {selectedEmail.attachments.map(attachment => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{attachment.filename}</div>
                                <div className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(2)} KB</div></div></div>
                            <button
                              onClick={() => downloadAttachment(selectedEmail.id, attachment.id, attachment.filename)}
                              className="p-2 hover:bg-gray-200 rounded-lg"
                              title="Download"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button></div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.snippet }}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Mail className="w-24 h-24 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select an email to read</p>
              </div></div>
          )}
        </div>

        {/* Compose Modal */}
        {showCompose && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {replyingTo ? 'Reply' : 'New Message'}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Use Template"
                  >
                    <FileText className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      setShowCompose(false);
                      setReplyingTo(null);
                      setComposeData({ to: '', subject: '', body: '' });
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button></div></div>

              {showTemplates && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Select Template:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => useTemplate(template.id)}
                        className="w-full text-left p-2 bg-white hover:bg-gray-100 rounded-lg border border-gray-200"
                      >
                        <div className="font-medium text-sm text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-600">{template.subject}</div></button>
                    ))}
                  </div></div>
              )}

              <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="email"
                    value={composeData.to}
                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="recipient@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={composeData.body}
                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Type your message here..."
                  />
                </div></div>

              <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCompose(false);
                    setReplyingTo(null);
                    setComposeData({ to: '', subject: '', body: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={sendEmail}
                  className="px-6 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium"
                >
                  Send
                </button></div></div></div>
        )}

        {/* Template Manager Modal */}
        {showTemplateManager && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Email Templates</h3>
                <button
                  onClick={() => {
                    setShowTemplateManager(false);
                    setEditingTemplate(null);
                    setTemplateForm({ name: '', subject: '', body: '', category: '', is_shared: false });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button></div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Template List */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Saved Templates</h4>
                    <div className="space-y-2">
                      {templates.map(template => (
                        <div key={template.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{template.name}</div>
                              <div className="text-xs text-gray-600 mt-1">{template.subject}</div>
                              {template.category && (
                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                  {template.category}
                                </span>
                              )}
                              <div className="text-xs text-gray-500 mt-1">Used {template.usage_count} times</div></div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setTemplateForm({
                                    name: template.name,
                                    subject: template.subject,
                                    body: template.body,
                                    category: template.category || '',
                                    is_shared: template.is_shared
                                  });
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => deleteTemplate(template.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                <Trash className="w-4 h-4 text-red-600" />
                              </button></div></div></div>
                      ))}
                    </div></div>

                  {/* Template Form */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {editingTemplate ? 'Edit Template' : 'Create New Template'}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={templateForm.name}
                          onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Template name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input
                          type="text"
                          value={templateForm.category}
                          onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="e.g., Follow-up, Quote"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                          type="text"
                          value={templateForm.subject}
                          onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Email subject"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                        <textarea
                          value={templateForm.body}
                          onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                          rows={8}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                          placeholder="Email body (use {{customer_name}}, {{company_name}} for placeholders)"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={templateForm.is_shared}
                          onChange={(e) => setTemplateForm({ ...templateForm, is_shared: e.target.checked })}
                          className="rounded"
                        />
                        <label className="text-sm text-gray-700">Share with team</label>
                      </div>

                      <button
                        onClick={editingTemplate ? updateTemplate : createTemplate}
                        className="w-full px-4 py-2 bg-[#3f72af] hover:bg-[#3f72af]/90 text-white rounded-lg font-medium"
                      >
                        {editingTemplate ? 'Update Template' : 'Create Template'}
                      </button></div></div></div></div></div></div>
        )}

        {/* Customer Link Modal */}
        {showCustomerLink && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Link to Customer</h3>
                <button
                  onClick={() => {
                    setShowCustomerLink(false);
                    setCustomerSearchQuery('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button></div>

              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-sm"
                  />
                </div></div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer._id}
                      onClick={() => linkCustomer(customer._id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-600">{customer.email}</div></button>
                  ))}
                </div></div></div></div>
        )}
      </div>
    );
}
