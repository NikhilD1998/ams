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
  const { login } = useContext(AppContext);

  const role = route?.params?.role;

  const handleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      login({ ...userCredential.user, role });

      if (role === 'teacher') {
        navigation.replace('TeacherDashboard');
      } else if (role === 'admin') {
        navigation.replace('AdminDashboard');
      } else if (role === 'parent') {
        navigation.replace('ParentDashboard');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
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
