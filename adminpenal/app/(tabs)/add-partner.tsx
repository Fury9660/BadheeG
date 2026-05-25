import { supabase } from '@/config/supabaseConfig';
import { IndianBanks } from '@/constants/BankList';
import { DISTRICTS, INDIAN_STATES } from '@/constants/locations';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
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

const AddPartnerScreen = () => {
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const isSmallDevice = width < 375;
    const isTablet = width > 768;
    const { editMode, id, initialData, readOnly } = useLocalSearchParams(); // Added readOnly

    const [isLoading, setIsLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankSearch, setBankSearch] = useState('');
    const filteredBanks = IndianBanks.filter(bank => bank.toLowerCase().includes(bankSearch.toLowerCase()));

    // Multi-Step State
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        { title: "Basic Details", icon: "user" },
        { title: "Location", icon: "map-pin" },
        { title: "Documents", icon: "file-text" },
        { title: "Bank Info", icon: "credit-card" },
        { title: "Store Setup", icon: "grid" }
    ];

    // Location Selection State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectionType, setSelectionType] = useState<'state' | 'city' | null>(null);
    const [timePickerType, setTimePickerType] = useState<'opening' | 'closing' | null>(null);
    const [showDayModal, setShowDayModal] = useState(false);
    const [showReturnPolicyModal, setShowReturnPolicyModal] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Error State
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Form State
    const [form, setForm] = useState({
        ownerName: '',
        mobileNumber: '', // Manual for Admin
        email: '',
        // password: '', // Using Phone Auth, no password needed

        // Business Profile
        storeName: '',
        category: 'Furniture',
        estYear: '',

        // Location & Address
        shopAddress: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        latitude: '',
        longitude: '',

        // Legal Documents
        gstNumber: '',
        panNumber: '',
        // businessProof: null as string | null, // Removed in source, used below

        // Bank Details
        accountHolderName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        upiId: '',
        // cancelledCheque: null as string | null, // Removed

        // Showroom Gallery
        // exteriorPhoto: null as string | null, // Removed
        // interiorPhotos: [] as string[], // Removed

        // Operational Details
        openingTime: '',
        closingTime: '',
        weeklyOff: 'None',
        serviceArea: 'City', // 'City' or 'India'
        returnPolicy: 'Only 48hrs', // Fixed default
        deliveryRadius: '', // Kept for backend compatibility but not shown if India

        // Added for type safety if needed, but existing code seems to use dynamic keys or ignores it
        businessProof: null as string | null,
    });

    useEffect(() => {
        if (initialData) {
            try {
                const parsed = JSON.parse(initialData as string);
                setForm(prev => ({
                    ...prev,
                    ownerName: parsed.owner_name || '',
                    mobileNumber: parsed.mobile_number || '',
                    email: parsed.email || '',
                    storeName: parsed.store_name || '',
                    category: parsed.category || 'Furniture',
                    estYear: parsed.est_year || '',
                    shopAddress: parsed.shop_address || '',
                    city: parsed.city || '',
                    state: parsed.state || '',
                    zipCode: parsed.zip_code || '',
                    landmark: parsed.landmark || '',
                    latitude: parsed.latitude || '',
                    longitude: parsed.longitude || '',
                    gstNumber: parsed.gst_number || '',
                    panNumber: parsed.pan_number || '',
                    businessProof: parsed.business_proof || null,
                    accountHolderName: parsed.account_holder_name || '',
                    bankName: parsed.bank_name || '',
                    accountNumber: parsed.account_number || '',
                    ifscCode: parsed.ifsc_code || '',
                    branchName: parsed.branch_name || '',
                    upiId: parsed.upi_id || '',
                    openingTime: parsed.opening_time || '',
                    closingTime: parsed.closing_time || '',
                    weeklyOff: parsed.weekly_off || 'None',
                    serviceArea: parsed.service_area || 'City',
                    returnPolicy: parsed.return_policy || 'Only 48hrs',
                }));
            } catch (e) {
                console.error("Failed to parse initialData", e);
            }
        }
    }, [initialData]);

    const theme = {
        background: '#F8FAFC',
        text: '#0F172A',
        card: '#FFFFFF',
        subtext: '#64748B',
        primary: '#000000',
        border: '#E2E8F0',
        inputBg: '#F1F5F9',
        danger: '#EF4444'
    };

    const pickImage = async (field: keyof typeof form) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setForm(p => ({ ...p, [field]: result.assets[0].uri }));
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

            let city = '';
            let state = '';
            let zipCode = '';
            let street = '';

            if (addressResponse.length > 0) {
                const addr = addressResponse[0];
                city = addr.city || addr.district || '';
                state = addr.region || addr.subregion || '';
                zipCode = addr.postalCode || '';
                street = addr.street || addr.name || '';
            }

            // Standardize State name if possible to match our list
            const matchedState = INDIAN_STATES.find(s => s.toLowerCase() === state.toLowerCase()) || state;

            setForm(p => ({
                ...p,
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                city: city, // User might still need to select district manually if geocode city != district
                state: matchedState,
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

    const uploadImage = async (uri: string, path: string) => {
        if (!uri) return null;
        try {
            console.log(`Starting upload for ${path} from ${uri}`);

            // Fetch image and convert to blob
            const response = await fetch(uri);
            const blob = await response.blob();

            const filename = `${path}/${Date.now()}_${uri.substring(uri.lastIndexOf('/') + 1)}`;

            const { data, error } = await supabase.storage
                .from('partner-docs')
                .upload(filename, blob, { contentType: 'image/jpeg' });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('partner-docs')
                .getPublicUrl(filename);

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
            // Optionally set error or clear branch name
            setErrors(prev => ({ ...prev, ifscCode: "Could not fetch bank details" }));
        }
    };

    const [submitError, setSubmitError] = useState('');

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const checkDuplicatePartner = async (mobile: string, email: string, excludeId?: string) => {
        try {
            let query = supabase
                .from('pre_approved_partners')
                .select('mobile_number, email')
                .or(`mobile_number.eq.${mobile},email.eq.${email}`);

            // In edit mode, exclude the current partner's own record
            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            const { data, error } = await query;

            if (error) {
                console.error("Duplicate Check Supabase Error:", error);
                return null;
            }

            if (data && data.length > 0) {
                const matchMobile = data.find(p => p.mobile_number === mobile);
                const matchEmail = data.find(p => p.email === email);

                if (matchMobile) return "Mobile Number already registered as a Partner.";
                if (matchEmail) return "Email ID already registered as a Partner.";
            }
            return null;
        } catch (error) {
            console.error("Duplicate Check Error:", error);
            return null;
        }
    };

    const handleRegister = async () => {
        setSubmitError('');
        console.log("handleRegister started. Form Data:", JSON.stringify(form, null, 2));
        // Validation
        if (!form.ownerName || !form.storeName || !form.shopAddress || !form.landmark) {
            console.log("Missing basic fields");
            const msg = 'Please fill all mandatory fields (including Landmark).';
            setSubmitError(msg);
            if (Platform.OS === 'web') window.alert(msg);
            else Alert.alert('Missing Fields', msg);
            return;
        }
        if (!form.mobileNumber || form.mobileNumber.length !== 10) {
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
        setUploadStatus('Saving...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const isEditMode = editMode === 'true' && id;

            // Upload business proof only if a new image was picked (not a URL already saved)
            let businessProofUrl = form.businessProof;
            if (form.businessProof && !form.businessProof.startsWith('http')) {
                setUploadStatus('Uploading document...');
                businessProofUrl = await uploadImage(form.businessProof!, 'docs');
            }

            setUploadStatus('Finalizing...');

            const partnerData = {
                owner_name: form.ownerName,
                mobile_number: form.mobileNumber,
                email: form.email,
                store_name: form.storeName,
                category: form.category,
                est_year: form.estYear,
                shop_address: form.shopAddress,
                city: form.city,
                state: form.state,
                zip_code: form.zipCode,
                landmark: form.landmark,
                latitude: form.latitude,
                longitude: form.longitude,
                gst_number: form.gstNumber,
                pan_number: form.panNumber,
                business_proof: businessProofUrl,
                account_holder_name: form.accountHolderName,
                bank_name: form.bankName,
                account_number: form.accountNumber,
                ifsc_code: form.ifscCode,
                branch_name: form.branchName,
                upi_id: form.upiId,
                opening_time: form.openingTime,
                closing_time: form.closingTime,
                weekly_off: form.weeklyOff,
                service_area: form.serviceArea,
                return_policy: form.returnPolicy,
            };

            if (isEditMode) {
                // UPDATE existing partner
                const { error } = await supabase
                    .from('pre_approved_partners')
                    .update(partnerData)
                    .eq('id', id);

                if (error) throw error;

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (Platform.OS === 'web') window.alert('Partner updated successfully!');
                else Alert.alert("Success", "Partner Updated Successfully");
                router.back();
            } else {
                // INSERT new partner
                const newPartnerId = generateUUID();
                const { error } = await supabase
                    .from('pre_approved_partners')
                    .upsert({
                        ...partnerData,
                        id: newPartnerId,
                        status: 'Active',
                        is_verified: true,
                        created_at: new Date(),
                        created_by: 'admin',
                        cancelled_cheque: null,
                        exterior_photo: null,
                        interior_photos: [],
                    });

                if (error) throw error;

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Success", "Partner Added Successfully");
                router.back();
            }

        } catch (error: any) {
            console.error(error);
            const msg = error.message || 'Could not save.';
            setSubmitError(msg);
            if (Platform.OS === 'web') window.alert('Error: ' + msg);
            else Alert.alert('Failed', msg);
        } finally {
            setIsLoading(false);
            setUploadStatus('');
        }
    };

    const fetchAndPopulatePincode = async (pincode: string) => {
        if (pincode.length !== 6) return;

        setIsLoading(true);
        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();

            if (data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
                const details = data[0].PostOffice[0];
                const apiState = details.State;
                const apiDistrict = details.District;

                // Normalize State
                const matchedState = INDIAN_STATES.find(s => s.toLowerCase() === apiState.toLowerCase()) || apiState;

                setForm(prev => ({
                    ...prev,
                    state: matchedState,
                    city: apiDistrict
                }));
                // Clear errors if any
                setErrors(prev => ({ ...prev, state: '', city: '', zipCode: '' }));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            console.error("Auto-fetch pincode error", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (form.zipCode?.length === 6) {
            fetchAndPopulatePincode(form.zipCode);
        }
    }, [form.zipCode]);

    const validatePincode = async (): Promise<boolean> => {
        if (!form.zipCode || form.zipCode.length !== 6) {
            setErrors(prev => ({ ...prev, zipCode: "Enter valid 6-digit pincode" }));
            return false;
        }

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${form.zipCode}`);
            const data = await response.json();

            if (data[0].Status === "Success") {
                const postOffices = data[0].PostOffice;
                const state = form.state;
                const district = form.city; // Using city as district based on selection logic

                // Check for State Match
                const stateMatch = postOffices.some((po: any) => po.State.toLowerCase() === state.toLowerCase());
                if (!stateMatch) {
                    setErrors(prev => ({ ...prev, zipCode: `Pincode belongs to ${postOffices[0].State}, not selected state` }));
                    return false;
                }

                // Check for District Match (Relaxed check as api district names might slightly differ)
                const districtMatch = postOffices.some((po: any) => {
                    const apiDistrict = po.District.toLowerCase();
                    const selectedDistrict = district.toLowerCase();
                    return apiDistrict.includes(selectedDistrict) || selectedDistrict.includes(apiDistrict);
                });

                if (!districtMatch) {
                    // Collect valid districts from API to show helpful message
                    const validDistricts = [...new Set(postOffices.map((po: any) => po.District))].join(", ");
                    setErrors(prev => ({ ...prev, zipCode: `Pincode belongs to ${validDistricts}, not ${district}` }));
                    return false;
                }

                // Clear zipCode error on success
                setErrors(prev => ({ ...prev, zipCode: '' }));
                return true;
            } else {
                setErrors(prev => ({ ...prev, zipCode: "Invalid Pincode. Not found." }));
                return false;
            }
        } catch (error) {
            console.log("Pincode API Error", error);
            // In case of API failure, we allow proceeding but log error.
            return true;
        }
    };

    const validateStep = () => {
        let currentErrors: { [key: string]: string } = {};
        let isValid = true;

        switch (currentStep) {
            case 0:
                if (!form.ownerName) { currentErrors.ownerName = "Owner Name is required."; isValid = false; }
                if (!form.storeName) { currentErrors.storeName = "Store Name is required."; isValid = false; }
                if (!form.email) { currentErrors.email = "Email is required."; isValid = false; }
                // Category is pre-selected, so no validation needed unless it becomes dynamic
                break;
            case 1:
                if (!form.shopAddress) { currentErrors.shopAddress = "Shop Address is required."; isValid = false; }
                if (!form.state) { currentErrors.state = "State is required."; isValid = false; }
                if (!form.city) { currentErrors.city = "City/District is required."; isValid = false; }
                if (!form.zipCode) { currentErrors.zipCode = "Zip Code is required."; isValid = false; }
                if (!form.landmark) { currentErrors.landmark = "Landmark is required."; isValid = false; }
                break;
            case 2:
                // GST Validation (Mandatory)
                if (!form.gstNumber) {
                    currentErrors.gstNumber = "GST Number is required.";
                    isValid = false;
                } else {
                    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                    if (!gstRegex.test(form.gstNumber)) {
                        currentErrors.gstNumber = "Invalid GST Format (e.g. 29ABCDE1234F1Z5)";
                        isValid = false;
                    }
                }

                // PAN Validation (Mandatory)
                if (!form.panNumber) {
                    currentErrors.panNumber = "PAN Number is required.";
                    isValid = false;
                } else {
                    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                    if (!panRegex.test(form.panNumber)) {
                        currentErrors.panNumber = "Invalid PAN Format (e.g. ABCDE1234F)";
                        isValid = false;
                    }
                }
                break;
            case 3:
                if (!form.accountHolderName) { currentErrors.accountHolderName = "Account Holder Name is required."; isValid = false; }
                if (!form.bankName) { currentErrors.bankName = "Bank Name is required."; isValid = false; }
                if (!form.accountNumber) { currentErrors.accountNumber = "Account Number is required."; isValid = false; }
                if (!form.ifscCode) { currentErrors.ifscCode = "IFSC Code is required."; isValid = false; }
                break;
            case 4:
                // All fields in step 4 are currently optional or have default values
                break;
        }
        setErrors(currentErrors);
        return isValid;
    };

    const handleNext = async () => {
        console.log("handleNext called. Current Step:", currentStep);
        setErrors({}); // Clear previous errors
        let newErrors: { [key: string]: string } = {};
        let isValid = true;

        if (currentStep === 0) {
            if (!form.ownerName) newErrors.ownerName = "Owner Name is required";
            if (!form.storeName) newErrors.storeName = "Store Name is required";
            if (!form.email) newErrors.email = "Email is required";

            if (!form.mobileNumber) newErrors.mobileNumber = "Mobile Number is required";
            else if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) {
                newErrors.mobileNumber = "Enter valid 10-digit Indian Mobile Number (starts with 6-9)";
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }


            // Skip duplicate check in edit mode — admin is editing existing record
            if (editMode !== 'true') {
                setIsLoading(true);
                const duplicateError = await checkDuplicatePartner(form.mobileNumber, form.email);
                setIsLoading(false);

                if (duplicateError) {
                    if (Platform.OS === 'web') window.alert(duplicateError);
                    else Alert.alert("Duplicate Entry", duplicateError);
                    return;
                }
            }

        } else if (currentStep === 1) {
            if (!form.shopAddress) newErrors.shopAddress = "Address is required";
            if (!form.state) newErrors.state = "State is required";
            if (!form.city) newErrors.city = "City/District is required";
            if (!form.zipCode) newErrors.zipCode = "Zip Code is required";
            if (!form.landmark) newErrors.landmark = "Landmark is required";

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }

            setIsLoading(true);
            const isValidPincode = await validatePincode();
            setIsLoading(false);
            if (!isValidPincode) return;
        } else if (currentStep === 2) {
            // GST Validation
            if (!form.gstNumber) {
                newErrors.gstNumber = "GST Number is required.";
            } else {
                const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                if (!gstRegex.test(form.gstNumber)) {
                    newErrors.gstNumber = "Invalid GST Format";
                }
            }

            // PAN Validation
            if (!form.panNumber) {
                newErrors.panNumber = "PAN Number is required.";
            } else {
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (!panRegex.test(form.panNumber)) {
                    newErrors.panNumber = "Invalid PAN Format";
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
        } else if (currentStep === 3) {
            if (!form.accountHolderName) newErrors.accountHolderName = "Account Name required";
            if (!form.bankName) newErrors.bankName = "Bank Name required";
            if (!form.accountNumber) newErrors.accountNumber = "Account Number required";
            if (!form.ifscCode) newErrors.ifscCode = "IFSC Code required";

            // UPI ID is now Optional
            if (form.upiId) {
                const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
                if (!upiRegex.test(form.upiId)) {
                    newErrors.upiId = "Invalid UPI ID Format";
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
        }

        if (currentStep < steps.length - 1) {
            console.log("Proceeding to next step");
            setCurrentStep(currentStep + 1);
            Haptics.selectionAsync();
        } else {
            console.log("Last step reached, calling handleRegister");
            handleRegister();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            Haptics.selectionAsync();
        } else {
            router.back();
        }
    };

    const openSelection = (type: 'state' | 'city') => {
        if (type === 'city' && !form.state) {
            Alert.alert("Select State", "Please select a State first.");
            return;
        }
        setSelectionType(type);
        setSearchText('');
        setModalVisible(true);
    };

    const handleSelection = (item: string) => {
        if (selectionType === 'state') {
            setForm(p => ({ ...p, state: item, city: '' })); // Reset city when state changes
            if (errors.state) setErrors(p => ({ ...p, state: '' }));
        } else {
            setForm(p => ({ ...p, city: item }));
            if (errors.city) setErrors(p => ({ ...p, city: '' }));
        }
        setModalVisible(false);
    };

    const getListItems = () => {
        if (selectionType === 'state') return INDIAN_STATES;
        if (selectionType === 'city') return DISTRICTS[form.state] || [];
        return [];
    };

    const filteredItems = getListItems().filter(item => item.toLowerCase().includes(searchText.toLowerCase()));

    const renderInput = (label: string, field: keyof typeof form, placeholder: string, keyboardLoading: any = 'default', half: boolean = false, editable: boolean = true, autoCap: 'none' | 'sentences' | 'words' | 'characters' = 'none') => (
        <View style={[styles.inputGroup, isTablet ? { width: '48%' } : { width: '100%' }]}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    {
                        color: theme.text,
                        backgroundColor: (editable && !readOnly) ? theme.inputBg : '#E2E8F0',
                        fontSize: 16,
                        opacity: (editable && !readOnly) ? 1 : 0.7,
                        outlineStyle: 'none'
                    }
                ]}
                placeholder={placeholder}
                placeholderTextColor={theme.subtext}
                value={(form[field] as string)}
                onChangeText={t => {
                    if (!editable || readOnly) return;
                    const val = autoCap === 'characters' ? t.toUpperCase() : t;
                    setForm(p => ({ ...p, [field]: val }));
                    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
                }}
                keyboardType={keyboardLoading}
                editable={editable && !readOnly}
                autoCapitalize={autoCap}
            />
            {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
        </View>
    );

    // Selectable Input Component (Looks like input but opens modal)
    const renderSelectionField = (label: string, value: string, placeholder: string, onPress: () => void, half: boolean = false) => {
        let fieldKey = '';
        if (label === 'State') fieldKey = 'state';
        else if (label === 'City') fieldKey = 'city';
        else if (label === 'Opening Time') fieldKey = 'openingTime';
        else if (label === 'Closing Time') fieldKey = 'closingTime';
        else if (label === 'Weekly Off') fieldKey = 'weeklyOff';
        else if (label === 'Return Policy') fieldKey = 'returnPolicy';

        const hasError = fieldKey && errors[fieldKey];

        return (
            <TouchableOpacity onPress={readOnly ? undefined : onPress} style={[styles.inputGroup, isTablet ? { width: '48%' } : { width: '100%' }]}>
                <Text style={styles.label}>{label}</Text>
                <View style={[
                    styles.input,
                    {
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: (readOnly) ? '#E2E8F0' : theme.inputBg,
                    }
                ]}>
                    <Text style={{ 
                        color: value ? theme.text : theme.subtext, 
                        fontSize: 16,
                    }}>
                        {value || placeholder}
                    </Text>
                    <Feather name="chevron-down" size={20} color={theme.subtext} />
                </View>
                {hasError ? <Text style={styles.errorText}>{errors[fieldKey]}</Text> : null}
            </TouchableOpacity>
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle="dark-content" />
            
            {/* Professional Step Indicator */}
            <View style={styles.headerNav}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Feather name="x" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{editMode ? 'Edit Partner' : 'Add New Partner'}</Text>
                        <Text style={styles.headerStep}>Step {currentStep + 1} of {steps.length}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>
                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${((currentStep + 1) / steps.length) * 100}%` }]} />
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={[styles.card, isTablet && { alignSelf: 'center', width: 900, padding: 40 }]}>
                        {currentStep === 0 && (
                            <View>
                                <SectionHeader title="Basic Details" icon="user" color="#3466F6" />
                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("Owner Name", "ownerName", "Full Name of Owner", 'default', true)}
                                    {renderInput("Mobile Number", "mobileNumber", "10-digit mobile number", 'phone-pad', true)}
                                </View>
                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("Email Address", "email", "owner@example.com", 'email-address', true)}
                                    {renderInput("Establishment Year", "estYear", "e.g. 2024", 'number-pad', true)}
                                </View>
                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("Store Name", "storeName", "Name of the showroom", 'default', true)}
                                    <View style={[styles.inputGroup, isTablet ? { width: '48%' } : { width: '100%' }]}>
                                        <Text style={styles.label}>Category</Text>
                                        <View style={[styles.input, { backgroundColor: '#E2E8F0', opacity: 0.7, justifyContent: 'center' }]}>
                                            <Text style={{ color: theme.text }}>{form.category}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {currentStep === 1 && (
                            <View>
                                <SectionHeader title="Location Details" icon="map-pin" color="#27AE60" />
                                <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                                    <View style={styles.locationButtonInner}>
                                        <Feather name="navigation" size={18} color="#fff" />
                                        <Text style={styles.locationButtonText}>Detect My Location</Text>
                                    </View>
                                </TouchableOpacity>

                                <View style={isTablet ? styles.row : {}}>
                                    {renderSelectionField("State", form.state, "Select State", () => openSelection('state'), true)}
                                    {renderSelectionField("City / District", form.city, "Select City", () => openSelection('city'), true)}
                                </View>
                                
                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("Zip Code", "zipCode", "6-digit pincode", 'number-pad', true)}
                                    {renderInput("Landmark", "landmark", "Famous place nearby", 'default', true)}
                                </View>

                                {renderInput("Full Shop Address", "shopAddress", "Shop floor, Building, Main road etc.", 'default')}
                                
                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("Latitude", "latitude", "Auto-filled", 'default', true, false)}
                                    {renderInput("Longitude", "longitude", "Auto-filled", 'default', true, false)}
                                </View>
                            </View>
                        )}

                        {currentStep === 2 && (
                            <View>
                                <SectionHeader title="Legal Documents" icon="file-text" color="#E67E22" />
                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("GST Number", "gstNumber", "15-digit GSTIN", 'default', true, true, 'characters')}
                                    {renderInput("PAN Number", "panNumber", "10-digit PAN", 'default', true, true, 'characters')}
                                </View>

                                <Text style={styles.uploadLabel}>Business Proof (Image)</Text>
                                <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage('businessProof')}>
                                    {form.businessProof ? (
                                        <Image source={{ uri: form.businessProof }} style={styles.previewImage} resizeMode="contain" />
                                    ) : (
                                        <View style={styles.uploadPlaceholder}>
                                            <Feather name="upload-cloud" size={32} color={theme.subtext} />
                                            <Text style={styles.uploadText}>Tap to upload document</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                {errors.businessProof ? <Text style={styles.errorText}>{errors.businessProof}</Text> : null}
                            </View>
                        )}

                        {currentStep === 3 && (
                            <View>
                                <SectionHeader title="Bank Information" icon="credit-card" color="#3466F6" />
                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("Account Holder Name", "accountHolderName", "Name on passbook", 'default', true)}
                                    {renderSelectionField("Select Bank", form.bankName, "Choose Bank", () => setShowBankModal(true), true)}
                                </View>

                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("IFSC Code", "ifscCode", "11-digit IFSC", 'default', true, true, 'characters')}
                                    {renderInput("Branch Name", "branchName", "Auto-filled via IFSC", 'default', true, false)}
                                </View>

                                <View style={isTablet ? styles.row : {}}>
                                    {renderInput("Account Number", "accountNumber", "Your account Number", 'number-pad', true)}
                                    {renderInput("UPI ID (Optional)", "upiId", "example@upi", 'default', true)}
                                </View>
                            </View>
                        )}

                        {currentStep === 4 && (
                            <View>
                                <SectionHeader title="Store Operations" icon="grid" color="#E67E22" />
                                <View style={isTablet ? styles.row : {}}>
                                    {renderSelectionField("Opening Time", form.openingTime || '10:00 AM', "Select Time", () => setTimePickerType('opening'), true)}
                                    {renderSelectionField("Closing Time", form.closingTime || '08:00 PM', "Select Time", () => setTimePickerType('closing'), true)}
                                </View>

                                <View style={isTablet ? styles.row : {}}>
                                    {renderSelectionField("Weekly Off", form.weeklyOff, "Select Day", () => setShowDayModal(true), true)}
                                    {renderSelectionField("Return Policy", form.returnPolicy, "Select Policy", () => setShowReturnPolicyModal(true), true)}
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Service Area</Text>
                                    <View style={styles.radioGroup}>
                                        <TouchableOpacity 
                                            style={[styles.radioButton, form.serviceArea === 'City' && styles.radioButtonActive]} 
                                            onPress={() => setForm(p => ({ ...p, serviceArea: 'City' }))}
                                        >
                                            <Feather name="map" size={18} color={form.serviceArea === 'City' ? '#fff' : '#000'} />
                                            <Text style={[styles.radioText, form.serviceArea === 'City' && { color: '#fff' }]}>Own City</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.radioButton, form.serviceArea === 'India' && styles.radioButtonActive]} 
                                            onPress={() => setForm(p => ({ ...p, serviceArea: 'India' }))}
                                        >
                                            <Feather name="globe" size={18} color={form.serviceArea === 'India' ? '#fff' : '#000'} />
                                            <Text style={[styles.radioText, form.serviceArea === 'India' && { color: '#fff' }]}>All India</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Action Bar */}
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextButtonText}>{currentStep === steps.length - 1 ? 'Submit' : 'Continue'}</Text>}
                </TouchableOpacity>
            </View>

            {/* Selection Modal - Moved outside KeyboardAvoidingView */}
            <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Select {selectionType === 'state' ? 'State' : 'City'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Feather name="x" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.searchContainer, { backgroundColor: '#f0f0f0' }]}>
                            <Feather name="search" size={20} color={theme.subtext} style={{ marginRight: 10 }} />
                            <TextInput
                                placeholder="Search..."
                                placeholderTextColor={theme.subtext}
                                style={{ flex: 1, color: theme.text, height: 40, outlineStyle: 'none' }}
                                value={searchText}
                                onChangeText={setSearchText}
                                autoCorrect={false}
                            />
                        </View>

                        <FlatList
                            data={filteredItems}
                            keyExtractor={(item) => item}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            keyboardShouldPersistTaps="handled"
                            initialNumToRender={15}
                            maxToRenderPerBatch={15}
                            windowSize={10}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleSelection(item)} style={[styles.optionItem, { borderBottomColor: theme.border }]}>
                                    <Text style={[styles.optionText, { color: theme.text }]}>{item}</Text>
                                    {(selectionType === 'state' ? form.state === item : form.city === item) &&
                                        <Feather name="check" size={20} color={theme.primary} />
                                    }
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Bank Selection Modal */}
            <Modal visible={showBankModal} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity onPress={() => setShowBankModal(false)}>
                            <Feather name="arrow-left" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <TextInput
                            style={{ flex: 1, backgroundColor: theme.inputBg, padding: 12, borderRadius: 8, color: theme.text, fontSize: 16, outlineStyle: 'none' }}
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
            {/* Time Selection Modal */}
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

            {/* Weekly Off Modal */}
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

            {/* Return Policy Selection Modal */}
            <Modal visible={showReturnPolicyModal} transparent animationType="fade" onRequestClose={() => setShowReturnPolicyModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>Select Return Policy</Text>
                        <FlatList
                            data={['Only 48hrs', 'No Return']}
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
    headerNav: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerInfo: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerStep: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 2,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F1F5F9',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#000',
        borderRadius: 3,
    },
    scrollContent: {
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: "#64748B",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        height: 56,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        justifyContent: 'center',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    locationButton: {
        marginBottom: 24,
    },
    locationButtonInner: {
        backgroundColor: '#000',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    locationButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    uploadLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 12,
    },
    uploadBox: {
        height: 200,
        width: '100%',
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    uploadText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    radioButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
    },
    radioButtonActive: {
        backgroundColor: '#000',
        borderColor: '#000',
    },
    radioText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
    },
    actionBar: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },
    backButton: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '700',
    },
    nextButton: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '80%', paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, height: 48, marginBottom: 16 },
    optionItem: { paddingVertical: 16, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionText: { fontSize: 16, fontWeight: '500' }
});

export default AddPartnerScreen;
