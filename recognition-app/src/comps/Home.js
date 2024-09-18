import React from 'react'
import { useNavigate } from 'react-router-dom';

function Home() {
    const navigate = useNavigate()
    const username = localStorage.getItem("username")
    const handleRouteButton = () => {
        navigate("/train")
    }

    const logoutButton = () => {
        localStorage.removeItem("authToken")
        localStorage.removeItemItem("userId")
        localStorage.removeItemItem("username")

        navigate("/")
    }
    return (
        <div className="container login-container">
            <h1 className="title">Home Page</h1>
            <form className="login-form">
                <div className="input-container">
                    <h2 className='profile-name'>{username}</h2>
                </div>
                <div className="btn-box">
                    <button type="submit" className="login-btn" onClick={() => handleRouteButton()}>
                        Train
                    </button>
                    <button className='login-btn logout-btn' onClick={() => logoutButton()}>
                        Log out
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Home