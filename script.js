const $ = (id) => document.getElementById(id),
  cl = (v, a, b) => Math.max(a, Math.min(b, v));
const RM = matchMedia("(prefers-reduced-motion:reduce)").matches;
/* ---------- WebGL infinite-zoom lattice ---------- */
const cv = $("gl"),
  gl = cv.getContext("webgl");
const FS = `precision highp float;uniform vec2 r;uniform float t,d,hue,f,g;
vec3 pal(float x){return .55+.45*cos(6.2831*(x+vec3(0.,.33,.67)));}
vec4 layer(vec2 p,float s){p*=s;vec2 id=floor(p),q=fract(p)-.5;float chk=mod(id.x+id.y,2.);
q.y*=1.+f*.6;q+=.07*vec2(sin(t+id.y*.9+p.y*2.),cos(t*.9+id.x*.9+p.x*2.));
float rad=mix(.2,.31,chk),dd=length(q),disc=smoothstep(rad,rad-.05,dd);
float ring=smoothstep(.035,0.,abs(dd-rad-.09))*(.5+.5*g);
vec3 c=pal(hue+chk*.4)*(disc*(.7+.5*(.5-dd)))+pal(hue+.5)*ring*.8;
float bond=smoothstep(.03,0.,abs(abs(q.x)-.5+.0))*.15;
return vec4(c+bond*pal(hue),max(disc,ring));}
void main(){vec2 uv=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);float a=d*.12,ca=cos(a),sa=sin(a);uv=mat2(ca,-sa,sa,ca)*uv;
float fd=fract(d);vec3 col=vec3(0.);
for(int i=0;i<5;i++){float k=float(i)+fd;float w=sin(3.14159*k/5.);w*=w;
vec4 L=layer(uv,1.6/exp2(k-2.5));
col+=L.rgb*w*(.35+.65*L.a)*.9;}
float rr=length(uv);col+=pal(hue+.2)*(.08+.18*g)/(rr*6.+.4);
col*=smoothstep(1.7,.2,rr);gl_FragColor=vec4(col,1.);}`;
let U = {};
if (gl) {
  const mk = (t, s) => {
    const o = gl.createShader(t);
    gl.shaderSource(o, s);
    gl.compileShader(o);
    return o;
  };
  const pr = gl.createProgram();
  gl.attachShader(
    pr,
    mk(
      gl.VERTEX_SHADER,
      "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}",
    ),
  );
  gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  gl.useProgram(pr);
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const l = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(l);
  gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
  ["r", "t", "d", "hue", "f", "g"].forEach(
    (n) => (U[n] = gl.getUniformLocation(pr, n)),
  );
}
function size() {
  const k = Math.min(devicePixelRatio || 1, 1.25);
  cv.width = innerWidth * k;
  cv.height = innerHeight * k;
  gl && gl.viewport(0, 0, cv.width, cv.height);
}
size();
addEventListener("resize", size);
/* ---------- fall state ---------- */
let auto = 0,
  falling = false,
  speed = 1,
  hue = 0.55,
  fS = 0,
  gS = 0,
  tNow = 0,
  cp = 0;
const SP = [0.25, 0.5, 1, 2, 4];
let si = 2;
const hues = [0.55, 0.5, 0.08, 0.88];
function setBtn() {
  $("fall").classList.toggle("on", falling);
  $("fall").textContent = falling ? "Pause" : "Fall";
}
$("fall").onclick = () => {
  falling = !falling;
  setBtn();
};
$("slow").onclick = () => {
  si = Math.max(0, si - 1);
};
$("fast").onclick = () => {
  si = Math.min(4, si + 1);
};
addEventListener("keydown", (e) => {
  if (/INPUT/.test(e.target.tagName)) return;
  if (e.key === "f" || e.key === "F") {
    falling = !falling;
    setBtn();
  }
  if (e.key === "[") si = Math.max(0, si - 1);
  if (e.key === "]") si = Math.min(4, si + 1);
});
/* ---------- scroll ---------- */
const links = [...document.querySelectorAll("nav a")],
  secs = links.map((a) => $(a.hash.slice(1)));
