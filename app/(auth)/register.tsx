import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function RegisterRedirect() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to home as this page is deprecated
        router.replace('/(tabs)');
    }, []);

    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
}
