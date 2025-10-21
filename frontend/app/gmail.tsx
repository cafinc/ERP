import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';
import { GmailEmail, GmailLabel } from '../types';
import EmailDetailView from '../components/EmailDetailView';
import WebAdminLayout from '../components/WebAdminLayout';
import EnhancedHeader from '../components/EnhancedHeader';
import { Colors } from '../utils/theme';
import api from '../utils/api';

interface AutoLabelRule {
  id: string;
  name: string;
  condition_type: 'from' | 'to' | 'subject' | 'contains';
  condition_value: string;
  label_ids: string[];
  active: boolean;
}

export default function GmailInterface() {
  const CACHE_BUST_VERSION = Date.now(); // Unique timestamp
  console.log(`🟢🟢🟢 GMAIL LOADED - CACHE BUST VERSION: ${CACHE_BUST_VERSION} 🟢🟢🟢`);
  console.log('🟢 NGROK DIRECT URL TEST - IF YOU SEE THIS, CACHING IS FIXED!');
  console.log('🔴 SIDEBAR STYLE:', StyleSheet.flatten(styles.sidebarMini));
  const { gmailEmails, refreshGmailEmails } = useMessaging();
  const { currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  
  const showMiniSidebar = !isDesktop;

  // Local state for emails with optimistic updates - initialize properly
  const [localEmails, setLocalEmails] = useState<GmailEmail[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Track all optimistic changes in one object for consistency
  const [optimisticChanges, setOptimisticChanges] = useState<{
    read: Set<string>;
    starred: Set<string>;
    unstarred: Set<string>;
    deleted: Set<string>;
    archived: Set<string>;
  }>({
    read: new Set(),
    starred: new Set(),
    unstarred: new Set(),
    deleted: new Set(),
    archived: new Set(),
  });

  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showCompose, setShowCompose] = useState(false);
  const [showFolderDrawer, setShowFolderDrawer] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [parentLabel, setParentLabel] = useState<string>('');
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [labelMenuEmail, setLabelMenuEmail] = useState<GmailEmail | null>(null);
  const [labelToDelete, setLabelToDelete] = useState<GmailLabel | null>(null);
  const [showDeleteLabelConfirm, setShowDeleteLabelConfirm] = useState(false);
  
  // Auto-labeling rules
  const [showAutoLabelRules, setShowAutoLabelRules] = useState(false);
  const [autoLabelRules, setAutoLabelRules] = useState<AutoLabelRule[]>([]);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleConditionType, setNewRuleConditionType] = useState<'from' | 'to' | 'subject' | 'contains'>('from');
  const [newRuleConditionValue, setNewRuleConditionValue] = useState('');
  const [newRuleLabels, setNewRuleLabels] = useState<string[]>([]);
  
  // Batch operations
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    fetchLabels();
    fetchAutoLabelRules();
  }, []);

  useEffect(() => {
    refreshGmailEmails();
  }, []);

  // Load optimistic changes from localStorage on mount (client-side only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('gmailOptimisticChanges');
        if (stored) {
          const parsed = JSON.parse(stored);
          setOptimisticChanges({
            read: new Set(parsed.read || []),
            starred: new Set(parsed.starred || []),
            unstarred: new Set(parsed.unstarred || []),
            deleted: new Set(parsed.deleted || []),
            archived: new Set(parsed.archived || []),
          });
        }
      } catch (error) {
        console.error('Error loading optimistic changes:', error);
      }
    }
  }, []);

  // Persist optimistic changes to localStorage
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      try {
        const toStore = {
          read: Array.from(optimisticChanges.read),
          starred: Array.from(optimisticChanges.starred),
          unstarred: Array.from(optimisticChanges.unstarred),
          deleted: Array.from(optimisticChanges.deleted),
          archived: Array.from(optimisticChanges.archived),
        };
        localStorage.setItem('gmailOptimisticChanges', JSON.stringify(toStore));
      } catch (error) {
        console.error('Error saving optimistic changes:', error);
      }
    }
  }, [optimisticChanges]);

  // Apply optimistic changes to emails - THIS IS THE KEY FIX
  const applyOptimisticChanges = (emails: GmailEmail[]) => {
    return emails
      .filter(email => !optimisticChanges.deleted.has(email.id) && !optimisticChanges.archived.has(email.id))
      .map(email => {
        let updated = { ...email };
        
        // Apply read status
        if (optimisticChanges.read.has(email.id)) {
          updated.is_unread = false;
        }
        
        // Apply star status
        if (optimisticChanges.starred.has(email.id)) {
          updated.is_starred = true;
        }
        if (optimisticChanges.unstarred.has(email.id)) {
          updated.is_starred = false;
        }
        
        return updated;
      });
  };

  // Sync localEmails with gmailEmails and apply optimistic changes
  useEffect(() => {
    console.log('🔵 Gmail sync effect triggered:', {
      gmailEmailsCount: gmailEmails.length,
      localEmailsCount: localEmails.length,
      isInitialized
    });
    
    if (gmailEmails.length > 0) {
      // Apply optimistic changes to fresh emails from server
      const withOptimisticChanges = applyOptimisticChanges(gmailEmails);
      
      console.log('🔵 After applying optimistic changes:', {
        originalCount: gmailEmails.length,
        afterOptimisticCount: withOptimisticChanges.length,
        optimisticRead: optimisticChanges.read.size,
        optimisticDeleted: optimisticChanges.deleted.size,
        optimisticArchived: optimisticChanges.archived.size
      });
      
      // Clean up optimistic changes that are now confirmed by server
      const newOptimisticChanges = { ...optimisticChanges };
      let hasChanges = false;
      
      gmailEmails.forEach(email => {
        // If server confirms it's read, remove from optimistic read set
        if (!email.is_unread && optimisticChanges.read.has(email.id)) {
          newOptimisticChanges.read.delete(email.id);
          hasChanges = true;
        }
        
        // If server confirms it's starred, remove from optimistic starred set
        if (email.is_starred && optimisticChanges.starred.has(email.id)) {
          newOptimisticChanges.starred.delete(email.id);
          hasChanges = true;
        }
        
        // If server confirms it's not starred, remove from optimistic unstarred set
        if (!email.is_starred && optimisticChanges.unstarred.has(email.id)) {
          newOptimisticChanges.unstarred.delete(email.id);
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        setOptimisticChanges(newOptimisticChanges);
      }
      
      setLocalEmails(withOptimisticChanges);
      setIsInitialized(true);
      
      console.log('🔵 Local emails updated:', withOptimisticChanges.length);
    } else if (gmailEmails.length === 0 && !isInitialized) {
      // Empty inbox - still mark as initialized
      console.log('🔵 Empty inbox, marking as initialized');
      setLocalEmails([]);
      setIsInitialized(true);
    }
  }, [gmailEmails]);

  const fetchLabels = async () => {
    try {
      const response = await api.get('/gmail/labels');
      setLabels(response.data.labels || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const fetchAutoLabelRules = async () => {
    try {
      const response = await api.get('/gmail/auto-label-rules');
      setAutoLabelRules(response.data.rules || []);
    } catch (error) {
      console.error('Error fetching auto-label rules:', error);
    }
  };

  const handleDeleteLabel = async (label: GmailLabel) => {
    try {
      await api.delete(`/gmail/labels/${label.id}`);
      Alert.alert('Success', 'Label deleted successfully');
      fetchLabels();
      setShowDeleteLabelConfirm(false);
      setLabelToDelete(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete label');
    }
  };

  const handleStarToggle = async (email: GmailEmail, e: any) => {
    e.stopPropagation();
    
    const messageId = email.message_id || email.id;
    const isStarring = !email.is_starred;
    
    // Optimistic update
    if (isStarring) {
      setOptimisticChanges(prev => ({
        ...prev,
        starred: new Set(prev.starred).add(email.id),
        unstarred: (() => { const s = new Set(prev.unstarred); s.delete(email.id); return s; })()
      }));
    } else {
      setOptimisticChanges(prev => ({
        ...prev,
        unstarred: new Set(prev.unstarred).add(email.id),
        starred: (() => { const s = new Set(prev.starred); s.delete(email.id); return s; })()
      }));
    }
    
    setLocalEmails(prev => prev.map(e => 
      e.id === email.id ? { ...e, is_starred: isStarring } : e
    ));
    
    try {
      if (isStarring) {
        await api.post(`/gmail/star/${messageId}`);
      } else {
        await api.post(`/gmail/unstar/${messageId}`);
      }
      setTimeout(() => refreshGmailEmails(), 1000);
    } catch (error) {
      console.error('Error toggling star:', error);
      // Revert on error
      if (isStarring) {
        setOptimisticChanges(prev => {
          const newStarred = new Set(prev.starred);
          newStarred.delete(email.id);
          return { ...prev, starred: newStarred };
        });
      } else {
        setOptimisticChanges(prev => {
          const newUnstarred = new Set(prev.unstarred);
          newUnstarred.delete(email.id);
          return { ...prev, unstarred: newUnstarred };
        });
      }
      setLocalEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, is_starred: !isStarring } : e
      ));
    }
  };

  const handleApplyLabels = async (email: GmailEmail, labelIds: string[]) => {
    try {
      await api.post('/gmail/labels/add', {
        message_id: email.message_id || email.id,
        label_ids: labelIds
      });
      Alert.alert('Success', 'Labels applied successfully');
      refreshGmailEmails();
      setShowLabelMenu(false);
      setLabelMenuEmail(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to apply labels');
    }
  };

  const handleCreateAutoLabelRule = async () => {
    if (!newRuleName.trim() || !newRuleConditionValue.trim() || newRuleLabels.length === 0) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await api.post('/gmail/auto-label-rules', {
        name: newRuleName,
        condition_type: newRuleConditionType,
        condition_value: newRuleConditionValue,
        label_ids: newRuleLabels
      });
      Alert.alert('Success', 'Auto-label rule created successfully');
      fetchAutoLabelRules();
      setShowCreateRule(false);
      setNewRuleName('');
      setNewRuleConditionValue('');
      setNewRuleLabels([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create rule');
    }
  };

  const handleDeleteAutoLabelRule = async (ruleId: string) => {
    try {
      await api.delete(`/gmail/auto-label-rules/${ruleId}`);
      Alert.alert('Success', 'Rule deleted successfully');
      fetchAutoLabelRules();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete rule');
    }
  };

  const handleApplyAutoLabelRules = async () => {
    try {
      setLoading(true);
      const response = await api.post('/gmail/apply-auto-label-rules');
      Alert.alert('Success', response.data.message);
      refreshGmailEmails();
    } catch (error) {
      Alert.alert('Error', 'Failed to apply rules');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedEmails.size === 0) return;
    
    Alert.alert(
      'Delete Emails',
      `Delete ${selectedEmails.size} selected emails?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const emailsToDelete = filteredEmails.filter(e => selectedEmails.has(e.id));
            
            // Optimistic update - hide emails immediately
            setOptimisticChanges(prev => {
              const newDeleted = new Set(prev.deleted);
              emailsToDelete.forEach(e => newDeleted.add(e.id));
              return { ...prev, deleted: newDeleted };
            });
            
            setLocalEmails(prev => prev.filter(e => !selectedEmails.has(e.id)));
            
            try {
              for (const email of emailsToDelete) {
                await api.post(`/gmail/delete/${email.message_id || email.id}`);
              }
              Alert.alert('Success', 'Emails deleted successfully');
              setSelectedEmails(new Set());
              setSelectionMode(false);
              setTimeout(() => refreshGmailEmails(), 1000);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete emails');
              // Revert on error
              setOptimisticChanges(prev => {
                const newDeleted = new Set(prev.deleted);
                emailsToDelete.forEach(e => newDeleted.delete(e.id));
                return { ...prev, deleted: newDeleted };
              });
              refreshGmailEmails();
            }
          }
        }
      ]
    );
  };

  const handleBatchArchive = async () => {
    if (selectedEmails.size === 0) return;
    
    const emailsToArchive = filteredEmails.filter(e => selectedEmails.has(e.id));
    
    // Optimistic update
    setOptimisticChanges(prev => {
      const newArchived = new Set(prev.archived);
      emailsToArchive.forEach(e => newArchived.add(e.id));
      return { ...prev, archived: newArchived };
    });
    
    setLocalEmails(prev => prev.filter(e => !selectedEmails.has(e.id)));
    
    try {
      for (const email of emailsToArchive) {
        await api.post(`/gmail/archive/${email.message_id || email.id}`);
      }
      Alert.alert('Success', 'Emails archived successfully');
      setSelectedEmails(new Set());
      setSelectionMode(false);
      setTimeout(() => refreshGmailEmails(), 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to archive emails');
      // Revert on error
      setOptimisticChanges(prev => {
        const newArchived = new Set(prev.archived);
        emailsToArchive.forEach(e => newArchived.delete(e.id));
        return { ...prev, archived: newArchived };
      });
      refreshGmailEmails();
    }
  };

  const handleBatchMarkAsRead = async () => {
    if (selectedEmails.size === 0) return;
    
    const emailsToMark = filteredEmails.filter(e => selectedEmails.has(e.id));
    
    // Optimistic update
    setOptimisticChanges(prev => {
      const newRead = new Set(prev.read);
      emailsToMark.forEach(e => newRead.add(e.id));
      return { ...prev, read: newRead };
    });
    
    setLocalEmails(prev => prev.map(e => 
      selectedEmails.has(e.id) ? { ...e, is_unread: false } : e
    ));
    
    try {
      for (const email of emailsToMark) {
        await api.post(`/gmail/mark-read/${email.message_id || email.id}`);
      }
      Alert.alert('Success', 'Emails marked as read');
      setSelectedEmails(new Set());
      setSelectionMode(false);
      setTimeout(() => refreshGmailEmails(), 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to mark emails as read');
      // Revert on error
      setOptimisticChanges(prev => {
        const newRead = new Set(prev.read);
        emailsToMark.forEach(e => newRead.delete(e.id));
        return { ...prev, read: newRead };
      });
      refreshGmailEmails();
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(emailId)) {
      newSelection.delete(emailId);
    } else {
      newSelection.add(emailId);
    }
    setSelectedEmails(newSelection);
  };

  // Organize labels into hierarchy
  const organizeLabels = () => {
    const userLabels = labels.filter(l => l.type === 'user');
    const organized: { [key: string]: { label: GmailLabel; children: GmailLabel[] } } = {};
    const topLevel: GmailLabel[] = [];

    userLabels.forEach(label => {
      if (label.name.includes('/')) {
        const parts = label.name.split('/');
        const parentName = parts[0];
        
        if (!organized[parentName]) {
          organized[parentName] = {
            label: {
              id: `parent_${parentName}`,
              name: parentName,
              type: 'user',
              message_list_visibility: 'show',
              label_list_visibility: 'labelShow',
            },
            children: []
          };
        }
        organized[parentName].children.push(label);
      } else {
        if (!organized[label.name]) {
          organized[label.name] = {
            label: label,
            children: []
          };
        } else {
          organized[label.name].label = label;
        }
      }
    });

    return Object.values(organized);
  };

  const handleEmailClick = async (email: GmailEmail) => {
    if (selectionMode) {
      toggleEmailSelection(email.id);
    } else {
      setSelectedEmail(email);
      
      // Mark email as read when opened
      if (email.is_unread) {
        // Add to optimistic changes immediately
        setOptimisticChanges(prev => ({
          ...prev,
          read: new Set(prev.read).add(email.id)
        }));
        
        // Update local emails immediately
        setLocalEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, is_unread: false } : e
        ));
        
        try {
          await api.post(`/gmail/mark-read/${email.message_id || email.id}`);
          // Refresh in background
          setTimeout(() => refreshGmailEmails(), 1000);
        } catch (error) {
          console.error('Error marking email as read:', error);
          // Revert on error
          setOptimisticChanges(prev => {
            const newRead = new Set(prev.read);
            newRead.delete(email.id);
            return { ...prev, read: newRead };
          });
          setLocalEmails(prev => prev.map(e => 
            e.id === email.id ? { ...e, is_unread: true } : e
          ));
        }
      }
      
      // Only show modal on mobile, desktop shows in preview pane
      if (!isDesktop) {
        setShowEmailDetail(true);
      }
    }
  };

  // Enhanced helper function to strip HTML tags and decode entities
  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/&apos;/g, "'");
    
    // Remove excessive whitespace and newlines
    text = text.replace(/\s+/g, ' ').trim();
    
    // Remove long URLs (keep first 50 chars + ...)
    text = text.replace(/(https?:\/\/[^\s]{50,})/g, (match) => match.substring(0, 50) + '...');
    
    // Limit total length to avoid displaying huge blocks of text
    if (text.length > 500) {
      text = text.substring(0, 500) + '...';
    }
    
    return text;
  };

  const handleCompose = async () => {
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setSending(true);
      const response = await api.post('/gmail/send', {
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Email sent successfully!');
        setShowCompose(false);
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        refreshGmailEmails();
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const filterEmails = () => {
    let filtered = localEmails;

    if (searchQuery) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by folder/label
    if (selectedFolder === 'unread') {
      filtered = filtered.filter(email => email.is_unread);
    } else if (selectedFolder === 'starred') {
      filtered = filtered.filter(email => email.is_starred);
    } else if (selectedFolder !== 'inbox' && selectedFolder !== 'all') {
      // Filter by label
      filtered = filtered.filter(email => 
        email.labels && email.labels.includes(selectedFolder)
      );
    }

    return filtered;
  };

  const filteredEmails = filterEmails();

  const getInitials = (emailStr: string): string => {
    const name = emailStr.includes('<') ? emailStr.split('<')[0].trim() : emailStr.split('@')[0];
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      }
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  const renderEmailItem = ({ item }: { item: GmailEmail }) => (
    <TouchableOpacity
      style={[
        styles.emailItem, 
        item.is_unread && styles.emailItemUnread,
        selectedEmails.has(item.id) && styles.emailItemSelected
      ]}
      onPress={() => handleEmailClick(item)}
      onLongPress={() => {
        setSelectionMode(true);
        toggleEmailSelection(item.id);
      }}
      activeOpacity={0.7}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={(e) => {
            e.stopPropagation();
            toggleEmailSelection(item.id);
          }}
        >
          <Ionicons 
            name={selectedEmails.has(item.id) ? "checkbox" : "square-outline"} 
            size={24} 
            color={selectedEmails.has(item.id) ? Colors.primary : Colors.textSecondary} 
          />
        </TouchableOpacity>
      )}

      {/* Star Icon */}
      <TouchableOpacity 
        style={styles.starButton}
        onPress={(e) => handleStarToggle(item, e)}
      >
        <Ionicons 
          name={item.is_starred ? "star" : "star-outline"} 
          size={20} 
          color={item.is_starred ? Colors.warning : Colors.textSecondary} 
        />
      </TouchableOpacity>

      {/* Sender Avatar/Initial */}
      <View style={[styles.emailAvatar, item.is_unread && styles.emailAvatarUnread]}>
        <Text style={styles.avatarText}>{getInitials(item.from)}</Text>
      </View>

      {/* Email Content */}
      <View style={styles.emailContent}>
        <View style={styles.emailMainRow}>
          <View style={styles.emailLeft}>
            <Text 
              style={[styles.emailSender, item.is_unread && styles.textBold]} 
              numberOfLines={1}
            >
              {item.from.includes('<') ? item.from.split('<')[0].trim() : item.from.split('@')[0]}
            </Text>
            {item.is_unread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.emailDate}>{formatDate(item.date)}</Text>
        </View>
        
        <Text 
          style={[styles.emailSubject, item.is_unread && styles.textBold]} 
          numberOfLines={1}
        >
          {item.subject || '(No subject)'}
        </Text>

        {/* Labels display */}
        {item.labels && item.labels.length > 0 && (
          <View style={styles.emailLabels}>
            {item.labels.slice(0, 3).map((labelId) => {
              const label = labels.find(l => l.id === labelId);
              if (!label || label.type === 'system') return null;
              return (
                <View key={labelId} style={styles.labelChip}>
                  <Ionicons name="pricetag" size={10} color={Colors.primary} />
                  <Text style={styles.labelChipText}>{label.name}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Attachment indicator */}
      {item.has_attachments && (
        <View style={styles.attachmentIndicator}>
          <Ionicons name="attach" size={16} color={Colors.textSecondary} />
        </View>
      )}

      {/* Label menu button */}
      {!selectionMode && (
        <TouchableOpacity 
          style={styles.labelMenuButton}
          onPress={(e) => {
            e.stopPropagation();
            setLabelMenuEmail(item);
            setShowLabelMenu(true);
          }}
        >
          <Ionicons name="pricetag-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // Render the Gmail content
  const gmailContent = (
    <View style={styles.fullContainer}>
      <View style={styles.mainContent}>
        {/* Gmail Sidebar */}
        <ScrollView style={styles.sidebarMini} showsVerticalScrollIndicator={false}>
          {/* Inbox Header with Gmail Logo */}
          <View style={styles.inboxHeader}>
            <View style={styles.inboxTitleRow}>
              <Ionicons name="mail" size={24} color="#EA4335" />
              <Text style={styles.inboxTitle}>Gmail</Text>
            </View>
            <Text style={styles.inboxCount}>{filteredEmails.length}</Text>
          </View>

          <TouchableOpacity 
            style={styles.composeButtonMini}
            onPress={() => setShowCompose(true)}
          >
            <Ionicons name="create" size={20} color={Colors.white} />
            <Text style={styles.composeButtonMiniText}>Compose</Text>
          </TouchableOpacity>

          {/* Main Folders */}
          <TouchableOpacity
            style={[styles.navItem, selectedFolder === 'inbox' && styles.navItemActive]}
            onPress={() => setSelectedFolder('inbox')}
          >
            <Ionicons 
              name="mail" 
              size={20} 
              color={selectedFolder === 'inbox' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[styles.navItemText, selectedFolder === 'inbox' && styles.navItemTextActive]}>
              Inbox
            </Text>
            {localEmails.length > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{localEmails.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, selectedFolder === 'starred' && styles.navItemActive]}
            onPress={() => setSelectedFolder('starred')}
          >
            <Ionicons name="star" size={20} color={selectedFolder === 'starred' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.navItemText, selectedFolder === 'starred' && styles.navItemTextActive]}>
              Starred
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, selectedFolder === 'unread' && styles.navItemActive]}
            onPress={() => setSelectedFolder('unread')}
          >
            <Ionicons name="mail-unread" size={20} color={selectedFolder === 'unread' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.navItemText, selectedFolder === 'unread' && styles.navItemTextActive]}>
              Unread
            </Text>
            {localEmails.filter(e => e.is_unread).length > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{localEmails.filter(e => e.is_unread).length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, selectedFolder === 'sent' && styles.navItemActive]}
            onPress={() => setSelectedFolder('sent')}
          >
            <Ionicons name="send" size={20} color={selectedFolder === 'sent' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.navItemText, selectedFolder === 'sent' && styles.navItemTextActive]}>
              Sent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, selectedFolder === 'drafts' && styles.navItemActive]}
            onPress={() => setSelectedFolder('drafts')}
          >
            <Ionicons name="document" size={20} color={selectedFolder === 'drafts' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.navItemText, selectedFolder === 'drafts' && styles.navItemTextActive]}>
              Drafts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, selectedFolder === 'trash' && styles.navItemActive]}
            onPress={() => setSelectedFolder('trash')}
          >
            <Ionicons name="trash" size={20} color={selectedFolder === 'trash' ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.navItemText, selectedFolder === 'trash' && styles.navItemTextActive]}>
              Trash
            </Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />

          {/* Labels Section */}
          <View style={styles.labelsHeader}>
            <Text style={styles.labelsTitle}>Labels</Text>
            <View style={styles.labelHeaderActions}>
              <TouchableOpacity onPress={() => setShowCreateLabel(true)}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAutoLabelRules(true)} style={{ marginLeft: 8 }}>
                <Ionicons name="settings-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* User Labels */}
          {organizeLabels().map((item) => (
            <View key={item.label.id}>
              {/* Parent/Top-level label */}
              <View style={styles.labelItemContainer}>
                <TouchableOpacity
                  style={[styles.navItem, selectedFolder === item.label.id && styles.navItemActive]}
                  onPress={() => {
                    if (item.children.length > 0) {
                      const newExpanded = new Set(expandedLabels);
                      if (newExpanded.has(item.label.name)) {
                        newExpanded.delete(item.label.name);
                      } else {
                        newExpanded.add(item.label.name);
                      }
                      setExpandedLabels(newExpanded);
                    }
                    setSelectedFolder(item.label.id);
                  }}
                >
                  {item.children.length > 0 && (
                    <Ionicons 
                      name={expandedLabels.has(item.label.name) ? "chevron-down" : "chevron-forward"} 
                      size={16} 
                      color={Colors.textSecondary}
                      style={{ marginRight: -8 }}
                    />
                  )}
                  <Ionicons 
                    name="pricetag" 
                    size={16} 
                    color={item.label.color?.backgroundColor || Colors.primary}
                  />
                  <Text style={[styles.navItemText, selectedFolder === item.label.id && styles.navItemTextActive]}>
                    {item.label.name}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteLabelButton}
                  onPress={() => {
                    setLabelToDelete(item.label);
                    setShowDeleteLabelConfirm(true);
                  }}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>

              {/* Child labels (sublabels) */}
              {item.children.length > 0 && expandedLabels.has(item.label.name) && (
                item.children.map((child) => (
                  <View key={child.id} style={styles.labelItemContainer}>
                    <TouchableOpacity
                      style={[styles.navItem, styles.navItemChild, selectedFolder === child.id && styles.navItemActive]}
                      onPress={() => setSelectedFolder(child.id)}
                    >
                      <Ionicons 
                        name="pricetag-outline" 
                        size={14} 
                        color={child.color?.backgroundColor || Colors.primary}
                      />
                      <Text style={[styles.navItemText, selectedFolder === child.id && styles.navItemTextActive]}>
                        {child.name.split('/').pop()}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteLabelButton}
                      onPress={() => {
                        setLabelToDelete(child);
                        setShowDeleteLabelConfirm(true);
                      }}
                    >
                      <Ionicons name="close-circle" size={14} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ))}
        </ScrollView>

        {/* Main Email Area */}
        <View style={styles.emailArea}>
          {/* Search Bar with Actions */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in mail"
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {selectionMode && (
              <View style={styles.batchActions}>
                <TouchableOpacity onPress={handleBatchMarkAsRead} style={styles.batchButton}>
                  <Ionicons name="mail-open" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBatchArchive} style={styles.batchButton}>
                  <Ionicons name="archive" size={20} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBatchDelete} style={styles.batchButton}>
                  <Ionicons name="trash" size={20} color={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedEmails(new Set());
                  }} 
                  style={styles.batchButton}
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {!selectionMode && (
              <>
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={() => {
                    setSelectionMode(true);
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.refreshButton} onPress={() => refreshGmailEmails()}>
                  <Ionicons name="refresh-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {selectionMode && selectedEmails.size > 0 && (
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>{selectedEmails.size} selected</Text>
            </View>
          )}

          {/* Email List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : filteredEmails.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={64} color="#dadce0" />
              <Text style={styles.emptyText}>No emails found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredEmails}
              renderItem={renderEmailItem}
              keyExtractor={(item) => item.id}
              style={styles.emailList}
              contentContainerStyle={styles.emailListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Email Preview Pane - Right Side */}
        {isDesktop && (
          <View style={styles.emailPreviewPane}>
            {selectedEmail ? (
              <ScrollView style={styles.previewScroll}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewSubject}>{selectedEmail.subject || '(No subject)'}</Text>
                  <TouchableOpacity onPress={() => setSelectedEmail(null)}>
                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.previewMeta}>
                  <View style={styles.previewAvatarContainer}>
                    <View style={styles.previewAvatar}>
                      <Text style={styles.previewAvatarText}>{getInitials(selectedEmail.from)}</Text>
                    </View>
                    <View style={styles.previewSenderInfo}>
                      <Text style={styles.previewFrom}>{selectedEmail.from}</Text>
                      <Text style={styles.previewDate}>{formatDate(selectedEmail.date)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.previewActions}>
                    <TouchableOpacity onPress={(e) => handleStarToggle(selectedEmail, e)} style={styles.previewActionButton}>
                      <Ionicons name={selectedEmail.is_starred ? "star" : "star-outline"} size={20} color={selectedEmail.is_starred ? Colors.warning : Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.previewActionButton}>
                      <Ionicons name="arrow-undo" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.previewActionButton}>
                      <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.previewBody}>
                  <Text style={styles.previewBodyText}>
                    {stripHtml(selectedEmail.body) || stripHtml(selectedEmail.snippet) || 'No content'}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.previewEmpty}>
                <Ionicons name="mail-open-outline" size={80} color="#dadce0" />
                <Text style={styles.previewEmptyText}>Select an email to read</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Compose Modal */}
      <Modal
        visible={showCompose}
        animationType="slide"
        presentationStyle={isDesktop ? "formSheet" : "fullScreen"}
        onRequestClose={() => setShowCompose(false)}
      >
        <View style={styles.composeModal}>
          <View style={styles.composeHeader}>
            <Text style={styles.composeTitle}>New Message</Text>
            <TouchableOpacity onPress={() => setShowCompose(false)}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.composeForm}>
            <TextInput
              style={styles.composeInput}
              placeholder="To"
              placeholderTextColor="#9ca3af"
              value={composeTo}
              onChangeText={setComposeTo}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.composeDivider} />
            
            <TextInput
              style={styles.composeInput}
              placeholder="Subject"
              placeholderTextColor="#9ca3af"
              value={composeSubject}
              onChangeText={setComposeSubject}
            />
            <View style={styles.composeDivider} />
            
            <TextInput
              style={styles.composeBodyInput}
              placeholder="Compose email..."
              placeholderTextColor="#9ca3af"
              value={composeBody}
              onChangeText={setComposeBody}
              multiline
              numberOfLines={15}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.composeActions}>
            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={handleCompose}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#ffffff" />
                  <Text style={styles.sendButtonText}>Send</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Email Detail View */}
      {selectedEmail && (
        <EmailDetailView
          email={selectedEmail}
          visible={showEmailDetail}
          onClose={() => {
            setShowEmailDetail(false);
            setSelectedEmail(null);
            refreshGmailEmails();
          }}
        />
      )}

      {/* Create Label Modal */}
      <Modal
        visible={showCreateLabel}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateLabel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.labelModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create new label</Text>
              <TouchableOpacity onPress={() => setShowCreateLabel(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.labelInput}
              placeholder="Enter label name"
              value={newLabelName}
              onChangeText={setNewLabelName}
              autoFocus
            />
            
            <Text style={styles.inputLabel}>Parent Label (optional)</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity 
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Select Parent Label',
                    'Choose a parent label to create a sublabel',
                    [
                      { text: 'None (Top-level)', onPress: () => setParentLabel('') },
                      ...labels.filter(l => l.type === 'user' && !l.name.includes('/')).map(label => ({
                        text: label.name,
                        onPress: () => setParentLabel(label.name)
                      }))
                    ]
                  );
                }}
              >
                <Text style={styles.pickerText}>
                  {parentLabel || 'None (Top-level label)'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateLabel(false);
                  setNewLabelName('');
                  setParentLabel('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={async () => {
                  if (newLabelName.trim()) {
                    try {
                      const fullLabelName = parentLabel 
                        ? `${parentLabel}/${newLabelName}` 
                        : newLabelName;
                      
                      await api.post('/gmail/labels/create', { name: fullLabelName });
                      await fetchLabels();
                      setShowCreateLabel(false);
                      setNewLabelName('');
                      setParentLabel('');
                      Alert.alert('Success', 'Label created successfully');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to create label');
                    }
                  }
                }}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Label Confirmation */}
      <Modal
        visible={showDeleteLabelConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteLabelConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.labelModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Label</Text>
              <TouchableOpacity onPress={() => setShowDeleteLabelConfirm(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.deleteMessage}>
              Are you sure you want to delete the label "{labelToDelete?.name}"?
            </Text>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteLabelConfirm(false);
                  setLabelToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: Colors.error }]}
                onPress={() => labelToDelete && handleDeleteLabel(labelToDelete)}
              >
                <Text style={styles.createButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Label Menu Modal */}
      <Modal
        visible={showLabelMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLabelMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.labelModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply Labels</Text>
              <TouchableOpacity onPress={() => setShowLabelMenu(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.labelList}>
              {labels.filter(l => l.type === 'user').map((label) => {
                const isApplied = labelMenuEmail?.labels?.includes(label.id);
                return (
                  <TouchableOpacity
                    key={label.id}
                    style={styles.labelOption}
                    onPress={() => {
                      if (labelMenuEmail) {
                        handleApplyLabels(labelMenuEmail, [label.id]);
                      }
                    }}
                  >
                    <Ionicons 
                      name={isApplied ? "checkbox" : "square-outline"} 
                      size={24} 
                      color={isApplied ? Colors.primary : Colors.textSecondary} 
                    />
                    <Ionicons 
                      name="pricetag" 
                      size={16} 
                      color={label.color?.backgroundColor || Colors.primary}
                      style={{ marginLeft: 12 }}
                    />
                    <Text style={styles.labelOptionText}>{label.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Auto-Label Rules Modal */}
      <Modal
        visible={showAutoLabelRules}
        animationType="slide"
        presentationStyle={isDesktop ? "formSheet" : "fullScreen"}
        onRequestClose={() => setShowAutoLabelRules(false)}
      >
        <View style={styles.composeModal}>
          <View style={styles.composeHeader}>
            <Text style={styles.composeTitle}>Auto-Label Rules</Text>
            <TouchableOpacity onPress={() => setShowAutoLabelRules(false)}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.composeForm}>
            <TouchableOpacity 
              style={styles.createRuleButton}
              onPress={() => setShowCreateRule(true)}
            >
              <Ionicons name="add-circle" size={24} color={Colors.white} />
              <Text style={styles.createRuleButtonText}>Create New Rule</Text>
            </TouchableOpacity>

            {autoLabelRules.length > 0 && (
              <TouchableOpacity 
                style={styles.applyRulesButton}
                onPress={handleApplyAutoLabelRules}
              >
                <Ionicons name="flash" size={20} color={Colors.white} />
                <Text style={styles.applyRulesButtonText}>Apply All Rules Now</Text>
              </TouchableOpacity>
            )}

            {autoLabelRules.map((rule) => (
              <View key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <Text style={styles.ruleName}>{rule.name}</Text>
                  <TouchableOpacity onPress={() => handleDeleteAutoLabelRule(rule.id)}>
                    <Ionicons name="trash" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.ruleDetail}>
                  If {rule.condition_type} contains "{rule.condition_value}"
                </Text>
                <Text style={styles.ruleDetail}>
                  Apply {rule.label_ids.length} label(s)
                </Text>
              </View>
            ))}

            {autoLabelRules.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#dadce0" />
                <Text style={styles.emptyText}>No auto-label rules yet</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Auto-Label Rule Modal */}
      <Modal
        visible={showCreateRule}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateRule(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.labelModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Auto-Label Rule</Text>
              <TouchableOpacity onPress={() => setShowCreateRule(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.labelInput}
              placeholder="Rule name (e.g., 'Label Hello emails')"
              value={newRuleName}
              onChangeText={setNewRuleName}
            />

            <Text style={styles.inputLabel}>Condition</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity 
                style={styles.picker}
                onPress={() => {
                  Alert.alert(
                    'Select Condition Type',
                    'Choose what to match',
                    [
                      { text: 'From (sender)', onPress: () => setNewRuleConditionType('from') },
                      { text: 'To (recipient)', onPress: () => setNewRuleConditionType('to') },
                      { text: 'Subject', onPress: () => setNewRuleConditionType('subject') },
                      { text: 'Contains (body)', onPress: () => setNewRuleConditionType('contains') },
                    ]
                  );
                }}
              >
                <Text style={styles.pickerText}>
                  {newRuleConditionType.charAt(0).toUpperCase() + newRuleConditionType.slice(1)}
                </Text>
                <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.labelInput}
              placeholder="Value to match (e.g., 'hello@cafinc.ca')"
              value={newRuleConditionValue}
              onChangeText={setNewRuleConditionValue}
            />

            <Text style={styles.inputLabel}>Apply Labels</Text>
            <TouchableOpacity 
              style={styles.selectLabelsButton}
              onPress={() => {
                Alert.alert(
                  'Select Labels',
                  'Choose labels to apply',
                  [
                    ...labels.filter(l => l.type === 'user').map(label => ({
                      text: label.name,
                      onPress: () => {
                        if (newRuleLabels.includes(label.id)) {
                          setNewRuleLabels(newRuleLabels.filter(id => id !== label.id));
                        } else {
                          setNewRuleLabels([...newRuleLabels, label.id]);
                        }
                      }
                    }))
                  ]
                );
              }}
            >
              <Text style={styles.selectLabelsButtonText}>
                {newRuleLabels.length > 0 ? `${newRuleLabels.length} label(s) selected` : 'Select labels'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateRule(false);
                  setNewRuleName('');
                  setNewRuleConditionValue('');
                  setNewRuleLabels([]);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateAutoLabelRule}
              >
                <Text style={styles.createButtonText}>Create Rule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // If not web, just return the content without layout
  if (Platform.OS !== 'web') {
    return gmailContent;
  }

  // For web, wrap in WebAdminLayout
  return (
    <WebAdminLayout showHeader={true} startCollapsed={true}>
      {gmailContent}
    </WebAdminLayout>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarMini: {
    width: 200,
    minWidth: 200,
    maxWidth: 200,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  inboxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inboxTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inboxCount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  composeButtonMini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  composeButtonMiniText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
    flex: 1,
  },
  navItemChild: {
    paddingLeft: 36,
  },
  navItemActive: {
    backgroundColor: Colors.primaryLight + '20',
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    flex: 1,
  },
  navItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  navBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  navBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  navDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
    marginHorizontal: 8,
  },
  labelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  labelsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteLabelButton: {
    padding: 4,
  },
  emailArea: {
    width: 400,
    minWidth: 400,
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    flexShrink: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  batchActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  batchButton: {
    padding: 4,
  },
  refreshButton: {
    marginLeft: 8,
    padding: 4,
  },
  selectionInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primaryLight + '20',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emailList: {
    flex: 1,
  },
  emailListContent: {
    paddingBottom: 16,
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingRight: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
    minHeight: 72,
  },
  emailItemUnread: {
    backgroundColor: '#f0f4ff',
  },
  emailItemSelected: {
    backgroundColor: Colors.primaryLight + '30',
  },
  checkbox: {
    marginRight: 8,
  },
  starButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  emailAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emailAvatarUnread: {
    backgroundColor: Colors.primary,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emailContent: {
    flex: 1,
    gap: 2,
  },
  emailMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  emailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  emailSender: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  emailDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  emailSubject: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  emailSnippet: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  emailLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  labelChipText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  attachmentIndicator: {
    marginLeft: 8,
  },
  labelMenuButton: {
    marginLeft: 8,
    padding: 4,
  },
  textBold: {
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  composeModal: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  composeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  composeTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.white,
  },
  composeForm: {
    flex: 1,
  },
  composeInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  composeDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  composeBodyInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 200,
  },
  composeActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 18,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  labelModal: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  labelInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  selectLabelsButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  selectLabelsButtonText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  deleteMessage: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  labelList: {
    maxHeight: 300,
  },
  labelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  labelOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  createRuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  createRuleButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  applyRulesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  applyRulesButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  ruleCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  ruleDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  // Email Preview Pane Styles
  emailPreviewPane: {
    flex: 1,
    backgroundColor: Colors.white,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    minWidth: 500,
  },
  previewScroll: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewSubject: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 16,
  },
  previewMeta: {
    padding: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewAvatarText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  previewSenderInfo: {
    flex: 1,
  },
  previewFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  previewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewActionButton: {
    padding: 8,
  },
  previewBody: {
    padding: 24,
  },
  previewBodyText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  previewEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  previewEmptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
