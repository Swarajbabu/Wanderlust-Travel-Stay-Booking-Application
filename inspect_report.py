with open('build_full_report.py', 'r', encoding='utf-8') as f:
    text = f.read()

pages = text.split('<div class="page')
for pno in [5, 6]:
    print(f"\n==================== PAGE {pno} ====================")
    print(pages[pno])
