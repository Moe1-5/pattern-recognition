import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom"
import { useSnackbar } from 'notistack'

function Registeration() {

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const dwellTime = []
  const elapsedspeed = []
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  function passwordValidation() {
    if (password.length < 8) {
      enqueueSnackbar("the password must at least 8 characters long", { variant: 'info' })
      return false
    } else if (!/[A-Z]/.test(password)) {
      enqueueSnackbar("the password must contain at least one uppercase letter", { variant: 'info' })
      return false
    } else if (!/[a-z]/.test(password)) {
      enqueueSnackbar("the password must contain at least one lowercase letter", { variant: 'info' })
      return false
    } else if (!/\d/.test(password)) {
      enqueueSnackbar("the password must conatin at least one digit", { variant: 'info' })
      return false
    } else {
      return true
    }
  }
  // later you must compare the username with the data to check if there is any similar accounts//
  function emailValidation() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);
  }

  function formValidation() {
    if (!firstName || !lastName || !username || !email) {
      enqueueSnackbar('Please fill the empty fields', { variant: 'info' })
      return false
    } else {
      return true
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formValidation() || !passwordValidation()) {
      return;
    }

    const fullName = `${firstName} ${lastName}`;
    const newUser = { fullName, username, email, password, dwellTime, elapsedspeed };



    try {
      // make it also an axios post method for the registeration part 
      const addUserResponse = await fetch("http://localhost:5555/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const responseJson = await addUserResponse.json();

      if (!addUserResponse.ok) {
        console.log(addUserResponse)
        enqueueSnackbar(`Errors : ${responseJson.message}`, { variant: 'error' });
      } else if (addUserResponse.ok) {
        enqueueSnackbar("you have Registered successfully", { variant: 'success' })
        setFirstName(""); setLastName(""); setUsername(""); setPassword("");;
        navigate("/")
      }


    } catch (error) {
      enqueueSnackbar(`Error: ${error.massage}`, { variant: 'error' });
      // Handle errors with notistick here, such as displaying an error message to the user
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
        {/* you may want to add an input for the user email so you can send him through it a second authentication */}
        <div className="input-container">
          {/* <label className="email"> E-Mail:</label> */}
          <input
            type="mail"
            id="name"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email (example@gmail.com)" />

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
