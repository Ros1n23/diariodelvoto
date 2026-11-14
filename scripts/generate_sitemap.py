import sqlite3
import datetime

db_path = "/opt/quevotan/data/quevotan.db"
sitemap_path = "/opt/quevotan/public/sitemap.xml"

conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT DISTINCT date FROM sessions ORDER BY date DESC")
dates = [r[0] for r in c.fetchall()]

c.execute("SELECT id, session_date FROM initiatives ORDER BY session_date DESC")
initiatives = c.fetchall()

today = datetime.date.today().isoformat()

xml_lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    '    <loc>https://quevotan.es/</loc>',
    f'    <lastmod>{today}</lastmod>',
    '    <changefreq>daily</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>'
]

for d in dates:
    xml_lines.extend([
        '  <url>',
        f'    <loc>https://quevotan.es/?date={d}</loc>',
        f'    <lastmod>{d}</lastmod>',
        '    <changefreq>monthly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>'
    ])

for init_id, session_date in initiatives:
    xml_lines.extend([
        '  <url>',
        f'    <loc>https://quevotan.es/?initiative={init_id}</loc>',
        f'    <lastmod>{session_date}</lastmod>',
        '    <changefreq>never</changefreq>',
        '    <priority>0.7</priority>',
        '  </url>'
    ])

xml_lines.append('</urlset>')

with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write("\n".join(xml_lines) + "\n")

print(f"Sitemap generated at {sitemap_path} with {len(dates)} dates and {len(initiatives)} initiatives.")
