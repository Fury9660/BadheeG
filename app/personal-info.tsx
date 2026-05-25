import { supabase } from '@/config/supabaseConfig';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PersonalInfoScreen = () => {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  // State for Email Modal
  const [isEmailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // State for Phone Modal
  const [isPhoneModalVisible, setPhoneModalVisible] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) console.error("Fetch error:", error);
        if (data) {
          setUserData(data);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const theme = {
    background: isDarkMode ? '#000' : '#f0f2f5',
    text: isDarkMode ? '#fff' : '#171717',
    card: isDarkMode ? '#1A1A1A' : '#fff',
    subtext: isDarkMode ? '#888' : '#666',
    primary: '#007AFF',
    separator: isDarkMode ? '#333' : '#E5E5EA',
  };

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
      Alert.alert("Verification Sent", "A verification link has been sent to your new email address. Please verify to complete the change.");
      setEmailModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!newPhone) return Alert.alert("Error", "Please enter new phone number.");
    try {
      const { error } = await supabase.auth.updateUser({ phone: `+91${newPhone}` });
      if (error) throw error;
      setOtpSent(true);
      Alert.alert('Success', 'OTP has been sent to the new number!');
    } catch (error: any) {
      Alert.alert('Error', `Failed to send OTP: ${error.message}`);
    }
  };

  const handleUpdatePhoneNumber = async () => {
    if (!phoneOtp) return Alert.alert("Error", "Please enter OTP.");
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${newPhone}`,
        token: phoneOtp,
        type: 'phone_change'
      });
      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ mobile_number: `+91${newPhone}` })
        .eq('id', user!.id);

      Alert.alert("Success", "Your phone number has been updated.");
      setPhoneModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', `Update failed: ${error.message}`);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Personal Information</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.content, isWeb && { alignItems: 'center' }]}>
        <View style={{ width: '100%', maxWidth: 800 }}>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.subtext }]}>Name</Text>
              <Text style={[styles.value, { color: theme.text }]}>{userData?.name || 'Loading...'}</Text>
            </View>
            <View style={[styles.separator, { backgroundColor: theme.separator }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.subtext }]}>Email</Text>
              <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: theme.text }]}>{user?.email}</Text>
                <TouchableOpacity onPress={() => setEmailModalVisible(true)}><Text style={[styles.changeButton, { color: theme.primary }]}>Change</Text></TouchableOpacity>
              </View>
            </View>
            <View style={[styles.separator, { backgroundColor: theme.separator }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.subtext }]}>Mobile No.</Text>
              <View style={styles.valueContainer}>
                <Text style={[styles.value, { color: theme.text }]}>{userData?.mobile_number || 'Not Set'}</Text>
                <TouchableOpacity onPress={() => setPhoneModalVisible(true)}><Text style={[styles.changeButton, { color: theme.primary }]}>Change</Text></TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, marginTop: 24 }]}>
            <TouchableOpacity style={styles.infoRow} onPress={handlePasswordReset}>
              <Text style={[styles.label, { color: theme.primary }]}>Reset Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {/* Email Change Modal */}
      <Modal animationType="slide" transparent={true} visible={isEmailModalVisible} onRequestClose={() => setEmailModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Email</Text>
            <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.background }]} placeholder="New Email" placeholderTextColor={theme.subtext} value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleChangeEmail}><Text style={styles.buttonText}>Send Verification</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.subtext }]} onPress={() => setEmailModalVisible(false)}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Phone Change Modal */}
      <Modal animationType="slide" transparent={true} visible={isPhoneModalVisible} onRequestClose={() => setPhoneModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Phone Number</Text>
            {!otpSent ? (
              <>
                <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.background }]} placeholder="New Phone Number" placeholderTextColor={theme.subtext} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" maxLength={10} />
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSendPhoneOtp}><Text style={styles.buttonText}>Send OTP</Text></TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput style={[styles.input, { color: theme.text, backgroundColor: theme.background }]} placeholder="Enter OTP" placeholderTextColor={theme.subtext} value={phoneOtp} onChangeText={setPhoneOtp} keyboardType="number-pad" maxLength={6} />
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleUpdatePhoneNumber}><Text style={styles.buttonText}>Verify & Update</Text></TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.subtext }]} onPress={() => { setPhoneModalVisible(false); setOtpSent(false); }}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ddd', },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  card: { borderRadius: 12, paddingLeft: 16, },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, paddingRight: 16, },
  label: { fontSize: 16, },
  valueContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, },
  value: { fontSize: 16, fontWeight: '500', },
  changeButton: { fontSize: 16, fontWeight: '600', },
  separator: { height: 1, marginLeft: 0, },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16 },
  button: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default PersonalInfoScreen;