let secI = 0;
function onScroll() {
  const h = document.documentElement;
  $("bar").style.width = (scrollY / (h.scrollHeight - innerHeight)) * 100 + "%";
  secI = 0;
  secs.forEach((s, i) => {
    if (s.getBoundingClientRect().top < innerHeight * 0.45) secI = i;
  });
  links.forEach((a, i) => a.classList.toggle("on", i === secI));
  const p = cl(scrollY / (innerHeight * 0.95), 0, 1),
    diag = Math.hypot(innerWidth, innerHeight),
    R = Math.min(innerWidth, innerHeight) * 0.13 + p * p * p * diag * 1.1;
  const D = $("door"),
    rg = $("ring");
  D.style.setProperty("--R", R + "px");
  D.style.display = p >= 1 ? "none" : "block";
  rg.style.width = rg.style.height = 2 * R + "px";
  rg.style.opacity = p > 0.55 ? Math.max(0, 1 - (p - 0.55) * 4) : 1;
  rg.style.display = p >= 0.8 ? "none" : "block";
  document.querySelector(".hv").style.opacity = cl(1 - p * 1.6, 0, 1);
  const r = $("tg").getBoundingClientRect();
  cp = cl(-r.top / (r.height - innerHeight * 0.6), 0, 1);
  crystal(cp);
}
addEventListener("scroll", onScroll, { passive: true });
const io = new IntersectionObserver(
  (e) =>
    e.forEach((x) => {
      if (x.isIntersecting) x.target.classList.add("in");
    }),
  { threshold: 0.2 },
);
document.querySelectorAll(".rv").forEach((n) => io.observe(n));
function crystal(p) {
  const h = 170 - p * 80,
    top = 95 + p * 80,
    al = 22 + p * 38;
  ["a1", "a2", "a3"].forEach((id) => {
    const a = $(id);
    a.setAttribute("y1", top - 12 - al);
    a.setAttribute("y2", top - 14);
  });
  $("pt").setAttribute("y", top - 12);
  $("cr").setAttribute("y", top);
  $("cr").setAttribute("height", h);
  $("pl").setAttribute("y", top + 28);
  $("pl").style.opacity = p;
  $("mi").setAttribute("y", top + h - 14);
  $("mi").style.opacity = p;
  $("cr").setAttribute("fill", "hsl(" + (185 - p * 150) + ",70%,66%)");
  $("tf").textContent =
    "Force: " + (p * 100).toFixed(0) + " N  |  charge ∝ force";
}
/* ---------- simulation ---------- */
const data = [];
let cur = 0,
  frc = 0;
