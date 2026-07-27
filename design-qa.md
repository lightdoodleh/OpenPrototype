# Design QA

**Source visual truth**

- Full view: `/var/folders/p_/wzf0jt6n5kx_8td0rcr1l78r0000gq/T/codex-clipboard-b88319c3-996d-4cb8-9aa8-5d2c69e929ec.png`
- Source pixels: 4096 × 2060; normalized to 2048 × 1030 CSS-pixel proportions for comparison.
- The red boxes and arrows are editorial annotations. Their stated corrections, rather than the annotated old UI, define the target behavior.

**Implementation evidence**

- Closed desktop state: `/tmp/openprototype-demo-desktop-2048x1030.png`
- Normalized desktop state: `/tmp/openprototype-demo-implementation-normalized.png`
- Open PRD state: `/tmp/openprototype-demo-prd-2048x1030.png`
- Mobile Agent state: `/tmp/openprototype-demo-mobile-agent.png`
- Browser viewport: 2048 × 1030 CSS px for desktop and 390 × 844 CSS px for mobile.
- State: `customer_list.html` selected, seeded OpenCode conversation visible, with PRD closed in the primary full-view comparison.

**Full-view comparison evidence**

- Side-by-side source and implementation: `/tmp/openprototype-demo-comparison.png`
- The header, hero, call-to-action area, workbench scale, neutral palette, blue active states, and three-column product shell remain aligned with the reference.
- The left navigation now contains only prototype pages.
- The PRD entry moved into the preview canvas as a vertical bottom-right button and opens a drawer without replacing the preview.
- The right column is now an OpenCode Agent conversation surface instead of a process explanation.

**Focused comparison evidence**

- The open-PRD capture shows that the drawer is bounded to the preview canvas and leaves the page tree and Agent conversation available.
- The mobile capture shows the same PRD affordance and a full-width stacked Agent surface without losing the message composer.

**Findings**

- No actionable P0/P1/P2 mismatches remain.
- Typography: the existing Chinese system-font stack and type scale are preserved; chat metadata, tool rows, and PRD table hierarchy remain legible.
- Spacing and layout: the desktop workbench retains the original proportions while allocating a wider, product-like Agent panel; responsive stacking passes at 390 px.
- Colors: neutral surfaces, blue selection/primary actions, green availability state, and dark composer treatment stay consistent with the product shell.
- Image and asset quality: no low-resolution raster assets were introduced; interface icons remain vector/text based.
- Copy and content: above the fold, only the demo description changed from “查看详情和 PRD 增量” to “打开内嵌 PRD，并体验右侧 Agent 对话”; the header, hero, navigation, and CTA copy are unchanged.

**Interaction verification**

- PRD button opens and closes the canvas drawer; the displayed PRD title and file update when switching between list and detail pages.
- Customer filtering returned only “样板医疗器械公司” for “医疗”, and reset restored the table.
- Agent message send, simulated assistant reply, PRD quick action, new chat, collapse, and expand all passed.
- Switching prototype pages updates the Agent HTML/PRD context chips.
- Mobile layout was verified at 390 × 844 CSS px.
- Browser console: no errors or warnings.

**Comparison history**

- Earlier P1: “对应 PRD” appeared as a third item in the left page list.
- Fix: removed that item and added the preview-canvas PRD button plus drawer.
- Earlier P1: the right column displayed a four-step controlled-update flow.
- Fix: replaced it with an OpenCode-style conversation panel, live context, tool activity, message history, and composer.
- Post-fix evidence: the desktop, open-PRD, mobile, and side-by-side captures listed above.

**Intentional deviations**

- The online Agent is explicitly labeled as a simulated conversation and does not connect to a local model, because the public static Demo cannot invoke a visitor’s local OpenCode runtime.
- Editorial red callouts from the source image are not reproduced in the product UI.

**Implementation checklist**

- [x] Left navigation contains prototype pages only.
- [x] PRD opens from the preview window’s bottom-right affordance.
- [x] Right column presents an OpenCode Agent conversation.
- [x] Page, PRD, Agent, and mock context stay synchronized.
- [x] Desktop and mobile interactions pass.
- [x] Changed-file checks pass.

**Follow-up polish**

- None required for this correction.

final result: passed
