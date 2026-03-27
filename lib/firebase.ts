export const firebaseConfig = {
  apiKey: 'AIzaSyCID7AGwR-tfNsiJIBd0nPfBGE5adLAbwY',
  authDomain: 'train-api-49052.firebaseapp.com',
  projectId: 'train-api-49052',
  storageBucket: 'train-api-49052.firebasestorage.app',
  messagingSenderId: '1056584302761',
  appId: '1:1056584302761:web:659d6c4a3692ded2c4a9b8',
  measurementId: 'G-DT7ZYWWZ8E',
};

export const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
export const identityBaseUrl = 'https://identitytoolkit.googleapis.com/v1';
export const baseStorePath = 'browniebaiano/store';

export const buildDocUrl = (docPath: string) => `${firestoreBaseUrl}/${docPath}`;
export const buildCollectionUrl = (collectionPath: string, params = '') =>
  `${firestoreBaseUrl}/${collectionPath}${params ? `?${params}` : ''}`;
