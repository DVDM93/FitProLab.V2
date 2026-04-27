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
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// ─── USERS / MEMBERS ────────────────────────────────────────────────────────

function enforceExpirationStatus(member) {
  if (!member.expirationDate || member.status === 'Inattivo') return member;
  const expDate = new Date(member.expirationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expDate.setHours(0, 0, 0, 0);

  if (expDate < today) {
    // Aggiornamento asincrono nel database per mantenere la coerenza
    updateDoc(doc(db, 'users', member.id), { status: 'Inattivo' }).catch(console.error);
    return { ...member, status: 'Inattivo' };
  }
  return member;
}

export async function getUserData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = { id: snap.id, ...snap.data() };
  return enforceExpirationStatus(data);
}

export async function uploadUserDocument(uid, file, type) {
  // type can be 'medical_certificate' or 'id_document'
  const fileExt = file.name.split('.').pop();
  const filePath = `users/${uid}/${type}.${fileExt}`;
  const storageRef = ref(storage, filePath);
  
  await uploadBytes(storageRef, file);
  const downloadUrl = await getDownloadURL(storageRef);
  
  // Save URL back to user profile
  await updateDoc(doc(db, 'users', uid), {
    [type]: downloadUrl
  });
  
  return downloadUrl;
}


export async function getAllMembers() {
  // Single-field where — no composite index needed
  const q = query(collection(db, 'users'), where('role', '==', 'member'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => enforceExpirationStatus({ id: d.id, ...d.data() }));
}

export async function updateMember(uid, data) {
  await updateDoc(doc(db, 'users', uid), data);
}

export async function getActiveMemberCount() {
  // Fetch all members, filter in JS — no composite index
  const members = await getAllMembers();
  return members.filter((m) => m.status === 'Attivo').length;
}

export async function getAtRiskMembers() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const members = await getAllMembers();
  return members.filter((m) => {
    if (m.status !== 'Attivo') return false;
    if (!m.lastCheckIn) return true;
    return new Date(m.lastCheckIn) < cutoff;
  });
}

// ─── CLASSES ────────────────────────────────────────────────────────────────

