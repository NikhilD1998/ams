import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppContext } from '../context/AppContext';
import functions from '@react-native-firebase/functions';

const STATUS = ['Present', 'Absent', 'Late'];

const TeacherDashboard = ({ navigation }) => {
  const { fetchStudentsAndAttendance, logout, user } = useContext(AppContext);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formattedDate = date.toISOString().split('T')[0];

  useEffect(() => {
    if (navigation) {
      navigation.setOptions({ headerLeft: () => null, gestureEnabled: false });
      const unsubscribe = navigation.addListener('beforeRemove', e => {
        // Only prevent back actions, not all navigation
        if (e.data.action.type === 'GO_BACK') {
          e.preventDefault();
        }
      });
      return unsubscribe;
    }
  }, [navigation]);

  useEffect(() => {
    const fetchStudentsAndAttendanceData = async () => {
      setLoading(true);
      try {
        console.log(
          'Fetching students and attendance for date:',
          formattedDate,
        );

        const { students, attendance, allSubmitted } =
          await fetchStudentsAndAttendance('10-A', formattedDate);

        setStudents(students);
        setAttendance(attendance);
        setSubmitted(allSubmitted);

        console.log(
          'Attendance state set:',
          attendance,
          'All submitted:',
          allSubmitted,
        );
      } catch (error) {
        console.log('Error in fetchStudentsAndAttendance:', error);
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndAttendanceData();
  }, [formattedDate]);

  const markStatus = async (studentId, status) => {
    if (submitted) return;
    setAttendance(prev => ({ ...prev, [studentId]: status }));

    try {
      await firestore()
        .collection('students')
        .doc(studentId)
        .collection('attendance')
        .doc(formattedDate)
        .set({
          status,
          date: formattedDate,
          markedAt: firestore.FieldValue.serverTimestamp(),
        });

      if (status === 'Absent') {
        const student = students.find(s => s.id === studentId);
        console.log('Absent student:', student);
        try {
          await functions().httpsCallable('notifyParentOnAbsent')({
            studentId,
            studentName: student.name,
            date: formattedDate,
          });
          console.log('FCM notification sent to parent');
        } catch (err) {
          console.log('FCM notification error:', err);
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to update attendance for student: ${error.message}`,
      );
    }
  };

  const markAllPresent = () => {
    if (submitted) return;
    const allPresent = {};
    students.forEach(student => {
      allPresent[student.id] = 'Present';
      firestore()
        .collection('students')
        .doc(student.id)
        .collection('attendance')
        .doc(formattedDate)
        .set({
          status: 'Present',
          date: formattedDate,
          markedAt: firestore.FieldValue.serverTimestamp(),
        });
    });
    setAttendance(allPresent);
  };

  const handleSubmit = async () => {
    if (submitted) return;
    try {
      await firestore()
        .collection('attendance')
        .add({
          class: '10-A',
          date: formattedDate,
          records: students.map(student => ({
            studentId: student.id,
            name: student.name,
            rollNo: student.rollNo,
            status: attendance[student.id] || 'Absent',
          })),
          submittedAt: firestore.FieldValue.serverTimestamp(),
        });
      setSubmitted(true);
      Alert.alert('Success', 'Attendance submitted and locked!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
      setSubmitted(false);
    }
  };

  const renderStudent = ({ item }) => (
    <View style={styles.studentRow}>
      <Text style={styles.studentText}>
        {item.rollNo}. {item.name}
      </Text>
      <View style={styles.statusRow}>
        {STATUS.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusButton,
              attendance[item.id] === status && styles.selectedStatus,
              submitted && styles.disabledStatus,
            ]}
            onPress={() => markStatus(item.id, status)}
            disabled={submitted}
          >
            <Text
              style={{
                color: attendance[item.id] === status ? '#fff' : '#1976D2',
              }}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  useEffect(() => {
    console.log('User state changed:', user);
    if (user === null) {
      navigation.replace('UserSelectionScreen');
    }
  }, [user, navigation]);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={{ marginTop: 16 }}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.classRow}>
        <Text style={styles.title}>Class 10-A</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Logout button pressed');
            logout();
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Total Students: {students.length}</Text>
      <TouchableOpacity
        style={styles.dateBtn}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateBtnText}>Date: {formattedDate}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      <TouchableOpacity
        style={[styles.markAllBtn, submitted && styles.disabledStatus]}
        onPress={markAllPresent}
        disabled={submitted}
      >
        <Text style={styles.markAllText}>Mark All Present</Text>
      </TouchableOpacity>
      <FlatList
        data={students}
        keyExtractor={item => item.id}
        renderItem={renderStudent}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <Button
        title={submitted ? 'Submitted' : 'Submit'}
        onPress={handleSubmit}
        disabled={submitted}
        color="#1976D2"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  logoutText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 16,
    padding: 8,
  },
  subtitle: { fontSize: 16, marginBottom: 16, textAlign: 'center' },
  studentRow: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  studentText: { fontSize: 16, marginBottom: 6 },
  statusRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  statusButton: {
    borderWidth: 1,
    borderColor: '#1976D2',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  selectedStatus: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  disabledStatus: {
    opacity: 0.5,
  },
  markAllBtn: {
    backgroundColor: '#1976D2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  markAllText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateBtn: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateBtnText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
});

export default TeacherDashboard;
