import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminDashboard = () => {
  const [summary, setSummary] = useState({ Present: 0, Absent: 0, Late: 0 });
  const [absentList, setAbsentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchAttendanceSummary = async () => {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      setToday(todayStr);

      // Query attendance collection for today's date
      const attendanceSnap = await firestore()
        .collection('attendance')
        .where('date', '==', todayStr)
        .limit(1)
        .get();

      if (attendanceSnap.empty) {
        setSummary({ Present: 0, Absent: 0, Late: 0 });
        setAbsentList([]);
        setLoading(false);
        return;
      }

      const attendanceDoc = attendanceSnap.docs[0].data();
      const records = attendanceDoc.records || [];
      console.log('Attendance records:', records);

      let present = 0,
        absent = 0,
        late = 0;
      let absentStudents = [];

      records.forEach(record => {
        if (record.status === 'Present') present++;
        else if (record.status === 'Late') late++;
        else if (record.status === 'Absent') absent++;

        if (record.status === 'Absent') {
          absentStudents.push(record);
        }
      });

      setSummary({ Present: present, Absent: absent, Late: late });
      setAbsentList(absentStudents);
      setLoading(false);
    };

    fetchAttendanceSummary();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.header}>
          Today's Attendance Summary (Class 10-A)
        </Text>
        <Text style={styles.dateText}>Date: {today}</Text>
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <ActivityIndicator size="large" color="#1976D2" />
            <Text style={{ marginTop: 16 }}>Loading attendance...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.summary}>
              Present:{' '}
              <Text style={{ color: '#4CAF50' }}>{summary.Present}</Text> {'  '}
              Absent: <Text style={{ color: '#F44336' }}>
                {summary.Absent}
              </Text>{' '}
              {'  '}
              Late: <Text style={{ color: '#FFEB3B' }}>{summary.Late}</Text>
            </Text>
            <Text style={styles.subHeader}>Absent Students:</Text>
            {absentList.length === 0 ? (
              <Text style={styles.none}>None</Text>
            ) : (
              <FlatList
                data={absentList}
                keyExtractor={item =>
                  item.studentId?.toString() ||
                  item.rollNo?.toString() ||
                  Math.random().toString()
                }
                renderItem={({ item }) => (
                  <Text style={styles.student}>
                    {item.rollNo}. {item.name}
                  </Text>
                )}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    color: '#555',
  },
  summary: { fontSize: 18, marginBottom: 16, textAlign: 'center' },
  subHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  student: { fontSize: 16, marginBottom: 4 },
  loading: { textAlign: 'center', marginTop: 32 },
  none: { fontSize: 16, color: '#888', textAlign: 'center' },
});

export default AdminDashboard;
