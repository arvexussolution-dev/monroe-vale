/* MONROE & VALE — media config
   The site loads clips from these URLs. If you download the MP4s
   and place them in ./assets with the names below, the local files
   are used instead (recommended for production). */
window.MV_MEDIA = {
  poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_180209_fbeaf2d4-5024-467b-b938-cd9fc1cba905.png',
  posterLocal: null, // 'assets/poster.png'
  /* Still frames shown while each clip's frame cache fills. */
  macroPoster:  'assets/watches/eclipse/2.jpg',
  enginePoster: 'assets/watches/eclipse/4.jpg',
  /* Collection card photos — drop files into assets/watches/ and
     set e.g. hudson: 'assets/watches/hudson.png'. Null = elegant
     built-in dial placeholder. Eclipse defaults to the hero poster. */
  watchImages: {
    eclipse: 'assets/watches/eclipse/1.jpg',
    hudson: 'assets/watches/hudson/1.jpg',
    manhattan: 'assets/watches/manhattan/1.jpg',
    pacific: 'assets/watches/pacific/1.jpg',
    aspen: 'assets/watches/aspen/1.jpg',
    liberty: 'assets/watches/liberty/1.jpg'
  },
  /* Detail-view galleries (thumbnail rail in the watch modal) */
  watchGalleries: {
    eclipse: ['assets/watches/eclipse/1.jpg','assets/watches/eclipse/2.jpg','assets/watches/eclipse/3.jpg','assets/watches/eclipse/4.jpg','assets/watches/eclipse/5.jpg'],
    hudson: ['assets/watches/hudson/1.jpg','assets/watches/hudson/2.jpg','assets/watches/hudson/3.jpg','assets/watches/hudson/4.jpg','assets/watches/hudson/5.jpg'],
    manhattan: ['assets/watches/manhattan/1.jpg','assets/watches/manhattan/2.jpg','assets/watches/manhattan/3.jpg','assets/watches/manhattan/4.jpg'],
    pacific: ['assets/watches/pacific/1.jpg','assets/watches/pacific/2.jpg','assets/watches/pacific/3.jpg','assets/watches/pacific/4.jpg','assets/watches/pacific/5.jpg'],
    aspen: ['assets/watches/aspen/1.jpg','assets/watches/aspen/2.jpg','assets/watches/aspen/3.jpg','assets/watches/aspen/4.jpg','assets/watches/aspen/5.jpg'],
    liberty: ['assets/watches/liberty/1.jpg','assets/watches/liberty/2.jpg','assets/watches/liberty/3.jpg','assets/watches/liberty/4.jpg','assets/watches/liberty/5.jpg']
  },
  orbit:  'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_174715_c484b7cc-6e6d-4a03-b351-978c7262d1cf.mp4',
  macro:  'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_174726_54dc411b-1ec3-44e4-b223-545907b5e893.mp4',
  engine: 'https://d8j0ntlcm91z4.cloudfront.net/user_3GDmPHEJHZ0gj0bKJ4YoVfVIUHU/hf_20260713_174925_14d7998c-b823-4ba3-bdd1-a493b04b0e2a.mp4',
  // Optional local overrides (leave null to use the URLs above):
  orbitLocal:  'assets/video/orbit.mp4', // auto-fallback to remote until uploaded
  macroLocal:  'assets/video/macro.mp4', // auto-fallback to remote until uploaded
  engineLocal: 'assets/video/engine.mp4' // auto-fallback to remote until uploaded
};
