// The free funnel stores its first creator under ht_creator_v2.
// Service requests share a reference with Checkout and the booking message.
function newServiceReference() {
  const cookie = name => {
    try {
      return document.cookie.split('; ').find(part => part.startsWith(name + '='))?.slice(name.length + 1);
    } catch { return null; }
  };
  let saved;
  try { saved = localStorage.getItem('ht_creator_v2'); } catch {}
  saved ||= cookie('ht_creator_v2');
  const [oldCode, expires] = (cookie('ht_creator') || '').split('.');
  const creator = saved || (Number(expires) > Date.now() && oldCode) || new URLSearchParams(location.search).get('ref');
  const source = creator && creator !== 'off' && /^[A-Za-z0-9_-]{1,32}$/.test(creator) ? creator : 'DIRECT';
  return 'HTS-' + source + '-' + crypto.randomUUID();
}
