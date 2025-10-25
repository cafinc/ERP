'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import api from '@/lib/api';
import { formatPhoneNumber, validateEmail, isValidEmail } from '@/lib/utils/formatters';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Briefcase,
  Users,
  Building,
  CreditCard,
  AlertCircle,
  Plus,
  X,
  Smartphone,
  MessageSquare,
  Bell,
  Key,
  Monitor,
  Check,
  UserPlus,
  Upload,
  File,
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';

// Canadian provinces
const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
];

const POSITION_OPTIONS = ['Owner', 'Manager', 'Accountant', 'Other'];

export default function CustomerFormPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  const isEdit = !!customerId && customerId !== 'create';
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Company search states
  const [linkToCompany, setLinkToCompany] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // User access states
  const [requireAccess, setRequireAccess] = useState(false);
  const [accessWeb, setAccessWeb] = useState(false);
  const [accessInApp, setAccessInApp] = useState(false);
  const [userRole, setUserRole] = useState('customer');
  
  // Create site states
  const [createSite, setCreateSite] = useState(false);
  const [siteName, setSiteName] = useState('');
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, type: string, size: number, data: string}>>([]);
  
  // Duplicate detection states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [skipDuplicateCheck, setSkipDuplicateCheck] = useState(false);
  
  const [customerForm, setCustomerForm] = useState({
    // For individuals
    first_name: '',
    last_name: '',
    // For both
    email: '',
    phone: '',
    mobile: '',
    communication_preference: 'sms', // 'sms' or 'inapp'
    // Address broken out
    street_address: '',
    city: '',
    province: 'AB',
    postal_code: '',
    country: 'Canada',
    // Company fields
    company_name: '',
    operating_as: '',
    office_number: '',
    billing_address_same: true,
    billing_address: {
      street_address: '',
      city: '',
      province: 'AB',
      postal_code: '',
    },
    // Contact persons (3 positions)
    contacts: [
      { name: '', email: '', phone: '', position: 'Manager' },
      { name: '', email: '', phone: '', position: 'Accounting' },
      { name: '', email: '', phone: '', position: 'Supervisor' },
    ],
    same_person_all_contacts: false,
    customer_type: 'individual',
    company_id: '',
    // Main contact for companies
    main_contact: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      position: 'Manager',
    },
    notes: '',
    active: true,
    // Company-specific accounting fields
    accounting: {
      business_number: '',
      billing_email: '',
      billing_phone: '',
      payment_terms: 'due_on_receipt',
      credit_limit_enabled: false,
      credit_limit: '',
      preferred_payment_method: 'e_transfer',
      po_required: false,
      billing_address: '',
      notes: '',
    },
  });

  useEffect(() => {
    loadCompanies();
    if (isEdit) {
      loadCustomer();
    }
    // Initialize Google Places Autocomplete
    initGooglePlaces();
  }, [customerId]);

  const initGooglePlaces = () => {
    if (typeof window === 'undefined') return;
    
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setupAutocomplete();
      return;
    }
    
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setupAutocomplete());
      return;
    }
    
    // Load Google Places API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setupAutocomplete();
    document.head.appendChild(script);
  };

  const setupAutocomplete = () => {
    if (!addressInputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      componentRestrictions: { country: 'ca' },
      fields: ['address_components', 'formatted_address'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      let street = '';
      let city = '';
      let province = 'AB';
      let postalCode = '';

      // Log all components for debugging
      console.log('Google Places - All address components:', place.address_components);

      place.address_components.forEach((component: any) => {
        const types = component.types;
        
        // Street number
        if (types.includes('street_number')) {
          street = component.long_name + ' ';
        }
        
        // Street name
        if (types.includes('route')) {
          street += component.long_name;
        }
        
        // City - check multiple possible types in priority order
        if (!city) {
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('sublocality')) {
            city = component.long_name;
          } else if (types.includes('sublocality_level_1')) {
            city = component.long_name;
          } else if (types.includes('postal_town')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_3')) {
            city = component.long_name;
          }
        }
        
        // Province
        if (types.includes('administrative_area_level_1')) {
          province = component.short_name;
        }
        
        // Postal code
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      // Fallback: if city is still empty, try to extract from formatted address
      if (!city && place.formatted_address) {
        console.log('City not found in components, trying to extract from formatted address:', place.formatted_address);
      }

      // Log final extracted values
      console.log('Google Places - Extracted values:', { street, city, province, postalCode });

      setCustomerForm(prev => ({
        ...prev,
        street_address: street,
        city: city,
        province: province,
        postal_code: postalCode,
      }));
    });
  };

  const loadCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await api.get('/customers');
      const companyList = response.data.filter((c: any) => c.customer_type === 'company');
      setCompanies(companyList);
    } catch (error) {
      console.error('Error loading companies:', error);
      alert('Failed to load companies. Please refresh the page.');
    } finally {
      setLoadingCompanies(false);
    }
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      // Limit file size to 500KB to avoid proxy size limits
      if (file.size > 500 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 500KB per file.\n\nFor larger files, please upload them after creating the customer.`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedFiles(prev => [...prev, {
          name: file.name,
          type: file.type,
          size: file.size,
          data: result
        }]);
      };
      reader.onerror = () => {
        alert(`Error reading file ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    event.target.value = '';
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <File className="w-5 h-5 text-red-500" />;
    return <Paperclip className="w-5 h-5 text-gray-500" />;
  };

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customerId}`);
      const data = response.data;
      
      // Parse name into first_name and last_name
      const nameParts = (data.name || '').split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      
      // Parse address into components (basic split)
      const addressParts = (data.address || '').split(',').map((s: string) => s.trim());
      
      setCustomerForm({
        first_name: data.customer_type === 'individual' ? first_name : '',
        last_name: data.customer_type === 'individual' ? last_name : '',
        company_name: data.customer_type === 'company' ? data.name : '',
        email: data.email || '',
        phone: data.phone || '',
        mobile: '',
        street_address: addressParts[0] || data.address || '',
        city: addressParts[1] || '',
        province: 'AB',
        postal_code: '',
        country: 'Canada',
        customer_type: data.customer_type || 'individual',
        company_id: data.company_id || '',
        main_contact: {
          first_name: '',
          last_name: '',
          phone: '',
          email: '',
          position: 'Manager',
        },
        notes: data.notes || '',
        active: data.active !== false,
        accounting: data.accounting || {
          tax_id: '',
          billing_email: '',
          billing_phone: '',
          payment_terms: 'net_30',
          credit_limit: '',
          preferred_payment_method: '',
          po_required: false,
          billing_address: '',
          notes: '',
        },
      });
    } catch (error) {
      console.error('Error loading customer:', error);
      alert('Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelection = (type: 'individual' | 'company') => {
    setCustomerForm({ ...customerForm, customer_type: type });
  };

  const validateField = (fieldName: string, value: string) => {
    const errors = { ...fieldErrors };
    
    // Email validation
    if (fieldName === 'email' || fieldName === 'main_contact_email') {
      if (value && !isValidEmail(value)) {
        errors[fieldName] = 'Invalid email format';
      } else {
        delete errors[fieldName];
      }
    }
    
    // Phone validation (check if it's 10 digits when cleaned)
    if (fieldName.includes('phone')) {
      const cleaned = value.replace(/\D/g, '');
      if (value && cleaned.length > 0 && cleaned.length !== 10) {
        errors[fieldName] = 'Phone must be 10 digits';
      } else {
        delete errors[fieldName];
      }
    }
    
    setFieldErrors(errors);
  };

  const handlePhoneChange = (field: 'phone' | 'mobile' | 'main_contact_phone', value: string) => {
    const formatted = formatPhoneNumber(value);
    if (field === 'phone') {
      setCustomerForm({ ...customerForm, phone: formatted });
      validateField('phone', formatted);
    } else if (field === 'mobile') {
      setCustomerForm({ ...customerForm, mobile: formatted });
      validateField('mobile', formatted);
    } else {
      setCustomerForm({
        ...customerForm,
        main_contact: { ...customerForm.main_contact, phone: formatted },
      });
      validateField('main_contact_phone', formatted);
    }
  };

  // Handler for Contact Persons phone changes
  const handleContactPhoneChange = (index: number, value: string) => {
    const formatted = formatPhoneNumber(value);
    const newContacts = [...customerForm.contacts];
    newContacts[index].phone = formatted;
    
    // If same person toggle is on and it's the first contact, update all
    if (customerForm.same_person_all_contacts && index === 0) {
      newContacts[1].phone = formatted;
      newContacts[2].phone = formatted;
    }
    
    setCustomerForm({ ...customerForm, contacts: newContacts });
    validateField(`contact_${index}_phone`, formatted);
  };

  // Handler for Contact Persons email validation
  const handleContactEmailBlur = (index: number, value: string) => {
    validateField(`contact_${index}_email`, value);
  };

  // Check for duplicate customers
  const checkDuplicateCustomers = async () => {
    try {
      setCheckingDuplicates(true);
      
      const name = customerForm.customer_type === 'individual'
        ? `${customerForm.first_name} ${customerForm.last_name}`.trim()
        : customerForm.company_name;
      
      const response = await api.post('/customers/check-duplicate', {
        email: customerForm.email,
        phone: customerForm.phone,
        name: name
      });
      
      if (response.data.count > 0) {
        setDuplicates(response.data.duplicates);
        setShowDuplicateModal(true);
        return true; // Found duplicates
      }
      
      return false; // No duplicates
    } catch (error) {
      console.error('Error checking duplicates:', error);
      // Continue with submission even if check fails
      return false;
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    // Validation for required fields
    if (customerForm.customer_type === 'individual') {
      if (!customerForm.first_name) errors['first_name'] = 'First name is required';
      if (!customerForm.last_name) errors['last_name'] = 'Last name is required';
    } else {
      if (!customerForm.company_name) errors['company_name'] = 'Company name is required';
      if (!customerForm.main_contact.first_name) errors['main_contact_first_name'] = 'First name is required';
      if (!customerForm.main_contact.last_name) errors['main_contact_last_name'] = 'Last name is required';
    }

    // Email validation (required)
    if (!customerForm.email) {
      errors['email'] = 'Email is required';
    } else if (!isValidEmail(customerForm.email)) {
      errors['email'] = 'Invalid email format';
    }

    // Phone validation (required)
    if (!customerForm.phone) {
      errors['phone'] = 'Phone is required';
    } else {
      const cleaned = customerForm.phone.replace(/\D/g, '');
      if (cleaned.length !== 10) {
        errors['phone'] = 'Phone must be 10 digits';
      }
    }

    // Mobile validation (required if SMS communication preference)
    if (customerForm.communication_preference === 'sms') {
      if (!customerForm.mobile) {
        errors['mobile'] = 'Mobile number is required for SMS communication';
      } else {
        const cleaned = customerForm.mobile.replace(/\D/g, '');
        if (cleaned.length !== 10) {
          errors['mobile'] = 'Mobile must be 10 digits';
        }
      }
    }

    // Company-specific validation: Contact Persons
    if (customerForm.customer_type === 'company') {
      customerForm.contacts.forEach((contact, index) => {
        // Only validate first contact if same_person toggle is on
        if (customerForm.same_person_all_contacts && index > 0) {
          return;
        }
        
        if (!contact.name) {
          errors[`contact_${index}_name`] = `${contact.position} name is required`;
        }
        
        if (!contact.email) {
          errors[`contact_${index}_email`] = `${contact.position} email is required`;
        } else if (!isValidEmail(contact.email)) {
          errors[`contact_${index}_email`] = `Invalid email format for ${contact.position}`;
        }
        
        if (!contact.phone) {
          errors[`contact_${index}_phone`] = `${contact.position} phone is required`;
        } else {
          const cleaned = contact.phone.replace(/\D/g, '');
          if (cleaned.length !== 10) {
            errors[`contact_${index}_phone`] = `${contact.position} phone must be 10 digits`;
          }
        }
      });
    }

    // Set all errors at once
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      alert('Please fix the errors in the form before submitting');
      return;
    }

    // Check for duplicates (only for new customers, not edits)
    if (!isEdit && !skipDuplicateCheck) {
      const hasDuplicates = await checkDuplicateCustomers();
      if (hasDuplicates) {
        setSaving(false);
        return; // Stop submission, modal will handle user decision
      }
    }

    // Phone validation and auto-format
    if (customerForm.phone) {
      customerForm.phone = formatPhoneNumber(customerForm.phone);
    }
    if (customerForm.mobile) {
      customerForm.mobile = formatPhoneNumber(customerForm.mobile);
    }
    if (customerForm.main_contact?.phone) {
      customerForm.main_contact.phone = formatPhoneNumber(customerForm.main_contact.phone);
    }
    
    // Format contact persons phones
    if (customerForm.customer_type === 'company') {
      customerForm.contacts = customerForm.contacts.map(contact => ({
        ...contact,
        phone: formatPhoneNumber(contact.phone)
      }));
    }

    if (!customerForm.email || !customerForm.phone || !customerForm.street_address) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      // Construct name from first_name + last_name or use company_name
      const name =
        customerForm.customer_type === 'individual'
          ? `${customerForm.first_name} ${customerForm.last_name}`.trim()
          : customerForm.company_name;

      // Construct address from broken out fields
      const addressParts = [
        customerForm.street_address,
        customerForm.city,
        `${customerForm.province} ${customerForm.postal_code}`,
        customerForm.country,
      ].filter(Boolean);
      const address = addressParts.join(', ');

      const submitData: any = {
        name,
        email: customerForm.email,
        phone: customerForm.phone,
        address,
        customer_type: customerForm.customer_type,
        notes: customerForm.notes,
        active: customerForm.active,
      };

      // Add mobile to custom_fields if provided
      if (customerForm.mobile) {
        submitData.custom_fields = [
          { field_name: 'mobile', field_value: customerForm.mobile, field_type: 'text' },
        ];
      }
      
      // Add uploaded files if any
      if (uploadedFiles.length > 0) {
        submitData.attachments = uploadedFiles;
      }

      // For individuals with company link
      if (customerForm.customer_type === 'individual' && customerForm.company_id) {
        submitData.company_id = customerForm.company_id;
        const selectedCompany = companies.find(c => c._id === customerForm.company_id);
        if (selectedCompany) {
          submitData.company_name = selectedCompany.name;
        }
      }

      // For companies
      if (customerForm.customer_type === 'company') {
        // Add accounting info
        const accounting: any = {};
        if (customerForm.accounting.tax_id) accounting.tax_id = customerForm.accounting.tax_id;
        if (customerForm.accounting.billing_email) accounting.billing_email = customerForm.accounting.billing_email;
        if (customerForm.accounting.billing_phone) accounting.billing_phone = customerForm.accounting.billing_phone;
        if (customerForm.accounting.payment_terms) accounting.payment_terms = customerForm.accounting.payment_terms;
        if (customerForm.accounting.credit_limit) accounting.credit_limit = parseFloat(customerForm.accounting.credit_limit);
        if (customerForm.accounting.preferred_payment_method) accounting.preferred_payment_method = customerForm.accounting.preferred_payment_method;
        accounting.po_required = customerForm.accounting.po_required;
        if (customerForm.accounting.billing_address) accounting.billing_address = customerForm.accounting.billing_address;
        if (customerForm.accounting.notes) accounting.notes = customerForm.accounting.notes;

        if (Object.keys(accounting).length > 0) {
          submitData.accounting = accounting;
        }
      }

      let companyId = '';

      if (isEdit) {
        await api.put(`/customers/${customerId}`, submitData);
        alert('Customer updated successfully!');
        router.push(`/customers/${customerId}`);
      } else {
        // Validate access requirements if enabled
        if (requireAccess && !accessWeb && !accessInApp) {
          alert('Please select at least one access type (Web or In-App)');
          return;
        }

        let response;
        
        // Use special endpoint if user access is required
        if (requireAccess && (accessWeb || accessInApp)) {
          const accessData = {
            customer: submitData,
            require_access: true,
            access_web: accessWeb,
            access_inapp: accessInApp,
            user_role: userRole
          };
          
          response = await api.post('/customers/with-access', accessData);
          companyId = response.data.customer._id || response.data.customer.id;
          
          // Show user credentials if account was created
          if (response.data.user_account) {
            const user = response.data.user_account;
            alert(
              `Customer created successfully with user access!\n\n` +
              `Username: ${user.username}\n` +
              `Password: ${user.password}\n` +
              `Role: ${user.role}\n` +
              `Access: ${accessWeb ? 'Web' : ''} ${accessWeb && accessInApp ? '&' : ''} ${accessInApp ? 'In-App' : ''}\n\n` +
              `${user.email_sent ? 'Credentials email sent to ' + user.email : 'Note: Email not configured'}`
            );
          }
        } else {
          // Normal customer creation without access
          response = await api.post('/customers', submitData);
          companyId = response.data._id || response.data.id;
        }

        // If company with main contact, create the contact as individual
        if (customerForm.customer_type === 'company' && customerForm.main_contact.first_name) {
          const contactName = `${customerForm.main_contact.first_name} ${customerForm.main_contact.last_name}`.trim();
          const contactData = {
            name: contactName,
            email: customerForm.main_contact.email,
            phone: customerForm.main_contact.phone,
            address, // Use same address as company
            customer_type: 'individual',
            company_id: companyId,
            company_name: customerForm.company_name,
            notes: `Position: ${customerForm.main_contact.position}`,
            active: true,
          };

          await api.post('/customers', contactData);
        }
        
        // Create site if toggle is ON
        if (createSite && siteName) {
          const siteData = {
            name: siteName,
            customer_id: companyId,
            address: address,
            street_address: customerForm.street_address,
            city: customerForm.city,
            province: customerForm.province,
            postal_code: customerForm.postal_code,
            country: customerForm.country,
            status: 'active',
            type: 'residential', // Default type
            notes: `Site created automatically with contact ${customerForm.first_name ? customerForm.first_name + ' ' + customerForm.last_name : customerForm.company_name}`,
          };
          
          try {
            await api.post('/sites', siteData);
            console.log('Site created successfully:', siteName);
          } catch (siteError) {
            console.error('Error creating site:', siteError);
            // Don't fail the whole operation if site creation fails
            alert(`Customer created, but site creation failed: ${siteError}`);
          }
        }

        if (!requireAccess) {
          const message = createSite && siteName 
            ? `Customer created successfully! Site "${siteName}" has been created.`
            : 'Customer created successfully!';
          alert(message);
        } else if (createSite && siteName) {
          alert(`Customer and site "${siteName}" created successfully!`);
        }
        router.push(`/customers/${companyId}`);
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      
      // Provide more specific error messages
      if (error.response?.status === 502) {
        alert('Failed to save customer: Request too large. Please try with fewer or smaller files (max 500KB each).');
      } else if (error.response?.status === 413) {
        alert('Failed to save customer: Request payload too large. Please reduce the number of files or use smaller files.');
      } else if (error.message) {
        alert(`Failed to save customer: ${error.message}`);
      } else {
        alert('Failed to save customer. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      );
  }

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title={isEdit ? 'Edit Customer' : 'New Customer'}
        breadcrumbs={[
          { label: 'Customers', href: '/customers' },
          { label: isEdit ? 'Edit' : 'New' }
        ]}
      />

      {/* Main Content */}
      <div className="h-full bg-gray-50 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Type Selection */}
              {!isEdit && (
                <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Type *</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleTypeSelection('individual')}
                        className={`p-8 border-2 rounded-xl transition-all hover:scale-105 ${
                          customerForm.customer_type === 'individual'
                            ? 'border-[#3f72af] bg-blue-50 shadow-lg'
                            : 'border-gray-300 hover:border-gray-400 hover:shadow-md bg-white'
                        }`}
                      >
                        <Users className="w-12 h-12 mx-auto mb-4 text-[#3f72af]" />
                        <p className="font-bold text-gray-900 text-xl">Contact</p>
                        <p className="text-sm text-gray-600 mt-2">Person or homeowner</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeSelection('company')}
                        className={`p-8 border-2 rounded-xl transition-all hover:scale-105 ${
                          customerForm.customer_type === 'company'
                            ? 'border-[#3f72af] bg-blue-50 shadow-lg'
                            : 'border-gray-300 hover:border-gray-400 hover:shadow-md bg-white'
                        }`}
                      >
                        <Building className="w-12 h-12 mx-auto mb-4 text-[#3f72af]" />
                        <p className="font-bold text-gray-900 text-xl">Company</p>
                        <p className="text-sm text-gray-600 mt-2">Business or organization</p>
                      </button>
                    </div>
                </div>
              )}

              {/* Individual Form */}
              {customerForm.customer_type === 'individual' && (
                <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-[#3f72af]" />
                        <span>Contact Information</span>
                      </div>
                      {/* Active Customer Toggle - label first, then toggle */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() => setCustomerForm({ ...customerForm, active: !customerForm.active })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 flex-shrink-0 ${
                            customerForm.active ? 'bg-[#3f72af]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              customerForm.active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={customerForm.first_name}
                          onChange={e =>
                            setCustomerForm({ ...customerForm, first_name: e.target.value })
                          }
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                            fieldErrors['first_name'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          placeholder="John"
                          required
                        />
                        {fieldErrors['first_name'] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors['first_name']}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={customerForm.last_name}
                          onChange={e =>
                            setCustomerForm({ ...customerForm, last_name: e.target.value })
                          }
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                            fieldErrors['last_name'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                          placeholder="Smith"
                          required
                        />
                        {fieldErrors['last_name'] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors['last_name']}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={customerForm.email}
                            onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                            onBlur={e => validateField('email', e.target.value)}
                            className={`w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                              fieldErrors['email'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="john@example.com"
                            required
                          />
                        </div>
                        {fieldErrors['email'] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors['email']}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            value={customerForm.phone}
                            onChange={e => handlePhoneChange('phone', e.target.value)}
                            className={`w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                              fieldErrors['phone'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            placeholder="(555) 123-4567"
                            required
                          />
                        </div>
                        {fieldErrors['phone'] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors['phone']}</p>
                        )}
                      </div>

                      {/* Communication Preference (Left) and Mobile Number (Right) - Side by Side */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Communication Preference
                        </label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="communication_preference"
                              value="sms"
                              checked={customerForm.communication_preference === 'sms'}
                              onChange={(e) => setCustomerForm({ ...customerForm, communication_preference: e.target.value })}
                              className="w-4 h-4 text-[#3f72af] border-gray-300 focus:ring-[#3f72af]"
                            />
                            <MessageSquare className="w-4 h-4 text-[#3f72af]" />
                            <span className="text-sm text-gray-700">SMS</span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="communication_preference"
                              value="inapp"
                              checked={customerForm.communication_preference === 'inapp'}
                              onChange={(e) => setCustomerForm({ ...customerForm, communication_preference: e.target.value })}
                              className="w-4 h-4 text-[#3f72af] border-gray-300 focus:ring-[#3f72af]"
                            />
                            <Bell className="w-4 h-4 text-[#3f72af]" />
                            <span className="text-sm text-gray-700">In-App</span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {customerForm.communication_preference === 'sms' 
                            ? 'Contact will receive SMS notifications (mobile number required)'
                            : 'Contact will receive in-app notifications only'}
                        </p>
                      </div>

                      {/* Mobile Number - On the right */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number {customerForm.communication_preference === 'sms' ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs">(Optional)</span>}
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="tel"
                              value={customerForm.mobile}
                              onChange={e => handlePhoneChange('mobile', e.target.value)}
                              className={`w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                                fieldErrors['mobile'] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                              }`}
                              placeholder="(555) 987-6543"
                              required={customerForm.communication_preference === 'sms'}
                            />
                          </div>
                          {customerForm.phone && (
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerForm({ ...customerForm, mobile: customerForm.phone });
                                // Clear any mobile field errors
                                setFieldErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors['mobile'];
                                  return newErrors;
                                });
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-[#3f72af] bg-blue-50 border border-[#3f72af] rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap flex items-center gap-1"
                              title="Copy phone number to mobile"
                            >
                              <Phone className="w-3 h-3" />
                              Copy from Phone
                            </button>
                          )}
                        </div>
                        {fieldErrors['mobile'] && (
                          <p className="text-red-500 text-xs mt-1">{fieldErrors['mobile']}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-3">
                          {/* Require Access Toggle - Moved to the left */}
                          <button
                            type="button"
                            onClick={() => {
                              const newRequireAccess = !requireAccess;
                              setRequireAccess(newRequireAccess);
                              if (!newRequireAccess) {
                                setAccessWeb(false);
                                setAccessInApp(false);
                                setUserRole('customer');
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 flex-shrink-0 ${
                              requireAccess ? 'bg-[#3f72af]' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                requireAccess ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Require Access
                          </label>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const newLinkCompany = !linkToCompany;
                              setLinkToCompany(newLinkCompany);
                              if (!newLinkCompany) {
                                setCustomerForm({ ...customerForm, company_id: '' });
                                setCompanySearch('');
                                setFilteredCompanies([]);
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 flex-shrink-0 ml-6 ${
                              linkToCompany ? 'bg-[#3f72af]' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                linkToCompany ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            Link to Company
                          </label>
                        
                        {/* Search bar opens here when Link to Company is ON */}
                        {linkToCompany && !customerForm.company_id && (
                          <div className="relative w-64 mx-3">
                            <div className="relative">
                              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={companySearch}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setCompanySearch(value);
                                  setShowSearchResults(true);
                                  const query = value.toLowerCase();
                                  if (query.length > 0) {
                                    const filtered = companies.filter(company =>
                                      company.name?.toLowerCase().includes(query)
                                    );
                                    setFilteredCompanies(filtered);
                                  } else {
                                    setFilteredCompanies([]);
                                  }
                                }}
                                onFocus={() => {
                                  setShowSearchResults(true);
                                  if (companySearch.length > 0) {
                                    const query = companySearch.toLowerCase();
                                    const filtered = companies.filter(company =>
                                      company.name?.toLowerCase().includes(query)
                                    );
                                    setFilteredCompanies(filtered);
                                  }
                                }}
                                onBlur={() => {
                                  // Delay to allow click on search results
                                  setTimeout(() => setShowSearchResults(false), 200);
                                }}
                                disabled={loadingCompanies}
                                className="w-full pl-8 pr-4 py-1 h-6 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder={loadingCompanies ? "Loading companies..." : "Search for a company..."}
                              />
                              {loadingCompanies && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3f72af]"></div>
                                </div>
                              )}
                            </div>
                            
                            {/* Search Results Dropdown */}
                            {showSearchResults && companySearch.length > 0 && !loadingCompanies && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredCompanies.length > 0 ? (
                                  filteredCompanies.map((company, index) => (
                                    <button
                                      key={company._id || company.id || `company-${index}`}
                                      type="button"
                                      onClick={() => {
                                        setCustomerForm({ ...customerForm, company_id: company._id || company.id });
                                        setCompanySearch(company.name);
                                        setFilteredCompanies([]);
                                        setShowSearchResults(false);
                                      }}
                                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center space-x-3 border-b last:border-b-0"
                                    >
                                      <Building className="w-5 h-5 text-[#3f72af] flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{company.name}</p>
                                        {company.email && (
                                          <p className="text-xs text-gray-500 truncate">{company.email}</p>
                                        )}
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-6 text-center">
                                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 font-medium">No companies found</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Try a different search term or create a new company first
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Selected Company Display - Inline with toggles */}
                        {linkToCompany && customerForm.company_id && companySearch && (
                          <div className="flex items-center gap-2 mx-3">
                            <div className="flex items-center bg-blue-50 border border-blue-200 rounded-md px-2 py-1 h-6">
                              <Building className="w-3 h-3 text-[#3f72af] mr-1" />
                              <span className="text-xs font-medium text-gray-700">{companySearch}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomerForm({ ...customerForm, company_id: '' });
                                setCompanySearch('');
                              }}
                              className="flex items-center justify-center w-6 h-6 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                              title="Remove company link"
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </button>
                          </div>
                        )}
                        </div>
                      </div>
                      
                      {/* Access Configuration - Shows when Require Access is ON */}
                      {requireAccess && (
                        <div className="md:col-span-2 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="space-y-4">
                            {/* Access Type Checkboxes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Access Type
                              </label>
                              <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={accessWeb}
                                    onChange={(e) => setAccessWeb(e.target.checked)}
                                    className="w-4 h-4 text-[#3f72af] border-gray-300 rounded focus:ring-[#3f72af]"
                                  />
                                  <Monitor className="w-4 h-4 text-[#3f72af]" />
                                  <span className="text-sm text-gray-700">Web</span>
                                </label>
                                
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={accessInApp}
                                    onChange={(e) => setAccessInApp(e.target.checked)}
                                    className="w-4 h-4 text-[#3f72af] border-gray-300 rounded focus:ring-[#3f72af]"
                                  />
                                  <Smartphone className="w-4 h-4 text-[#3f72af]" />
                                  <span className="text-sm text-gray-700">In-App</span>
                                </label>
                              </div>
                              {!accessWeb && !accessInApp && (
                                <p className="text-xs text-red-500 mt-2">
                                  Please select at least one access type
                                </p>
                              )}
                            </div>
                            
                            {/* User Role Dropdown */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                User Type / Role
                              </label>
                              <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                  value={userRole}
                                  onChange={(e) => setUserRole(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent text-sm"
                                >
                                  <option value="customer">Customer</option>
                                  <option value="employee">Employee</option>
                                  <option value="contractor">Contractor</option>
                                  <option value="manager">Manager</option>
                                  <option value="admin">Admin</option>
                                  <option value="viewer">Viewer (Read-Only)</option>
                                </select>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                User will receive an email with their login credentials
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Company Form */}
              {customerForm.customer_type === 'company' && (
                <div>
                  {/* Company Information */}
                  <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <Building className="w-5 h-5 text-[#3f72af]" />
                      <span>Company Information</span>
                    </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Legal Business Name *
                      </label>
                      <input
                        type="text"
                        value={customerForm.company_name}
                        onChange={e =>
                          setCustomerForm({ ...customerForm, company_name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ABC Corporation Ltd."
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Operating As
                      </label>
                      <input
                        type="text"
                        value={customerForm.operating_as}
                        onChange={e =>
                          setCustomerForm({ ...customerForm, operating_as: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ABC Services"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Office Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={customerForm.office_number}
                          onChange={e => setCustomerForm({ ...customerForm, office_number: e.target.value })}
                          className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={customerForm.email}
                          onChange={e =>
                            setCustomerForm({ ...customerForm, email: e.target.value })
                          }
                          className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="info@company.com"
                          required
                        />
                      </div>
                    </div>
                    </div>
                  </div>

                  {/* Company Address */}
                  <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-[#3f72af]" />
                      <span>Company Address *</span>
                    </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                      <input
                        type="text"
                        value={customerForm.street_address}
                        onChange={e =>
                          setCustomerForm({ ...customerForm, street_address: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123 Main Street"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={customerForm.city}
                        onChange={e =>
                          setCustomerForm({ ...customerForm, city: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Calgary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                      <select
                        value={customerForm.province}
                        onChange={e =>
                          setCustomerForm({ ...customerForm, province: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {CANADIAN_PROVINCES.map(prov => (
                          <option key={prov.code} value={prov.code}>
                            {prov.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                      <input
                        type="text"
                        value={customerForm.postal_code}
                        onChange={e =>
                          setCustomerForm({ ...customerForm, postal_code: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="T2P 1J9"
                        required
                      />
                    </div>
                    
                    {/* Billing Address Toggle */}
                    <div className="md:col-span-2 mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCustomerForm({ ...customerForm, billing_address_same: !customerForm.billing_address_same })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 flex-shrink-0 ${
                            customerForm.billing_address_same ? 'bg-[#3f72af]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              customerForm.billing_address_same ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <label className="text-sm font-medium text-gray-700">
                          Billing address same as company address
                        </label>
                      </div>
                    </div>
                    
                    {/* Billing Address Fields */}
                    {!customerForm.billing_address_same && (
                      <>
                        <div className="md:col-span-2 mt-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Billing Address</h3>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                          <input
                            type="text"
                            value={customerForm.billing_address.street_address}
                            onChange={e =>
                              setCustomerForm({
                                ...customerForm,
                                billing_address: { ...customerForm.billing_address, street_address: e.target.value }
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="456 Billing Street"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                          <input
                            type="text"
                            value={customerForm.billing_address.city}
                            onChange={e =>
                              setCustomerForm({
                                ...customerForm,
                                billing_address: { ...customerForm.billing_address, city: e.target.value }
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Calgary"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Province *</label>
                          <select
                            value={customerForm.billing_address.province}
                            onChange={e =>
                              setCustomerForm({
                                ...customerForm,
                                billing_address: { ...customerForm.billing_address, province: e.target.value }
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          >
                            {CANADIAN_PROVINCES.map(prov => (
                              <option key={prov.code} value={prov.code}>
                                {prov.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                          <input
                            type="text"
                            value={customerForm.billing_address.postal_code}
                            onChange={e =>
                              setCustomerForm({
                                ...customerForm,
                                billing_address: { ...customerForm.billing_address, postal_code: e.target.value }
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="T2P 1J9"
                            required
                          />
                        </div>
                      </>
                    )}
                    </div>
                  </div>

                  {/* Contact Persons */}
                  <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                      <Users className="w-5 h-5 text-[#3f72af]" />
                      <span>Contact Persons *</span>
                    </h2>

                    {/* Same Person Toggle */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCustomerForm({ ...customerForm, same_person_all_contacts: !customerForm.same_person_all_contacts })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 flex-shrink-0 ${
                            customerForm.same_person_all_contacts ? 'bg-[#3f72af]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              customerForm.same_person_all_contacts ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <label className="text-sm font-medium text-gray-700">
                          All positions are the same person
                        </label>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {customerForm.contacts.map((contact, index) => (
                        <div key={index} className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2 text-[#3f72af]" />
                            <span>{contact.position}</span>
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name {index === 0 || !customerForm.same_person_all_contacts ? '*' : ''}
                              </label>
                              <input
                                type="text"
                                value={contact.name}
                                onChange={e => {
                                  const newContacts = [...customerForm.contacts];
                                  newContacts[index].name = e.target.value;
                                  if (customerForm.same_person_all_contacts && index === 0) {
                                    newContacts[1].name = e.target.value;
                                    newContacts[2].name = e.target.value;
                                  }
                                  setCustomerForm({ ...customerForm, contacts: newContacts });
                                }}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                                  fieldErrors[`contact_${index}_name`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                placeholder="John Doe"
                                required={index === 0 || !customerForm.same_person_all_contacts}
                                disabled={customerForm.same_person_all_contacts && index !== 0}
                              />
                              {fieldErrors[`contact_${index}_name`] && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors[`contact_${index}_name`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email {index === 0 || !customerForm.same_person_all_contacts ? '*' : ''}
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="email"
                                  value={contact.email}
                                  onChange={e => {
                                    const newContacts = [...customerForm.contacts];
                                    newContacts[index].email = e.target.value;
                                    if (customerForm.same_person_all_contacts && index === 0) {
                                      newContacts[1].email = e.target.value;
                                      newContacts[2].email = e.target.value;
                                    }
                                    setCustomerForm({ ...customerForm, contacts: newContacts });
                                  }}
                                  onBlur={e => handleContactEmailBlur(index, e.target.value)}
                                  className={`w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                                    fieldErrors[`contact_${index}_email`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                  }`}
                                  placeholder="john@company.com"
                                  required={index === 0 || !customerForm.same_person_all_contacts}
                                  disabled={customerForm.same_person_all_contacts && index !== 0}
                                />
                              </div>
                              {fieldErrors[`contact_${index}_email`] && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors[`contact_${index}_email`]}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone {index === 0 || !customerForm.same_person_all_contacts ? '*' : ''}
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type="tel"
                                  value={contact.phone}
                                  onChange={e => handleContactPhoneChange(index, e.target.value)}
                                  className={`w-full pl-10 pr-4 py-1.5 border rounded-lg focus:ring-2 focus:border-transparent text-sm ${
                                    fieldErrors[`contact_${index}_phone`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                  }`}
                                  placeholder="(555) 123-4567"
                                  required={index === 0 || !customerForm.same_person_all_contacts}
                                  disabled={customerForm.same_person_all_contacts && index !== 0}
                                />
                              </div>
                              {fieldErrors[`contact_${index}_phone`] && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors[`contact_${index}_phone`]}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                {/* Company Accounting */}
                <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-[#3f72af]" />
                    <span>Accounting Information</span>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Number
                      </label>
                      <input
                        type="text"
                        value={customerForm.accounting.business_number}
                        onChange={e =>
                          setCustomerForm({
                            ...customerForm,
                            accounting: { ...customerForm.accounting, business_number: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123456789RC0001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Terms
                      </label>
                      <select
                        value={customerForm.accounting.payment_terms}
                        onChange={e =>
                          setCustomerForm({
                            ...customerForm,
                            accounting: {
                              ...customerForm.accounting,
                              payment_terms: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="due_on_receipt">Due on Receipt</option>
                        <option value="net_15">Net 15</option>
                        <option value="net_30">Net 30</option>
                        <option value="net_45">Net 45</option>
                        <option value="net_60">Net 60</option>
                      </select>
                    </div>

                    {/* Credit Limit Toggle */}
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          type="button"
                          onClick={() => setCustomerForm({
                            ...customerForm,
                            accounting: {
                              ...customerForm.accounting,
                              credit_limit_enabled: !customerForm.accounting.credit_limit_enabled
                            }
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 flex-shrink-0 ${
                            customerForm.accounting.credit_limit_enabled ? 'bg-[#3f72af]' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              customerForm.accounting.credit_limit_enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <label className="text-sm font-medium text-gray-700">
                          Set Credit Limit
                        </label>
                      </div>
                    </div>

                    {customerForm.accounting.credit_limit_enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Credit Limit Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={customerForm.accounting.credit_limit}
                            onChange={e =>
                              setCustomerForm({
                                ...customerForm,
                                accounting: {
                                  ...customerForm.accounting,
                                  credit_limit: e.target.value,
                                },
                              })
                            }
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="10000.00"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Payment Method
                      </label>
                      <select
                        value={customerForm.accounting.preferred_payment_method}
                        onChange={e =>
                          setCustomerForm({
                            ...customerForm,
                            accounting: {
                              ...customerForm.accounting,
                              preferred_payment_method: e.target.value,
                            },
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="e_transfer">E-Transfer</option>
                        <option value="direct_debit">Direct Debit</option>
                        <option value="check">Check</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customerForm.accounting.po_required}
                          onChange={e =>
                            setCustomerForm({
                              ...customerForm,
                              accounting: {
                                ...customerForm.accounting,
                                po_required: e.target.checked,
                              },
                            })
                          }
                          className="w-5 h-5 text-[#3f72af] rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Purchase Order Required
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Sites Section - Only show for companies, only after creation */}
                {isEdit && (
                  <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-[#3f72af]" />
                        <span>Sites</span>
                      </h2>
                      <button
                        type="button"
                        onClick={() => router.push(`/sites/create?company_id=${customerId}`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#3f72af] text-white rounded-lg hover:bg-[#2c5282] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Site</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Manage service locations for this company. Sites can be added after the company is created.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Address Section (Common for both) */}
            <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-[#3f72af]" />
                  <span>Address *</span>
                </div>
                {/* Create Site Toggle - label first, then toggle */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Create Site
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateSite(!createSite);
                      if (createSite) {
                        setSiteName('');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 flex-shrink-0 ${
                      createSite ? 'bg-[#3f72af]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        createSite ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </h2>
              
              {/* Site Name Field - appears below header when Create Site is ON */}
              {createSite && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name *
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={e => setSiteName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3f72af] focus:border-transparent"
                    placeholder="Main Office, Warehouse, Home, etc."
                    required={createSite}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Site will be created with the address information below
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <div className="relative">
                    <input
                      ref={addressInputRef}
                      type="text"
                      value={customerForm.street_address}
                      onChange={e =>
                        setCustomerForm({ ...customerForm, street_address: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="123 Main Street"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                      <img 
                        src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" 
                        alt="Powered by Google"
                        className="h-4"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Start typing to use Google address autocomplete
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    value={customerForm.city}
                    onChange={e => setCustomerForm({ ...customerForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Calgary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>
                  <select
                    value={customerForm.province}
                    onChange={e => setCustomerForm({ ...customerForm, province: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {CANADIAN_PROVINCES.map(prov => (
                      <option key={prov.code} value={prov.code}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={customerForm.postal_code}
                    onChange={e =>
                      setCustomerForm({ ...customerForm, postal_code: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="T2P 1J9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                  <input
                    type="text"
                    value={customerForm.country}
                    onChange={e => setCustomerForm({ ...customerForm, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    placeholder="Canada"
                    readOnly
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white/60 rounded-2xl shadow-lg shadow-sm border border-white/40 p-8 backdrop-blur-sm hover:shadow-md transition-shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#3f72af]" />
                <span>Additional Information</span>
              </h2>

              <div className="space-y-6">
                {/* File Upload Section */}
                <div>
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Paperclip className="w-5 h-5 mr-2 text-[#3f72af]" />
                      <span>Documents & Photos</span>
                    </h3>
                    
                    {/* Upload Button */}
                    <div className="mb-4">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#3f72af] text-white text-sm font-medium rounded-lg hover:bg-[#2f5a8f] transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Upload Files</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload documents, photos, contracts, etc. (Max 500KB per file)
                      </p>
                    </div>
                    
                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#3f72af] transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIcon(file.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="flex-shrink-0 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                              title="Remove file"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {uploadedFiles.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No files uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes Section */}
                <div>
                  <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
                    <textarea
                      value={customerForm.notes}
                      onChange={e => setCustomerForm({ ...customerForm, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Any additional information about this customer..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.push('/customers')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-[#3f72af] text-white rounded-lg hover:bg-[#2f5a8f] focus:outline-none focus:ring-2 focus:ring-[#3f72af] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Create Customer
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate Customer Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Potential Duplicate Customer Found</h2>
                  <p className="text-white/90 mt-1">
                    We found {duplicates.length} customer{duplicates.length > 1 ? 's' : ''} that might match
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="space-y-4">
                {duplicates.map((dup, index) => (
                  <div 
                    key={dup.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{dup.name}</h3>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {dup.customer_type === 'company' ? 'Company' : 'Individual'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{dup.email || 'No email'}</span>
                            {dup.match_reason.includes('email') && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">Match</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{dup.phone || 'No phone'}</span>
                            {dup.match_reason.includes('phone') && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">Match</span>
                            )}
                          </div>
                          
                          {dup.address && (
                            <div className="flex items-center gap-2 md:col-span-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">{dup.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          window.open(`/customers/${dup.id}`, '_blank');
                        }}
                        className="ml-4 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Review carefully before proceeding</p>
                    <p>
                      If this is a new customer with similar information, click "Create Anyway". 
                      Otherwise, use the existing customer record to avoid duplicates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-6 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicates([]);
                  setSaving(false);
                }}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicates([]);
                  setSkipDuplicateCheck(true);
                  // Trigger form submission after setting skip flag
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) {
                      form.requestSubmit();
                    }
                  }, 100);
                }}
                className="px-6 py-2.5 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
              >
                Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
