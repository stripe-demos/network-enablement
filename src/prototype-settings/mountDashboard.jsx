import { mountPrototypeSettings } from './mount';
import { DASHBOARD_PROTOTYPE_SETTINGS } from '../dashboard/prototype/prototypeSettingsConfig';

// Mounted from dashboard/index.html so Dashboard's own entry keeps importing
// only Dashboard code. Specific to this repo; not needed when copying the tool.
mountPrototypeSettings(DASHBOARD_PROTOTYPE_SETTINGS);
