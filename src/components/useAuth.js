import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setCurrentUser), []);
  return { currentUser };
};
