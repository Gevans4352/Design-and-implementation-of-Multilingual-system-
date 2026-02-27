import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './Pages/Navbar'
import Login from './Pages/Login'
import Signup from './Pages/Signup'
import Home from './Component/Home'
import Dashboard from './Pages/Dashboard'
import LanguageSelection from './Pages/LanguageSelection'
import TopicSelection from './Pages/TopicSelection'
import PracticeChat from './Pages/PracticeChat'
import ProtectedRoute from './Component/ProtectedRoute'

const App = () => {
  return (
    <BrowserRouter>
      <div className="pt-20">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/select-language" element={
            <ProtectedRoute>
              <LanguageSelection />
            </ProtectedRoute>
          } />
          <Route path="/select-topic" element={
            <ProtectedRoute>
              <TopicSelection />
            </ProtectedRoute>
          } />
          <Route path="/practice" element={
            <ProtectedRoute>
              <PracticeChat />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App