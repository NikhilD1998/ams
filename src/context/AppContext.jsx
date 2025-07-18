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
    // 1. Fetch students
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

    // 2. Fetch attendance docs for the date
    const attendanceSnap = await firestore()
      .collectionGroup('attendance')
      .where('date', '==', formattedDate)
      .get();

    // 3. Map attendance by studentId
    const attendanceMap = {};
    attendanceSnap.docs.forEach(doc => {
      const parent = doc.ref.parent.parent;
      if (parent) {
        attendanceMap[parent.id] = doc.data().status;
      }
    });

    // 4. Merge: set attendance state, default to 'Absent'
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
    // 1. Find the student linked to this parent
    const studentSnap = await firestore()
      .collection('students')
      .where('parent.email', '==', parentEmail)
      .limit(1)
      .get();
    if (studentSnap.empty)
      return { student: null, monthPercent: null, attendanceList: [] };
    const studentDoc = studentSnap.docs[0];
    const student = { id: studentDoc.id, ...studentDoc.data() };

    // 2. Fetch all attendance for current month
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

    // 3. Calculate percentage for current month
    const presentCount = allAttendance.filter(
      a => a.status === 'Present',
    ).length;
    const totalCount = allAttendance.length;
    const monthPercent =
      totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    // 4. Get last 7 days attendance (sorted descending by date)
    const attendanceList = allAttendance
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    return { student, monthPercent, attendanceList };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        fetchStudentsAndAttendance,
        fetchParentStudentAndAttendance,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
