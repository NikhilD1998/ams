import React, { createContext, useState } from 'react';
import firestore from '@react-native-firebase/firestore';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = userData => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  // Fetch students and attendance for a given class and date
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

  return (
    <AppContext.Provider
      value={{ user, login, logout, fetchStudentsAndAttendance }}
    >
      {children}
    </AppContext.Provider>
  );
};
