
import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RegisterScreen = () => {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, []);

  return null;
  // const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [pincode, setPincode] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const handlePincodeChange = async (text: string) => {
    setPincode(text);
    if (text.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${text}`);
        const data = await response.json();
        if (data && data[0].Status === 'Success') {
          const postOffice = data[0].PostOffice[0];
          setState(postOffice.State);
          setDistrict(postOffice.District);
        } else {
          Alert.alert('Error', 'Invalid Pincode');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not fetch pincode details.');
      }
    }
  };

  const sendOtp = async () => {
    if (password !== rePassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }
    if (phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
      });
      if (error) throw error;

      setVerificationId('sent');
      Alert.alert("OTP Sent", `OTP sent to +91 ${phone}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    }
  };

  const handleRegistration = async () => {
    if (!verificationId) return Alert.alert("Error", "Please verify your phone number first.");
    try {
      // Step 1: Verify OTP
      const { data: { session, user }, error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;
      if (!user) throw new Error("Verification failed");

      // Step 2: Update Email and Password (since phone auth creates user with phone only)
      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
        password: password,
      });

      if (updateError) throw updateError;

      // Step 3: Save user data to 'users' table
      // Ensure 'users' table exists in Supabase public schema
      const { error: dbError } = await supabase.from('users').insert({
        id: user.id,
        name: name,
        email: email,
        phone_number: `+91${phone}`,
        pincode: pincode,
        district: district,
        state: state,
        created_at: new Date(),
        role: 'admin' // Assuming this registration is for admins/partners
      });

      if (dbError) throw dbError;

      await AsyncStorage.setItem('user_role', 'admin');
      Alert.alert('Success', 'Your account has been created successfully!');
      router.replace('/login');
    } catch (error: any) {
      console.error("Registration Error", error);
      Alert.alert('Error', `Registration failed: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : '#f2f2f2' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={isDarkMode ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>Create New Account</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {!verificationId ? (
            <>
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="Full Name" placeholderTextColor="#888" value={name} onChangeText={setName} />
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="Mobile Number" placeholderTextColor="#888" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={10} />
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="Email Address" placeholderTextColor="#888" keyboardType="email-address" value={email} onChangeText={setEmail} />
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="Password" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="Re-enter Password" placeholderTextColor="#888" secureTextEntry value={rePassword} onChangeText={setRePassword} />
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="Pincode" placeholderTextColor="#888" keyboardType="number-pad" value={pincode} onChangeText={handlePincodeChange} maxLength={6} />
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="District" placeholderTextColor="#888" value={district} onChangeText={setDistrict} />
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000' }]} placeholder="State" placeholderTextColor="#888" value={state} onChangeText={setState} />
              <TouchableOpacity style={styles.registerButton} onPress={sendOtp}>
                <Text style={styles.registerButtonText}>Send OTP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.otpPrompt, { color: isDarkMode ? '#fff' : '#000' }]}>Enter OTP sent to +91 {phone}</Text>
              <TextInput style={[styles.input, { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', color: isDarkMode ? '#fff' : '#000', textAlign: 'center' }]} placeholder="- - - - - -" placeholderTextColor="#888" keyboardType="number-pad" value={otp} onChangeText={setOtp} maxLength={6} />
              <TouchableOpacity style={styles.registerButton} onPress={handleRegistration}>
                <Text style={styles.registerButtonText}>Create Account</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scrollContainer: { padding: 24, },
  input: { padding: 18, borderRadius: 12, marginBottom: 16, fontSize: 16 },
  registerButton: { backgroundColor: '#4A90E2', padding: 18, borderRadius: 30, alignItems: 'center', marginTop: 16 },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  otpPrompt: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
});

export default RegisterScreen;
