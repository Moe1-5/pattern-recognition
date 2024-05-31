import { useState, useEffect } from "react";

const useFetch = (url) => {
    let userExist = ''
    useEffect(() => {
        const abort = new AbortController();

        setTimeout(() => {
            fetch(url, { signal: abort.signal })
                .then((res) => {
                    if (!res.ok) {
                        throw new Error("failed to fetch users data")

                    }
                    return res.json();
                })
                .then((users) => {
                    setData(users);

                    userExist = users.find((user) => {
                        return (
                            user.fullName === fullName &&
                            user.username === username
                        )
                    })

                })
                .catch((err) => {
                    if (err.name === "AbortError") {
                        console.log("fetch aborted");
                    }
                });
        }, 1000);

        return () => abort.abort();
    }, [url]);

    return { data, userExist };
};

export default useFetch;
