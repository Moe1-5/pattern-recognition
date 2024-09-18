import mongoose from "mongoose"

const userSchema = mongoose.Schema(
    {

        fullName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            validate: {
                validator: function (value) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                },
                message: props => `${props.value} is not a valid email!`
            }
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        dwellTime: {
            type: [[Number]]
        },
        elapsedspeed: {
            type: [Number]
        }
    }
)

export const User = mongoose.model("User", userSchema)