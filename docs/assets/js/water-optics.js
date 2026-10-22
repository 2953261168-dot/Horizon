/* Original height-field renderer. Optical approach inspired by Lucas Bebber's
 * Rain & Water Effects (Codrops): a fluid map, its normals, and background refraction.
 * No fixed teardrop silhouette, drop sprite, external runtime or remote texture. */
(() => {
  'use strict';
  class WaterOptics {
    constructor(host, image) {
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'liquid-optics';
      this.canvas.setAttribute('aria-hidden', 'true');
      host.append(this.canvas);
      this.map = document.createElement('canvas');
      this.ctx = this.map.getContext('2d');
      this.image = image;
      const gl = this.gl = this.canvas.getContext('webgl', {alpha:true, antialias:false, depth:false, premultipliedAlpha:false, powerPreference:'low-power'});
      if (!gl) { this.canvas.dataset.state='static-fallback'; return; }
      try {
        const vertex = 'attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
        const fragment = `precision mediump float;
          varying vec2 uv;
          uniform sampler2D water, engraving;
          uniform vec2 screen, pixel;
          uniform vec4 imageRect;
          uniform vec3 paper;
          uniform float imageAlpha;
          vec3 scene(vec2 p){
            vec2 q=(p-imageRect.xy)/max(imageRect.zw,vec2(1.));
            if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)return paper;
            float edge=1.-smoothstep(.35,.79,length((q-.5)/vec2(.68,.67)));
            vec3 ink=texture2D(engraving,vec2(q.x,1.-q.y)).rgb;
            float grey=dot(ink,vec3(.299,.587,.114));
            return paper*mix(1.,grey,imageAlpha*edge*.85);
          }
          void main(){
            float h=texture2D(water,uv).a;
            if(h<.12)discard;
            float l=texture2D(water,uv-vec2(pixel.x,0.)).a;
            float r=texture2D(water,uv+vec2(pixel.x,0.)).a;
            float d=texture2D(water,uv-vec2(0.,pixel.y)).a;
            float u=texture2D(water,uv+vec2(0.,pixel.y)).a;
            vec3 n=normalize(vec3((l-r)*8.,(d-u)*8.,.55));
            vec2 p=vec2(uv.x,1.-uv.y)*screen;
            vec3 refracted=scene(p+vec2(n.x,-n.y)*(9.+h*13.));
            vec3 light=normalize(vec3(-.45,.7,.65));
            float glint=pow(max(0.,dot(reflect(-light,n),vec3(0.,0.,1.))),22.);
            float soft=pow(max(0.,dot(n,light)),8.);
            float rim=pow(1.-max(n.z,0.),2.);
            vec3 colour=refracted*(.97-rim*.24)+vec3(.99,.97,.88)*(glint*.90+soft*.20);
            float alpha=smoothstep(.12,.28,h)*(.62+rim*.29+glint*.32);
            gl_FragColor=vec4(colour,alpha);
          }`;
        const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
        const program=this.program=gl.createProgram();
        gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
        gl.useProgram(program);
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
        const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
        this.uniform={};['water','engraving','screen','pixel','imageRect','paper','imageAlpha'].forEach(key=>this.uniform[key]=gl.getUniformLocation(program,key));
        this.waterTexture=this.texture();this.imageTexture=this.texture();
        gl.uniform1i(this.uniform.water,0);gl.uniform1i(this.uniform.engraving,1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
        const upload=()=>{if(!image.complete||!image.naturalWidth)return;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.imageTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);};
        image.addEventListener('load',upload,{once:true});upload();
        this.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.ready=false;this.canvas.dataset.state='static-fallback';});
        this.ready=true;this.resize();this.canvas.dataset.state='optical';
      } catch(error) {this.canvas.dataset.state='static-fallback';console.warn('Water optics unavailable; retaining the printed illustration.',error);}
    }
    texture(){const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));return t;}
    resize(){if(!this.ready)return;const bounds=this.canvas.getBoundingClientRect();this.width=bounds.width;this.height=bounds.height;this.scale=Math.min(1.25,devicePixelRatio||1,Math.sqrt(1000000/(this.width*this.height)));this.canvas.width=this.map.width=Math.round(this.width*this.scale);this.canvas.height=this.map.height=Math.round(this.height*this.scale);this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
    render(drops,traces,rect,alpha){
      if(!this.ready)return;
      const c=this.ctx,s=this.scale,gl=this.gl;
      const hasVisible=drops.some(p=>p.y-scrollY>-30&&p.y-scrollY<this.height+30)||traces.some(t=>t.y-scrollY>0&&t.y-scrollY<this.height);
      this.canvas.style.visibility=hasVisible?'visible':'hidden';if(!hasVisible)return;
      c.clearRect(0,0,this.map.width,this.map.height);c.save();c.scale(s,s);c.globalCompositeOperation='lighter';
      const bead=(x,y,rx,ry,strength)=>{
        if(y< -ry*2||y>innerHeight+ry*2)return;
        c.save();c.translate(x,y);c.scale(rx,ry);
        const g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(255,255,255,${strength})`);g.addColorStop(.42,`rgba(255,255,255,${strength*.8})`);g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();
      };
      const floor=alpha>.7&&rect.top+rect.height>0?rect.top+rect.height*(268/561)-3:-Infinity;
      const visibleDrops=drops.filter(p=>p.y-scrollY>=floor);
      const visibleTraces=traces.filter(t=>t.y-scrollY>=floor);
      const paths=new Map();visibleTraces.forEach(t=>{if(!paths.has(t.id))paths.set(t.id,[]);paths.get(t.id).push(t);});
      paths.forEach(points=>{if(points.length<2)return;
        for(let i=1;i<points.length;i++){
          const a=points[i-1],b=points[i],fresh=Math.max(0,1-(a.age+b.age)/10);
          c.beginPath();c.moveTo(a.x,a.y-scrollY);c.lineTo(b.x,b.y-scrollY);
          c.strokeStyle=`rgba(255,255,255,${.07+.19*fresh})`;c.lineWidth=.8+Math.sin(i*.15)*.18;
          c.lineCap='round';c.shadowColor=`rgba(255,255,255,${.15*fresh})`;c.shadowBlur=1.8;c.stroke();
        }c.shadowBlur=0;
      });
      visibleTraces.forEach(t=>bead(t.x,t.y-scrollY,t.r*.55,t.r*1.5,t.opacity*.75));
      visibleDrops.forEach(p=>{bead(p.x,p.y-scrollY,p.r*p.wide,p.r*p.long,p.onFace?.65:.95);});
      c.restore();
      gl.useProgram(this.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.waterTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,this.map);
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.imageTexture);
      gl.uniform2f(this.uniform.screen,this.width,this.height);gl.uniform2f(this.uniform.pixel,1/this.map.width,1/this.map.height);gl.uniform4f(this.uniform.imageRect,rect.left,rect.top,rect.width,rect.height);gl.uniform1f(this.uniform.imageAlpha,alpha);
      gl.uniform3f(this.uniform.paper,.91,.91,.85);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);
      this.canvas.dataset.drops=String(drops.length);this.canvas.dataset.visible=String(visibleDrops.filter(p=>p.y-scrollY<this.height).length);this.canvas.dataset.lowestAllowedY=String(floor);this.canvas.dataset.firstY=(drops[0]?.y-scrollY).toFixed(1);this.canvas.dataset.drawnAt=performance.now().toFixed(0);
    }
  }
  window.HorizonWaterOptics=WaterOptics;
})();
