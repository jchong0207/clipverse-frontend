// Sample illustrations shown inside the KYC upload tiles so users can see what
// each shot should look like before they pick a file. Drawn as inline SVG so they
// scale crisply and need no image assets.

// ID card, photo side: portrait box on the left + text lines on the right.
export function DocFrontSample() {
  return (
    <svg viewBox="0 0 100 72" className="kf-sample-svg" aria-hidden="true">
      <rect x="3" y="3" width="94" height="66" rx="7" fill="#fff" stroke="#c4ccda" strokeWidth="2" />
      <rect x="11" y="20" width="26" height="33" rx="4" fill="#dfe4ee" />
      <circle cx="24" cy="31" r="7" fill="#aab2c2" />
      <path d="M14 52c1.5-7 19-7 20.5 0z" fill="#aab2c2" />
      <rect x="46" y="20" width="40" height="5" rx="2.5" fill="#cdd4e0" />
      <rect x="46" y="32" width="44" height="5" rx="2.5" fill="#dde2ec" />
      <rect x="46" y="44" width="30" height="5" rx="2.5" fill="#dde2ec" />
    </svg>
  )
}

// ID card, back side: magnetic strip near the top + text lines.
export function DocBackSample() {
  return (
    <svg viewBox="0 0 100 72" className="kf-sample-svg" aria-hidden="true">
      <rect x="3" y="3" width="94" height="66" rx="7" fill="#fff" stroke="#c4ccda" strokeWidth="2" />
      <rect x="3" y="14" width="94" height="13" fill="#9aa2b2" />
      <rect x="13" y="38" width="56" height="5" rx="2.5" fill="#cdd4e0" />
      <rect x="13" y="49" width="72" height="5" rx="2.5" fill="#dde2ec" />
      <rect x="74" y="36" width="13" height="13" rx="2" fill="#dfe4ee" />
    </svg>
  )
}

// A person holding their ID card up next to their face.
export function DocHandheldSample() {
  return (
    <svg viewBox="0 0 100 72" className="kf-sample-svg" aria-hidden="true">
      <circle cx="34" cy="22" r="12" fill="#aab2c2" />
      <path d="M14 70c0-13 9-21 20-21s20 8 20 21z" fill="#aab2c2" />
      <rect x="58" y="30" width="34" height="24" rx="4" fill="#fff" stroke="#c4ccda" strokeWidth="2" />
      <rect x="63" y="36" width="11" height="13" rx="2" fill="#dfe4ee" />
      <rect x="78" y="37" width="10" height="3.5" rx="1.75" fill="#cdd4e0" />
      <rect x="78" y="45" width="10" height="3.5" rx="1.75" fill="#dde2ec" />
    </svg>
  )
}

export const DOC_SAMPLES = {
  front: DocFrontSample,
  back: DocBackSample,
  handheld: DocHandheldSample,
}
