import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Alert, Modal, SafeAreaView, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

interface RecaptchaVerifierProps {
    firebaseConfig: any;
    onVerify: (token: string) => void;
    onCancel?: () => void;
}

export interface RecaptchaVerifierHandle {
    show: () => void;
    hide: () => void;
}

const RecaptchaVerifier = forwardRef<RecaptchaVerifierHandle, RecaptchaVerifierProps>((props, ref) => {
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useImperativeHandle(ref, () => ({
        show: () => {
            setVisible(true);
            setLoading(true);
        },
        hide: () => setVisible(false),
    }));

    const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
        <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
        <style>
          body, html { 
            margin: 0; padding: 0; height: 100%; width: 100%;
            display: flex; flex-direction: column; justify-content: center; align-items: center; 
            background: #f7f8fc;
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          #recaptcha-container { 
            margin-bottom: 20px;
          }
          .msg {
            color: #666;
            margin-bottom: 20px;
            font-size: 16px;
            text-align: center;
            padding: 0 20px;
          }
        </style>
      </head>
      <body>
        <div class="msg">Please complete the security check to continue.</div>
        <div id="recaptcha-container"></div>
        <script>
          try {
            const firebaseConfig = ${JSON.stringify(props.firebaseConfig)};
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
              'size': 'normal',
              'callback': (token) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token }));
              },
              'expired-callback': () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expired' }));
              },
              'error-callback': (error) => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: error.message }));
              }
            });
            
            window.recaptchaVerifier.render().then(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
            });

            // Bridge console logs to React Native
            const originalLog = console.log;
            console.log = function(message) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: message }));
                originalLog.apply(console, arguments);
            };
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: e.message }));
          }
        </script>
      </body>
    </html>
  `;

    return (
        <Modal
            visible={visible}
            transparent={false} // Switch to full-screen to avoid transparency issues
            animationType="slide"
            onRequestClose={() => {
                setVisible(false);
                props.onCancel?.();
            }}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                            setVisible(false);
                            props.onCancel?.();
                        }}
                    >
                        <Ionicons name="close" size={28} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Security Verification</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={{ flex: 1 }}>
                    {loading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color="#000000" />
                            <Text style={styles.loadingText as TextStyle}>Initializing...</Text>
                        </View>
                    )}

                    <WebView
                        originWhitelist={['*']}
                        source={{ html: htmlContent }}
                        style={[styles.webview, { opacity: loading ? 0 : 1 }]}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        mixedContentMode="always"
                        onMessage={(event) => {
                            try {
                                const data = JSON.parse(event.nativeEvent.data);
                                if (data.type === 'log') {
                                    console.log('WebView Log:', data.message);
                                } else if (data.type === 'ready') {
                                    setLoading(false);
                                } else if (data.type === 'verify') {
                                    setVisible(false);
                                    props.onVerify(data.token);
                                } else if (data.type === 'error') {
                                    console.error("Recaptcha Error:", data.error);
                                    setLoading(false);
                                    Alert.alert("Security Check Failed", data.error);
                                } else if (data.type === 'expired') {
                                    setLoading(false);
                                    Alert.alert("Session Expired", "Please try the verification again.");
                                }
                            } catch (e) {
                                console.error("WebView message error:", e);
                            }
                        }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn('WebView error: ', nativeEvent);
                            setLoading(false);
                        }}
                        onHttpError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.warn('WebView HTTP error: ', nativeEvent);
                        }}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f8fc',
    } as ViewStyle,
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    } as ViewStyle,
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#121212',
    } as TextStyle,
    closeButton: {
        padding: 5,
    } as ViewStyle,
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f8fc',
        zIndex: 5,
    } as ViewStyle,
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    } as TextStyle,
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    } as ViewStyle,
});

export default RecaptchaVerifier;
