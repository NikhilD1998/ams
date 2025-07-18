import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import UserSelectionScreen from '../screens/UserSelectionScreen';
import TeacherDashboard from '../screens/TeacherDashboard';
import ParentDashboard from '../screens/ParentDashboard';
import AdminDashboard from '../screens/AdminDashboard';

const Stack = createStackNavigator();

const RootNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserSelectionScreen"
          component={UserSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TeacherDashboard"
          component={TeacherDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ParentDashboard"
          component={ParentDashboard}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigation;
