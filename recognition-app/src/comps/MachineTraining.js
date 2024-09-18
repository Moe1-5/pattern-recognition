import React, { useEffect, useState, useCallback } from "react";
import { handleTypingSpeed, handleStartTime } from "./CalculateTyping";
import { useNavigate } from "react-router-dom";
import { enqueueSnackbar } from "notistack";


function MachineTraining() {
  const [typingStartTime, setTypingStartTime] = useState(null)
  const [typingEndTime, setTypingEndTime] = useState(null)
  const [typingSpeed, setTypingSpeed] = useState(0)
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [userExists, setUserExists] = useState(null)
  const [dwellTimes, setDwellTimes] = useState([]);
  const [keyPressTimes, setKeyPressTimes] = useState({});
  const userId = localStorage.getItem("userId")
  const token = localStorage.getItem("authToken")
  const navigate = useNavigate()

  useEffect(() => {
    if (typingStartTime && typingEndTime) {
      const timeInSeconds = (typingEndTime - typingStartTime) / 1000;
      setTypingSpeed(timeInSeconds)
    }
  }, [typingStartTime, typingEndTime])

  const handleSubmit = async (e) => {
    console.log(typingSpeed)
    e.preventDefault()

    if (!password) {
      enqueueSnackbar("please fill the required field", { variant: "info" })
      return
    }


    try {
      // axios, then the try and catch is not necessary 
      const userResponse = await fetch(`http://localhost:5555/train/${userId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });


      if (!userResponse.ok) {
        const responseJson = await userResponse.json()
        enqueueSnackbar(`Error: ${responseJson.message}`, { variant: "error" })
        resetForm()
        throw new Error(responseJson.message);
      }

      const user = await userResponse.json();
      console.log(user)

      if (!user) {
        setFormError("Enter your correct password")
        resetForm()
        // the error handling here 
        setTypingStartTime(null)
        return;
      } else {
        handleTypingSpeed(e, typingStartTime, typingEndTime, setTypingStartTime, setTypingEndTime, setPassword)
        setFormError("");
        setPassword("");
        setUserExists({ ...user })
        //message handling here 
      }

    } catch (err) {
      console.log("Error", err)
    }
  }

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



  const handlingSpeed = useCallback((typingSpeed) => {
    if (typingSpeed !== 0 && typingSpeed) {
      console.log("typing speed coming from the handleSubmit")
      console.log('2', userExists)
      console.log("working from the useEffect:", typingSpeed)
      console.log(userExists.speed)
      console.log("dwellTimes2", dwellTimes)
      if (dwellTimes && dwellTimes.length > 0) {
        userExists.elapsedspeed.push(typingSpeed)
        userExists.dwellTime.push(dwellTimes)
        resetForm()
      }
    }
  }, [userExists, dwellTimes])


  function resetForm() {
    setTypingStartTime(null);
    setTypingEndTime(null);
    setTypingSpeed(0)
    setDwellTimes([]);
    setKeyPressTimes({});
    setPassword("");
  }


  const updateUser = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5555/train/${userId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dwellTime: userExists.dwellTime,
          elapsedspeed: userExists.elapsedspeed,
        }),
      })

      if (!response.ok) {
        const responseJson = await response.json()
        enqueueSnackbar(`${responseJson.message}`, { variant: "error" })
        throw new Error("failed to update user data")
      }

      const updatedUser = await response.json()
      console.log("User updated successfully", updatedUser)
      resetForm()

    } catch (error) {
      console.log("Error updating user:", error)
    }
  }, [userExists, userId])



  useEffect(() => {
    console.log("check this 1", typingEndTime)
    console.log("check this 2", typingStartTime)
    if (typingStartTime && typingEndTime) {
      console.log("it haas entered")
      setTypingStartTime(null)
      setTypingEndTime(null)
      setPassword('')
      console.log("reached here 1")
    }
  }, [typingStartTime, typingEndTime])


  useEffect(() => {
    if (userExists && typingSpeed > 0) {
      handlingSpeed(typingSpeed)
      updateUser();
    }
    console.log("the userExists is null")

  }, [userExists, updateUser, handlingSpeed, typingSpeed]);

  const HomeRouteButton = () => {
    navigate("/home")
  }

  return (
    <div className="container login-container">
      <h1 className="title">Train</h1>
      <form className="login-form" onSubmit={(e) => handleSubmit(e)}>
        <div className="input-container">
          <input
            type="password"
            className="input-password"
            value={password}
            onChange={(e) => handleStartTime(e, typingStartTime, setTypingStartTime, setPassword)}
            // onBlur={(e) => handleEndTime(e, typingStartTime, typingEndTime, setTypingStartTime, setTypingEndTime, setPassword)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="enter your password"
          />
        </div>
        <div className="btn-box">
          <button type="submit" className="login-btn">
            submit
          </button>
          <button className='login-btn home' onClick={() => HomeRouteButton()}>
            Home
          </button>
          {formError && <p className="error-msg">{formError}</p>}
          <p>{typingSpeed}</p>
          <p>{`starting:${typingStartTime}`}</p>
          <p>{`Ending:${typingEndTime}`}</p>
        </div>
      </form>
    </div>
  )
}

export default MachineTraining;
