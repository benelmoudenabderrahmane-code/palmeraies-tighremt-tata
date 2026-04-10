'use client';
import { useRef, useEffect, useState } from 'react';
import { Renderer, Program, Triangle, Mesh } from 'ogl';
import './LightRays.css';

const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left':     return { anchor: [0, -outside * h],           dir: [0, 1]  };
    case 'top-right':    return { anchor: [w, -outside * h],           dir: [0, 1]  };
    case 'left':         return { anchor: [-outside * w, 0.5 * h],     dir: [1, 0]  };
    case 'right':        return { anchor: [(1 + outside) * w, 0.5 * h],dir: [-1, 0] };
    case 'bottom-left':  return { anchor: [0, (1 + outside) * h],      dir: [0, -1] };
    case 'bottom-center':return { anchor: [0.5 * w, (1 + outside) * h],dir: [0, -1] };
    case 'bottom-right': return { anchor: [w, (1 + outside) * h],      dir: [0, -1] };
    default:             return { anchor: [0.5 * w, -outside * h],     dir: [0, 1]  };
  }
};

const LightRays = ({
  raysOrigin     = 'top-center',
  raysColor      = '#ffffff',
  raysSpeed      = 1,
  lightSpread    = 1,
  rayLength      = 2,
  pulsating      = false,
  fadeDistance   = 1.0,
  saturation     = 1.0,
  followMouse    = true,
  mouseInfluence = 0.1,
  noiseAmount    = 0.0,
  distortion     = 0.0,
  className      = '',
}) => {
  const containerRef    = useRef(null);
  const uniformsRef     = useRef(null);
  const rendererRef     = useRef(null);
  const mouseRef        = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef  = useRef({ x: 0.5, y: 0.5 });
  const animationIdRef  = useRef(null);
  const meshRef         = useRef(null);
  const cleanupRef      = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  /* ── Visibility observer ── */
  useEffect(() => {
    if (!containerRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { threshold: 0.1 }
    );
    io.observe(containerRef.current);
    return () => io.disconnect();
  }, []);

  /* ── WebGL init ── */
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }

    let cancelled = false;

    const init = async () => {
      await new Promise(r => setTimeout(r, 10));
      if (cancelled || !containerRef.current) return;

      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
      rendererRef.current = renderer;
      const gl = renderer.gl;
      gl.canvas.style.width  = '100%';
      gl.canvas.style.height = '100%';
      while (containerRef.current.firstChild) containerRef.current.removeChild(containerRef.current.firstChild);
      containerRef.current.appendChild(gl.canvas);

      const vert = `attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;

      const frag = `precision highp float;
uniform float iTime;uniform vec2 iResolution;
uniform vec2 rayPos;uniform vec2 rayDir;uniform vec3 raysColor;
uniform float raysSpeed;uniform float lightSpread;uniform float rayLength;
uniform float pulsating;uniform float fadeDistance;uniform float saturation;
uniform vec2 mousePos;uniform float mouseInfluence;uniform float noiseAmount;uniform float distortion;
varying vec2 vUv;
float noise(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
float rayStrength(vec2 raySource,vec2 rayRefDirection,vec2 coord,float seedA,float seedB,float speed){
  vec2 s2c=coord-raySource;vec2 dn=normalize(s2c);float ca=dot(dn,rayRefDirection);
  float da=ca+distortion*sin(iTime*2.0+length(s2c)*0.01)*0.2;
  float sf=pow(max(da,0.0),1.0/max(lightSpread,0.001));
  float dist=length(s2c);float maxD=iResolution.x*rayLength;
  float lf=clamp((maxD-dist)/maxD,0.0,1.0);
  float ff=clamp((iResolution.x*fadeDistance-dist)/(iResolution.x*fadeDistance),0.5,1.0);
  float pulse=pulsating>0.5?(0.8+0.2*sin(iTime*speed*3.0)):1.0;
  float base=clamp((0.45+0.15*sin(da*seedA+iTime*speed))+(0.3+0.2*cos(-da*seedB+iTime*speed)),0.0,1.0);
  return base*lf*ff*sf*pulse;}
void mainImage(out vec4 fragColor,in vec2 fragCoord){
  vec2 coord=vec2(fragCoord.x,iResolution.y-fragCoord.y);
  vec2 frd=rayDir;
  if(mouseInfluence>0.0){vec2 mp=mousePos*iResolution.xy;frd=normalize(mix(rayDir,normalize(mp-rayPos),mouseInfluence));}
  vec4 r1=vec4(1.0)*rayStrength(rayPos,frd,coord,36.2214,21.11349,1.5*raysSpeed);
  vec4 r2=vec4(1.0)*rayStrength(rayPos,frd,coord,22.3991,18.0234,1.1*raysSpeed);
  fragColor=r1*0.5+r2*0.4;
  if(noiseAmount>0.0){float n=noise(coord*0.01+iTime*0.1);fragColor.rgb*=(1.0-noiseAmount+noiseAmount*n);}
  float brightness=1.0-(coord.y/iResolution.y);
  fragColor.x*=0.1+brightness*0.8;fragColor.y*=0.3+brightness*0.6;fragColor.z*=0.5+brightness*0.5;
  if(saturation!=1.0){float g=dot(fragColor.rgb,vec3(0.299,0.587,0.114));fragColor.rgb=mix(vec3(g),fragColor.rgb,saturation);}
  fragColor.rgb*=raysColor;}
void main(){vec4 c;mainImage(c,gl_FragCoord.xy);gl_FragColor=c;}`;

      const uniforms = {
        iTime:          { value: 0 },
        iResolution:    { value: [1, 1] },
        rayPos:         { value: [0, 0] },
        rayDir:         { value: [0, 1] },
        raysColor:      { value: hexToRgb(raysColor) },
        raysSpeed:      { value: raysSpeed },
        lightSpread:    { value: lightSpread },
        rayLength:      { value: rayLength },
        pulsating:      { value: pulsating ? 1.0 : 0.0 },
        fadeDistance:   { value: fadeDistance },
        saturation:     { value: saturation },
        mousePos:       { value: [0.5, 0.5] },
        mouseInfluence: { value: mouseInfluence },
        noiseAmount:    { value: noiseAmount },
        distortion:     { value: distortion },
      };
      uniformsRef.current = uniforms;

      const geometry = new Triangle(gl);
      const program  = new Program(gl, { vertex: vert, fragment: frag, uniforms });
      const mesh     = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      const updateSize = () => {
        if (!containerRef.current || !renderer) return;
        renderer.dpr = Math.min(window.devicePixelRatio, 2);
        const { clientWidth: wCSS, clientHeight: hCSS } = containerRef.current;
        renderer.setSize(wCSS, hCSS);
        const dpr = renderer.dpr;
        const w = wCSS * dpr, h = hCSS * dpr;
        uniforms.iResolution.value = [w, h];
        const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
        uniforms.rayPos.value = anchor;
        uniforms.rayDir.value = dir;
      };

      const loop = t => {
        if (!rendererRef.current || !uniformsRef.current || !meshRef.current) return;
        uniforms.iTime.value = t * 0.001;
        if (followMouse && mouseInfluence > 0) {
          const s = 0.92;
          smoothMouseRef.current.x = smoothMouseRef.current.x * s + mouseRef.current.x * (1 - s);
          smoothMouseRef.current.y = smoothMouseRef.current.y * s + mouseRef.current.y * (1 - s);
          uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
        }
        try {
          renderer.render({ scene: mesh });
          animationIdRef.current = requestAnimationFrame(loop);
        } catch { /* ignore */ }
      };

      window.addEventListener('resize', updateSize);
      updateSize();
      animationIdRef.current = requestAnimationFrame(loop);

      cleanupRef.current = () => {
        cancelled = true;
        if (animationIdRef.current) { cancelAnimationFrame(animationIdRef.current); animationIdRef.current = null; }
        window.removeEventListener('resize', updateSize);
        try {
          const canvas = renderer.gl.canvas;
          renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
          canvas?.parentNode?.removeChild(canvas);
        } catch { /* ignore */ }
        rendererRef.current = null; uniformsRef.current = null; meshRef.current = null;
      };
    };

    init();
    return () => { cancelled = true; if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; } };
  }, [isVisible, raysOrigin, raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, followMouse, mouseInfluence, noiseAmount, distortion]);

  /* ── Mouse tracking ── */
  useEffect(() => {
    if (!followMouse) return;
    const onMove = e => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [followMouse]);

  return <div ref={containerRef} className={`light-rays-container ${className}`.trim()} />;
};

export default LightRays;
