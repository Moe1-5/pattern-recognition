import express from "express"
import mongoose from "mongoose"
import { User } from "./scheme.js"
import bcrypt from 'bcrypt';
import cors from 'cors'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
import runPrediction from './mlModel.js'

dotenv.config();

const app = express()
app.use(cors())
app.use(express.json())

let trainUser = ""

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


// app.post("/login", async (req, res) => {
//     const { username, password } = req.body;

//     try {
//         const user = await User.findOne({ username });

//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         const filteredUser = {
//             id: user.id,
//             dwellTime: user.dwellTime || [],
//             elapsedspeed: user.elapsedspeed || []
//         };

//         // Remove the initial prediction here. It will be handled in the PUT request.

//         // Send back a success response for the login (without token generation yet)
//         return res.status(200).json({
//             message: "Login successful, awaiting behavior data for authentication",
//             user: filteredUser
//         });

//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Server error" });
//     }
// });



app.post("/login", async (req, res) => {
    // const { id } = req.params;
    const { username, password, dwellTime, elapsedspeed } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }


        const updatedData = {
            dwellTime: user.dwellTime,
            elapsedspeed: user.elapsedspeed,
        }


        if (dwellTime !== undefined) {
            // Concatenate the new dwellTime (works for arrays)
            updatedData.dwellTime = updatedData.dwellTime.concat(dwellTime);
        }

        if (elapsedspeed !== undefined) {
            // Concatenate the new elapsed speed
            updatedData.elapsedspeed = updatedData.elapsedspeed.concat(elapsedspeed);
        }

        // Now run the prediction with updated user data
        const prediction = await runPrediction(updatedData);

        console.log("this is the prediction : ", prediction)

        if (prediction >= 0.5) {
            // Grant authentication token and return success
            await data.save();
            const token = jwt.sign({ username: updateUser.username }, process.env.SECRET_KEY, { expiresIn: "1h" });
            return res.status(200).json({ message: "Login successful", token });
        } else {
            // Deny login due to suspicious behavior
            return res.status(403).json({ message: "Suspicious login behavior detected" });
        }
    } catch (error) {
        console.log("Error updating user:", error);
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

        trainUser = password;

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

        if (trainUser.length !== dwellTime[dwellTime.length - 1].length) {
            return res.status(500).json({ message: "SERVER ERROR : Try ALT + BAKCSPACE and write the password again!!" })
        }

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