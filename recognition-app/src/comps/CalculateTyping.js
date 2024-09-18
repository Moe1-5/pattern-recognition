// over look this entire code if not needed delete it replace it with other one 
// also after finishing delete the logs 
export function handleStartTime(e, typingStartTime, setTypingStartTime, setPassword) {
    setPassword(e.target.value)

    if (!typingStartTime) {
        setTypingStartTime(Date.now())
    }
}


export function handleTypingSpeed(e, typingStartTime, typingEndTime, setTypingStartTime, setTypingEndTime, setPassword) {
    e.preventDefault()

    console.log("reached here 1")

    if (typingStartTime && !typingEndTime) {
        setTypingEndTime(Date.now())
    } else {
        setTypingEndTime(null)
        console.log("reached here 2")
    }

    console.log("check this one ", typingEndTime)

    if (typingStartTime && typingEndTime) {
        setTypingStartTime(null)
        setTypingEndTime(null)
        setPassword('')
        console.log("reached here 1")

    }
}

