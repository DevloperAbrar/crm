import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import TrustBadge from './TrustBadge.jsx';
import {
  RULES,
  describeFlag,
  flagTime,
  formatDateTime,
  groupImpact,
} from '../../lib/utils/fraudHelpers.js';

const SEVERITY_STYLES = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const MAX_SHOWN = 4;
const truncate = (s, n = 90) => (s.length > n ? `${s.slice(0, n)}...` : s);

export default function FraudFlagCard({ group, children }) {
  const { user, lead, rule, severity, flags } = group;
  const info = RULES[rule] || { label: rule.replace(/_/g, ' '), help: '' };
  const shown = flags.slice(0, MAX_SHOWN);
  const hidden = flags.length - shown.length;
  const reviewed = flags[0].status !== 'open' ? flags[0] : null;

  return (
    <Card className="mb-3">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm flex items-center gap-2 flex-wrap">
            {info.label}
            {flags.length > 1 && (
              <span className="text-xs font-semibold bg-brand-50 text-brand-500 rounded-full px-2 py-0.5">
                x{flags.length}
              </span>
            )}
          </p>
          {info.help && <p className="text-xs text-gray-500 mt-0.5">{info.help}</p>}
        </div>
        <span className={`text-[11px] font-semibold uppercase rounded-full px-2 py-0.5 ${SEVERITY_STYLES[severity]}`}>
          {severity}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3 text-xs text-gray-600">
        <span className="font-medium text-gray-800">{user?.name || 'Unknown user'}</span>
        <span className="capitalize text-gray-400">({user?.role?.replace('_', ' ')})</span>
        {user && <TrustBadge score={user.trustScore} />}
        {lead && (
          <>
            <span className="text-gray-300">|</span>
            <Link to={`/leads/${lead._id}`} className="text-accent-600 hover:underline">
              {lead.businessName}
            </Link>
          </>
        )}
      </div>

      <ul className="mt-3 divide-y divide-gray-100 border border-gray-100 rounded-lg text-xs">
        {shown.map((f) => (
          <li key={f._id} className="px-3 py-2">
            <div className="flex justify-between gap-3">
              <span className="font-medium text-gray-700">{describeFlag(f)}</span>
              <span className="text-gray-400 whitespace-nowrap">{formatDateTime(flagTime(f))}</span>
            </div>
            {f.interactionId && (
              <p className="text-gray-500 mt-0.5">
                <span className="capitalize">{f.interactionId.type}</span> · {f.interactionId.outcome}
                {f.interactionId.notes ? ` - "${truncate(f.interactionId.notes)}"` : ''}
              </p>
            )}
          </li>
        ))}
        {hidden > 0 && <li className="px-3 py-2 text-gray-400">+ {hidden} earlier occurrence(s)</li>}
      </ul>

      {reviewed ? (
        <p className="text-xs text-gray-500 mt-3">
          Reviewed by <strong>{reviewed.reviewedBy?.name || 'a manager'}</strong>
          {reviewed.reviewedAt ? ` on ${formatDateTime(reviewed.reviewedAt)}` : ''}
          {reviewed.reviewNotes ? ` - "${reviewed.reviewNotes}"` : ''}
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-3">
          If confirmed fraudulent, trust score drops by {groupImpact(group)} point(s).
        </p>
      )}

      {children}
    </Card>
  );
}