function calc() {
  const f = parseFloat($("force").value),
    d = parseFloat($("d33").value),
    t = parseFloat($("time").value);
  if (!(f >= 0) || !(d > 0) || !(t > 0)) {
    $("err").textContent =
      "Enter a force of 0 or more, and values above 0 for d33 and time.";
    return;
  }
  $("err").textContent = "";
  const q = d * 1e-12 * f,
    nA = (q / t) * 1e9;
  $("out").textContent = nA.toFixed(2) + " nA";
  $("chg").textContent = "Charge: " + (q * 1e9).toFixed(3) + " nC";
  cur = nA;
  frc = f;
  data.push({ f, i: nA });
  data.sort((a, b) => a.f - b.f);
  table();
  graph();
}
function table() {
  $("rows").innerHTML = data
    .map(
      (d, k) =>
        `<tr><td>${k + 1}</td><td>${d.f}</td><td>${d.i.toFixed(2)}</td></tr>`,
    )
    .join("");
}
function graph() {
  const c = $("graph"),
    g = c.getContext("2d"),
    W = c.width,
    H = c.height,
    L = 70,
    R = 20,
    T = 20,
    B = 55;
  g.clearRect(0, 0, W, H);
  const mF = Math.max(10, ...data.map((d) => d.f)) * 1.1,
    la = data[data.length - 1],
    sl = la ? la.i / (la.f || 1) : 0,
    mI = Math.max(1, ...data.map((d) => d.i)) * 1.15;
  const X = (f) => L + (f / mF) * (W - L - R),
    Y = (i) => H - B - (i / mI) * (H - T - B);
  g.strokeStyle = "#3a3560";
  g.fillStyle = "#b9b2d6";
  g.font = "13px Segoe UI";
  for (let k = 0; k <= 5; k++) {
    const f = (mF * k) / 5,
      i = (mI * k) / 5;
    g.beginPath();
    g.moveTo(X(f), T);
    g.lineTo(X(f), H - B);
    g.moveTo(L, Y(i));
    g.lineTo(W - R, Y(i));
    g.stroke();
    g.textAlign = "center";
    g.fillText(f.toFixed(0), X(f), H - B + 18);
    g.textAlign = "right";
    g.fillText(i.toFixed(1), L - 8, Y(i) + 4);
  }
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.fillText("Force (N)", W / 2, H - 10);
  g.save();
  g.translate(18, H / 2);
  g.rotate(-Math.PI / 2);
  g.fillText("Current (nA)", 0, 0);
  g.restore();
  if (!data.length) return;
  g.strokeStyle = "#5eead4";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(X(0), Y(0));
  g.lineTo(X(mF), Y(sl * mF));
  g.stroke();
  g.fillStyle = "#ffc233";
  data.forEach((d) => {
    g.beginPath();
    g.arc(X(d.f), Y(d.i), 6, 0, 7);
    g.fill();
  });
}
const ac = $("anim"),
  a = ac.getContext("2d"),
  dots = Array.from({ length: 14 }, (_, k) => k / 14);
function sim() {
  a.clearRect(0, 0, 480, 320);
  const sq = (Math.min(frc, 100) / 100) * 70,
    cH = 130 - sq,
    cT = 120 + sq,
    al = 10 + (Math.min(frc, 100) / 100) * 40;
  a.fillStyle = "#ff7a59";
  a.font = "14px Segoe UI";
  a.textAlign = "center";
  [150, 240, 330].forEach((x) => {
    a.fillRect(x - 2, cT - 14 - al, 4, al);
    a.beginPath();
    a.moveTo(x - 8, cT - 18);
    a.lineTo(x + 8, cT - 18);
    a.lineTo(x, cT - 8);
    a.fill();
  });
  a.fillText("F = " + frc + " N", 240, 20);
  a.fillStyle = "#c9c3e6";
  a.fillRect(110, cT - 10, 260, 10);
  a.fillRect(110, 250, 260, 10);
  a.fillStyle = "hsl(" + (185 - Math.min(frc, 100) * 1.5) + ",70%,62%)";
  a.fillRect(110, cT, 260, cH);
  a.strokeStyle = "#5eead4";
  a.lineWidth = 2;
  a.strokeRect(110, cT, 260, cH);
  a.fillStyle = "#14213d";
  a.fillText("+ + + +", 240, cT + 22);
  a.fillText("− − − −", 240, cT + cH - 10);
  a.strokeStyle = "#e9e4ff";
  a.beginPath();
  a.moveTo(110, cT - 5);
  a.lineTo(60, cT - 5);
  a.lineTo(60, 255);
  a.lineTo(110, 255);
  a.moveTo(370, cT - 5);
  a.lineTo(420, cT - 5);
  a.lineTo(420, 255);
  a.lineTo(370, 255);
  a.stroke();
  const sp = (Math.min(cur, 500) / 500) * 0.02 + (cur > 0 ? 0.002 : 0);
  a.fillStyle = "#ffc233";
  dots.forEach((p, k) => {
    dots[k] = (p + sp) % 1;
    const s = dots[k] * 3;
    let x, y;
    if (s < 1) {
      x = 370 + 50 * s;
      y = cT - 5;
    } else if (s < 2) {
      x = 420;
      y = cT - 5 + (260 - cT) * (s - 1);
    } else {
      x = 420 - 50 * (s - 2);
      y = 255;
    }
    a.beginPath();
    a.arc(x, y, 4, 0, 7);
    a.fill();
  });
  a.fillStyle = "#fff";
  a.fillText("I = " + cur.toFixed(2) + " nA", 240, 300);
}
/* ---------- front-page physics and maths animation ---------- */
const hc = $("hc"),
  hx = hc.getContext("2d");
