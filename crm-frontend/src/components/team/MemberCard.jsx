import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, UserX, UserCheck, ArrowRightLeft, Pencil } from 'lucide-react';
import Card from '../ui/Card.jsx';
import TrustBadge from '../fraud/TrustBadge.jsx';
import OnlineDot from '../ui/OnlineDot.jsx';
import { usePresence } from '../../hooks/usePresence.js';

export default function MemberCard({
  member,
  role,
  teamLeads = [],
  onReassign,
  onDeactivate,
  onReactivate,
  onEdit,
}) {
  const navigate = useNavigate();
  const { isOnline } = usePresence();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  const isBde = role === 'BDE';
  const online = isOnline(member._id, member.isOnline);
  const isDeactivated = member.isActive === false;

  return (
    <Card className={`relative hover:shadow-md transition-shadow ${isDeactivated ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="cursor-pointer flex-1" onClick={() => navigate(`/team/${member._id}`)}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <OnlineDot online={isDeactivated ? false : online} />
            <p className="font-medium text-gray-800">{member.name}</p>
            {isDeactivated && (
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                Deactivated
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{role}</p>
          <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-lg shadow-lg z-10 w-48 py-1 text-sm">
              <button
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit?.(member);
                }}
              >
                <Pencil size={14} /> Edit Details
              </button>

              {isBde && !isDeactivated && (
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setReassignOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  <ArrowRightLeft size={14} /> Reassign Team Lead
                </button>
              )}

              {isDeactivated ? (
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-green-50 text-green-600 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onReactivate?.(member._id);
                  }}
                >
                  <UserCheck size={14} /> Reactivate
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    if (window.confirm(`Deactivate ${member.name}?`)) onDeactivate(member._id);
                  }}
                >
                  <UserX size={14} /> Deactivate
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        {member.trustScore != null ? <TrustBadge score={member.trustScore} /> : <span />}
        {isBde && (
          <span className="text-xs text-gray-400">
            {member.stats?.callsMade || 0} calls · {member.stats?.conversions || 0} conv.
          </span>
        )}
      </div>

      {reassignOpen && (
        <div className="mt-3 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
          <label className="text-xs font-medium text-gray-600">Move to Team Lead</label>
          <select
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full mt-1"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                onReassign(member._id, e.target.value);
                setReassignOpen(false);
              }
            }}
          >
            <option value="" disabled>
              Select Team Lead
            </option>
            {teamLeads
              .filter((tl) => tl._id !== member.reportsTo)
              .map((tl) => (
                <option key={tl._id} value={tl._id}>
                  {tl.name}
                </option>
              ))}
          </select>
        </div>
      )}
    </Card>
  );
}
