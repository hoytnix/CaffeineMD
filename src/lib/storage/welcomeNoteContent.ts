/**
 * Default Seed Document: Welcome to CaffeineMD ☕
 * Rich showcase demonstrating typography, bidirectional linking,
 * asset staging, native tables, and interactive WASM code execution.
 */

export const WELCOME_NOTE_CONTENT = `---
title: Welcome to CaffeineMD ☕
status: Active
category: Documentation
priority: High
tags: [welcome, showcase, pwa, wasm, markdown]
---

# Welcome to CaffeineMD ☕

CaffeineMD is a high-performance, local-first personal knowledge management workspace modeled after Obsidian and Notion. Powered by Tiptap v2, Dexie IndexedDB, and client-side WASM runtimes, it delivers zero cloud lock-in with zero latency.

---

## Fluid Typography & Formatting

Express your thoughts with versatile inline styling. You can format prose with **bold text** for emphasis, *italic text* for gentle cadence, <u>underlined text</u> for citations, ~~strikethrough text~~ for revisions, and ==highlighted text== for spotlight callouts. Quick access shortcuts like \`⌘P\` (Quick-Switcher), \`⌘K\` (Global Search), \`⌘⇧H\` (Vault RegEx Replace), and \`Shift+Space\` (Universal Emoji Drawer) keep your hands on the keyboard.

---

## Bidirectional Knowledge Graph & Smart Links

CaffeineMD automatically connects your ideas across documents. Explore external resources via [CaffeineMD Official Site](https://www.caffeinemd.wiki) or [TehWiz Productions](https://tehwiz.com), and create instantaneous bidirectional links to internal notes like [[Project Alpha]] and [[Ideas]]. Hover over any link to trigger iOS-style Link Preview cards with metadata screenshots, or switch to the 2D Force-Directed Graph View to watch topic clusters organically emerge in real-time.

---

## Embedded Visual Assets & Media Staging

Seamlessly drop screenshots, mockups, and local media into your notes. Images render offline from IndexedDB blob storage with instant object URLs, zero UI freezes, and clean markdown round-tripping.

![Lofi Coffee Workspace](/og-caffeinemd.png)

---

## Local-First Philosophy & Cloud Privacy

> Local-first software prioritizes user data ownership, privacy, and speed above all else.
> Every note, image asset, and database record resides primarily on your local machine in IndexedDB.
> Synchronize on your terms using Google Drive Bring-Your-Own-Cloud (BYOC) with resumable multipart chunking.

---

## Structured Task Lists & Outlines

Organize sprints, agendas, and architectural requirements with structured lists:

### Core Workflows
- Continuous local autosave to client-side IndexedDB
- Bidirectional backlink indexing and mention resolution
- Notion-style frontmatter database views

### Roadmap Milestones
1. Mount existing local vault directory via File System Access API
2. Compose specifications and cross-reference research documents
3. Export standalone offline single-page apps or installable PWAs

### Interactive Task Checklist
- [x] Configure YAML frontmatter metadata and priority tags
- [x] Test bidirectional WikiLink navigation and backlink drawer
- [ ] Run client-side WASM polyglot code execution benchmarks
- [ ] Deploy static vault export directly to Netlify edge

---

## Multi-Mode Workspace Matrix

CaffeineMD adapts to your current task with specialized views:

| Workspace Mode | Primary Purpose | Key Accelerator | Local-First Storage |
| --- | --- | --- | --- |
| Rich Text | Fluid WYSIWYG note writing | Slash Command \`/\` | IndexedDB / Disk |
| Plaintext Markdown | Direct source editing & YAML headers | Mode Tab Switcher | IndexedDB / Disk |
| Split Diff View | Side-by-side buffer revisions | Dual Pane \`⌘\\\` | Local Buffer |
| Database / Kanban | Notion-style frontmatter tables & boards | Peer Tab View | IndexedDB Schema |
| 2D Force Graph | Bi-directional semantic topology | Graph Tab \`Network\` | D3 Physics Engine |
| 1-Click PWA Export | Standalone HTML & installable PWA bundles | Export Pill \`⌘E\` | Zero-Build Zip |

---

## Interactive Polyglot WASM Sandbox

Click the green **Run** button on any code block below to execute code client-side inside an isolated sandbox with live streaming output.

### 1. Shell Scripting (Bash Runtime)
Execute pipelines with variable expansion and arithmetic evaluation:

\`\`\`bash
ROAST_BATCHES=4
PRICE_PER_LB=18
TOTAL_VALUE=$(( ROAST_BATCHES * PRICE_PER_LB ))

echo "=== CaffeineMD Roastery Inventory ==="
echo "Active Batches: $ROAST_BATCHES | Estimated Value: \\\$$TOTAL_VALUE"

printf "Espresso Roast\\nEthiopia Yirgacheffe\\nColombia Supremo\\nDecaf Blend\\n" | grep -v "Decaf" | sort
\`\`\`

### 2. Python 3 (Pyodide WebAssembly)
Perform statistical computing and data processing directly in the browser:

\`\`\`python
def fibonacci_stats(n):
    seq = [0, 1]
    for _ in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq, sum(seq) / len(seq)

fib_sequence, avg = fibonacci_stats(10)
print(f"☕ Fibonacci First 10: {fib_sequence}")
print(f"📊 Statistical Mean: {avg:.2f}")
print("⚡ Powered by Pyodide WebAssembly in an isolated worker!")
\`\`\`

### 3. In-Browser SQLite Database (SQL Runtime)
Create tables, seed rows, and format queries into clean ASCII result tables:

\`\`\`sql
CREATE TABLE coffee_menu (
  id INTEGER PRIMARY KEY,
  drink TEXT,
  caffeine_mg INTEGER,
  rating REAL
);

INSERT INTO coffee_menu VALUES (1, 'Cortado', 130, 4.9);
INSERT INTO coffee_menu VALUES (2, 'Nitro Cold Brew', 215, 4.85);
INSERT INTO coffee_menu VALUES (3, 'Flat White', 130, 4.75);
INSERT INTO coffee_menu VALUES (4, 'Affogato', 65, 4.95);

SELECT drink, caffeine_mg, rating FROM coffee_menu ORDER BY rating DESC;
\`\`\`

### 4. Typed Logic (TypeScript / JavaScript Runtime)
Run asynchronous TypeScript snippets with compile-time type verification:

\`\`\`typescript
interface BrewOrder {
  id: string;
  blend: string;
  shots: number;
  temperature: 'iced' | 'steamed';
}

async function fulfillOrders(orders: BrewOrder[]): Promise<string> {
  const totalShots = orders.reduce((sum, o) => sum + o.shots, 0);
  return \`Successfully pulled \${totalShots} shots for \${orders.length} craft beverages.\`;
}

const queue: BrewOrder[] = [
  { id: 'b-101', blend: 'Signature Dark Roast', shots: 2, temperature: 'steamed' },
  { id: 'b-102', blend: 'Ethiopian Single Origin', shots: 3, temperature: 'iced' }
];

fulfillOrders(queue).then((summary) => console.log('☕ ' + summary));
\`\`\`

### 5. Live Sandboxed DOM Preview (HTML/CSS/SVG)
Click **Run** to launch an interactive live preview drawer rendered inside a secure iframe:

\`\`\`html
<div style="font-family: system-ui, sans-serif; padding: 1.25rem; background: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #334155;">
  <div style="display: flex; align-items: center; gap: 10px;">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>
    <h3 style="margin: 0; color: #f59e0b; font-size: 1.1rem;">CaffeineMD Live DOM Preview</h3>
  </div>
  <p style="margin: 0.75rem 0 0; font-size: 0.9rem; color: #94a3b8;">
    Sandboxed iframe preview running real-time HTML, CSS, and SVG markup right inside your note.
  </p>
</div>
\`\`\`
`;