const EQ = [
  ["Q = d₃₃F", 0.1, 0.36],
  ["F = ma", 0.88, 0.34],
  ["I = dQ/dt", 0.08, 0.52],
  ["V = IR", 0.91, 0.5],
  ["∇·E = ρ/ε₀", 0.15, 0.9],
  ["E = hν", 0.82, 0.9],
  ["sin²θ + cos²θ = 1", 0.5, 0.95],
  ["∫ f dx", 0.27, 0.22],
  ["π", 0.72, 0.2],
  ["Σ", 0.95, 0.14],
  ["λ = v/f", 0.06, 0.15],
];
function hero(t) {
  if (scrollY > innerHeight * 1.1) return;
  const W = (hc.width = hc.offsetWidth),
    H = (hc.height = hc.offsetHeight);
  if (!W) return;
  hx.lineWidth = 2;
  [
    ["#0a7c86", 0],
    ["#ff6b4a", 1],
    ["#14213d", 2],
  ].forEach(([c, k]) => {
    hx.strokeStyle = c;
    hx.globalAlpha = 0.45;
    hx.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const y =
        H * 0.82 +
        k * 13 +
        Math.sin(x / 70 + t * (1 + k * 0.4) + k) * (12 + k * 6);
      x ? hx.lineTo(x, y) : hx.moveTo(x, y);
    }
    hx.stroke();
  });
  const ax = W * 0.17,
    ay = H * 0.66;
  hx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    const rot = (i * Math.PI) / 3;
    hx.strokeStyle = "rgba(10,124,134,.55)";
    hx.lineWidth = 1.5;
    hx.beginPath();
    hx.ellipse(ax, ay, 50, 18, rot, 0, 7);
    hx.stroke();
    const an = t * (1.2 + i * 0.3) + i * 2,
      ex = 50 * Math.cos(an),
      ey = 18 * Math.sin(an);
    hx.fillStyle = "#14213d";
    hx.beginPath();
    hx.arc(
      ax + ex * Math.cos(rot) - ey * Math.sin(rot),
      ay + ex * Math.sin(rot) + ey * Math.cos(rot),
      4.5,
      0,
      7,
    );
    hx.fill();
  }
  hx.fillStyle = "#ff6b4a";
  hx.beginPath();
  hx.arc(ax, ay, 8, 0, 7);
  hx.fill();
  const lx = W * 0.83,
    ly = H * 0.66;
  hx.strokeStyle = "#ff4d8d";
  hx.lineWidth = 2;
  hx.globalAlpha = 0.8;
  hx.beginPath();
  for (let q = 0; q <= 6.3; q += 0.05) {
    const x = lx + Math.sin(3 * q + t * 0.8) * 52,
      y = ly + Math.sin(2 * q) * 52;
    q ? hx.lineTo(x, y) : hx.moveTo(x, y);
  }
  hx.stroke();
  hx.globalAlpha = 1;
  hx.font =
    "italic 600 " +
    Math.max(15, Math.min(24, W / 55)) +
    "px Cambria,Georgia,serif";
  hx.textAlign = "center";
  hx.fillStyle = "rgba(20,33,61,.4)";
  EQ.forEach((e, i) => {
    if (e[2] >= 0.3)
      hx.fillText(e[0], W * e[1], H * e[2] + Math.sin(t * 0.9 + i * 1.3) * 8);
  });
  hero2(t, W, H);
}
function hero2(t, W, H) {
  hx.lineWidth = 2;
  hx.globalAlpha = 0.9;
  const px = W * 0.9,
    py = H * 0.12,
    L = H * 0.15,
    an = 0.7 * Math.sin(t * 1.8),
    bx = px + Math.sin(an) * L,
    by = py + Math.cos(an) * L;
  hx.strokeStyle = "#14213d";
  hx.beginPath();
  hx.moveTo(px, py);
  hx.lineTo(bx, by);
  hx.stroke();
  hx.fillStyle = "#ff6b4a";
  hx.beginPath();
  hx.arc(bx, by, 10, 0, 7);
  hx.fill();
  const sx = W * 0.1,
    sy = H * 0.12,
    len = H * 0.13 + Math.sin(t * 2.2) * H * 0.03;
  hx.strokeStyle = "#0a7c86";
  hx.beginPath();
  hx.moveTo(sx, sy);
  for (let i = 1; i <= 10; i++)
    hx.lineTo(sx + (i % 2 ? 14 : -14), sy + (len * i) / 11);
  hx.lineTo(sx, sy + len);
  hx.stroke();
  hx.fillStyle = "#14213d";
  hx.fillRect(sx - 14, sy + len, 28, 22);
  [
    [0.27, 0.48, "#ff4d8d"],
    [0.73, 0.48, "#0a7c86"],
  ].forEach(([fx, fy, c]) => {
    hx.strokeStyle = c;
    for (let k = 0; k < 3; k++) {
      const q = (t * 0.35 + k / 3) % 1;
      hx.globalAlpha = (1 - q) * 0.55;
      hx.beginPath();
      hx.arc(W * fx, H * fy, q * 80, 0, 7);
      hx.stroke();
    }
  });
  hx.globalAlpha = 1;
}
const TH = {
  classic: { h: 0 },
  neon: { h: 0.2 },
  forest: { h: -0.12 },
  ember: { h: 0.45 },
};
let th = "classic";
document.querySelectorAll(".dot").forEach((b) => {
  b.onclick = () => {
    th = b.dataset.t;
    document.documentElement.dataset.t = th;
    document
      .querySelectorAll(".dot")
      .forEach((x) => x.classList.toggle("on", x === b));
  };
});
/* ---------- main loop ---------- */
let last = 0;
function loop(ms) {
  const dt = Math.min((ms - last) / 1000, 0.1);
  last = ms;
  if (!RM) {
    tNow += dt;
    if (falling) auto += dt * 0.12 * SP[si];
  }
  const depth = (scrollY / innerHeight) * 0.55 + auto;
  const tgt = (hues[secI] + TH[th].h + 1) % 1;
  let dl = ((tgt - hue + 1.5) % 1) - 0.5;
  hue = (hue + dl * 0.04 + 1) % 1;
  const fT = Math.max(cl(frc / 100, 0, 1), secI === 1 ? cp * 0.8 : 0);
  fS += (fT - fS) * 0.06;
  gS += (cl(cur / 200, 0, 1) - gS) * 0.06;
  if (gl) {
    gl.uniform2f(U.r, cv.width, cv.height);
    gl.uniform1f(U.t, tNow);
    gl.uniform1f(U.d, depth);
    gl.uniform1f(U.hue, hue);
    gl.uniform1f(U.f, fS);
    gl.uniform1f(U.g, gS);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  sim();
  hero(tNow);
  requestAnimationFrame(loop);
}
$("calc").onclick = calc;
$("clear").onclick = () => {
  data.length = 0;
  cur = 0;
  frc = 0;
  $("out").textContent = "0.00 nA";
  $("chg").textContent = "Charge: 0 nC";
  table();
  graph();
};
["force", "d33", "time"].forEach((id) =>
  $(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") calc();
  }),
);
graph();
onScroll();
setBtn();
requestAnimationFrame(loop);
