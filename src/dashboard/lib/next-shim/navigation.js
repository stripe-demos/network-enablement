import { dashboardPath } from '../dashboardRouting';
// Shim for `next/navigation` so dashboard components (ported verbatim from the
// Next.js app) run unchanged inside this Vite + react-router prototype.
import {
  useNavigate,
  useLocation,
  useParams as rrUseParams,
  useSearchParams as rrUseSearchParams,
} from 'react-router-dom';
import { frameSafePath } from '../../prototype/prototypeFrameRouting';

export function usePathname() {
  return useLocation().pathname;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (to) => navigate(to),
    replace: (to) => navigate(to, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {},
    prefetch: () => {},
  };
}

export function useParams() {
  return rrUseParams();
}

export function useSearchParams() {
  const [searchParams] = rrUseSearchParams();
  return searchParams;
}

export function redirect(to) {
  if (typeof window !== 'undefined') window.location.assign(dashboardPath(frameSafePath(to)));
}
