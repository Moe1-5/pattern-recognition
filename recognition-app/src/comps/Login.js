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

    try {
      handleTypingSpeed(
        e,
        typingStartTime,
        typingEndTime,
        setTypingStartTime,
        setTypingEndTime,
        setPassword
      );

      console.log(dwellTimes)

      setUserExists({
        username: username,
        password: password,
        dwellTime: [],
        elapsedspeed: []
      });

    } catch (err) {
      console.log(err.message)
    }

    //   try {

    //     const usersResponse = await fetch("http://localhost:5555/login", {
    //       method: "POST",
    //       headers: { "content-type": "application/json" },
    //       body: JSON.stringify(data),
    //     });
    //     if (!usersResponse.ok) {
    //       const responseJson = await usersResponse.json()
    //       enqueueSnackbar(`Error: ${responseJson.message}`, { variant: "error" })
    //       resetForm()
    //       return
    //     }
    //     const users = await usersResponse.json();
    //     const { user, token } = users
    //     enqueueSnackbar(`${users.message}`, { variant: 'success' })

    //     localStorage.setItem("authToken", token)
    //     localStorage.setItem("username", username)
    //     localStorage.setItem("userId", user.id)

    //     // console.log("this is the important part" + user.id)

    //     if (dwellTimes.length !== password.length) {
    //       console.log("error in capturing timestamps")
    //       resetForm()
    //     }
    //     // console.log(`this is the dwell Time length ${dwellTimes.length}, and this is the password length ${password.length}`)

    //     handleTypingSpeed(
    //       e,
    //       typingStartTime,
    //       typingEndTime,
    //       setTypingStartTime,
    //       setTypingEndTime,
    //       setPassword
    //     );
    //     setFormError("");
    //     setUsername("");
    //     setPassword("");

    //     // setTimeout(() => {
    //     //   navigate("/home");
    //     // }, 1000);

    //     setUserExists({ ...user });

    //   } catch (err) {
    //     console.log("Error:", err);
    //   }
  };

  const handleKeyDown = (e) => {
    // Only record time if an alphanumeric key is pressed
    if (/^[a-zA-Z0-9]$/.test(e.key)) {
      const currentTime = Date.now();

      // Calculate the time difference from the last key press
      const previousKeyPressTime = Object.values(keyPressTimes).slice(-1)[0];
      const timeDifference = previousKeyPressTime ? currentTime - previousKeyPressTime : 0;

      // Log the current time in minutes, seconds, and milliseconds
      const date = new Date(currentTime);
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const milliseconds = date.getMilliseconds();
      console.log(`Current Time: ${minutes}m ${seconds}s ${milliseconds}ms`);

      // Log the time difference only if there's a previous key press
      if (previousKeyPressTime) {
        const diffMinutes = Math.floor(timeDifference / 60000);
        const diffSeconds = Math.floor((timeDifference % 60000) / 1000);
        const diffMilliseconds = timeDifference % 1000;

        console.log(`Time Difference: ${diffMinutes}m ${diffSeconds}s ${diffMilliseconds}ms`);

        // Add the time difference to the dwellTime state
        setDwellTimes((prevDwellTimes) => {
          return [...prevDwellTimes, timeDifference];
        });
      }

      // Store the timestamp for the current key press
      setKeyPressTimes((prevTimes) => ({
        ...prevTimes,
        [e.key]: currentTime,
      }));
    }

    // Handle Backspace and Ctrl + Backspace
    if (e.key === 'Backspace') {
      if (e.ctrlKey) {
        // Clear all dwell times if Ctrl + Backspace is pressed
        setDwellTimes([]);
        console.log('All time differences cleared!');
        setKeyPressTimes({}); // Clear all key press times
      } else {
        // Remove the last dwell time if it exists
        setDwellTimes((prevDwellTimes) => {
          if (prevDwellTimes.length > 0) {
            return prevDwellTimes.slice(0, -1); // Remove the last dwell time
          }
          return prevDwellTimes; // Return unchanged if there's nothing to remove
        });

        setKeyPressTimes((prevTimes) => {
          const keys = Object.keys(prevTimes);
          if (keys.length > 0) {
            const newTimes = { ...prevTimes };
            delete newTimes[keys[keys.length - 1]]; // Remove the last character's key
            return newTimes; // Return the updated times
          }
          return prevTimes; // Return unchanged if there's nothing to remove
        });
      }
    }
  };



  // const handleKeyUp = (e) => {
  //   if (e.ctrlKey && e.key === "Backspace") {
  //     setDwellTimes([]);
  //     return;
  //   } else if (e.key === "Backspace") {
  //     setDwellTimes((prevDwellTimes) => {
  //       const newDwellTimes = [...prevDwellTimes];
  //       newDwellTimes.pop(); // Remove the last dwell time
  //       return newDwellTimes;
  //     });

  //     setKeyPressTimes((prevTimes) => {
  //       const newTimes = { ...prevTimes };
  //       delete newTimes[e.key]; // Remove the time of the backspace key
  //       return newTimes;
  //     });
  //   } else {
  //     const keyDownTime = keyPressTimes[e.key];
  //     if (keyDownTime) {
  //       const keyUpTime = Date.now();
  //       const index = dwellTimes.length - 1; // Get the last index

  //       // Calculate dwell time only if there is a previous key press
  //       if (index > 0) {
  //         const previousKeyTime = dwellTimes[index - 1]; // Get the time of the previous key
  //         const dwellTime = keyUpTime - keyDownTime; // Time held down
  //         console.log("Key:", e.key, "Dwell Time:", dwellTime);

  //         // Store dwell time as the difference from the previous key press
  //         const newDwellTimes = dwellTimes.map((time, i) => {
  //           if (i === index) {
  //             return dwellTime; // Only update the last dwell time
  //           }
  //           return time; // Keep other times the same
  //         });

  //         setDwellTimes(newDwellTimes);
  //       }

  //       setKeyPressTimes((prevTimes) => {
  //         const newTimes = { ...prevTimes };
  //         delete newTimes[e.key]; // Remove the time of the current key
  //         return newTimes;
  //       });
  //     }
  //   }
  // };


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
      const response = await fetch(`http://localhost:5555/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userExists),
      });

      console.log(userExists.dwellTime, userExists.elapsedspeed)

      if (!response.ok) {
        const responseJson = await response.json();
        enqueueSnackbar(`Error: ${responseJson.message}`, { variant: 'error' });
        resetForm()
        return
      }

      const responseJson = await response.json();
      enqueueSnackbar(responseJson.message, { variant: 'success' });

      // If the login is successful, store the token and navigate to home
      if (responseJson.token) {
        localStorage.setItem("authToken", responseJson.token);
        localStorage.setItem("username", username);
        localStorage.setItem("userId", responseJson.userId)
        navigate("/home");
        resetForm()
      }


    } catch (error) {
      console.log("Error updating user:", error);
    }
  }, [userExists, dwellTimes, typingSpeed]);


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
            // onKeyUp={handleKeyUp}
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
