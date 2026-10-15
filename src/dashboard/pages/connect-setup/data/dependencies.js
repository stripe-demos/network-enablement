// Cross-setting dependencies in Review setup: some combinations can't coexist,
// so changing one setting automatically corrects the other and the affected
// section header warns first.
//
// Scenario 1 — Funds flow → Negative balance liability:
// Destination charges and Separate charges and transfers both make the platform
// the merchant of record, so the platform must own negative balance liability.
// Selecting either while liability is "Stripe" flips it to "Your platform".

/**
 * Apply `settingId = value` to `config` plus any forced cascades.
 *
 * `autoLiability` carries the liability value we previously overrode (or null),
 * so the auto-edit can be undone: switching to destination/separate flips a
 * Stripe liability to platform and remembers "stripe"; switching back to direct
 * restores it. A deliberate liability change clears that memory so we never
 * clobber a choice the user made themselves.
 *
 * Returns `{ config, autoLiability }`.
 */
export function applyDependencies(config, settingId, value, autoLiability = null) {
  const next = { ...config, [settingId]: value };
  let nextAuto = autoLiability;

  if (settingId === 'chargeType') {
    if (
      (value === 'destination' || value === 'separate') &&
      next.negativeBalanceLiability === 'stripe'
    ) {
      nextAuto = next.negativeBalanceLiability; // remember what we overrode
      next.negativeBalanceLiability = 'platform';
    } else if (value === 'direct' && autoLiability != null) {
      next.negativeBalanceLiability = autoLiability; // undo the auto-edit
      nextAuto = null;
    }
  } else if (settingId === 'negativeBalanceLiability') {
    nextAuto = null; // a deliberate choice — forget the auto-override
  }

  return { config: next, autoLiability: nextAuto };
}

/**
 * Whether the current selection for `settingId` cascades into another setting —
 * drives the "Editing will change settings below" header warning while that
 * setting is being edited. It reflects the chosen value, so the warning appears
 * only once the user moves off the non-cascading default (e.g. direct charges),
 * not while that default is selected.
 */
export function willCascade(settingId, config) {
  if (settingId === 'chargeType') {
    // Destination / separate charges are what force liability onto the platform.
    return config.chargeType === 'destination' || config.chargeType === 'separate';
  }
  return false;
}

// Why the "Stripe" liability option is unavailable — shown as a tooltip on the
// disabled option in both the inline and stepped editors.
export const LIABILITY_DISABLED_REASON =
  'Not supported with destination or separate charges';

/**
 * Negative-balance-liability option values that can't be chosen under the
 * current config. With destination/separate charges the platform is the
 * merchant of record, so "Stripe" is unavailable.
 */
export function disabledLiabilityValues(config) {
  if (config.chargeType === 'destination' || config.chargeType === 'separate') {
    return ['stripe'];
  }
  return [];
}
