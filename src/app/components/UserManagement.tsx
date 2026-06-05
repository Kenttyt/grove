import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface User {
  id: number;
  name: string | null;
  username: string;
  role: string;
  last_activity: string | null;
  status: string;
  created_at: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'worker'>('worker');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit user modal state
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'worker'>('worker');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/admin/create-user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to create user');
        return;
      }

      setSuccess('User created successfully!');
      setUsername('');
      setPassword('');
      
      // Refresh users list
      fetchUsers();
    } catch {
      setError('Failed to create user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users.php');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch {
      console.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditPassword('');
    setEditRole(user.role as 'admin' | 'worker');
    setEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    if (!editUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (editUsername.length > 18) {
      setError('Username must be 18 characters or less');
      return;
    }

    if (editPassword.trim() && editPassword.length < 8) {
      setError('Password must be at least 8 characters if provided');
      return;
    }

    try {
      const response = await fetch('/api/admin/update-user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          username: editUsername,
          password: editPassword,
          role: editRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to update user');
        return;
      }

      setSuccess('User updated successfully!');
      setEditModal(false);
      fetchUsers();
    } catch {
      setError('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }

    fetch('/api/admin/delete-user.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setSuccess(data.message);
          fetchUsers();
        } else {
          setError('Failed to delete user');
        }
      })
      .catch(() => setError('Failed to delete user. Please try again.'));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
        <p className="text-muted-foreground">Create and manage user accounts for workers and administrators.</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Create New User</h2>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              type="text"
              id="new-username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={18}
              className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              type="password"
              id="new-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              placeholder="Enter password (min 8 characters)"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'worker')}
              className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            >
              <option value="worker">Worker</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity font-semibold"
          >
            {isSubmitting ? 'Creating User...' : 'Create User'}
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Existing Users</h2>
        {users.length === 0 ? (
          <p className="text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-foreground">User ID</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Username</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Last Activity</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="py-3 px-4 text-foreground">{user.id}</td>
                    <td className="py-3 px-4 text-foreground">{user.name || '-'}</td>
                    <td className="py-3 px-4 text-foreground">{user.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.last_activity ? new Date(user.last_activity).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-red-500/10 text-red-600'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-xs px-3 py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border">
            <h3 className="text-xl font-semibold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  maxLength={18}
                  className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                  placeholder="Enter new password (min 8 characters)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'admin' | 'worker')}
                  className="w-full bg-background px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                >
                  <option value="worker">Worker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
