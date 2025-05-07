import React, { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/login", {
        username,
        password,
      });
      localStorage.setItem("token", response.data.token);
      alert("Login successful");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      {" "}
      <h2>Login</h2>{" "}
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />{" "}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />{" "}
      <button type="submit">Login</button>{" "}
    </form>
  );
}
