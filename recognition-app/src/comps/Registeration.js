import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom"


function Registeration() {

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [formError, setFormError] = useState("")
  const dwellTime = []
  const elapsedspeed = []
  const navigate = useNavigate()

  function passwordValidation() {
    if (password.length < 8) {
      setPasswordError("the password must at least 8 characters long")
      return false
    } else if (!/[A-Z]/.test(password)) {
      setPasswordError("the password must contain at least one uppercase letter")
      return false
    } else if (!/[a-z]/.test(password)) {
      setPasswordError("the password must contain at least one lowercase letter")
      return false
    } else if (!/\d/.test(password)) {
      setPasswordError("the password must conatin at least one digit")
      return false
    } else {
      setPasswordError("")
      return true
    }
  }
  // later you must compare the username with the data to check if there is any similar accounts//

  function formValidation() {
    if (!firstName || !lastName || !username) {
      setFormError('Please fill the empty fields')
      return false
    } else {
      setFormError("")
      return true
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formValidation() || !passwordValidation()) {
      return;
    }

    const fullName = `${firstName} ${lastName}`;
    const newUser = { fullName, username, password, dwellTime, elapsedspeed };



    try {
      const usersResponse = await fetch("http://localhost:5000/user");
      if (!usersResponse.ok) {
        throw new Error("Failed to fetch user data");
      }
      const users = await usersResponse.json();

      const userExists = users.find(
        (user) => user.fullName === fullName && user.username === username
      );

      if (userExists) {
        setFormError("The user already exists. Please log in.");
        return;
      }

      const addUserResponse = await fetch("http://localhost:5000/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!addUserResponse.ok) {
        console.log(addUserResponse)
        throw new Error("Failed to add new user");
      }
      console.log("new user has been added")
      setFirstName(""); setLastName(""); setUsername(""); setPassword(""); setFormError(""); setPasswordError("");
      navigate("/")

    } catch (error) {
      console.error("Error:", error.message);
      // Handle errors here, such as displaying an error message to the user
    }
  }
  return (
    <div className="container">
      <h1 className="title">Sign up</h1>☺
      <form onSubmit={handleSubmit} className="registeration-form">
        <div className="input-container">
          <input
            type="text"
            id="username"
            className="firstname"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your First name"
          />
          <input
            type="text"
            id="username"
            className="lastname"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your Last name"
          />
        </div>
        <div className="input-container">
          {/* <label className="email"> E-Mail:</label> */}
          <input
            type="text"
            id="name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username" />

        </div>
        <div className="input-container">
          {/* <label className="password">Password:</label> */}
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        {formError && <p className="error-msg">{formError}</p>}
        {passwordError && <p className='error-msg'>{passwordError}</p>}
        <div className="btn-box">
          <button className="register-btn">
            Register
          </button>
          <NavLink to="/" className="new-link">have an account? log in</NavLink>
        </div>
      </form>
    </div>
  );
}

export default Registeration;
