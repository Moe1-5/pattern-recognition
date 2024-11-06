import express from "express"
import mongoose from "mongoose"
import { User } from "./scheme.js"
import bcrypt from 'bcrypt';
import cors from 'cors'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express()
app.use(cors())
app.use(express.json())

const PYTHON_API_URL = "http://127.0.0.1:5000/predict"
const PYTHON_TRAINING_API_URL = "http://127.0.0.1:5000/train"
const PYTHON_INC_TRAINING_API_URL = "http://127.0.0.1:5000/incremental_train"

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}


app.get('/', (req, res) => {
    res.status(200).send("Hello")
})
//check the validation of the registeration , add the user exist validation here... 
app.post('/register', async (req, res) => {
    const { fullName, username, email, password, dwellTime, elapsedspeed } = req.body;
    try {
        if (
            !fullName ||
            !username ||
            !password
        ) {
            return res.status(400).send({ message: "all fields need to be filled" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userExists = await User.findOne({ $or: [{ username }, { email }] });

        if (userExists) {
            return res.status(409).json({ message: "The user already exist" })
        }

        const newUser = {
            fullName: fullName,
            username: username,
            email: email,
            password: hashedPassword,
            dwellTime: dwellTime,
            elapsedspeed: elapsedspeed,
        };
        try {
            const user = await User.create(newUser);
            return res.status(201).json(user);
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                return res.status(409).send({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
            }
            console.error("Error creating user:", error.message);
            return res.status(500).send({ message: "An internal error occurred while creating the user" });
        }

    } catch (err) {
        console.log("here is the error", err.message)
        res.status(500).send({ message: err.message })
    }
})

app.post("/login", async (req, res) => {
    const { username, password, dwellTime, elapsedspeed } = req.body;
    console.log("DwellTime :", dwellTime);
    console.log("elapsedTime :", elapsedspeed);

    try {

        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        let sessionCount = user.dwellTime ? user.dwellTime.length : 0;
        if (sessionCount === 50 || sessionCount > 50 && sessionCount % 50 === 0) {
            try {
                const userData = {
                    userID: user._id,
                    dwellTime: user.dwellTime,
                    elapsedTime: user.elapsedspeed,
                };

                console.log("UserData sent for training:", userData);

                await axios.post(PYTHON_TRAINING_API_URL, userData);

                console.log(`Model trained for user ${user._id}`);
            } catch (error) {
                console.error("Error training model:", error);
            }
        }

        if (sessionCount > 50) {
            const checkUserData = { userID: user._id, dwellTime, elapsedTime: elapsedspeed };
            const response = await axios.post(PYTHON_API_URL, checkUserData);

            const { is_suspicious, reconstruction_error } = response.data;
            if (is_suspicious) {
                return res.status(403).json({ message: "Suspicious login behavior detected", reconstruction_error });
            }
        }

        if (dwellTime !== undefined) {
            user.dwellTime.push(...dwellTime);
        }
        if (elapsedspeed !== undefined) {
            user.elapsedspeed.push(...elapsedspeed);
        }

        const updateData = user.save()
        if (!updateData) {
            return res.status(404).json({ message: "User not found" });
        } else {
            const token = jwt.sign({ username: user.username }, process.env.SECRET_KEY, { expiresIn: "1h" });
            return res.status(200).json({
                message: "Login successful",
                token,
                userId: user._id,
            });
        }

    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

app.post("/train/:id", authenticateToken, async (req, res) => {
    const { id } = req.params
    const { password } = req.body
    const user = await User.findById(id)
    console.log("this is the req body : ", req.body)

    if (!user) {
        return res.status(500).json({ message: " Internal error, please login again" })
    }

    try {
        const isMatch = await bcrypt.compare(password, user.password);

        const filteredUser = {
            dwellTime: user.dwellTime,
            elapsedspeed: user.elapsedspeed

        }

        if (!isMatch) {
            return res.status(400).json({ message: "incorrect password" })
        } else {
            return res.status(200).json(filteredUser)
        }
    } catch (err) {
        console.log(err.message)
        return res.status(500).json({ message: "Server Error" })
    }
})

app.put("/train/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { dwellTime, elapsedspeed } = req.body;

    try {
        const updateData = {};

        if (dwellTime !== undefined) {
            updateData.dwellTime = dwellTime;
        }
        if (elapsedspeed !== undefined) {
            updateData.elapsedspeed = elapsedspeed;
        }

        let sessionCount = dwellTime ? dwellTime.length : 0;
        if (sessionCount === 50 || sessionCount > 50 && sessionCount % 50 === 0) {
            try {
                const userData = {
                    userID: id,
                    dwellTime: dwellTime,
                    elapsedTime: elapsedspeed,
                };

                // console.log("UserData sent for training:", userData);

                await axios.post(PYTHON_TRAINING_API_URL, userData);

                console.log(`Model trained for user ${id}`);
            } catch (error) {
                console.error("Error training model:", error);
            }
        }

        if (sessionCount > 50 && sessionCount % 10 === 0) {
            try {
                const periodicDwell = dwellTime.slice(-10)
                const periodicElapsed = elapsedspeed.slice(-10)

                const periodicData = {
                    userID: id,
                    dwellTime: periodicDwell,
                    elapsedTime: periodicElapsed,
                }
                console.log("this is the preiodic data : ", periodicData)

                await axios.post(PYTHON_INC_TRAINING_API_URL, periodicData)

            } catch (error) {
                console.log("error in the line 337 : ", error)
            }
        }

        // console.log("this is the updated data in training : ", updateData)

        const updateUser = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });

        if (!updateUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(updateUser);

    } catch (error) {
        console.error("Error updating user:", error.message);
        return res.status(500).json({ message: "Server error" });
    }
});


mongoose.connect(process.env.MONGO_DB).then(() => {
    console.log("Mongo DB is connected ")

    app.listen(process.env.PORT, () => {
        console.log("App is connected to the port :", process.env.PORT)
    })

}).catch((err) => {
    console.log(err.message)
})