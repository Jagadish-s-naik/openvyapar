import type { TimelineEvent } from '@openvyapar/shared';
import { db } from '../db/connection.js';

export async function buildBusinessTimeline(
  businessId: string,
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<TimelineEvent[]> {
  const auditLogs = await db.getAuditLogsForBusiness(businessId);
  const agentActions = await db.getAgentActionsForBusiness(businessId);

  const events: TimelineEvent[] = [];

  // 1. Process Audit Logs
  for (const log of auditLogs) {
    const person = await db.getPerson(log.actor_id);
    const actorName = person ? person.name : log.actor_id;

    let category: TimelineEvent['category'] = 'governance';
    let title = log.action;
    let description = '';
    let icon = 'activity';

    if (log.action === 'create_business') {
      category = 'identity';
      title = 'Business Identity Created (DID Minted)';
      description = `Business registered with DID ${businessId} and initial owner role assigned.`;
      icon = 'building';
    } else if (log.action === 'transfer_ownership') {
      category = 'governance';
      title = 'Ownership Succession Transfer';
      description = `Business ownership successfully transferred to successor.`;
      icon = 'users';
    } else if (log.action.startsWith('grant_role')) {
      category = 'governance';
      title = 'Business Role Granted';
      description = `Role assigned to ${actorName}.`;
      icon = 'user-check';
    } else if (log.action === 'issue_credential') {
      category = 'credential';
      const credType = (log.metadata?.type as string) || 'institutional';
      title = `HMAC Signed Credential Issued (${credType})`;
      description = `Authentic verifiable credential issued by ${log.metadata?.issuer || log.actor_id}.`;
      icon = 'award';
    } else if (log.action === 'grant_delegation') {
      category = 'delegation';
      const scopes = Array.isArray(log.metadata?.scopes)
        ? log.metadata.scopes.join(', ')
        : 'scoped';
      title = 'Scoped Delegation Token Issued';
      description = `Authorized delegation token granted with scopes: [${scopes}].`;
      icon = 'key';
    } else if (log.action === 'revoke_delegation') {
      category = 'delegation';
      title = 'Delegation Token Revoked';
      description = `Active delegation token ${log.metadata?.token_id || ''} was revoked immediately.`;
      icon = 'slash';
    } else if (log.action === 'generate_proof') {
      category = 'proof';
      const purpose = (log.metadata?.purpose as string) || 'selective_disclosure';
      title = `Selective-Disclosure Proof Generated (${purpose})`;
      description = `Cryptographic proof generated for ${log.metadata?.shared_with || 'verifier'}.`;
      icon = 'share-2';
    } else {
      description = `Action ${log.action} confirmed by ${actorName}.`;
    }

    events.push({
      event_id: log.log_id,
      business_id: log.business_id,
      event_type: 'audit_log',
      category,
      title,
      description,
      actor: {
        id: log.actor_id,
        type: log.actor_type,
        name: actorName,
        role: log.actor_role || (log.actor_type === 'owner' ? 'Business Owner' : log.actor_type === 'delegate' ? 'Authorized Delegate / CA' : undefined),
      },
      confirmed_by_human: log.confirmed_by_human,
      timestamp: log.timestamp,
      ip_address: log.ip_address,
      origin: log.origin,
      diff: log.diff,
      details: log.metadata,
      icon,
    });
  }

  // 2. Process Agent Actions
  for (const action of agentActions) {
    let category: TimelineEvent['category'] = 'agent';
    let title = `AI Agent Proposal (${action.agent_type})`;
    let description = action.input_summary;
    let icon = 'sparkles';

    if (action.agent_type === 'onboarding') {
      title = 'AI Conversational Onboarding Proposal';
      icon = 'sparkles';
    } else if (action.agent_type === 'consent_explainer') {
      title = 'AI Consent & Risk Explanation';
      icon = 'shield-alert';
    } else if (action.agent_type === 'delegation_scoping') {
      title = 'Least-Privilege Scoping Recommendation';
      icon = 'lock';
    } else if (action.agent_type === 'verifier_trust') {
      title = 'AI Verifier Trust Assessment';
      icon = 'check-circle';
    }

    events.push({
      event_id: action.agent_action_id,
      business_id: action.business_id,
      event_type: 'agent_proposal',
      category,
      title,
      description,
      actor: {
        id: `agent:${action.agent_type}`,
        type: 'agent',
        name: `OpenVyapar ${action.agent_type.replace('_', ' ').toUpperCase()} Agent`,
        role: 'AI Co-pilot',
      },
      human_decision: action.human_decision,
      confirmed_by_human: action.human_decision === 'confirmed',
      timestamp: action.decided_at || action.created_at,
      details: {
        proposed_action: action.proposed_action,
        target_action_ref: action.target_action_ref,
        created_at: action.created_at,
        decided_at: action.decided_at,
      },
      icon,
    });
  }

  // Sort events by timestamp
  return events.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });
}
