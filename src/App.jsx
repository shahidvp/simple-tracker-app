import React, { useEffect, useState } from "react";
import { db, auth, login, register } from "./firebase"; // Import necessary Firebase services
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc} from "firebase/firestore"; // Correct Firestore imports and add addDoc
import { onAuthStateChanged, signOut } from "firebase/auth"; // Listen to authentication state changes
import './App.css';

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // Track logged-in user
  const [email, setEmail] = useState(""); // For email input
  const [password, setPassword] = useState(""); // For password input
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Track login state
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and sign-up forms
  const [showForm, setShowForm] = useState(false); // State to control task form visibility
  const [newTask, setNewTask] = useState(""); // State to hold new task input
  const [newTaskDetails, setNewTaskDetails] = useState({ // State to hold new task details
    cusName: "",
    serviceType: "",
    priority: "Not Urgent",
    amountPaid: "Not Received",
    completeBy: "",
    status: "In Progress",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  // Set the page title to "Task Tracker"
  useEffect(() => {
    document.title = "Task Tracker";
  }, []);

  // Check for user login status on app load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set user if logged in
        localStorage.setItem("user", JSON.stringify(currentUser)); // Store user in local storage
        fetchTasks(currentUser.uid); // Fetch tasks for the logged-in user
      } else {
        setUser(null); // Clear user if logged out
        localStorage.removeItem("user"); // Remove user from local storage
      }
      setLoading(false); // Stop loading after checking auth status
    });

    return () => unsubscribe(); // Cleanup the subscription
  }, []);

  // Function to log in user
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email, password);
      setEmail(""); // Reset email and password
      setPassword("");
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Function to sign up user
  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await register(email, password);
      setEmail(""); // Reset email and password
      setPassword("");
    } catch (err) {
      setError("Sign up failed. Please check your credentials.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fetch tasks created by the logged-in user
  const fetchTasks = async (uid) => {
    console.log("fetchTasks called with UID:", uid); // Debug: Log when the function is called and with what UID
    try {
      const tasksCollection = collection(db, "tasks");
      console.log("tasksCollection:", tasksCollection); // Debug: Log the collection reference

      const q = query(tasksCollection, where("userId", "==", uid));
      console.log("Query created:", q); // Debug: Log the query object

      console.log("Fetching documents..."); // Debug: Indicate the start of the fetch operation
      const taskSnapshot = await getDocs(q);
      console.log("Documents fetched. Snapshot:", taskSnapshot); // Debug: Log the snapshot received

      const taskList = taskSnapshot.docs.map((doc) => {
        const taskData = {
          id: doc.id,
          ...doc.data(),
        };
        console.log("Processing document:", doc.id, taskData); // Debug: Log each processed document
        return taskData;
      });
      console.log("taskList:", taskList); // Debug: Log the final task list before setting state

      setTasks(taskList);
      console.log("Tasks state updated:", taskList); // Debug: Log after the state has been updated

    } catch (err) {
      console.error("Error fetching tasks:", err); // Debug: Log any errors that occur
      setError("Error fetching tasks.");
    }
  };

  // Function to handle adding a new task
  const handleAddTask = async () => {
    if (!user) {
      setError("You must be logged in to add tasks.");
      return;
    }
  
    try {
      if (newTaskDetails.id) {
        const taskRef = doc(db, "tasks", newTaskDetails.id);
        await updateDoc(taskRef, { ...newTaskDetails });
      } else {
        const docRef = await addDoc(collection(db, "tasks"), {
          userId: user.uid,
          ...newTaskDetails,
        });
  
        // Add generated ID to task (optional: if you want to store ID in doc too)
        await updateDoc(docRef, { id: docRef.id });
      }
  

      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);

      // Reset form
      setNewTaskDetails({
        cusName: "",
        serviceType: "",
        priority: "Not Urgent",
        amountPaid: "Not Received",
        completeBy: "",
        status: "In Progress",
        date: currentDate,
        time: currentTime,
        id: null,
      });
  
      setShowForm(false);
      fetchTasks(user.uid);
    } catch (error) {
      console.error("Error adding/editing task:", error);
      setError("Error adding/editing task.");
    }
  };
  

// Mark task as completed
const markTaskComplete = async (taskId) => {
  try {
    console.log("markTaskComplete called with taskId:", taskId);

    const taskRef = doc(db, "tasks", taskId);
    console.log("Task reference created:", taskRef);

    await updateDoc(taskRef, { status: "Completed" });
    console.log("Task status updated to 'Completed'");

    // Debugging user object
    console.log("User object:", user);

    if (!user || !user.uid) {
      console.error("User is not defined or missing uid");
      return;
    }

    console.log("Calling fetchTasks with user.uid:", user.uid);
    fetchTasks(user.uid); // Refresh task list
  } catch (err) {
    console.error("Error marking task complete:", err);
    if (err.stack) console.error("Stack trace:", err.stack);
    setError("Failed to update task.");
  }
};


// Delete task
const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);
    fetchTasks(user.uid); // Refresh task list
  } catch (err) {
    console.error("Error deleting task:", err);
    setError("Failed to delete task.");
  }
};

