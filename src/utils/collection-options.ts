import { Branch, CollectionMethod } from '../types';

export interface CollectionEvaluationInput {
  state?: string;
  city?: string;
  activeDispatchLoad?: number;
  branches: Branch[];
  shipmentCount?: number;
  totalEstimatedWeightKg?: number;
}

export interface CollectionOptionAvailability {
  method: CollectionMethod;
  available: boolean;
  label: string;
  feeNgn: number;
  estimatedWindow: string;
  badgeText?: string;
  unavailableReason?: string;
  fallbackSuggestion?: string;
}

export interface CollectionEvaluationResult {
  standardPickup: CollectionOptionAvailability;
  priorityPickup: CollectionOptionAvailability;
  dropoff: CollectionOptionAvailability & {
    branches: Branch[];
  };
}

const STANDARD_ELIGIBLE_STATES = ['lagos', 'abuja', 'fct', 'rivers'];
const PRIORITY_ELIGIBLE_STATES = ['lagos', 'abuja', 'fct'];

export function calculatePriorityPickupFee(params: {
  state?: string;
  city?: string;
  shipmentCount?: number;
  totalEstimatedWeightKg?: number;
}): number {
  const normalizedState = (params.state || '').trim().toLowerCase();
  const baseFee = normalizedState.includes('abuja') || normalizedState === 'fct' ? 4000 : 3500;
  const count = Math.max(1, params.shipmentCount || 1);
  const weight = Math.max(0.5, params.totalEstimatedWeightKg || 1);

  // Dynamic surcharge for extra stops/heavy volume (>10kg or multiple parcels)
  const extraPieceFee = count > 2 ? (count - 2) * 750 : 0;
  const weightSurcharge = weight > 15 ? 1500 : weight > 8 ? 750 : 0;

  return baseFee + extraPieceFee + weightSurcharge;
}

export function getActiveDropoffBranches(branches: Branch[]): Branch[] {
  return branches.filter((b) => b.status === 'active');
}

export function evaluateCollectionOptions(
  input: CollectionEvaluationInput
): CollectionEvaluationResult {
  const normalizedState = (input.state || 'Lagos').trim().toLowerCase();
  const normalizedCity = (input.city || '').trim().toLowerCase();
  const load = input.activeDispatchLoad ?? 2;
  const activeBranches = getActiveDropoffBranches(input.branches);

  const isStandardZone =
    STANDARD_ELIGIBLE_STATES.some((z) => normalizedState.includes(z) || normalizedCity.includes(z)) ||
    normalizedCity.includes('ikeja') ||
    normalizedCity.includes('lekki') ||
    normalizedCity.includes('victoria island') ||
    normalizedCity.includes('port harcourt');

  const isPriorityZone =
    PRIORITY_ELIGIBLE_STATES.some((z) => normalizedState.includes(z) || normalizedCity.includes(z)) ||
    normalizedCity.includes('ikeja') ||
    normalizedCity.includes('lekki') ||
    normalizedCity.includes('victoria island');

  const standardPickup: CollectionOptionAvailability = isStandardZone
    ? {
        method: 'standard_pickup',
        available: true,
        label: 'Standard Pickup',
        feeNgn: 0,
        estimatedWindow: 'Target collection within 24 hours after booking confirmation',
        badgeText: 'Free Collection',
      }
    : {
        method: 'standard_pickup',
        available: false,
        label: 'Standard Pickup',
        feeNgn: 0,
        estimatedWindow: 'Not active in this state',
        unavailableReason: `Doorstep pickup is currently active in Lagos, Abuja FCT, and Port Harcourt metro zones.`,
        fallbackSuggestion: 'Select Drop-off at a verified Swiftvero Hub or arrange regional linehaul.',
      };

  let priorityAvailable = true;
  let priorityReason: string | undefined;

  if (!isPriorityZone) {
    priorityAvailable = false;
    priorityReason = `Priority 1–6 hour pickup is not available in ${input.state || input.city || 'this area'}. Please select Standard Pickup or Branch Drop-off.`;
  } else if (load >= 8) {
    priorityAvailable = false;
    priorityReason =
      'All priority field couriers in your zone are currently committed for this window. Standard Pickup or Branch Drop-off remain available.';
  }

  const priorityFee = calculatePriorityPickupFee({
    state: input.state,
    city: input.city,
    shipmentCount: input.shipmentCount,
    totalEstimatedWeightKg: input.totalEstimatedWeightKg,
  });

  const priorityPickup: CollectionOptionAvailability = {
    method: 'priority_pickup',
    available: priorityAvailable,
    label: 'Priority Pickup',
    feeNgn: priorityAvailable ? priorityFee : 0,
    estimatedWindow: '1 – 6 hours (subject to location, demand & agent availability)',
    badgeText: priorityAvailable ? 'Expedited Dispatch' : 'Unavailable',
    unavailableReason: priorityReason,
    fallbackSuggestion: priorityAvailable
      ? undefined
      : 'Choose Standard Pickup (Free, 24h target) or Drop-off at an intake hub.',
  };

  const dropoff = {
    method: 'dropoff' as const,
    available: activeBranches.length > 0,
    label: 'Drop-off at Swiftvero Hub',
    feeNgn: 0,
    estimatedWindow: 'Instant intake verification during branch operating hours',
    badgeText: `${activeBranches.length} Active Locations`,
    branches: activeBranches,
    unavailableReason:
      activeBranches.length === 0 ? 'No active drop-off locations are currently open.' : undefined,
  };

  return {
    standardPickup,
    priorityPickup,
    dropoff,
  };
}

export function validatePickupEligibility(params: {
  state: string;
  city?: string;
  pickupType: 'standard' | 'priority' | 'dropoff';
  branches: Branch[];
  activeDispatchLoad?: number;
}): {
  serviceable: boolean;
  reason?: string;
  fallbackSuggestion?: string;
  priorityFeeNgn: number;
} {
  const evaluated = evaluateCollectionOptions({
    state: params.state,
    city: params.city,
    branches: params.branches,
    activeDispatchLoad: params.activeDispatchLoad,
  });

  if (params.pickupType === 'dropoff') {
    return {
      serviceable: evaluated.dropoff.available,
      reason: evaluated.dropoff.unavailableReason,
      priorityFeeNgn: 0,
    };
  }

  if (params.pickupType === 'priority') {
    return {
      serviceable: evaluated.priorityPickup.available,
      reason: evaluated.priorityPickup.unavailableReason,
      fallbackSuggestion: evaluated.priorityPickup.fallbackSuggestion,
      priorityFeeNgn: evaluated.priorityPickup.feeNgn,
    };
  }

  return {
    serviceable: evaluated.standardPickup.available,
    reason: evaluated.standardPickup.unavailableReason,
    fallbackSuggestion: evaluated.standardPickup.fallbackSuggestion,
    priorityFeeNgn: 0,
  };
}
