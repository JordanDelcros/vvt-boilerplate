#if defined(USE_BLUR) || defined(USE_SSAO)
#include "../chunks/blue-noise.glsl";
#endif

#ifdef USE_BLUR
#include "../chunks/blur-map.glsl";
#endif

#ifdef USE_SSAO
#include "../chunks/ssao.glsl";
#endif