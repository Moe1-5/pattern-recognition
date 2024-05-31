import React from 'react'
import { NavLink } from 'react-router-dom';

function Home() {
    return (
        <div className="container login-container">
            <h1 className="title">Home Page</h1>
            <form /*onSubmit={(e) => handleSubmit(e)}*/ className="login-form">
                <div className="input-container">
                    <h2 className='profile-name'>mohammed</h2>
                </div>
                {/* {formError && <p className="error-msg">{formError}</p>} */}
                <div className="btn-box">
                    <button type="submit" className="login-btn">
                        Train
                    </button>
                    <button className='login-btn logout-btn'>
                        Log out
                    </button>
                    <NavLink to="/train" className="new-link">bored? Go to Training</NavLink>
                </div>
            </form>
        </div>
    );

}

export default Home