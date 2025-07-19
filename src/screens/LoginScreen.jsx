import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { AppContext } from '../context/AppContext';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const { login } = useContext(AppContext);

  const role = route?.params?.role;

  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setFormError('Email and password are required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const userEmail = userCredential.user.email;

      if (
        (role === 'teacher' && userEmail !== 'teacher@school.com') ||
        (role === 'parent' && userEmail !== 'parent@school.com') ||
        (role === 'admin' && userEmail !== 'admin@school.com')
      ) {
        Alert.alert(
          'Access Denied',
          'You are not authorized to access this role with these credentials.',
        );
        setLoading(false);
        return;
      }

      login({ ...userCredential.user, role });

      if (role === 'teacher') {
        navigation.replace('TeacherDashboard');
      } else if (role === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (role === 'parent') {
        navigation.replace('ParentDashboard');
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setFormError('No user found with this email.');
      } else if (error.code === 'auth/wrong-password') {
        setFormError('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        setFormError('Invalid email address.');
      } else {
        setFormError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {role && (
        <Text style={{ textAlign: 'center', marginBottom: 16 }}>
          Logging in as: <Text style={{ fontWeight: 'bold' }}>{role}</Text>
        </Text>
      )}
      {formError ? (
        <Text style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>
          {formError}
        </Text>
      ) : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#1976D2"
          style={{ marginTop: 16 }}
        />
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderColor: '#1976D2',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
});
