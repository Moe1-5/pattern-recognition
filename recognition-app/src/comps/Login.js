import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { handleTypingSpeed, handleStartTime } from "./CalculateTyping";

function Login() {
  const [formError, setFormError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [typingStartTime, setTypingStartTime] = useState(null);
  const [typingEndTime, setTypingEndTime] = useState(null);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [userExists, setUserExists] = useState(null);
  const [dwellTimes, setDwellTimes] = useState([]);
  const [keyPressTimes, setKeyPressTimes] = useState({});

  useEffect(() => {
    if (typingStartTime && typingEndTime) {
      const timeInSeconds = (typingEndTime - typingStartTime) / 1000;
      setTypingSpeed(timeInSeconds);
    }
  }, [typingStartTime, typingEndTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const usersResponse = await fetch("http://localhost:5000/user");
      if (!usersResponse.ok) {
        throw new Error("Failed to fetch user data");
      }
      const users = await usersResponse.json();
      const user = users.find(
        (user) => user.username === username && user.password === password
      );
      if (!user) {
        setFormError("You don't have an account, Please Register");
        resetForm()
        return;
      }
      handleTypingSpeed(
        e,
        typingStartTime,
        typingEndTime,
        setTypingStartTime,
        setTypingEndTime,
        setPassword
      );
      setFormError("");
      setUsername("");
      setPassword("");
      const fetchedUserId = user.id;

      setTimeout(() => {
        navigate("/train", { state: { userId: fetchedUserId } });
      }, 1000);

      setUserExists({ ...user });

    } catch (err) {
      console.log("Error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      setKeyPressTimes((prevTimes) => ({
        ...prevTimes,
        [e.key]: Date.now(),
      }));
    }
  };

  const handleKeyUp = (e) => {
    if (e.key === "Backspace") {
      setDwellTimes((prevDwellTimes) => {
        const newDwellTimes = [...prevDwellTimes];
        newDwellTimes.pop();
        return newDwellTimes;
      });

      setKeyPressTimes((prevTimes) => {
        const newTimes = { ...prevTimes };
        delete newTimes[newTimes[e.key]];
        return newTimes;
      });

    } else {

      const keyDownTime = keyPressTimes[e.key];
      if (keyDownTime) {
        const keyUpTime = Date.now();
        const dwellTime = keyUpTime - keyDownTime;
        console.log("Key:", e.key, "Dwell Time:", dwellTime);
        setDwellTimes((prevDwellTimes) => [...prevDwellTimes, dwellTime]);

        setKeyPressTimes((prevTimes) => {
          const newTimes = { ...prevTimes };
          delete newTimes[e.key];
          return newTimes;
        });
      }
    }
  };

  const handlingSpeed = useCallback(
    (typingSpeed) => {
      if (typingSpeed !== 0 && typingSpeed) {
        console.log("typing speed coming from the handleSubmit");
        console.log("2", userExists);
        console.log("working from the useEffect:", typingSpeed);
        console.log(userExists.speed);
        console.log("dwellTimes2", dwellTimes);
        if (dwellTimes && dwellTimes.length > 0) {
          userExists.elapsedspeed.push(typingSpeed);
          userExists.dwellTime.push(dwellTimes);
          resetForm()
        }
      }
    },
    [userExists, dwellTimes]
  );


  function resetForm() {
    setTypingStartTime(null);
    setTypingEndTime(null);
    setTypingSpeed(0)
    setDwellTimes([]);
    setKeyPressTimes({});
    setPassword("");
    setUsername("");
  }

  const updateUser = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/user/${userExists.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userExists),
        }
      );

      if (!response.ok) {
        throw new Error("failed to update user data");
      }

      const updatedUser = await response.json();
      console.log("User updated successfully", updatedUser);
    } catch (error) {
      console.log("Error updating user:", error);
    }
    // setUserExists(null)
    // setDwellTimes([])
    // setTypingStartTime(null)
    // setTypingEndTime(null)
    // setTypingSpeed(0)
  }, [userExists]);

  useEffect(() => {
    if (userExists && typingSpeed > 0) {
      handlingSpeed(typingSpeed);
      updateUser();
    }
    console.log("the userExists is null");
  }, [userExists, typingSpeed, handlingSpeed, updateUser]);

  return (
    <div className="container login-container">
      <h1 className="title">Login</h1>
      <form onSubmit={(e) => handleSubmit(e)} className="login-form">
        <div className="input-container">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-username"
            placeholder="enter your username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) =>
              handleStartTime(e, typingStartTime, setTypingStartTime, setPassword)
            }
            className="input-password"
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="enter your password"
          />
        </div>
        {formError && <p className="error-msg">{formError}</p>}
        <div className="btn-box">
          <button type="submit" className="login-btn">
            Login
          </button>
          <p>{typingSpeed}</p>
          <p>{`starting:${typingStartTime}`}</p>
          <p>{`Ending:${typingEndTime}`}</p>
          <NavLink to="/register" className="new-link">
            New? create account
          </NavLink>
        </div>
      </form>
    </div>
  );
}

export default Login;
