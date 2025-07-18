import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const UserSelectionScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login As</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LoginScreen', { role: 'teacher' })}
      >
        <Text style={styles.buttonText}>Teacher</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LoginScreen', { role: 'parent' })}
      >
        <Text style={styles.buttonText}>Parent</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('LoginScreen', { role: 'admin' })}
      >
        <Text style={styles.buttonText}>Admin</Text>
      </TouchableOpacity>
    </View>
  );
};

export default UserSelectionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
