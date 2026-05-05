import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { addPayment } from './firestoreService';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize secondary app
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
const secondaryAuth = getAuth(secondaryApp);

export async function adminCreateMember(memberData) {
  try {
    // 1. Create user in Firebase Auth using the secondary instance
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      memberData.email,
      memberData.password
    );

    const uid = userCredential.user.uid;

    // 2. Save user profile to Firestore (using the main db instance)
    const newDoc = {
      name: memberData.name,
      email: memberData.email,
      phone: memberData.phone || '',
      plan: memberData.plan || 'Basic',
      role: 'member',
      status: 'Attivo',
      joinDate: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      lastCheckIn: null,
      expirationDate: memberData.expirationDate,
    };

    if (memberData.plan === 'Pacchetto 12') newDoc.entriesLeft = 12;
    if (memberData.plan === 'Giornaliero') newDoc.entriesLeft = 1;

    await setDoc(doc(db, 'users', uid), newDoc);

    // 3. Create initial payment
    if (memberData.amount > 0 || memberData.plan === 'Pacchetto 12' || memberData.plan === 'Giornaliero') {
      await addPayment(uid, {
        amount: memberData.amount || 0,
        method: 'Contanti', // Default to cash for initial creation
        date: new Date().toISOString().split('T')[0],
        notes: `Pagamento iniziale - ${memberData.plan}`,
        planKey: memberData.plan,
      }, null); // pass null so it doesn't overwrite user doc entries again
    }

    // 4. Sign out the secondary instance to prevent lingering sessions
    await signOut(secondaryAuth);

    return { id: uid, ...newDoc };
  } catch (error) {
    console.error("Error creating member as admin:", error);
    throw error;
  }
}
