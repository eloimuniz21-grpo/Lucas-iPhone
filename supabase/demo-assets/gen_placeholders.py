import base64

def phone_svg(grad_from, grad_to, accent):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{grad_from}"/>
      <stop offset="100%" stop-color="{grad_to}"/>
    </linearGradient>
    <linearGradient id="phone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2622"/>
      <stop offset="100%" stop-color="#151311"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <g transform="translate(400,400)">
    <rect x="-130" y="-260" width="260" height="520" rx="48" fill="url(#phone)"/>
    <rect x="-118" y="-246" width="236" height="492" rx="36" fill="#0b0a09"/>
    <circle cx="0" cy="-198" r="7" fill="{accent}" opacity="0.85"/>
    <rect x="-160" y="-150" width="60" height="80" rx="16" fill="url(#phone)"/>
    <circle cx="-130" cy="-120" r="16" fill="{accent}" opacity="0.55"/>
    <circle cx="-130" cy="-90" r="10" fill="{accent}" opacity="0.35"/>
  </g>
</svg>'''

variants = [
    ("model1", "#f3ddc4", "#e3b585", "#a4531f"),
    ("model2", "#f7e9d8", "#eec9a0", "#c1662e"),
    ("model3", "#efe2cf", "#d9a468", "#8f4419"),
]

for name, g1, g2, accent in variants:
    svg = phone_svg(g1, g2, accent)
    b64 = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    data_uri = f"data:image/svg+xml;base64,{b64}"
    with open(f"/tmp/{name}.uri", "w") as f:
        f.write(data_uri)
    print(name, len(data_uri))
