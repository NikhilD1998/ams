const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notifyParentOnAbsent = functions.https.onCall(async (data, context) => {
  console.log('notifyParentOnAbsent called with:', data);

  const { studentId, studentName, date } = data.data || {};

  if (!studentId) {
    console.log('Missing studentId');
    return { success: false, error: 'Missing studentId' };
  }

  const studentDoc = await admin
    .firestore()
    .collection('students')
    .doc(studentId)
    .get();
  const fcmToken = studentDoc.get('parent.fcmToken');
  if (!fcmToken) {
    console.log('No FCM token for parent');
    return { success: false, error: 'No FCM token for parent' };
  }

  const message = {
    token: fcmToken,
    notification: {
      title: 'Attendance Alert',
      body: `${studentName} was marked Absent on ${date}`,
    },
  };
  try {
    await admin.messaging().send(message);
    console.log('Notification sent');
    return { success: true };
  } catch (err) {
    console.log('Error sending FCM:', err);
    return { success: false, error: err.message };
  }
});
