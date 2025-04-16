import React from "react";
import axios from "axios";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/register", {
        username,
        password,
      });
      alert(response.data);
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      {" "}
      <h2>Register</h2>{" "}
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
      <button type="submit">Register</button>{" "}
    </form>
  );
}
