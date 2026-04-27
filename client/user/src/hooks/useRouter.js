import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  return useMemo(() => ({
    push: (path, options) => navigate(path, options),
    replace: (path, options) => navigate(path, { ...options, replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    pathname: location.pathname,
    query: Object.fromEntries(searchParams.entries()),
    params,
  }), [navigate, location, params, searchParams]);
}
