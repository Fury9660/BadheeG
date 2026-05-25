import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image, // Added Image
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IndianBanks } from '../constants/BankList';

// Categories defined outside component

const categories = [
    { name: 'Furniture', icon: 'sofa', library: 'MaterialCommunityIcons' },
];

const SectionHeader = ({ title, icon, color }: { title: string, icon: any, color: string }) => (
    <View style={styles.sectionHeader}>
        <Feather name={icon} size={20} color={color} style={{ marginRight: 10 }} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
);

const SellerRegistrationScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 375;
    const isTablet = width > 768;
    const params = useLocalSearchParams();

    // Helper function to clean phone number - handles both +91 and 91 prefixes
    const cleanPhoneNumber = (phone: string | string[] | undefined): string => {
        if (!phone || Array.isArray(phone)) return '';
        let cleaned = phone.toString().trim();
        // Remove +91 or 91 prefix
        if (cleaned.startsWith('+91')) {
            cleaned = cleaned.substring(3);
        } else if (cleaned.startsWith('91') && cleaned.length > 10) {
            cleaned = cleaned.substring(2);
        }
        return cleaned;
    };

    const phoneNumber = cleanPhoneNumber(params.phoneNumber);
    const uid = params.uid;

    console.log('Registration - Phone Number from params:', params.phoneNumber);
    console.log('Registration - Cleaned Phone Number:', phoneNumber);

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [timePickerType, setTimePickerType] = useState<'opening' | 'closing' | null>(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [showReturnPolicyModal, setShowReturnPolicyModal] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const filteredBanks = IndianBanks.filter(bank => bank.toLowerCase().includes(bankSearch.toLowerCase()));

    const validateStep = (step: number) => {
        let newErrors: { [key: string]: string } = {};

        if (step === 1) {
            if (!form.ownerName) newErrors.ownerName = "Owner name is required";
            if (!form.email) newErrors.email = "Email is required";
        } else if (step === 2) {
            if (!form.storeName) newErrors.storeName = "Store name is required";
            if (!form.category) newErrors.category = "Please select a category";
        } else if (step === 3) {
            if (!form.shopAddress) newErrors.shopAddress = "Address is required";
            if (!form.district) newErrors.district = "District is required";
            if (!form.state) newErrors.state = "State is required";
            if (!form.zipCode) newErrors.zipCode = "Zip code is required";
            if (!form.landmark) newErrors.landmark = "Landmark is required";
        } else if (step === 4) {
            // GSTIN format: 2 digits + 10 uppercase letters + 1 digit + 1 letter + 1 alphanumeric (total 15)
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!form.gstNumber) newErrors.gstNumber = "GST number is required";
            else if (form.gstNumber.length !== 15) newErrors.gstNumber = "GST number must be exactly 15 characters";
            else if (!gstRegex.test(form.gstNumber)) newErrors.gstNumber = "Invalid GST format (e.g. 22AAAAA0000A1Z5)";

            // PAN format: 5 uppercase letters + 4 digits + 1 uppercase letter (total 10)
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!form.panNumber) newErrors.panNumber = "PAN number is required";
            else if (form.panNumber.length !== 10) newErrors.panNumber = "PAN number must be exactly 10 characters";
            else if (!panRegex.test(form.panNumber)) newErrors.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (currentStep < 6) {
            if (validateStep(currentStep)) {
                setCurrentStep(s => s + 1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(s => s - 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const openPreview = (uri: string) => {
        setPreviewImage(uri);
        setIsPreviewVisible(true);
    };

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Form State
    const [form, setForm] = useState({
        ownerName: '',
        mobileNumber: phoneNumber || '',
        email: '',
        // password: '', // Using Phone Auth, no password needed

        // Business Profile
        storeName: '',
        tagline: '',
        category: '',
        estYear: '',

        // Location & Address
        shopAddress: '',
        state: '',
        district: '',
        zipCode: '',
        landmark: '',
        latitude: '',
        longitude: '',

        // Legal Documents
        gstNumber: '',
        panNumber: '',
        businessProof: null as string | null,

        // Bank Details
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        upiId: '',
        cancelledCheque: null as string | null,

        // Operational Details
        openingTime: '',
        closingTime: '',
        weeklyOff: 'None',
        serviceArea: 'City',
        deliveryRadius: '',
        returnPolicy: '48 hours',
    });

    // Load saved progress on mount
    useEffect(() => {
        const loadSavedProgress = async () => {
            if (!phoneNumber) return;

            try {
                const cleanPhoneNumber = (phoneNumber as string).replace('+91', '');
                const storageKey = `registration_progress_${cleanPhoneNumber}`;
                const savedData = await AsyncStorage.getItem(storageKey);

                if (savedData) {
                    const { form: savedForm, currentStep: savedStep, timestamp } = JSON.parse(savedData);

                    // Check if old data has +91 or 91 in mobile number - if so, clear it
                    if (savedForm.mobileNumber && (savedForm.mobileNumber.startsWith('+91') || (savedForm.mobileNumber.startsWith('91') && savedForm.mobileNumber.length > 10))) {
                        console.log('Clearing old incompatible saved data with +91/91');
                        await AsyncStorage.removeItem(storageKey);
                        return;
                    }

                    // Only load if saved within last 7 days
                    const daysSinceLastSave = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
                    if (daysSinceLastSave < 7) {
                        // Ensure mobile number is cleaned when restoring
                        let cleanedMobile = savedForm.mobileNumber || '';
                        if (cleanedMobile.startsWith('+91')) {
                            cleanedMobile = cleanedMobile.substring(3);
                        } else if (cleanedMobile.startsWith('91') && cleanedMobile.length > 10) {
                            cleanedMobile = cleanedMobile.substring(2);
                        }
                        const cleanedForm = {
                            ...savedForm,
                            mobileNumber: cleanedMobile
                        };
                        setForm(cleanedForm);
                        setCurrentStep(savedStep);
                        console.log(`Resumed registration from Step ${savedStep}`);
                    } else {
                        // Clear old data
                        await AsyncStorage.removeItem(storageKey);
                    }
                }
            } catch (error) {
                console.error('Error loading saved progress:', error);
            }
        };

        loadSavedProgress();
    }, [phoneNumber]);

    // Auto-save form progress
    useEffect(() => {
        if (!phoneNumber) return;

        const saveProgress = async () => {
            try {
                const cleanPhoneNumber = (phoneNumber as string).replace('+91', '');
                const storageKey = `registration_progress_${cleanPhoneNumber}`;
                const dataToSave = {
                    form,
                    currentStep,
                    timestamp: Date.now()
                };
                await AsyncStorage.setItem(storageKey, JSON.stringify(dataToSave));
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        };

        // Debounce save to avoid excessive writes
        const timer = setTimeout(() => {
            saveProgress();
        }, 500);

        return () => clearTimeout(timer);
    }, [form, currentStep, phoneNumber]);

    const theme = {
        background: isDarkMode ? '#000' : '#f7f8fc',
        text: isDarkMode ? '#fff' : '#121212',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#A0A0A0' : '#555',
        primary: '#000000',
        border: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        danger: '#e74c3c' // Added danger color
    };

    const pickImage = async (field: keyof typeof form, isMulti: boolean = false) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
            base64: Platform.OS === 'web', // Request base64 on Web
        });

        if (!result.canceled) {
            let imageUri = result.assets[0].uri;

            // On Web, use base64 data URI to avoid CORS/Blob issues
            if (Platform.OS === 'web' && result.assets[0].base64) {
                // Determine mime type if possible, default to jpeg
                const mimeType = result.assets[0].mimeType || 'image/jpeg';
                imageUri = `data:${mimeType};base64,${result.assets[0].base64}`;
            }

            if (isMulti) {
                setForm(p => ({ ...p, [field]: [...(p[field] as string[]), imageUri] }));
            } else {
                setForm(p => ({ ...p, [field]: imageUri }));
            }
        }
    };

    const getCurrentLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission denied', 'Permission to access location was denied');
            return;
        }

        setIsLoading(true);
        try {
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            let addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });

            let district = '';
            let state = '';
            let zipCode = '';
            let street = '';

            if (addressResponse.length > 0) {
                const addr = addressResponse[0];
                district = addr.district || addr.city || '';
                state = addr.region || addr.subregion || '';
                zipCode = addr.postalCode || '';
                street = addr.street || addr.name || '';
            }

            setForm(p => ({
                ...p,
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                district: district,
                state: state,
                zipCode: zipCode,
                shopAddress: p.shopAddress ? p.shopAddress : street
            }));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not fetch location details.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPinCodeDetails = async (pinCode: string) => {
        if (pinCode.length !== 6) return;

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
            const data = await response.json();

            if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
                const postOffice = data[0].PostOffice[0];
                setForm(p => ({
                    ...p,
                    state: postOffice.State || '',
                    district: postOffice.District || ''
                }));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert('Invalid Pin Code', 'Could not find location details for this pin code.');
            }
        } catch (error) {
            console.error('Pin code fetch error:', error);
            Alert.alert('Error', 'Could not fetch location details.');
        }
    };

    const uploadImage = async (uri: string, path: string) => {
        if (!uri) return null;
        try {
            console.log(`Starting upload for ${path}`);

            // Generate unique filename
            const filename = uri.substring(uri.lastIndexOf('/') + 1).replace(/[^a-zA-Z0-9.\-_]/g, '') || `image_${Date.now()}.jpg`;
            const fullPath = `${path}/${Date.now()}_${filename}`;

            // Prepare file for Supabase upload
            const response = await fetch(uri);
            const blob = await response.blob();
            // Or use FormData if blob fails in your environment, but blob is standard for RN now with fetch

            // Supabase Upload (Assumes bucket 'partner-docs' exists. Plan accordingly)
            const { data, error } = await supabase.storage
                .from('partner-docs') // Ensure this bucket exists in Supabase
                .upload(fullPath, blob, {
                    contentType: 'image/jpeg', // Adjust based on file type if needed
                    upsert: false
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('partner-docs')
                .getPublicUrl(fullPath);

            console.log("Upload success:", publicUrl);
            return publicUrl;
        } catch (error) {
            console.error("Upload failed for path:", path, error);
            throw error;
        }
    };

    const fetchBankDetails = async (ifsc: string) => {
        if (ifsc.length !== 11) return;

        try {
            const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
            const data = await response.json();
            if (data.BRANCH) {
                // Check if bank name matches
                const apiBank = data.BANK.toLowerCase();
                const selectedBank = form.bankName.toLowerCase();

                if (form.bankName && !apiBank.includes(selectedBank) && !selectedBank.includes(apiBank)) {
                    setErrors(prev => ({ ...prev, ifscCode: `This IFSC belongs to ${data.BANK}, not ${form.bankName}` }));
                    return;
                }

                setForm(prev => ({ ...prev, branchName: data.BRANCH }));
                if (errors.ifscCode) setErrors(prev => ({ ...prev, ifscCode: '' }));
            } else {
                setErrors(prev => ({ ...prev, ifscCode: "Invalid IFSC Code" }));
            }
        } catch (error) {
            console.error("IFSC Fetch Error", error);
            setErrors(prev => ({ ...prev, ifscCode: "Could not fetch bank details" }));
        }
    };

    const [submitError, setSubmitError] = useState('');

    const handleRegister = async () => {
        setSubmitError('');
        // Validation moved here
        if (!form.ownerName || !form.storeName || !form.shopAddress || !form.landmark) {
            const msg = 'Please fill all mandatory fields (including Landmark).';
            setSubmitError(msg);
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Missing Fields', msg);
            return;
        }
        // Clean mobile number - handle both +91 and 91 prefixes
        let cleanMobileNumber = (form.mobileNumber || '').trim();
        if (cleanMobileNumber.startsWith('+91')) {
            cleanMobileNumber = cleanMobileNumber.substring(3);
        } else if (cleanMobileNumber.startsWith('91') && cleanMobileNumber.length > 10) {
            cleanMobileNumber = cleanMobileNumber.substring(2);
        }
        if (!cleanMobileNumber || cleanMobileNumber.length !== 10 || !/^\d{10}$/.test(cleanMobileNumber)) {
            const msg = 'Please enter a valid 10-digit mobile number.';
            setSubmitError(msg);
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Invalid Mobile', msg);
            return;
        }

        // GST Validation
        if (!form.gstNumber) {
            const msg = 'GST Number is required.';
            setSubmitError(msg);
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Missing Fields', msg);
            return;
        } else {
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstRegex.test(form.gstNumber)) {
                const msg = 'Invalid GST Number format (e.g. 29ABCDE1234F1Z5)';
                setSubmitError(msg);
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Invalid Format', msg);
                return;
            }
        }

        // PAN Validation
        if (!form.panNumber) {
            const msg = 'PAN Number is required.';
            setSubmitError(msg);
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Missing Fields', msg);
            return;
        } else {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(form.panNumber)) {
                const msg = 'Invalid PAN Number format (e.g. ABCDE1234F)';
                setSubmitError(msg);
                if (Platform.OS === 'web') window.alert(msg);
                else Alert.alert('Invalid Format', msg);
                return;
            }
        }


        setIsLoading(true);
        setUploadStatus('Starting registration...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const currentUid = user?.id || uid as string;

            if (!currentUid) throw new Error("User not authenticated");

            setUploadStatus('Uploading Documents...');
            // Need to create buckets first if not exists. Assuming 'partner-docs' bucket.

            const businessProofUrl = await uploadImage(form.businessProof!, 'docs');
            const cancelledChequeUrl = form.cancelledCheque ? await uploadImage(form.cancelledCheque, 'docs') : null;

            setUploadStatus('Finalizing Registration...');

            const partnerData = {
                id: currentUid,
                owner_name: form.ownerName,
                mobile_number: form.mobileNumber,
                email: form.email,

                // Business Profile
                store_name: form.storeName,
                category: form.category,
                est_year: form.estYear,

                // Location
                shop_address: form.shopAddress,
                state: form.state,
                zip_code: form.zipCode,
                landmark: form.landmark,
                latitude: form.latitude,
                longitude: form.longitude,

                // Documents
                gst_number: form.gstNumber,
                pan_number: form.panNumber,
                business_proof: businessProofUrl,

                // Bank Details
                account_holder_name: form.accountHolderName,
                bank_name: form.bankName,
                account_number: form.accountNumber,
                ifsc_code: form.ifscCode,
                branch_name: form.branchName,
                upi_id: form.upiId,
                cancelled_cheque: cancelledChequeUrl,

                // Operations
                opening_time: form.openingTime,
                closing_time: form.closingTime,
                weekly_off: form.weeklyOff,
                service_area: form.serviceArea,
                delivery_radius: form.deliveryRadius,
                return_policy: form.returnPolicy,

                // Metadata
                status: 'pending',
                is_verified: false,
                created_at: new Date().toISOString(),
                created_by: 'self'
            };

            const { error: dbError } = await supabase
                .from('pre_approved_partners')
                .insert(partnerData);

            if (dbError) throw dbError;

            // Clear saved progress after successful registration
            if (phoneNumber) {
                const cleanPhoneNumber = (phoneNumber as string).replace('+91', '');
                const storageKey = `registration_progress_${cleanPhoneNumber}`;
                await AsyncStorage.removeItem(storageKey);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await AsyncStorage.setItem('user_role', 'partner');

            router.replace('/approval-pending');

        } catch (error: any) {
            console.error(error);
            const msg = error.message || 'Could not register.';
            setSubmitError(msg);
            Alert.alert('Registration Failed', msg);
        } finally {
            setIsLoading(false);
            setUploadStatus('');
        }
    };

    // Selectable Input Component (Looks like input but opens modal)
    const renderSelectionField = (label: string, value: string, placeholder: string, onPress: () => void, half: boolean = false) => {
        // Determine field key based on label for error matching (simplified)
        // Only checking basic ones for now or adding specific keys if needed
        let fieldKey = '';
        if (label.includes("Opening")) fieldKey = 'openingTime';
        if (label.includes("Closing")) fieldKey = 'closingTime';
        if (label.includes("Weekly")) fieldKey = 'weeklyOff';
        if (label.includes("Return Policy")) fieldKey = 'returnPolicy';


        return (
            <TouchableOpacity onPress={onPress} style={[styles.inputGroup, (half || isTablet) ? { flex: 0.48 } : {}]}>
                <Text style={[styles.label, { color: theme.subtext, fontSize: isSmallDevice ? 11 : 13 }]}>{label}</Text>
                <View style={[
                    styles.input,
                    {
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderColor: theme.border,
                        backgroundColor: theme.card
                    }
                ]}>
                    <Text style={{ color: value ? theme.text : theme.subtext, fontSize: isSmallDevice ? 14 : 16 }}>
                        {value || placeholder}
                    </Text>
                    <Feather name="chevron-down" size={20} color={theme.subtext} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderUploadButton = (label: string, field: keyof typeof form, isMulti: boolean = false) => {
        const value = form[field];
        const error = errors[field];

        return (
            <View style={{ marginBottom: 20 }}>
                <Text style={[styles.label, { color: theme.subtext, fontSize: isSmallDevice ? 11 : 13 }]}>{label}</Text>

                {/* Preview for Multiple Images */}
                {isMulti && Array.isArray(value) && value.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        {value.map((uri, index) => (
                            <View key={index} style={{ marginRight: 12, width: 90, height: 90, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                                <Image source={{ uri }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                                <TouchableOpacity
                                    onPress={() => {
                                        const newPhotos = [...value];
                                        newPhotos.splice(index, 1);
                                        setForm(p => ({ ...p, [field]: newPhotos }));
                                    }}
                                    style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 }}
                                >
                                    <Feather name="x" size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Preview for Single Image */}
                {!isMulti && value && typeof value === 'string' && (
                    <View style={{ marginBottom: 12, width: '100%', height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                        <Image source={{ uri: value }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                        <TouchableOpacity
                            style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 20 }}
                            onPress={() => pickImage(field, isMulti)}
                        >
                            <Feather name="edit-2" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity
                    onPress={() => pickImage(field, isMulti)}
                    style={[
                        styles.uploadBox,
                        {
                            borderColor: error ? theme.danger : theme.border,
                            backgroundColor: theme.background,
                            display: (!isMulti && value) ? 'none' : 'flex'
                        }
                    ]}
                >
                    <View style={{ alignItems: 'center' }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                            <Feather name={isMulti ? "layers" : "image"} size={22} color={theme.primary} />
                        </View>
                        <Text style={[styles.uploadText, { color: theme.text }]}>
                            {isMulti && Array.isArray(value) && value.length > 0 ? "Add More Photos" : (isMulti ? "Select Multiple Photos" : "Click to Upload")}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 4 }}>Supports JPG, PNG</Text>
                    </View>
                </TouchableOpacity>
                {error ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 6 }}>{error}</Text> : null}
            </View>
        );
    };

    const generateTimeSlots = () => {
        const times = [];
        const periods = ['AM', 'PM'];
        for (let p = 0; p < 2; p++) {
            for (let h = 0; h < 12; h++) {
                const hour = h === 0 ? 12 : h;
                times.push(`${hour}:00 ${periods[p]}`);
                times.push(`${hour}:30 ${periods[p]}`);
            }
        }
        return times;
    };
    const timeSlots = generateTimeSlots();
    const daysOfWeek = ["None", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const renderInput = (label: string, field: keyof typeof form, placeholder: string, keyboardLoading: any = 'default', half: boolean = false) => (
        <View style={[styles.inputGroup, (half || isTablet) ? { flex: 0.48 } : {}]}>
            <Text style={[styles.label, { color: theme.subtext, fontSize: isSmallDevice ? 11 : 13 }]}>{label}</Text>
            <TextInput
                style={[styles.input, { color: theme.text, borderColor: errors[field] ? theme.danger : theme.border, backgroundColor: theme.card, fontSize: isSmallDevice ? 14 : 16, ...Platform.select({ web: { outlineStyle: 'none' } }) } as any]}
                placeholder={placeholder}
                placeholderTextColor={theme.subtext}
                value={(form[field] as string)}
                onChangeText={t => {
                    setForm(p => ({ ...p, [field]: t }));
                    if (errors[field]) setErrors(prev => {
                        const next = { ...prev };
                        delete next[field];
                        return next;
                    });
                }}
                keyboardType={keyboardLoading}
            />
            {errors[field] ? <Text style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{errors[field]}</Text> : null}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                            <Feather name="x" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={[styles.headerTitle, { color: theme.text }]}>Step {currentStep} of 6</Text>
                        </View>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${(currentStep / 6) * 100}%`, backgroundColor: theme.primary }]} />
                    </View>
                </View>

                <ScrollView
                    style={[styles.container, { backgroundColor: theme.background }]}
                    contentContainerStyle={[styles.content, { maxWidth: 600, alignSelf: 'center', width: '100%' }]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.mainCard, { backgroundColor: theme.card, boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' } as any]}>
                        {currentStep === 1 && (
                            <View style={styles.stepContainer}>
                                <SectionHeader title="Basic Owner Details" icon="user" color={theme.primary} />
                                {renderInput("Owner Name", "ownerName", "Full Name")}
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.subtext }]}>Mobile Number</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.subtext, borderColor: theme.border, backgroundColor: isDarkMode ? '#222' : '#f0f0f0' }]}
                                        value={form.mobileNumber?.replace('+91', '') || ''}
                                        editable={false}
                                    />
                                </View>
                                {renderInput("Email ID", "email", "Email Address", "email-address")}
                            </View>
                        )}

                        {currentStep === 2 && (
                            <View style={styles.stepContainer}>
                                <SectionHeader title="Business Profile" icon="briefcase" color="#f39c12" />
                                {renderInput("Showroom Name", "storeName", "e.g. Royal Furniture")}
                                <View style={{ height: 8 }} />
                                <Text style={[styles.label, { color: theme.subtext, marginTop: 16 }]}>Category</Text>
                                <View style={styles.categoryGrid}>
                                    {categories.map(cat => (
                                        <TouchableOpacity
                                            key={cat.name}
                                            style={[
                                                styles.catChipGrid,
                                                {
                                                    borderColor: form.category === cat.name ? theme.primary : theme.border,
                                                    backgroundColor: form.category === cat.name ? theme.primary + '10' : 'transparent'
                                                }
                                            ]}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setForm(p => ({ ...p, category: cat.name }));
                                            }}
                                        >
                                            <View style={[styles.iconCircle, { backgroundColor: form.category === cat.name ? theme.primary : theme.background }]}>
                                                {cat.library === 'MaterialCommunityIcons' ? (
                                                    <MaterialCommunityIcons name={cat.icon as any} size={24} color={form.category === cat.name ? '#fff' : theme.text} />
                                                ) : (
                                                    <Feather name={cat.icon as any} size={24} color={form.category === cat.name ? '#fff' : theme.text} />
                                                )}
                                            </View>
                                            <Text style={[styles.catText, { color: form.category === cat.name ? theme.primary : theme.text, textAlign: 'center' }]}>{cat.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {errors.category ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>{errors.category}</Text> : null}
                            </View>
                        )}

                        {currentStep === 3 && (
                            <View style={styles.stepContainer}>
                                <SectionHeader title="Location & Address" icon="map-pin" color="#2ecc71" />
                                {renderInput("Shop Address", "shopAddress", "Street Address")}

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.subtext }]}>Pin Code</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: errors.zipCode ? theme.danger : theme.border, backgroundColor: theme.card }]}
                                        value={form.zipCode}
                                        onChangeText={(text) => {
                                            const numericText = text.replace(/[^0-9]/g, '');
                                            setForm(p => ({ ...p, zipCode: numericText }));
                                            if (numericText.length === 6) {
                                                fetchPinCodeDetails(numericText);
                                            }
                                        }}
                                        placeholder="Enter 6-digit Pin Code"
                                        placeholderTextColor={theme.subtext}
                                        keyboardType="numeric"
                                        maxLength={6}
                                    />
                                    {errors.zipCode ? <Text style={{ color: theme.danger, fontSize: 12, marginTop: 4 }}>{errors.zipCode}</Text> : null}
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                        <Text style={[styles.label, { color: theme.subtext }]}>State</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.subtext, borderColor: theme.border, backgroundColor: isDarkMode ? '#222' : '#f0f0f0' }]}
                                            value={form.state}
                                            editable={false}
                                            placeholder="Auto-filled"
                                            placeholderTextColor={theme.subtext}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                        <Text style={[styles.label, { color: theme.subtext }]}>District</Text>
                                        <TextInput
                                            style={[styles.input, { color: theme.subtext, borderColor: theme.border, backgroundColor: isDarkMode ? '#222' : '#f0f0f0' }]}
                                            value={form.district}
                                            editable={false}
                                            placeholder="Auto-filled"
                                            placeholderTextColor={theme.subtext}
                                        />
                                    </View>
                                </View>

                                {renderInput("Landmark", "landmark", "Landmark")}
                            </View>
                        )}

                        {currentStep === 4 && (
                            <View style={styles.stepContainer}>
                                <SectionHeader title="Tax Information" icon="file-text" color="#9b59b6" />

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.subtext }]}>GST Number</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: errors.gstNumber ? theme.danger : theme.border, backgroundColor: theme.card }]}
                                        value={form.gstNumber}
                                        onChangeText={(text) => {
                                            const upperText = text.toUpperCase();
                                            setForm(p => ({ ...p, gstNumber: upperText }));
                                            if (errors.gstNumber) {
                                                setErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next.gstNumber;
                                                    return next;
                                                });
                                            }
                                        }}
                                        placeholder="15-character GSTIN (e.g. 22AAAAA0000A1Z5)"
                                        placeholderTextColor={theme.subtext}
                                        maxLength={15}
                                        autoCapitalize="characters"
                                    />
                                    {errors.gstNumber ? <Text style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{errors.gstNumber}</Text> : null}
                                    {form.gstNumber && form.gstNumber.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber) ? (
                                        <Text style={{ color: theme.primary, fontSize: 11, marginTop: 4 }}>✓ Valid format</Text>
                                    ) : form.gstNumber ? (
                                        <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 4 }}>{form.gstNumber.length}/15 characters</Text>
                                    ) : null}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: theme.subtext }]}>PAN Number</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text, borderColor: errors.panNumber ? theme.danger : theme.border, backgroundColor: theme.card }]}
                                        value={form.panNumber}
                                        onChangeText={(text) => {
                                            const upperText = text.toUpperCase();
                                            setForm(p => ({ ...p, panNumber: upperText }));
                                            if (errors.panNumber) {
                                                setErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next.panNumber;
                                                    return next;
                                                });
                                            }
                                        }}
                                        placeholder="10-character PAN (e.g. ABCDE1234F)"
                                        placeholderTextColor={theme.subtext}
                                        maxLength={10}
                                        autoCapitalize="characters"
                                    />
                                    {errors.panNumber ? <Text style={{ color: theme.danger, fontSize: 11, marginTop: 4 }}>{errors.panNumber}</Text> : null}
                                    {form.panNumber && form.panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber) ? (
                                        <Text style={{ color: theme.primary, fontSize: 11, marginTop: 4 }}>✓ Valid format</Text>
                                    ) : form.panNumber ? (
                                        <Text style={{ color: theme.subtext, fontSize: 11, marginTop: 4 }}>{form.panNumber.length}/10 characters</Text>
                                    ) : null}
                                </View>
                            </View>
                        )}

                        {currentStep === 5 && (
                            <View style={styles.stepContainer}>
                                <SectionHeader title="Store Operations" icon="grid" color="#e67e22" />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {renderSelectionField("Opening Time", form.openingTime, "Select Time", () => setTimePickerType('opening'), true)}
                                    {renderSelectionField("Closing Time", form.closingTime, "Select Time", () => setTimePickerType('closing'), true)}
                                </View>

                                {renderSelectionField("Weekly Off", form.weeklyOff, "Select Day", () => setShowDayModal(true))}

                                <Text style={[styles.label, { color: theme.subtext, marginTop: 10 }]}>Service Area</Text>
                                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                                    <TouchableOpacity
                                        style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: form.serviceArea === 'City' ? theme.primary + '20' : theme.card, borderColor: form.serviceArea === 'City' ? theme.primary : theme.border }]}
                                        onPress={() => setForm(p => ({ ...p, serviceArea: 'City' }))}
                                    >
                                        <Feather name="map-pin" size={18} color={form.serviceArea === 'City' ? theme.primary : theme.subtext} />
                                        <Text style={{ color: form.serviceArea === 'City' ? theme.primary : theme.subtext, fontWeight: '600' }}>Own District</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.input, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: form.serviceArea === 'India' ? theme.primary + '20' : theme.card, borderColor: form.serviceArea === 'India' ? theme.primary : theme.border }]}
                                        onPress={() => setForm(p => ({ ...p, serviceArea: 'India' }))}
                                    >
                                        <Feather name="globe" size={18} color={form.serviceArea === 'India' ? theme.primary : theme.subtext} />
                                        <Text style={{ color: form.serviceArea === 'India' ? theme.primary : theme.subtext, fontWeight: '600' }}>All India</Text>
                                    </TouchableOpacity>
                                </View>

                                {form.serviceArea === 'City' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: theme.subtext }]}>Serviceable District (Auto-fetched)</Text>
                                        <View style={[styles.input, { backgroundColor: isDarkMode ? '#222' : '#f0f0f0', borderColor: theme.border, justifyContent: 'center' }]}>
                                            <Text style={{ color: theme.subtext, fontSize: 16 }}>{form.district || "Please complete Location step"}</Text>
                                        </View>
                                    </View>
                                )}


                            </View>
                        )}

                        {currentStep === 6 && (
                            <View style={styles.stepContainer}>
                                <SectionHeader title="Review Your Information" icon="check-circle" color={theme.primary} />
                                <Text style={{ color: theme.subtext, marginBottom: 20, fontSize: 14 }}>
                                    Please review all your information before submitting
                                </Text>

                                {/* Basic Owner Details */}
                                <View style={{ marginBottom: 20, padding: 16, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Basic Owner Details</Text>
                                        <TouchableOpacity onPress={() => setCurrentStep(1)}>
                                            <Feather name="edit-2" size={16} color={theme.primary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Owner Name:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.ownerName || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Mobile:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.mobileNumber || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Email:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.email || '-'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Business Profile */}
                                <View style={{ marginBottom: 20, padding: 16, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Business Profile</Text>
                                        <TouchableOpacity onPress={() => setCurrentStep(2)}>
                                            <Feather name="edit-2" size={16} color={theme.primary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Showroom Name:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.storeName || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Category:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.category || '-'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Location & Address */}
                                <View style={{ marginBottom: 20, padding: 16, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Location & Address</Text>
                                        <TouchableOpacity onPress={() => setCurrentStep(3)}>
                                            <Feather name="edit-2" size={16} color={theme.primary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Address:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.shopAddress || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Pin Code:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.zipCode || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>State:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.state || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>District:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.district || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Landmark:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.landmark || '-'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Tax Information */}
                                <View style={{ marginBottom: 20, padding: 16, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Tax Information</Text>
                                        <TouchableOpacity onPress={() => setCurrentStep(4)}>
                                            <Feather name="edit-2" size={16} color={theme.primary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>GST Number:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.gstNumber || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>PAN Number:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.panNumber || '-'}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Store Operations */}
                                <View style={{ marginBottom: 20, padding: 16, backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Store Operations</Text>
                                        <TouchableOpacity onPress={() => setCurrentStep(5)}>
                                            <Feather name="edit-2" size={16} color={theme.primary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={{ gap: 8 }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Opening Time:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.openingTime || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Closing Time:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.closingTime || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Weekly Off:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.weeklyOff || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Service Area:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.serviceArea || '-'}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ color: theme.subtext, flex: 1 }}>Return Policy:</Text>
                                            <Text style={{ color: theme.text, flex: 2, fontWeight: '500' }}>{form.returnPolicy || '-'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={{ marginTop: 20 }}>
                            {submitError ? <Text style={{ textAlign: 'center', marginBottom: 10, color: theme.danger, fontWeight: 'bold' }}>{submitError}</Text> : null}
                            {uploadStatus ? <Text style={{ textAlign: 'center', marginBottom: 10, color: theme.subtext }}>{uploadStatus}</Text> : null}
                            <View style={styles.footerButtons}>
                                <TouchableOpacity
                                    style={[styles.backStepButton, { borderColor: theme.border, opacity: currentStep === 1 ? 0.3 : 1 }]}
                                    onPress={prevStep}
                                    disabled={currentStep === 1}
                                >
                                    <Text style={[styles.backStepText, { color: theme.text }]}>Back</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.nextStepButton, { backgroundColor: '#000000', opacity: isLoading ? 0.7 : 1 }]}
                                    onPress={() => currentStep === 6 ? handleRegister() : nextStep()}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextStepText}>{currentStep === 6 ? "Submit" : "Next"}</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modals */}
            <Modal visible={showBankModal} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => setShowBankModal(false)}>
                            <Feather name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <TextInput
                            style={{ flex: 1, backgroundColor: theme.card, padding: 12, borderRadius: 8, color: theme.text, fontSize: 16 }}
                            placeholder="Search Bank"
                            placeholderTextColor={theme.subtext}
                            value={bankSearch}
                            onChangeText={setBankSearch}
                            autoFocus
                        />
                    </View>
                    <FlatList
                        data={filteredBanks}
                        keyExtractor={(item) => item}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}
                                onPress={() => {
                                    setForm(prev => ({ ...prev, bankName: item }));
                                    setBankSearch('');
                                    setShowBankModal(false);
                                }}
                            >
                                <Text style={{ color: theme.text, fontSize: 16 }}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>
            <Modal visible={!!timePickerType} transparent animationType="fade" onRequestClose={() => setTimePickerType(null)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20, maxHeight: '60%' }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Select Time</Text>
                        <FlatList
                            data={timeSlots}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                                    onPress={() => {
                                        if (timePickerType === 'opening') setForm(p => ({ ...p, openingTime: item }));
                                        else setForm(p => ({ ...p, closingTime: item }));
                                        setTimePickerType(null);
                                    }}
                                >
                                    <Text style={{ color: theme.text, fontSize: 16 }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setTimePickerType(null)} style={{ marginTop: 16, alignSelf: 'center' }}>
                            <Text style={{ color: theme.danger, fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal visible={showDayModal} transparent animationType="fade" onRequestClose={() => setShowDayModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Select Weekly Off</Text>
                        <FlatList
                            data={daysOfWeek}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                                    onPress={() => {
                                        setForm(p => ({ ...p, weeklyOff: item }));
                                        setShowDayModal(false);
                                    }}
                                >
                                    <Text style={{ color: theme.text, fontSize: 16 }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setShowDayModal(false)} style={{ marginTop: 16, alignSelf: 'center' }}>
                            <Text style={{ color: theme.danger, fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <Modal visible={showReturnPolicyModal} transparent animationType="fade" onRequestClose={() => setShowReturnPolicyModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Select Return Policy</Text>
                        <FlatList
                            data={["No Return", "24 Hours", "48 Hours"]}
                            keyExtractor={item => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                                    onPress={() => {
                                        setForm(p => ({ ...p, returnPolicy: item }));
                                        setShowReturnPolicyModal(false);
                                    }}
                                >
                                    <Text style={{ color: theme.text, fontSize: 16 }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity onPress={() => setShowReturnPolicyModal(false)} style={{ marginTop: 16, alignSelf: 'center' }}>
                            <Text style={{ color: theme.danger, fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 12,
        paddingTop: Platform.OS === 'ios' ? 10 : 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    closeButton: {
        padding: 8,
    },
    headerTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    headerSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    progressBarContainer: {
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    content: { paddingVertical: 20 },
    mainCard: {
        borderRadius: 20,
        marginHorizontal: 16,
        padding: 24,
        elevation: 4,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
            },
            ios: {
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            }
        })
    },
    stepContainer: {
        flex: 1,
    },
    section: { marginBottom: 24, paddingBottom: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { padding: 18, borderRadius: 16, fontSize: 16, borderWidth: 1.5 },
    locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 10 },
    uploadBox: { height: 120, borderStyle: 'dashed', borderWidth: 1.5, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    uploadText: { fontSize: 14, fontWeight: '600' },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
    catChipGrid: { width: '48%', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1.5, marginBottom: 4 },
    iconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    catText: { fontWeight: '700', fontSize: 14 },
    footerButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
    backStepButton: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    backStepText: { fontSize: 16, fontWeight: '700' },
    nextStepButton: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    nextStepText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default SellerRegistrationScreen;
