import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── USERS / MEMBERS ────────────────────────────────────────────────────────

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllMembers() {
  const q = query(collection(db, 'users'), where('role', '==', 'member'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateMember(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getActiveMemberCount() {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'member'),
    where('status', '==', 'Attivo')
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function getAtRiskMembers() {
  // Members inactive for more than 14 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'member'),
    where('status', '==', 'Attivo')
  );
  const snap = await getDocs(q);
  const members = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return members.filter((m) => {
    if (!m.lastCheckIn) return true;
    return new Date(m.lastCheckIn) < cutoff;
  });
}

// ─── CLASSES ────────────────────────────────────────────────────────────────

export async function getClassesForDate(dateStr) {
  // dateStr format: 'YYYY-MM-DD'
  const q = query(
    collection(db, 'classes'),
    where('date', '==', dateStr),
    orderBy('time', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addClass(classData) {
  return await addDoc(collection(db, 'classes'), {
    ...classData,
    createdAt: serverTimestamp(),
  });
}

export async function updateClass(classId, data) {
  await updateDoc(doc(db, 'classes'), data);
}

export async function deleteClass(classId) {
  await deleteDoc(doc(db, 'classes', classId));
}

// ─── BOOKINGS ───────────────────────────────────────────────────────────────

export async function getUserBookings(userId) {
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUpcomingBooking(userId) {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    where('date', '>=', today),
    where('status', '==', 'confirmed'),
    orderBy('date', 'asc'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function bookClass(userId, classData) {
  // Add booking record
  const booking = await addDoc(collection(db, 'bookings'), {
    userId,
    classId: classData.id,
    classTitle: classData.title,
    coach: classData.coach,
    time: classData.time,
    date: classData.date,
    status: 'confirmed',
    createdAt: serverTimestamp(),
  });
  // Increment booked count on the class
  await updateDoc(doc(db, 'classes', classData.id), {
    booked: (classData.booked || 0) + 1,
  });
  return booking;
}

export async function cancelBooking(bookingId, classId, currentBooked) {
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
  if (classId && currentBooked > 0) {
    await updateDoc(doc(db, 'classes', classId), {
      booked: currentBooked - 1,
    });
  }
}

// ─── CHECK-INS ──────────────────────────────────────────────────────────────

export async function getTodayCheckInCount() {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'checkins'),
    where('date', '==', today)
  );
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function addCheckIn(userId) {
  const today = new Date().toISOString().split('T')[0];
  await addDoc(collection(db, 'checkins'), {
    userId,
    date: today,
    timestamp: serverTimestamp(),
  });
  // Update lastCheckIn on user
  await updateDoc(doc(db, 'users', userId), {
    lastCheckIn: today,
    checkInCount: serverTimestamp(), // will be handled properly
  });
}

// ─── SCORES / PR ─────────────────────────────────────────────────────────────

export async function getUserScores(userId) {
  const q = query(
    collection(db, 'scores'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addScore(userId, scoreData) {
  return await addDoc(collection(db, 'scores'), {
    userId,
    ...scoreData,
    date: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
  });
}

export async function getLeaderboard(exerciseName) {
  const q = query(
    collection(db, 'scores'),
    where('exerciseName', '==', exerciseName),
    orderBy('value', 'desc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── RECENT ACTIVITY (Admin) ─────────────────────────────────────────────────

export async function getRecentActivity(limitCount = 10) {
  const q = query(
    collection(db, 'bookings'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