export async function getClassesForDate(dateStr) {
  // Single-field where only — no composite index needed
  const q = query(collection(db, 'classes'), where('date', '==', dateStr));
  const snap = await getDocs(q);
  const classes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort by time in JS
  return classes.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

export async function addClass(classData) {
  return await addDoc(collection(db, 'classes'), {
    ...classData,
    createdAt: serverTimestamp(),
  });
}

export async function updateClass(classId, data) {
  await updateDoc(doc(db, 'classes', classId), data);
}

export async function deleteClass(classId) {
  await deleteDoc(doc(db, 'classes', classId));
}

// ─── BOOKINGS ───────────────────────────────────────────────────────────────

export async function getUserBookings(userId) {
  // Single-field where, sort in JS
  const q = query(collection(db, 'bookings'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return bookings.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getBookingsForClass(classId) {
  const q = query(
    collection(db, 'bookings'),
    where('classId', '==', classId),
    where('status', '==', 'confirmed')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUpcomingBooking(userId) {
  const today = new Date().toISOString().split('T')[0];
  // Single-field where, filter + sort in JS
  const q = query(collection(db, 'bookings'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const upcoming = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((b) => b.status === 'confirmed' && b.date >= today)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return upcoming.length > 0 ? upcoming[0] : null;
}

export async function bookClass(userId, classData, userName = '') {
  const booking = await addDoc(collection(db, 'bookings'), {
    userId,
    userName,
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

export async function cancelBooking(bookingId, classId) {
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
  if (classId) {
    // Fetch current class to get accurate booked count
    const classSnap = await getDoc(doc(db, 'classes', classId));
    if (classSnap.exists()) {
      const current = classSnap.data().booked || 0;
      await updateDoc(doc(db, 'classes', classId), {
        booked: Math.max(0, current - 1),
      });
    }
  }
}

// ─── CHECK-INS ──────────────────────────────────────────────────────────────

export async function getTodayCheckInCount() {
  const today = new Date().toISOString().split('T')[0];
  // Single-field where — no composite index
  const q = query(collection(db, 'checkins'), where('date', '==', today));
  const snap = await getDocs(q);
  return snap.size;
}

export async function addCheckIn(userId) {
  const today = new Date().toISOString().split('T')[0];
  await addDoc(collection(db, 'checkins'), {
    userId,
    date: today,
    timestamp: serverTimestamp(),
  });
  // Update lastCheckIn on user document
  await updateDoc(doc(db, 'users', userId), {
    lastCheckIn: today,
  });
}

// ─── SCORES / PR ─────────────────────────────────────────────────────────────

export async function getUserScores(userId) {
  // Single-field where, sort in JS
  const q = query(collection(db, 'scores'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const scores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return scores.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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
  // Single-field where, sort in JS — no composite index
  const q = query(
    collection(db, 'scores'),
    where('exerciseName', '==', exerciseName)
  );
  const snap = await getDocs(q);
  const scores = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort: higher value = better (for weight exercises)
  // Per-exercise ordering can be customized later
  return scores
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 20);
}

// ─── RECENT ACTIVITY (Admin) ─────────────────────────────────────────────────

export async function getRecentActivity(limitCount = 10) {
  // No orderBy to avoid needing an index — sort in JS
  const q = query(collection(db, 'bookings'), limit(50));
  const snap = await getDocs(q);
  const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort by createdAt descending in JS
  return bookings
    .filter((b) => b.createdAt)
    .sort((a, b) => {
      const tA = a.createdAt?.toDate?.() || new Date(0);
      const tB = b.createdAt?.toDate?.() || new Date(0);
      return tB - tA;
    })
    .slice(0, limitCount);
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────

export async function getTodayNewBookingsCount() {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'bookings'),
    where('date', '==', today),
    where('status', '==', 'confirmed')
  );
  const snap = await getDocs(q);
  return snap.size;
}

// ─── WOD (Workout of the Day) ───────────────────────────────────────────────

export async function getAllWODs() {
  const snap = await getDocs(collection(db, 'wods'));
  const wods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return wods.sort((a, b) => {
    const tA = a.createdAt?.toDate?.() || new Date(0);
    const tB = b.createdAt?.toDate?.() || new Date(0);
    return tB - tA; // newer first
  });
}

export async function getWOD(wodId) {
  if (!wodId) return null;
  const snap = await getDoc(doc(db, 'wods', wodId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addWOD(wodData) {
  return await addDoc(collection(db, 'wods'), {
    ...wodData,
    createdAt: serverTimestamp(),
  });
}

export async function deleteWOD(wodId) {
  await deleteDoc(doc(db, 'wods', wodId));
}

export async function getClassesForWOD(wodId) {
  const q = query(collection(db, 'classes'), where('wodId', '==', wodId));
  const snap = await getDocs(q);
  const classes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort descending by date
  return classes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

// ─── PAYMENTS ───────────────────────────────────────────────────────────────

export async function getUserPayments(userId) {
  const q = query(collection(db, 'payments'), where('userId', '==', userId));
  const snap = await getDocs(q);
  const payments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return payments.sort((a, b) => {
    const tA = a.date ? new Date(a.date).getTime() : 0;
    const tB = b.date ? new Date(b.date).getTime() : 0;
    return tB - tA; // descending
  });
}

export async function addPayment(userId, paymentData, newExpirationDate) {
  await addDoc(collection(db, 'payments'), {
    userId,
    ...paymentData,
    createdAt: serverTimestamp(),
  });

  if (newExpirationDate) {
    await updateDoc(doc(db, 'users', userId), {
      expirationDate: newExpirationDate,
    });
  }
}

