import React, { createContext, useContext } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';

interface UIContextType {
    tabBarTranslateY: any; // SharedValue<number>
    categoryBarTranslateY: any; // SharedValue<number>
    isLoginDrawerOpen: boolean;
    setTabBarVisible: (visible: boolean) => void;
    setCategoryBarVisible: (visible: boolean) => void;
    setLoginDrawerOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType>({
    tabBarTranslateY: { value: 0 },
    categoryBarTranslateY: { value: 0 },
    isLoginDrawerOpen: false,
    setTabBarVisible: () => { },
    setCategoryBarVisible: () => { },
    setLoginDrawerOpen: () => { },
});

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
    const tabBarTranslateY = useSharedValue(0);
    const categoryBarTranslateY = useSharedValue(0);
    const [isLoginDrawerOpen, setLoginDrawerOpen] = React.useState(false);

    const setTabBarVisible = (visible: boolean) => {
        'worklet';
        tabBarTranslateY.value = withTiming(visible ? 0 : 100, { duration: 300 });
    };

    const setCategoryBarVisible = (visible: boolean) => {
        'worklet';
        categoryBarTranslateY.value = withTiming(visible ? 0 : -100, { duration: 300 });
    };

    return (
        <UIContext.Provider value={{
            tabBarTranslateY,
            categoryBarTranslateY,
            isLoginDrawerOpen,
            setTabBarVisible,
            setCategoryBarVisible,
            setLoginDrawerOpen
        }}>
            {children}
        </UIContext.Provider>
    );
};
