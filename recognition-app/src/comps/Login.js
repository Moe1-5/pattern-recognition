import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { handleTypingSpeed, handleStartTime } from "./CalculateTyping";
import { useSnackbar } from 'notistack'
// be careful here with the code



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
  const { enqueueSnackbar } = useSnackbar()
  useEffect(() => {
    if (typingStartTime && typingEndTime) {
      const timeInSeconds = (typingEndTime - typingStartTime) / 1000;
      setTypingSpeed(timeInSeconds);
    }
  }, [typingStartTime, typingEndTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username === "" || password === "") {
      enqueueSnackbar("please fill the required fields", { variant: 'info' })
      return
    }

    if (
      localStorage.getItem("authToken") ||
      localStorage.getItem("username") ||
      localStorage.getItem("userId")
    ) {
      localStorage.removeItem("authToken")
      localStorage.removeItem("username")
      localStorage.removeItem("userId")

    }

    const data = { username, password }
    try {
      const usersResponse = await fetch("http://localhost:5555/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!usersResponse.ok) {
        const responseJson = await usersResponse.json()
        enqueueSnackbar(`Error: ${responseJson.message}`, { variant: "error" })
        resetForm()
        return
      }
      const users = await usersResponse.json();
      const { user, token } = users
      enqueueSnackbar(`${users.message}`, { variant: 'success' })

      localStorage.setItem("authToken", token)
      localStorage.setItem("username", username)
      localStorage.setItem("userId", user.id)

      // console.log("this is the important part" + user.id)

      if (dwellTimes.length !== password.length) {
        console.log("error in capturing timestamps")
        resetForm()
      }
      // console.log(`this is the dwell Time length ${dwellTimes.length}, and this is the password length ${password.length}`)

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

      setTimeout(() => {
        navigate("/home");
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
    if (e.ctrlKey && e.key === "Backspace") {
      setDwellTimes([]);
      return;

    } else if (e.key === "Backspace") {
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
          //you mey need only these with the user.
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
        `http://localhost:5555/login/${userExists.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            dwellTime: userExists.dwellTime,
            elapsedspeed: userExists.elapsedspeed,
          }),
        }
      );

      if (!response.ok) {
        const responseJson = await response.json()
        enqueueSnackbar(`Error: ${responseJson.message}`)
        throw new Error("Failed to update user data, this is the response :", response.message);
      }

      const updatedUser = await response.json();
      console.log("User updated successfully", updatedUser);
    } catch (error) {
      console.log("Error updating user:", error);
    }

    // Optional: clean up state or perform other actions
    // setUserExists(null);
    // setDwellTimes([]);
    // setTypingStartTime(null);
    // setTypingEndTime(null);
    // setTypingSpeed(0);
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
