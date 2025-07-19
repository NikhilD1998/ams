import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

const PARENT_EMAIL = 'parent@school.com';

const ParentDashboard = ({ navigation }) => {
  const { fetchParentStudentAndAttendance, logout, user } =
    useContext(AppContext);
  const [student, setStudent] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [monthPercent, setMonthPercent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { student, monthPercent, attendanceList } =
        await fetchParentStudentAndAttendance(PARENT_EMAIL);
      setStudent(student);
      setMonthPercent(monthPercent);
      setAttendanceList(attendanceList);
      setLoading(false);

      // Request notification permission before getting token
      try {
        await messaging().requestPermission();
        if (student && student.id) {
          await saveParentFcmToken(student.id);
          console.log('Parent FCM token saved');
        }
      } catch (err) {
        console.log('Error requesting FCM permission or saving token:', err);
      }
    };
    fetchData();
  }, []);

  const getColor = status => {
    if (status === 'Present') return '#4CAF50';
    if (status === 'Absent') return '#F44336';
    if (status === 'Late') return '#FFEB3B';
    return '#ccc';
  };

  useEffect(() => {
    if (typeof user !== 'undefined' && user === null && navigation) {
      console.log('Navigating to UserSelectionScreen after logout');
      navigation.replace('UserSelectionScreen');
    }
  }, [user, navigation]);

  // Call this after parent login
  const saveParentFcmToken = async studentId => {
    const token = await messaging().getToken();
    await firestore().collection('students').doc(studentId).update({
      'parent.fcmToken': token,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={{ marginTop: 16 }}>Loading attendance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.classRow}>
        <Text style={styles.header}>Parent Dashboard</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Logout button pressed');
            logout();
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      {student && (
        <>
          <Text style={styles.childName}>
            Student: {student.name} ({student.rollNo})
          </Text>
          <Text style={styles.percent}>
            Current Month Attendance:{' '}
            {monthPercent !== null ? `${monthPercent}%` : 'Loading...'}
          </Text>
          <Text style={styles.subHeader}>Last 7 Days</Text>
          <FlatList
            data={attendanceList}
            keyExtractor={item => item.date}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={[styles.status, { color: getColor(item.status) }]}>
                  {item.status[0]}
                </Text>
              </View>
            )}
          />
        </>
      )}
      {!student && <Text>No student linked to this parent.</Text>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'left',
  },
  logoutText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 16,
    padding: 8,
  },
  childName: { fontSize: 18, marginBottom: 8 },
  percent: { fontSize: 16, marginBottom: 16 },
  subHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  date: { fontSize: 15 },
  status: { fontSize: 18, fontWeight: 'bold' },
});

export default ParentDashboard;
