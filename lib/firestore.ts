import { getFirestore, collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"

// Client-side Firestore operations
export const firestoreOperations = {
  // Get all documents from a collection
  getDocuments: async (app: any, collectionName: string) => {
    const db = getFirestore(app)
    const querySnapshot = await getDocs(collection(db, collectionName))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  },

  // Query documents with a filter
  queryDocuments: async (app: any, collectionName: string, field: string, operator: any, value: any) => {
    const db = getFirestore(app)
    const q = query(collection(db, collectionName), where(field, operator, value))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  },

  // Add a new document
  addDocument: async (app: any, collectionName: string, data: any) => {
    const db = getFirestore(app)
    const docRef = await addDoc(collection(db, collectionName), data)
    return docRef.id
  },

  // Update a document
  updateDocument: async (app: any, collectionName: string, docId: string, data: any) => {
    const db = getFirestore(app)
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, data)
    return true
  },

  // Delete a document
  deleteDocument: async (app: any, collectionName: string, docId: string) => {
    const db = getFirestore(app)
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
    return true
  },
}
