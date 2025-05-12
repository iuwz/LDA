// src/views/pages/Admin/AdminPage.tsx

import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaFileAlt,
  FaUserShield,
  FaSpinner,
  FaTrash,
  FaUserCog,
  FaHome,
} from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

// User type
interface User {
  email: string;
  role: string;
}

// Dashboard metrics type
interface Metrics {
  users: number;
  documents: number;
  risk_assessments: number;
  compliance_reports: number;
  translation_reports: number;
  rephrase_reports: number;
  chatbot_sessions: number;
}

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<{
    email: string;
    role: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch users and metrics on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersRes = await fetch(`${API_BASE}/admin/users`, {
          credentials: "include",
        });
        if (!usersRes.ok) throw new Error("Failed to fetch users");
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Fetch metrics
        const metricsRes = await fetch(`${API_BASE}/admin/metrics/users`, {
          credentials: "include",
        });
        if (!metricsRes.ok) throw new Error("Failed to fetch metrics");
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      } catch (err: any) {
        console.error("Admin fetch error:", err);
        setError(err.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle role change
  const handleRoleChange = async () => {
    if (!pendingRole) return;
    setActionLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/users/${pendingRole.email}/role`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_role: pendingRole.role }),   // ← update
        }
      );
      if (!res.ok) throw new Error("Failed to update role");

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.email === pendingRole.email
            ? { ...user, role: pendingRole.role }
            : user
        )
      );
      setSuccessMessage(
        `Changed ${pendingRole.email}'s role to ${pendingRole.role}`
      );
    } catch (err: any) {
      console.error("Role change error:", err);
      setError(err.message || "Failed to change role");
    } finally {
      setActionLoading(false);
      setPendingRole(null);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!pendingDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${pendingDelete}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete user");

      // Update local state
      setUsers((prev) => prev.filter((user) => user.email !== pendingDelete));
      if (metrics) {
        setMetrics({
          ...metrics,
          users: metrics.users - 1,
        });
      }
      setSuccessMessage(`Deleted user ${pendingDelete}`);
    } catch (err: any) {
      console.error("Delete user error:", err);
      setError(err.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
      setPendingDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <FaSpinner className="animate-spin text-4xl text-[#C18241]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#1A202C] text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <FaUserShield className="mr-3 text-2xl text-[#C18241]" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 rounded px-3 py-2"
              >
                <FaHome className="mr-2" /> User Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Success/Error messages */}
        {error && (
          <div className="mb-6 rounded-md bg-red-100 p-4 text-red-800">
            <p>{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 rounded-md bg-green-100 p-4 text-green-800">
            <p>{successMessage}</p>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-800">
              System Overview
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                    <FaUsers className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold">{metrics.users}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-md">
                <div className="flex items-center">
                  <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                    <FaFileAlt className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Documents</p>
                    <p className="text-2xl font-bold">{metrics.documents}</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 rounded-lg bg-white p-6 shadow-md">
                <h3 className="mb-3 font-semibold text-gray-700">
                  Service Counts
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Compliance Reports</p>
                    <p className="text-xl font-semibold">
                      {metrics.compliance_reports}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Risk Assessments</p>
                    <p className="text-xl font-semibold">
                      {metrics.risk_assessments}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Translations</p>
                    <p className="text-xl font-semibold">
                      {metrics.translation_reports}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rephrasing</p>
                    <p className="text-xl font-semibold">
                      {metrics.rephrase_reports}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {user.role === "admin" ? (
                            <FaUserShield className="text-[#C18241]" />
                          ) : (
                            <FaUserCog className="text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-green-100 text-green-800"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          setPendingRole({
                            email: user.email,
                            role: user.role === "admin" ? "user" : "admin",
                          })
                        }
                        className="text-blue-600 hover:text-blue-900 mx-2"
                      >
                        {user.role === "admin" ? "Make User" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => setPendingDelete(user.email)}
                        className="text-red-600 hover:text-red-900 mx-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {pendingRole && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-black opacity-30"></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold">Change User Role</h3>
              <p className="my-4">
                Change {pendingRole.email} from {pendingRole.role} to{" "}
                {pendingRole.role === "admin" ? "user" : "admin"}?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setPendingRole(null)}
                  className="px-4 py-2 border rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                  {actionLoading ? (
                    <FaSpinner className="animate-spin mx-auto" />
                  ) : (
                    "Confirm"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-black opacity-30"></div>
            <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-red-600">
                Delete User
              </h3>
              <p className="my-4">
                Are you sure you want to delete {pendingDelete}? This will
                remove all their data.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="px-4 py-2 border rounded-md text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
                >
                  {actionLoading ? (
                    <FaSpinner className="animate-spin mx-auto" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
