const LANDING_FLAG = 'suecao-return-landing';

export function exitAppToLanding(): void {
  sessionStorage.setItem(LANDING_FLAG, '1');
  const base = process.env.PUBLIC_URL || '/';
  const target = base.endsWith('/') ? base : `${base}/`;
  window.location.assign(target);
  window.location.reload();
}

export function consumeLandingReturnFlag(): boolean {
  const flag = sessionStorage.getItem(LANDING_FLAG);
  if (flag) {
    sessionStorage.removeItem(LANDING_FLAG);
    return true;
  }
  return false;
}
