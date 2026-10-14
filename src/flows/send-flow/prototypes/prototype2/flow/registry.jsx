import RecipientStep from '../steps/RecipientStep';
import PayoutMethodStep from '../steps/PayoutMethodStep';
import PayoutDetailsStep from '../steps/PayoutDetailsStep';
import ReviewStep from '../steps/ReviewStep';
import SuccessStep from '../steps/SuccessStep';
import MethodPickerStep from '../steps/addRecipient/MethodPickerStep';
import PayoutMethodFormStep from '../steps/addRecipient/PayoutMethodFormStep';
import PersonalDetailsStep from '../steps/addRecipient/PersonalDetailsStep';
import RecipientSavedStep from '../steps/addRecipient/RecipientSavedStep';
import DestinationDetailsStep from '../steps/kyc/DestinationDetailsStep';
import ExternalPayoutStep from '../steps/external/ExternalPayoutStep';
import VerifyPayeeStep from '../steps/vop/VerifyPayeeStep';
import EmailComposeStep from '../steps/email/EmailComposeStep';
import EmailSentStep from '../steps/email/EmailSentStep';
import EmailPreviewPane from '../steps/email/EmailPreviewPane';

/**
 * stepId -> component. Kept separate from graph.js so the reducer can import the
 * graph without pulling components (and therefore the flow context) into a cycle.
 */
export const COMPONENTS = {
  recipient: RecipientStep,
  payoutMethod: PayoutMethodStep,
  payoutDetails: PayoutDetailsStep,
  review: ReviewStep,
  success: SuccessStep,
  'ar.method': MethodPickerStep,
  'ar.form': PayoutMethodFormStep,
  'ar.personal': PersonalDetailsStep,
  'ar.saved': RecipientSavedStep,
  // Two halves of an additional-details request, each on the step it belongs to.
  'kyc.destination': DestinationDetailsStep,
  // The same component as ar.personal: same fields, different entry point.
  'kyc.details': PersonalDetailsStep,
  'external.details': ExternalPayoutStep,
  // Review and the confirmation are the same screens as the main rail: a payout to your own
  // account is the same transaction, and both read entirely from the draft.
  'external.review': ReviewStep,
  'external.success': SuccessStep,
  'vop.verify': VerifyPayeeStep,
  'email.compose': EmailComposeStep,
  'email.sent': EmailSentStep,
};

/** Right-hand pane for `layout: 'split'` steps. */
export const ASIDES = {
  'email.compose': EmailPreviewPane,
};

export function asideFor(stepId) {
  return ASIDES[stepId] ?? null;
}

export function componentFor(stepId) {
  const C = COMPONENTS[stepId];
  if (!C) throw new Error(`No component registered for step: ${stepId}`);
  return C;
}
