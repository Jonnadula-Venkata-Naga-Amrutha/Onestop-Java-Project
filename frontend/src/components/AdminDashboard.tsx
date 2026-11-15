import { useState } from 'react';
import {
  Booking,
  Complaint,
  AdminAuditLog,
  ProviderProfile,
  User,
  VerificationRequest
} from '../types';
import { Language } from '../data/translations';
import { dbService } from '../services/storage';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  providers: ProviderProfile[];
  bookings: Booking[];
  auditLogs: AdminAuditLog[];
  verifications: VerificationRequest[];
  complaints: Complaint[];
  lang: Language;
  onRefreshData: () => void;
}

export default function AdminDashboard({
  currentUser,
  users,
  providers,
  bookings,
  auditLogs,
  verifications,
  complaints,
  lang,
  onRefreshData,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'verifications' | 'complaints' | 'users' | 'bookings' | 'audit'>('verifications');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Platform metrics
  const totalUsersCount = users.length;
  const activeProvidersCount = providers.length;
  const pendingVerifs = verifications.filter(v => v.status === 'PENDING');
  const openComplaints = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'DISMISSED');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const completionRate = bookings.length > 0
    ? Math.round((completedBookings.length / bookings.length) * 100)
    : 100;

  const handleApproveVerification = async (verifId: string) => {
    try {
      await dbService.updateVerificationStatus(verifId, 'APPROVED', 'Reviewed and approved by administrator.');
      onRefreshData();
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'Verification could not be approved.');
    }
  };

  const handleRejectVerification = async (verifId: string) => {
    try {
      await dbService.updateVerificationStatus(verifId, 'REJECTED', 'Submitted documentation does not meet verification requirements.');
      onRefreshData();
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'Verification could not be rejected.');
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    if (!resolutionNotes.trim()) return;
    try {
      await dbService.resolveComplaint(complaintId, 'RESOLVED', resolutionNotes);
      setSelectedComplaintId(null);
      setResolutionNotes('');
      onRefreshData();
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'Complaint could not be resolved.');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      await dbService.updateUserStatus(user.id, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
      onRefreshData();
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : 'User status could not be updated.');
    }
  };

  return (
    <div className="py-10 bg-[#F7F5EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#173D32]/10 gap-4">
          <div>
            <div className="text-xs font-semibold text-[#173D32] uppercase tracking-wider mb-1">
              Platform Governance & Trust Ops
            </div>
            <h1 className="text-3xl font-bold font-serif-heading text-[#173D32]">
              Administrator Console
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Monitor verification credentials, resolve disputes, and maintain platform integrity.
            </p>
          </div>
          <button
            onClick={onRefreshData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#173D32] bg-white border border-[#173D32]/20 rounded-xl hover:bg-[#173D32]/5 self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="text-xs text-gray-500">Registered Users</div>
            <div className="text-2xl font-bold font-mono-code text-gray-900 mt-1 tabular-nums">
              {totalUsersCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="text-xs text-gray-500">Active Pros</div>
            <div className="text-2xl font-bold font-mono-code text-[#173D32] mt-1 tabular-nums">
              {activeProvidersCount}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="text-xs text-gray-500">Pending Licenses</div>
            <div className="text-2xl font-bold font-mono-code text-amber-600 mt-1 tabular-nums">
              {pendingVerifs.length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="text-xs text-gray-500">Open Complaints</div>
            <div className="text-2xl font-bold font-mono-code text-[#C84C4C] mt-1 tabular-nums">
              {openComplaints.length}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
            <div className="text-xs text-gray-500">Job Completion Rate</div>
            <div className="text-2xl font-bold font-mono-code text-teal-700 mt-1 tabular-nums">
              {completionRate}%
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-xl border border-gray-200 w-fit mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'verifications'
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Verification Requests ({pendingVerifs.length})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'complaints'
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Complaints & Disputes ({openComplaints.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-[#173D32] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User Directory ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'bookings' ? 'bg-[#173D32] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'audit' ? 'bg-[#173D32] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Audit log
          </button>
        </div>

        {/* Tab 1: Verification Requests */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            {verifications.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-gray-900">{v.providerName}</span>
                    <span className="text-gray-500">({v.businessName})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-900'
                        : v.status === 'REJECTED'
                        ? 'bg-red-100 text-red-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Doc: <strong>{v.documentType}</strong> · Reg No: <code className="font-mono-code">{v.documentNumber}</code>
                  </p>
                  {v.reviewerNotes && (
                    <p className="text-gray-500 italic mt-1">Reviewer Note: {v.reviewerNotes}</p>
                  )}
                </div>

                {v.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRejectVerification(v.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 font-medium"
                    >
                      Reject License
                    </button>
                    <button
                      onClick={() => handleApproveVerification(v.id)}
                      className="px-4 py-1.5 rounded-lg bg-[#173D32] hover:bg-[#102B25] text-white font-semibold flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approve & Grant Badge</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Complaints & Disputes */}
        {activeTab === 'complaints' && (
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <p className="p-6 bg-white rounded-2xl border text-xs text-gray-500 italic">
                Zero active disputes on the platform.
              </p>
            ) : (
              complaints.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs text-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-code font-bold text-[#173D32]">
                          Ref: {c.bookingReference}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">{c.subject}</h4>
                      <p className="text-gray-500">
                        Filed by: <strong>{c.filedByName}</strong> against <strong>{c.againstName}</strong>
                      </p>
                    </div>
                  </div>

                  <p className="p-3 bg-red-50/50 rounded-xl text-gray-700">
                    "{c.description}"
                  </p>

                  {c.adminResolutionNotes && (
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-900">
                      <strong>Admin Resolution Note:</strong> {c.adminResolutionNotes}
                    </div>
                  )}

                  {c.status !== 'RESOLVED' && (
                    <div className="pt-2 border-t border-gray-100">
                      {selectedComplaintId === c.id ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder="Enter mediation resolution notes, compensation action, or provider warning..."
                            className="w-full p-2 rounded-lg border border-gray-300"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedComplaintId(null)}
                              className="px-3 py-1 text-gray-500"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleResolveComplaint(c.id)}
                              className="px-4 py-1.5 bg-[#173D32] text-white rounded-lg font-semibold"
                            >
                              Finalize Resolution
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedComplaintId(c.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium"
                        >
                          Resolve Dispute
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Users */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#F7F5EF] text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-3 font-semibold">User Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Phone</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">{u.fullName}</td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-900'
                          : u.role === 'PROVIDER'
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-stone-100 text-stone-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono-code text-gray-600">{u.phone}</td>
                    <td className={`p-3 font-semibold ${u.status === 'ACTIVE' ? 'text-emerald-700' : 'text-red-700'}`}>{u.status}</td>
                    <td className="p-3">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="border-b bg-[#F7F5EF] text-gray-600">
                <tr>
                  <th className="p-3">Reference</th><th className="p-3">Customer</th>
                  <th className="p-3">Provider</th><th className="p-3">Service</th>
                  <th className="p-3">Date</th><th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(booking => (
                  <tr key={booking.id}>
                    <td className="p-3 font-mono-code font-semibold">{booking.bookingReference}</td>
                    <td className="p-3">{booking.customerName}</td>
                    <td className="p-3">{booking.providerName}</td>
                    <td className="p-3">{booking.serviceTitle}</td>
                    <td className="p-3">{booking.scheduledDate}</td>
                    <td className="p-3">{booking.status.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && <p className="p-6 text-center text-gray-500">No bookings found.</p>}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLogs.map(log => (
              <article key={log.id} className="rounded-xl border border-gray-200 bg-white p-4 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <strong>{log.actionType.replace(/_/g, ' ')}</strong>
                  <time className="text-gray-500">{new Date(log.createdAt).toLocaleString()}</time>
                </div>
                <p className="mt-1 text-gray-700">{log.changeSummary}</p>
                <p className="mt-1 text-gray-500">{log.adminName} · {log.entityName} · {log.entityId}</p>
              </article>
            ))}
            {auditLogs.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-gray-500">No administrative actions recorded.</p>}
          </div>
        )}

      </div>
    </div>
  );
}
