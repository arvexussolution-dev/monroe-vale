/* MONROE & VALE — media config
   The site loads clips from these URLs. If you download the MP4s
   and place them in ./assets with the names below, the local files
   are used instead (recommended for production). */
window.MV_MEDIA = {
  poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_180209_fbeaf2d4-5024-467b-b938-cd9fc1cba905.png',
  posterLocal: null, // 'assets/poster.png'
  /* Collection card photos — drop files into assets/watches/ and
     set e.g. hudson: 'assets/watches/hudson.png'. Null = elegant
     built-in dial placeholder. Eclipse defaults to the hero poster. */
  watchImages: {
    eclipse: null,
    hudson: null,
    manhattan: null,
    pacific: null,
    aspen: null,
    liberty: null
  },
  orbit:  'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_174715_c484b7cc-6e6d-4a03-b351-978c7262d1cf.mp4',
  macro:  'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_174726_54dc411b-1ec3-44e4-b223-545907b5e893.mp4',
  engine: 'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_174925_14d7998c-b823-4ba3-bdd1-a493b04b0e2a.mp4',
  // Optional local overrides (leave null to use the URLs above):
  orbitLocal:  null, // 'assets/orbit.mp4'
  macroLocal:  null, // 'assets/macro.mp4'
  engineLocal: null  // 'assets/engine.mp4'
};
