import { supabase } from '@/config/supabaseConfig';
import { useTheme } from '@/store/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Firebase imports removed
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/*
  Table: public.admin_notifications
  - id: uuid
  - title: text
  - message: text
  - created_at: timestamp
  - sender: text
*/

const SendNotificationScreen = () => {
    const { isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    const theme = {
        background: isDarkMode ? '#000' : '#f8f9fa',
        text: isDarkMode ? '#fff' : '#171717',
        card: isDarkMode ? '#1A1A1A' : '#fff',
        subtext: isDarkMode ? '#888' : '#666',
        inputBg: isDarkMode ? '#2C2C2C' : '#E5E5EA',
        primary: '#4A90E2',
        danger: '#FF3B30',
        border: isDarkMode ? '#333' : '#e1e4e8',
    };

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setHistory(data);
        } catch (error) {
            console.error("Fetch error", error);
        }
    };

    useEffect(() => {
        fetchHistory();

        // Optional: Realtime
        const subscription = supabase
            .channel('notifications_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchHistory)
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert("Error", "Please enter both title and message");
            return;
        }

        setSending(true);
        try {
            const { error } = await supabase.from('admin_notifications').insert({
                title: title.trim(),
                message: message.trim(),
                sender: 'Badhee G Team'
            });

            if (error) throw error;

            Alert.alert("Success", "Notification sent successfully!");
            setTitle('');
            setMessage('');
            fetchHistory(); // Refresh manually if realtime lags
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to send notification");
        }
        setSending(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            "Unsend Notification",
            "Are you sure you want to delete this notification? It will be removed from users' devices.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unsend",
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('admin_notifications')
                                .delete()
                                .eq('id', id);

                            if (error) throw error;
                            fetchHistory();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete notification");
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const renderHeader = () => (
        <View style={styles.content}>
            <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
                    placeholder="e.g. System Maintenance Update"
                    placeholderTextColor={theme.subtext}
                    value={title}
                    onChangeText={setTitle}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Message</Text>
                <TextInput
                    style={[styles.textArea, { backgroundColor: theme.inputBg, color: theme.text }]}
                    placeholder="Type your announcement here..."
                    placeholderTextColor={theme.subtext}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: theme.primary, opacity: sending ? 0.7 : 1 }]}
                onPress={handleSend}
                disabled={sending}
            >
                {sending ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <Feather name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.sendBtnText}>Send Notification</Text>
                    </>
                )}
            </TouchableOpacity>

            <View style={{ marginTop: 32, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="clock" size={20} color={theme.text} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent History</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Send Notification</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={history}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                    <View style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={[styles.historyTitle, { color: theme.text }]}>{item.title}</Text>
                                <Text style={{ fontSize: 12, color: theme.subtext }}>{formatDate(item.created_at)}</Text>
                            </View>
                            <Text style={[styles.historyMsg, { color: theme.subtext }]} numberOfLines={2}>{item.message}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                            <Feather name="trash-2" size={20} color={theme.danger} />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    backBtn: { padding: 4 },
    content: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { borderRadius: 12, padding: 16, fontSize: 16 },
    textArea: { borderRadius: 12, padding: 16, fontSize: 16, height: 100 },
    sendBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 16 },
    sendBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold' },
    historyCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
    historyTitle: { fontSize: 16, fontWeight: '600' },
    historyMsg: { fontSize: 14, marginTop: 4 },
    deleteBtn: { padding: 8, marginLeft: 8 }
});

export default SendNotificationScreen;
