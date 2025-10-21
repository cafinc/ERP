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

export default function GmailInterface() {
  const { gmailEmails, refreshGmailEmails } = useMessaging();
  const { currentUser } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width > 768;
  
  // For Gmail, always use mini sidebar on mobile
  const showMiniSidebar = !isDesktop;

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
  const [selectedEmailForLabels, setSelectedEmailForLabels] = useState<GmailEmail | null>(null);
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<GmailLabel | null>(null);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const response = await api.get('/gmail/labels');
      setLabels(response.data.labels || []);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
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
          // Create virtual parent if it doesn't exist
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
        // Top-level label
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

    // Convert to array for rendering
    return Object.values(organized);
  };

  useEffect(() => {
    refreshGmailEmails();
  }, []);

  const handleEmailClick = (email: GmailEmail) => {
    setSelectedEmail(email);
    setShowEmailDetail(true);
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
    let filtered = gmailEmails;

    if (searchQuery) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.snippet.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by folder (in a real app, this would use Gmail labels)
    // For now, inbox shows all emails
    if (selectedFolder === 'unread') {
      filtered = filtered.filter(email => email.is_unread);
    }

    return filtered;
  };

  const filteredEmails = filterEmails();

  const renderFolderList = () => (
    <View style={styles.folderList}>
      <TouchableOpacity
        style={[styles.folderItem, selectedFolder === 'inbox' && styles.folderItemActive]}
        onPress={() => {
          setSelectedFolder('inbox');
          setShowFolderDrawer(false);
        }}
      >
        <Ionicons name="mail-outline" size={20} color={selectedFolder === 'inbox' ? Colors.primary : '#5f6368'} />
        <Text style={[styles.folderText, selectedFolder === 'inbox' && styles.folderTextActive]}>
          Inbox
        </Text>
        <View style={styles.folderBadge}>
          <Text style={styles.folderBadgeText}>{gmailEmails.length}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.folderItem, selectedFolder === 'starred' && styles.folderItemActive]}
        onPress={() => {
          setSelectedFolder('starred');
          setShowFolderDrawer(false);
        }}
      >
        <Ionicons name="star-outline" size={20} color={selectedFolder === 'starred' ? Colors.primary : '#5f6368'} />
        <Text style={[styles.folderText, selectedFolder === 'starred' && styles.folderTextActive]}>
          Starred
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.folderItem, selectedFolder === 'unread' && styles.folderItemActive]}
        onPress={() => {
          setSelectedFolder('unread');
          setShowFolderDrawer(false);
        }}
      >
        <Ionicons name="mail-unread-outline" size={20} color={selectedFolder === 'unread' ? Colors.primary : '#5f6368'} />
        <Text style={[styles.folderText, selectedFolder === 'unread' && styles.folderTextActive]}>
          Unread
        </Text>
        <View style={styles.folderBadge}>
          <Text style={styles.folderBadgeText}>
            {gmailEmails.filter(e => e.is_unread).length}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.folderItem, selectedFolder === 'sent' && styles.folderItemActive]}
        onPress={() => {
          setSelectedFolder('sent');
          setShowFolderDrawer(false);
        }}
      >
        <Ionicons name="send-outline" size={20} color={selectedFolder === 'sent' ? Colors.primary : '#5f6368'} />
        <Text style={[styles.folderText, selectedFolder === 'sent' && styles.folderTextActive]}>
          Sent
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.folderItem, selectedFolder === 'drafts' && styles.folderItemActive]}
        onPress={() => {
          setSelectedFolder('drafts');
          setShowFolderDrawer(false);
        }}
      >
        <Ionicons name="document-outline" size={20} color={selectedFolder === 'drafts' ? Colors.primary : '#5f6368'} />
        <Text style={[styles.folderText, selectedFolder === 'drafts' && styles.folderTextActive]}>
          Drafts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.folderItem, selectedFolder === 'trash' && styles.folderItemActive]}
        onPress={() => {
          setSelectedFolder('trash');
          setShowFolderDrawer(false);
        }}
      >
        <Ionicons name="trash-outline" size={20} color={selectedFolder === 'trash' ? Colors.primary : '#5f6368'} />
        <Text style={[styles.folderText, selectedFolder === 'trash' && styles.folderTextActive]}>
          Trash
        </Text>
      </TouchableOpacity>
    </View>
  );

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
      style={[styles.emailItem, item.is_unread && styles.emailItemUnread]}
      onPress={() => handleEmailClick(item)}
      activeOpacity={0.7}
    >
      {/* Star Icon */}
      <TouchableOpacity style={styles.starButton}>
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
        
        <Text style={styles.emailSnippet} numberOfLines={2}>
          {item.snippet || 'No preview available'}
        </Text>
      </View>

      {/* Attachment indicator */}
      {item.has_attachments && (
        <View style={styles.attachmentIndicator}>
          <Ionicons name="attach" size={16} color={Colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );

  // Render the Gmail content
  const gmailContent = (
    <View style={styles.fullContainer}>
      <View style={styles.mainContent}>
        {/* Gmail Sidebar - Sleek minimalist with text */}
        <View style={styles.sidebarMini}>
          {/* Inbox Header with Count */}
          <View style={styles.inboxHeader}>
            <Text style={styles.inboxTitle}>Inbox</Text>
            <Text style={styles.inboxCount}>{filteredEmails.length}</Text>
          </View>

          <TouchableOpacity 
            style={styles.composeButtonMini}
            onPress={() => setShowCompose(true)}
          >
            <Ionicons name="create" size={20} color={Colors.white} />
            <Text style={styles.composeButtonMiniText}>Compose</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'inbox' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('inbox')}
          >
            <Ionicons 
              name="mail" 
              size={20} 
              color={selectedFolder === 'inbox' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'inbox' && styles.navItemTextActive
            ]}>
              Inbox
            </Text>
            {gmailEmails.length > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{gmailEmails.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'starred' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('starred')}
          >
            <Ionicons 
              name="star" 
              size={20} 
              color={selectedFolder === 'starred' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'starred' && styles.navItemTextActive
            ]}>
              Starred
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'unread' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('unread')}
          >
            <Ionicons 
              name="mail-unread" 
              size={20} 
              color={selectedFolder === 'unread' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'unread' && styles.navItemTextActive
            ]}>
              Unread
            </Text>
            {gmailEmails.filter(e => e.is_unread).length > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>
                  {gmailEmails.filter(e => e.is_unread).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'sent' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('sent')}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={selectedFolder === 'sent' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'sent' && styles.navItemTextActive
            ]}>
              Sent
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'drafts' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('drafts')}
          >
            <Ionicons 
              name="document" 
              size={20} 
              color={selectedFolder === 'drafts' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'drafts' && styles.navItemTextActive
            ]}>
              Drafts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'trash' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('trash')}
          >
            <Ionicons 
              name="trash" 
              size={20} 
              color={selectedFolder === 'trash' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'trash' && styles.navItemTextActive
            ]}>
              Trash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'spam' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('spam')}
          >
            <Ionicons 
              name="warning" 
              size={20} 
              color={selectedFolder === 'spam' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'spam' && styles.navItemTextActive
            ]}>
              Spam
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'important' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('important')}
          >
            <Ionicons 
              name="bookmark" 
              size={20} 
              color={selectedFolder === 'important' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'important' && styles.navItemTextActive
            ]}>
              Important
            </Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />

          {/* Gmail Categories */}
          <View style={styles.categoriesHeader}>
            <Text style={styles.labelsTitle}>Categories</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'category_primary' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('category_primary')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={selectedFolder === 'category_primary' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'category_primary' && styles.navItemTextActive
            ]}>
              Primary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'category_social' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('category_social')}
          >
            <Ionicons 
              name="people" 
              size={20} 
              color={selectedFolder === 'category_social' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'category_social' && styles.navItemTextActive
            ]}>
              Social
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'category_promotions' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('category_promotions')}
          >
            <Ionicons 
              name="pricetag" 
              size={20} 
              color={selectedFolder === 'category_promotions' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'category_promotions' && styles.navItemTextActive
            ]}>
              Promotions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'category_updates' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('category_updates')}
          >
            <Ionicons 
              name="notifications" 
              size={20} 
              color={selectedFolder === 'category_updates' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'category_updates' && styles.navItemTextActive
            ]}>
              Updates
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'category_forums' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('category_forums')}
          >
            <Ionicons 
              name="chatbubbles" 
              size={20} 
              color={selectedFolder === 'category_forums' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'category_forums' && styles.navItemTextActive
            ]}>
              Forums
            </Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />

          <TouchableOpacity
            style={[
              styles.navItem,
              selectedFolder === 'all' && styles.navItemActive
            ]}
            onPress={() => setSelectedFolder('all')}
          >
            <Ionicons 
              name="mail" 
              size={20} 
              color={selectedFolder === 'all' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.navItemText,
              selectedFolder === 'all' && styles.navItemTextActive
            ]}>
              All Mail
            </Text>
          </TouchableOpacity>

          <View style={styles.navDivider} />

          {/* Labels Section */}
          <View style={styles.labelsHeader}>
            <Text style={styles.labelsTitle}>Labels</Text>
            <TouchableOpacity onPress={() => setShowCreateLabel(true)}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* User Labels */}
          {organizeLabels().map((item) => (
            <View key={item.label.id}>
              {/* Parent/Top-level label */}
              <TouchableOpacity
                style={[
                  styles.navItem,
                  selectedFolder === item.label.id && styles.navItemActive
                ]}
                onPress={() => {
                  if (item.children.length > 0) {
                    // Toggle expand/collapse
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
                <Text style={[
                  styles.navItemText,
                  selectedFolder === item.label.id && styles.navItemTextActive
                ]}>
                  {item.label.name}
                </Text>
              </TouchableOpacity>

              {/* Child labels (sublabels) */}
              {item.children.length > 0 && expandedLabels.has(item.label.name) && (
                item.children.map((child) => (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.navItem,
                      styles.navItemChild,
                      selectedFolder === child.id && styles.navItemActive
                    ]}
                    onPress={() => setSelectedFolder(child.id)}
                  >
                    <Ionicons 
                      name="pricetag-outline" 
                      size={14} 
                      color={child.color?.backgroundColor || Colors.primary}
                    />
                    <Text style={[
                      styles.navItemText,
                      selectedFolder === child.id && styles.navItemTextActive
                    ]}>
                      {child.name.split('/').pop()}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ))}
        </View>

        {/* Main Email Area */}
        <View style={styles.emailArea}>
          {/* Search Bar with Refresh Button - FIXED */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in mail"
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.refreshButton} onPress={() => refreshGmailEmails()}>
              <Ionicons name="refresh-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Email List - SCROLLABLE */}
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
      </View>

      {/* Folder Drawer (Mobile Only) */}
      <Modal
        visible={showFolderDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFolderDrawer(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerOverlayTouch} 
            activeOpacity={1}
            onPress={() => setShowFolderDrawer(false)}
          />
          <View style={styles.drawerContainer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Folders</Text>
              <TouchableOpacity onPress={() => setShowFolderDrawer(false)}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.drawerComposeButton}
              onPress={() => {
                setShowFolderDrawer(false);
                setShowCompose(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#ffffff" />
              <Text style={styles.composeButtonText}>Compose</Text>
            </TouchableOpacity>

            <ScrollView style={styles.drawerContent}>
              {renderFolderList()}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
            
            {/* Parent Label Selector for Sublabels */}
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
    </View>
  );

  // If not web, just return the content without layout
  if (Platform.OS !== 'web') {
    return gmailContent;
  }

  // For web, wrap in WebAdminLayout (collapsed by default, WITH header like other pages)
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 256,
    backgroundColor: Colors.gray50,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingTop: 16,
  },
  sidebarMini: {
    width: 180,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  inboxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
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
  categoriesHeader: {
    paddingHorizontal: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  labelColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    marginRight: 4,
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
    marginBottom: 20,
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
  composeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  composeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  folderList: {
    paddingHorizontal: 8,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 2,
  },
  folderItemActive: {
    backgroundColor: Colors.primaryLight + '30', // 30% opacity
  },
  folderText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  folderTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  folderBadge: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  folderBadgeText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emailArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
  refreshButton: {
    marginLeft: 8,
    padding: 4,
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
  attachmentIndicator: {
    marginLeft: 8,
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
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerOverlayTouch: {
    flex: 1,
  },
  drawerContainer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.primary,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
  },
  drawerContent: {
    flex: 1,
  },
  drawerComposeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
});
