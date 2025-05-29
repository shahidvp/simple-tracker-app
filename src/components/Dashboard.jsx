import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'tasks'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map((doc) => doc.data()));
    });
    return unsubscribe;
  }, [currentUser]);

  const renderTasks = (status) => tasks.filter(t => t.status === status).map(task => (
    <div key={task.id}>
      <strong>{task.cusName}</strong> | {task.serviceType} | {task.date}
    </div>
  ));

  return (
    <div>
      <h2>To Do</h2>{renderTasks('to-do')}
      <h2>In Progress</h2>{renderTasks('in-progress')}
      <h2>Complete</h2>{renderTasks('complete')}
    </div>
  );
}
