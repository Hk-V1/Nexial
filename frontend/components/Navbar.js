export default function Navbar({ user, onLogout }) {
  return (
    <div className="bg-primary text-white px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-bold">Nexial</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm">Welcome, {user.username}</span>
        <button
          onClick={onLogout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
