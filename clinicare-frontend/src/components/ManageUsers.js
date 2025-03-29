import React, { useState, useEffect } from "react";
import axios from "axios";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/users/", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const handleAddUser = async () => {
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    setError("");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/users/",
        {
          email: username, // Ensure backend expects 'email' instead of 'username'
          password: password,
          role: role,
          first_name: "New",
          last_name: "User",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("User added:", response.data);

      setUsers((prevUsers) => [...prevUsers, response.data]);
      setUsername("");
      setPassword("");
      setRole("staff");
    } catch (error) {
      console.error("Error adding user:", error.response?.data);
      setError(error.response?.data?.error || "Failed to add user.");
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      {error && <p className="error">{error}</p>}
      <div className="add-user-form">
        <input
          type="text"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="doctor">Doctor</option>
          <option value="nurse">Nurse</option>
          <option value="staff">Staff</option>
        </select>
        <button onClick={handleAddUser}>Add User</button>
      </div>

      <h3>Existing Users</h3>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.email} - {user.role}</li>
        ))}
      </ul>
    </div>
  );
};

export default UserManagement;
