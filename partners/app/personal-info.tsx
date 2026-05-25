
import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { ThemeMode, useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PersonalInfoScreen = () => {
  const { themeMode, setThemeMode, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  // State for Email Modal
  const [isEmailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // State for Phone Modal
  const [isPhoneModalVisible, setPhoneModalVisible] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerificationId, setPhoneVerificationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setUserData({
      email: user.email,
      phoneNumber: user.phone
    });

    supabase.from('pre_approved_partners').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setUserData(prev => ({ ...prev, ...data }));
      });
  }, [user]);

  // Use colors from ThemeContext
  // primary is now White in dark modes, matching user request

  const handlePasswordReset = async () => {
    if (user && user.email) {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) Alert.alert("Error", error.message);
      else Alert.alert("Password Reset", "A password reset link has been sent to your email address.");
    }
  }

  const handleChangeEmail = async () => {
    if (!newEmail) return Alert.alert("Error", "Please enter new email.");
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      Alert.alert("Verification Sent", "A confirmation link has been sent to your new email address.");
      setEmailModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!newPhone) return Alert.alert("Error", "Enter phone number");
    try {
      const { error } = await supabase.auth.updateUser({ phone: `+91${newPhone}` });
      if (error) throw error;
      Alert.alert("Success", "Verification code sent to new number (if enabled) or number updated.");
      setPhoneModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleUpdatePhoneNumber = async () => {
    if (!phoneOtp) return Alert.alert("Error", "Enter OTP");
    try {
      const { error } = await supabase.auth.verifyOtp({ phone: `+91${newPhone}`, token: phoneOtp, type: 'phone_change' });
      if (error) throw error;
      Alert.alert("Success", "Phone number updated verified.");
      setPhoneModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  }

  const ThemeSelector = () => (
    <View style={[styles.themeSelectorContainer, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 24 }]}>
      <View style={styles.themeHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
          <Feather name="moon" size={20} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App Theme</Text>
      </View>

      <View style={[styles.segmentContainer, { backgroundColor: colors.background }]}>
        {(['light', 'black'] as ThemeMode[]).map((mode) => {
          const isActive = themeMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.segmentButton,
                isActive && { backgroundColor: colors.card, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }
              ]}
              onPress={() => setThemeMode(mode)}
            >
              <Text style={[
                styles.segmentText,
                { color: isActive ? colors.text : colors.subtext, fontWeight: isActive ? '600' : '400' }
              ]}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: isDesktop ? 0 : insets.top }]}>
      <StatusBar barStyle={themeMode === 'light' ? 'dark-content' : 'light-content'} />

      {!isDesktop && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.contentWrapper, { maxWidth: 480, alignSelf: 'center', width: '100%' }]}>

          <Text style={[styles.pageTitle, { color: colors.text }]}>Personal Information</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.subtext }]}>Name</Text>
              <Text style={[styles.value, { color: colors.text }]}>{userData?.owner_name || userData?.name || 'Loading...'}</Text>
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.subtext }]}>Email</Text>
              <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
                <TouchableOpacity onPress={() => setEmailModalVisible(true)}>
                  <Text style={[styles.changeButton, { color: colors.primary }]}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.subtext }]}>Mobile No.</Text>
              <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: colors.text }]}>{user?.phoneNumber || userData?.mobile_number || 'Not Set'}</Text>
                <TouchableOpacity onPress={() => setPhoneModalVisible(true)}>
                  <Text style={[styles.changeButton, { color: colors.primary }]}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, marginTop: 24 }]}>
            <TouchableOpacity style={styles.infoRow} onPress={handlePasswordReset}>
              <Text style={[styles.label, { color: colors.primary, fontWeight: '600' }]}>Reset Password</Text>
              <Feather name="chevron-right" size={20} color={colors.subtext} style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          </View>

          <ThemeSelector />

          <Text style={{ textAlign: 'center', color: colors.subtext, fontSize: 13, marginTop: 40, marginBottom: 20 }}>
            Version 1.0.0 • Partner App
          </Text>

        </View>
      </ScrollView>

      {/* Email Change Modal */}
      <Modal animationType="fade" transparent={true} visible={isEmailModalVisible} onRequestClose={() => setEmailModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Email</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="New Email"
              placeholderTextColor={colors.subtext}
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelBtn, { borderColor: colors.border }]} onPress={() => setEmailModalVisible(false)}>
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleChangeEmail}>
                <Text style={[styles.buttonText, { color: themeMode === 'light' ? '#fff' : '#000' }]}>Send Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Phone Change Modal */}
      <Modal animationType="fade" transparent={true} visible={isPhoneModalVisible} onRequestClose={() => setPhoneModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Phone Number</Text>
            {!phoneVerificationId ? (
              <>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  placeholder="New Phone Number"
                  placeholderTextColor={colors.subtext}
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setPhoneModalVisible(false); }}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSendPhoneOtp}>
                    <Text style={[styles.buttonText, { color: themeMode === 'light' ? '#fff' : '#000' }]}>Send OTP</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                  placeholder="Enter OTP"
                  placeholderTextColor={colors.subtext}
                  value={phoneOtp}
                  onChangeText={setPhoneOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.button, styles.cancelBtn, { borderColor: colors.border }]} onPress={() => { setPhoneModalVisible(false); setPhoneVerificationId(null); }}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleUpdatePhoneNumber}>
                    <Text style={[styles.buttonText, { color: themeMode === 'light' ? '#fff' : '#000' }]}>Verify</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scrollContent: { padding: 16 },
  contentWrapper: { width: '100%' },

  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 8,
  },

  card: { borderRadius: 16, paddingLeft: 16, overflow: 'hidden' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingRight: 16,
  },
  label: { fontSize: 16, fontWeight: '400' },
  valueContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  value: { fontSize: 16, fontWeight: '500' },
  changeButton: { fontSize: 14, fontWeight: '600' },
  separator: { height: 1, marginLeft: 0 },

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, padding: 24, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    fontSize: 16,
    borderWidth: 1,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtn: { backgroundColor: 'transparent', borderWidth: 1 },
  buttonText: { fontWeight: '600', fontSize: 16 },

  // Theme Selector Styles
  themeSelectorContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    height: 44,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 14,
  },
});

export default PersonalInfoScreen;
