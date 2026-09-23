import React from 'react';
import MemberCard from './MemberCard.jsx';

export default function TeamTree({
  teamLeads = [],
  unassignedBdes = [],
  onReassign,
  onDeactivate,
  onReactivate,
  onEdit,
}) {
  const allTeamLeads = teamLeads;

  return (
    <div className="flex flex-col gap-8">
      {teamLeads.length === 0 && unassignedBdes.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No team members yet.</p>
          <p className="text-xs mt-1">Use "Add Team Lead" or "Add BDE" above to build out your team.</p>
        </div>
      )}

      {teamLeads.map((tl) => (
        <div key={tl._id}>
          <MemberCard
            member={tl}
            role="Team Lead"
            onDeactivate={onDeactivate}
            onReactivate={onReactivate}
            onEdit={onEdit}
          />
          <div className="ml-8 mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(tl.bdes || []).length === 0 && (
              <p className="text-xs text-gray-400 col-span-full">No BDEs assigned to this Team Lead yet.</p>
            )}
            {(tl.bdes || []).map((bde) => (
              <MemberCard
                key={bde._id}
                member={bde}
                role="BDE"
                teamLeads={allTeamLeads}
                onReassign={onReassign}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}

      {unassignedBdes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-3">Unassigned BDEs</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unassignedBdes.map((bde) => (
              <MemberCard
                key={bde._id}
                member={bde}
                role="BDE"
                teamLeads={allTeamLeads}
                onReassign={onReassign}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
