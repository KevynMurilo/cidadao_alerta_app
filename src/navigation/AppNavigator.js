import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapaScreen from '../screens/MapaScreen';
import NovaOcorrenciaScreen from '../screens/NovaOcorrenciaScreen';
import MinhasOcorrenciasScreen from '../screens/MinhasOcorrenciasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import NovaOcorrenciaOfflineScreen from '../screens/NovaOcorrenciaOfflineScreen';
import VerifyScreen from '../screens/VerifyScreen';
// ✨ 1. Importe a nova tela de notificações ✨
import NotificationScreen from '../screens/NotificationScreen';
import TicketScreen from '../screens/TicketScreen';
import CriarTicketScreen from '../screens/CriarTicketScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
    const styles = StyleSheet.create({
        tabBarContainer: {
            flexDirection: 'row',
            position: 'absolute',
            bottom: 30,
            left: 20,
            right: 20,
            height: 70,
            backgroundColor: '#ffffff',
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 5,
            alignItems: 'center',
            justifyContent: 'space-around',
        },
        tabItem: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        },
        addButtonContainer: {
            width: 65,
            height: 65,
            borderRadius: 35,
            backgroundColor: '#3a86f4',
            justifyContent: 'center',
            alignItems: 'center',
            top: -25,
            shadowColor: '#3a86f4',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 8,
        },
    });

    return (
        <View style={styles.tabBarContainer}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                if (route.name === 'NovaOcorrencia') {
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.tabItem}
                            onPress={onPress}
                            accessibilityRole="button"
                            accessibilityLabel="Nova Ocorrência"
                        >
                            <View style={styles.addButtonContainer}>
                                <Ionicons name="add" size={32} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    );
                }

                if (!options.tabBarIcon) {
                    return null;
                }

                return (
                    <TouchableOpacity
                        key={index}
                        style={styles.tabItem}
                        onPress={onPress}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                    >
                        {options.tabBarIcon({
                            focused: isFocused,
                            color: isFocused ? '#3a86f4' : '#748c94',
                            size: 28,
                        })}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const TabNavigator = () => (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
    >
        <Tab.Screen
            name="Início"
            component={HomeScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Minhas Ocorrências"
            component={MinhasOcorrenciasScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'list-circle' : 'list-circle-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="NovaOcorrencia"
            component={NovaOcorrenciaScreen}
            options={{ tabBarIcon: () => null }}
        />
        <Tab.Screen
            name="Mapa"
            component={MapaScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
                ),
            }}
        />
        <Tab.Screen
            name="Perfil"
            component={PerfilScreen}
            options={{
                tabBarIcon: ({ color, size, focused }) => (
                    <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
                ),
            }}
        />
    </Tab.Navigator>
);

const AppNavigator = () => {
    const { userToken, needsVerification } = useContext(AuthContext);

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {userToken !== null ? (
                    <Stack.Screen name="Main" component={TabNavigator} />
                ) : needsVerification !== null ? (
                    <Stack.Screen
                        name="Verify"
                        component={VerifyScreen}
                        initialParams={{ email: needsVerification }}
                    />
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                    </>
                )}
                <Stack.Screen name="NovaOcorrenciaOffline" component={NovaOcorrenciaOfflineScreen} />
                <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
                <Stack.Screen name="Notifications" component={NotificationScreen} />
                <Stack.Screen name="Tickets" component={TicketScreen} />
                <Stack.Screen name="CriarTicket" component={CriarTicketScreen} />
                <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;