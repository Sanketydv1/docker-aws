import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("http://localhost:5000/api/message")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => {
        console.error("error fetching message", err);
      })
  }, [])

  return (
    <>
      <h1>Welcome to chai aur code...</h1>
      <h2>Data: {message}</h2>
    </>
  )
}

export default App
