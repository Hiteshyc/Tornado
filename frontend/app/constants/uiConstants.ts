import { OperationStatus, TeamStatus } from '../types'

export const OPERATION_STATUSES: OperationStatus[] = [
  'pending', 'assigned', 'en-route', 'travelling', 'reached', 'rescue-ongoing', 'returning', 'completed', 'failed',
]

export const STATUS_LABEL: Record<OperationStatus, string> = {
  'pending':        'Pending',
  'assigned':       'Assigned',
  'en-route':       'En Route',
  'travelling':     'Travelling',
  'reached':        'Reached',
  'rescue-ongoing': 'Rescue Ongoing',
  'returning':      'Returning',
  'completed':      'Completed',
  'failed':         'Failed',
}

export const STATUS_COLOR: Record<OperationStatus, string> = {
  'pending':        '#6b7280',
  'assigned':       '#6b93bb',
  'en-route':       '#ca8a04',
  'travelling':     '#ca8a04',
  'reached':        '#ca8a04',
  'rescue-ongoing': '#dc2626',
  'returning':      '#16a34a',
  'completed':      '#16a34a',
  'failed':         '#991b1b',
}

export const TEAM_STATUS_COLOR: Record<TeamStatus, string> = {
  'available':  '#16a34a',
  'on-mission': '#dc2626',
  'travelling': '#ca8a04',
  'offline':    '#6b7280',
}

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  'available':  'Available',
  'on-mission': 'On Mission',
  'travelling': 'Travelling',
  'offline':    'Offline',
}
