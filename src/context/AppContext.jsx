import React, { createContext, useState } from 'react';
import firestore from '@react-native-firebase/firestore';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = userData => {
    setUser(userData);
  };

  const logout = () => {
    console.log('AppContext: logout called');
    setUser(null);
  };

  const fetchStudentsAndAttendance = async (className, formattedDate) => {
    const studentSnap = await firestore()
      .collection('students')
      .where('class', '==', className)
      .get();
    const studentList = studentSnap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => Number(a.rollNo) - Number(b.rollNo));

    const attendanceSnap = await firestore()
      .collectionGroup('attendance')
      .where('date', '==', formattedDate)
      .get();

    const attendanceMap = {};
    attendanceSnap.docs.forEach(doc => {
      const parent = doc.ref.parent.parent;
      if (parent) {
        attendanceMap[parent.id] = doc.data().status;
      }
    });

    const newAttendance = {};
    let allSubmitted = true;
    studentList.forEach(student => {
      if (attendanceMap[student.id]) {
        newAttendance[student.id] = attendanceMap[student.id];
      } else {
        newAttendance[student.id] = 'Absent';
        allSubmitted = false;
      }
    });

    return {
      students: studentList,
      attendance: newAttendance,
      allSubmitted,
    };
  };

  const fetchParentStudentAndAttendance = async parentEmail => {
    const studentSnap = await firestore()
      .collection('students')
      .where('parent.email', '==', parentEmail)
      .limit(1)
      .get();
    if (studentSnap.empty)
      return { student: null, monthPercent: null, attendanceList: [] };
    const studentDoc = studentSnap.docs[0];
    const student = { id: studentDoc.id, ...studentDoc.data() };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];

    const attendanceSnap = await firestore()
      .collection('students')
      .doc(studentDoc.id)
      .collection('attendance')
      .where('date', '>=', monthStartStr)
      .get();

    const allAttendance = attendanceSnap.docs.map(doc => doc.data());

    const presentCount = allAttendance.filter(
      a => a.status === 'Present',
    ).length;
    const totalCount = allAttendance.length;
    const monthPercent =
      totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    const attendanceList = allAttendance
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    return { student, monthPercent, attendanceList };
  };

  const fetchAdminAttendanceSummary = async dateStr => {
    const todayStr = dateStr || new Date().toISOString().split('T')[0];

    const attendanceSnap = await firestore()
      .collection('attendance')
      .where('date', '==', todayStr)
      .limit(1)
      .get();

    if (attendanceSnap.empty) {
      return {
        summary: { Present: 0, Absent: 0, Late: 0 },
        absentList: [],
      };
    }

    const attendanceDoc = attendanceSnap.docs[0].data();
    const records = attendanceDoc.records || [];

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

    return {
      summary: { Present: present, Absent: absent, Late: late },
      absentList: absentStudents,
    };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        fetchStudentsAndAttendance,
        fetchParentStudentAndAttendance,
        fetchAdminAttendanceSummary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
