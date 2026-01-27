import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { clearToken, isLoggedIn } from './lib/auth';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import UploadPage from './pages/UploadPage.jsx';
import NoteDetailsPage from './pages/NoteDetailsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();

  function logout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
          <Link to="/" className="text-lg font-semibold">Notely</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/">Home</Link>
            {loggedIn ? (
              <>
                <Link to="/upload">Upload</Link>
                <Link to="/profile">Profile</Link>
                <button onClick={logout} className="rounded bg-slate-900 px-3 py-1.5 text-white">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/notes/:id" element={<NoteDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
