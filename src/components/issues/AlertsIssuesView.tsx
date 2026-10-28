import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  History,
  BellRing,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { CAMPUS_ZONES } from '../../data/initialData';
import type { IssueCategory, IssueStatus, CampusZoneId } from '../../types';

const CATEGORY_LABELS: Record<IssueCategory, string> = {
  blocked_slot: 'Blocked Parking Slot',
  incorrect_availability: 'Incorrect Slot Availability',
  unauthorized_parking: 'Unauthorized Parking',
  damaged_facility: 'Damaged Parking Facility',
  other: 'Other Parking Problem',
};

export const AlertsIssuesView: React.FC = () => {
  const {
    currentUser,
    slots,
    issues,
    reportIssue,
    updateIssueStatus,
    triggerSimulatedAlert,
  } = useParking();

  const isAdmin = currentUser.role === 'admin';

  // Report form state
  const [category, setCategory] = useState<IssueCategory>('blocked_slot');
  const [zoneId, setZoneId] = useState<CampusZoneId>('ZONE_A');
  const [slotId, setSlotId] = useState<string>('A-12');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Admin review state
  const [statusFilter, setStatusFilter] = useState<'ALL' | IssueStatus>('ALL');
  const [selectedIssueId, setSelectedIssueId] = useState<string>('ISS-401');
  const [adminNote, setAdminNote] = useState<string>('');
  const [markMaintenance, setMarkMaintenance] = useState<boolean>(false);

  const zoneSlots = useMemo(
    () => slots.filter((s) => s.zoneId === zoneId),
    [slots, zoneId]
  );

  const filteredIssues = useMemo(
    () => issues.filter((i) => statusFilter === 'ALL' || i.status === statusFilter),
    [issues, statusFilter]
  );

  const selectedIssue = useMemo(
    () => issues.find((i) => i.id === selectedIssueId) || filteredIssues[0] || null,
    [issues, selectedIssueId, filteredIssues]
  );

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    const res = await reportIssue({
      category,
      zoneId,
      slotId: slotId || undefined,
      severity,
      title,
      description,
    });
    setSubmitting(false);
    if (res.success && res.data) {
      setSelectedIssueId(res.data.id);
      setTitle('');
      setDescription('');
    }
  };

  const handleAdminStatusUpdate = async (newStatus: IssueStatus) => {
    if (!selectedIssue) return;
    await updateIssueStatus(selectedIssue.id, {
      status: newStatus,
      note: adminNote || undefined,
      markSlotMaintenance: markMaintenance,
    });
    setAdminNote('');
    setMarkMaintenance(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Campus Incident Reporting &amp; Administrator Resolution Console
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Parking Alerts &amp; Issue Reporting
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Report blocked bays, unauthorized vehicles, or facility damage. Administrators review and resolve reports with a full timestamped audit trail.
          </p>
        </div>

        {/* Clearly Labelled Simulated Alert Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <BellRing className="w-3.5 h-3.5 text-amber-600" />
            <span>Demo Alerts (Simulated):</span>
          </span>
          <button
            onClick={() => triggerSimulatedAlert('overstay')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            Simulate Overstay
          </button>
          <button
            onClick={() => triggerSimulatedAlert('blocked')}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 whitespace-nowrap"
          >
            Simulate Obstruction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: User Issue Submission Form (5 cols) */}
        <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Report a Parking Issue</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitting as <strong>{currentUser.name}</strong> ({currentUser.role})
            </p>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parking Zone *
                </label>
                <select
                  value={zoneId}
                  onChange={(e) => {
                    const nextZone = e.target.value as CampusZoneId;
                    setZoneId(nextZone);
                    const first = slots.find((s) => s.zoneId === nextZone);
                    setSlotId(first ? first.id : '');
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {CAMPUS_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Affected Slot (Optional)
                </label>
                <select
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">Zone-Wide / None</option>
                  {zoneSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.slotNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors ${
                      severity === sev
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Short Summary Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Delivery vehicle blocking Bay A-12"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Detailed Description *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe vehicle plate (if unauthorized), obstruction details, or hardware damage..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Issue Report'}</span>
            </button>
          </form>
        </div>

        {/* Right: Issue Queue & Admin Review Console (7 cols) */}
        <div className="xl:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Reported Parking Issues ({filteredIssues.length})
              </h3>
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                {(['ALL', 'open', 'in_review', 'resolved'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap transition-colors ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredIssues.map((iss) => {
                const active = selectedIssue?.id === iss.id;
                return (
                  <div
                    key={iss.id}
                    onClick={() => setSelectedIssueId(iss.id)}
                    className={`p-3.5 cursor-pointer transition-colors rounded-lg ${
                      active ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="font-mono text-slate-500">{iss.id}</span>
                        <span>{iss.title}</span>
                      </div>
                      <span
                        className={`font-semibold capitalize whitespace-nowrap ${
                          iss.status === 'resolved'
                            ? 'text-emerald-700'
                            : iss.status === 'in_review'
                            ? 'text-blue-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {iss.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{iss.description}</p>
                    <div className="text-[11px] text-slate-500 mt-1.5 tabular-nums">
                      {CATEGORY_LABELS[iss.category]} · {iss.slotId ? `Slot ${iss.slotId}` : iss.zoneId} · Severity:{' '}
                      <span className="capitalize font-medium">{iss.severity}</span> · Reported by{' '}
                      {iss.reportedBy}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Issue Audit History + Admin Action Panel */}
          {selectedIssue && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Issue {selectedIssue.id} — Status History &amp; Review</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedIssue.title}</p>
                </div>
                <span className="text-xs font-semibold capitalize text-slate-700">
                  Current: {selectedIssue.status.replace('_', ' ')}
                </span>
              </div>

              {/* Timestamped Status History */}
              <div className="space-y-2.5">
                {selectedIssue.history.map((h, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span className="capitalize">
                        {h.status.replace('_', ' ')} — {h.actorName} ({h.actorRole})
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                        {new Date(h.timestamp).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{h.note}</p>
                  </div>
                ))}
              </div>

              {/* Administrator Resolution Controls */}
              {isAdmin ? (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Administrator Review &amp; Resolution Controls</span>
                  </div>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add administrator review or resolution note..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  {selectedIssue.slotId && selectedIssue.status !== 'resolved' && (
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markMaintenance}
                        onChange={(e) => setMarkMaintenance(e.target.checked)}
                      />
                      <span>
                        Mark Slot <strong>{selectedIssue.slotId}</strong> as Temporarily Unavailable while under review
                      </span>
                    </label>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleAdminStatusUpdate('in_review')}
                      className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Mark In Review</span>
                    </button>
                    <button
                      onClick={() => handleAdminStatusUpdate('resolved')}
                      className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve Issue</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Only Campus Administrators can modify issue status or resolve incidents.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