// Populate task form for editing
const editTask = (task) => {
  setNewTaskDetails(task);
  setShowForm(true);
};


  // Handle input changes for the new task form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTaskDetails(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      alert("No tasks to export.");
      return;
    }
  
    // Define CSV headers
    const headers = [
      "S/N",
      "Date & Time",
      "Customer Name",
      "Service Type",
      "Priority",
      "Payment Status",
      "Complete By",
      "Status",
    ];
  
    // Create CSV rows
    const rows = tasks.map((task, index) => [
      index + 1,
      `${task.date} ${task.time}`,
      task.cusName,
      task.serviceType,
      task.priority,
      task.amountPaid,
      task.completeBy
        ? new Date(task.completeBy).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
      task.status,
    ]);
  
    // Convert to CSV string
    const csvContent =
      [headers, ...rows]
        .map((e) =>
          e
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`) // Escape quotes
            .join(",")
        )
        .join("\n");
  
    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tasks_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user is logged in, show tasks
  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div>
        <h1>Login / Sign Up</h1>
        {error && <p>{error}</p>}

        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? "Submitting..." : isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>

        {/* Toggle between Login and Sign Up */}
        <div>
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <h1>Task Tracker</h1>
      <br />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
  <button onClick={() => setShowForm(!showForm)}>
    {showForm ? 'Cancel' : 'Add Task'}
  </button>
  
  <button onClick={handleExportCSV} style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
    Export to CSV
  </button>
</div>


      {showForm && (
  <div className="add-task-form"> {/* Add class name to the form container */}
    <h3>Add New Task</h3>
    <div className="input-group">
      <label htmlFor="date">Date:</label>
      <input
        type="date"
        id="date"
        name="date"
        value={newTaskDetails.date}
        onChange={handleInputChange}
      />
    </div>
    <div className="input-group">
      <label htmlFor="time">Time:</label>
      <input
        type="time"
        id="time"
        name="time"
        value={newTaskDetails.time}
        onChange={handleInputChange}
      />
    </div>
    <div className="input-group"> {/* Add class name for label and input group */}
      <label htmlFor="cusName">Customer Name:</label>
      <input
        type="text"
        id="cusName"
        name="cusName"
        value={newTaskDetails.cusName}
        onChange={handleInputChange}
        placeholder="Customer Name"
        required
      />
    </div>
    <div className="input-group"> {/* Add class name for label and input group */}
      <label htmlFor="serviceType">Service Type:</label>
      <input
        type="text"
        id="serviceType"
        name="serviceType"
        value={newTaskDetails.serviceType}
        onChange={handleInputChange}
        placeholder="Service Type"
      />
    </div>
    {/* ... repeat for other input fields, wrapping label and input in a div with className="input-group" */}
    <div className="input-group">
      <label htmlFor="priority">Priority:</label>
      <select
    id="priority"
    name="priority"
    value={newTaskDetails.priority}
    onChange={handleInputChange}
    required
  >
    <option value="Urgent">Urgent</option>
    <option value="Not Urgent">Not Urgent</option> {/* Default shown */}
  </select>
    </div>
    <div className="input-group">
      <label htmlFor="amountPaid">Payment Status:</label>
      <select
    id="amountPaid"
    name="amountPaid"
    value={newTaskDetails.amountPaid}
    onChange={handleInputChange}
    required
  >
    <option value="Received">Received</option>
    <option value="Not Received">Not Received</option> {/* Default shown */}
  </select>
    </div>
    <div className="input-group">
      <label htmlFor="completeBy">Complete By:</label>
      <input
  type="datetime-local"
  id="completeBy"
  name="completeBy"
  value={newTaskDetails.completeBy}
  onChange={handleInputChange}
/>
    </div>
    <div className="input-group">
      <label htmlFor="status">Status:</label>
      <select
    id="status"
    name="status"
    value={newTaskDetails.status}
    onChange={handleInputChange}
    required
  >
    <option value="Completed">Completed</option>
    <option value="In Progress">In Progress</option> {/* Default shown */}
    <option value="Cancelled">Cancelled</option>
  </select>
    </div>
    <button onClick={handleAddTask} className="save-task-button">Save Task</button> {/* Add class name to the button */}
  </div>
)}

<div>
  <h2>Your Tasks</h2>
  {tasks.length > 0 ? (
    Object.entries(
      tasks.reduce((groups, task) => {
        const date = task.date || "No Date";
        if (!groups[date]) groups[date] = [];
        groups[date].push(task);
        return groups;
      }, {})
    )
    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .map(([date, groupedTasks], index) => (
        <div key={index} className="task-folder" style={{ marginBottom: "1.5rem", border: "1px solid #ccc", borderRadius: "6px" }}>
          <details open>
          <summary style={{ padding: "10px 16px", background: "#f0f0f0", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>
  📅 {new Date(date).toLocaleDateString('en-GB').replace(/\//g, '-')} ({groupedTasks.length} task{groupedTasks.length > 1 ? "s" : ""})
</summary>

            <table className="task-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Date & Time</th>
                  <th className="wide-column">Customer Name</th>
                  <th>Service Type</th>
                  <th>Priority</th>
                  <th>Payment Status</th>
                  <th>Complete By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedTasks.map((task, index) => (
                  <tr key={task.id}>
                    <td>{index + 1}</td>
                    <td>
  {new Date(`${task.date}T${task.time}`)
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(',', '')
    .replace(/\//g, '-')
    .trim()}
</td>

                    <td className="wide-column">{task.cusName}</td>
                    <td>{task.serviceType}</td>
                    <td style={{
                      backgroundColor: task.priority === 'Urgent' ? '#E55050' : 'inherit'
                    }}>
                      {task.priority}
                    </td>
                    <td>{task.amountPaid}</td>
                    <td>
  {task.completeBy
    ? new Date(task.completeBy).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).replace(',', '')
      .replace(/\//g, '-')
      .trim()
    : ""}
</td>
                    <td style={{
                      backgroundColor:
                        task.status === 'Completed' ? '#16C47F' :
                        task.status === 'In Progress' ? '#8DD8FF' :
                        task.status === 'Cancelled' ? '#7F8CAA' :
                        'inherit'
                    }}>
                      {task.status}
                    </td>
                    <td>
                      <button onClick={() => markTaskComplete(task.id)}>Complete</button>
                      <button onClick={() => editTask(task)}>Edit</button>
                      <button onClick={() => {
                        if (window.confirm("Are you sure you want to delete this task?")) {
                          deleteTask(task.id);
                        }
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      ))
  ) : (
    <p>No tasks available.</p>
  )}
</div>

    </div>
  );
};

export default App;