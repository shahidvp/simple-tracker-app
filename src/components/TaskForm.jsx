import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './useAuth';

function generateReadableId() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `TASK-${date}-${time}`;
}

export default function TaskForm() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    date: '',
    time: '',
    completeBy: '',
    cusName: '',
    serviceType: '',
    priority: 'Medium',
    amountPaid: '',
    status: 'to-do'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = generateReadableId();
    await setDoc(doc(db, 'tasks', id), {
      id,
      ...form,
      amountPaid: parseFloat(form.amountPaid),
      userId: currentUser.uid,
      createdAt: serverTimestamp()
    });
    setForm({ date: '', time: '', completeBy: '', cusName: '', serviceType: '', priority: 'Medium', amountPaid: '', status: 'to-do' });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
      <input type="date" value={form.completeBy} onChange={(e) => setForm({ ...form, completeBy: e.target.value })} />
      <input placeholder="Customer Name" value={form.cusName} onChange={(e) => setForm({ ...form, cusName: e.target.value })} />
      <input placeholder="Service Type" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} />
      <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
      <input type="number" placeholder="Amount Paid" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="to-do">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="complete">Complete</option>
      </select>
      <button type="submit">Add Task</button>
    </form>
  );
}
