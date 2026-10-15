// kami 中文简历版式 CSS（固化自 tw93/kami 的 assets/templates/resume.html）
// 用途：server 端确定性渲染定制简历 → 交付感 HTML（A4 / 羊皮纸 / 宋体 / ATS 单栏底线）
// 浏览器打印/存 PDF 走 @page A4。字体走 jsDelivr CDN 兜底（本地 ttf 缺失不影响渲染）。
export const KAMI_RESUME_CSS = `
@font-face {
  font-family: "TsangerJinKai02";
  src: url("https://cdn.jsdelivr.net/gh/tw93/Kami@main/assets/fonts/TsangerJinKai02-W04.ttf") format("truetype");
  font-weight: 400; font-style: normal;
}
@font-face {
  font-family: "TsangerJinKai02";
  src: url("https://cdn.jsdelivr.net/gh/tw93/Kami@main/assets/fonts/TsangerJinKai02-W05.ttf") format("truetype");
  font-weight: 500; font-style: normal;
}
@page { size: A4; margin: 11mm 13mm 11mm 13mm; background: #f5f4ed; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --parchment: #f5f4ed;
  --ivory:     #faf9f5;
  --border:    #e8e6dc;
  --border-soft: #e5e3d8;
  --near-black: #141413;
  --dark-warm: #3d3d3a;
  --olive:     #504e49;
  --stone:     #6b6a64;
  --brand:     #1B365D;
  --brand-tint: #EEF2F7;
  --serif: "TsangerJinKai02", "Source Han Serif SC", "Source Han Serif CN", "Noto Serif CJK SC", "Noto Serif SC", "Songti SC", "STSong", "SimSun", Georgia, serif;
  --sans: var(--serif);
}
html, body { background: var(--parchment); }
@media screen { body { max-width: 210mm; margin: 0 auto; padding: 11mm 13mm; } }
body {
  color: var(--near-black);
  font-family: var(--serif);
  font-size: 9.2pt;
  line-height: 1.42;
  letter-spacing: 0.3pt;
  widows: 3; orphans: 3;
}
.serif { font-family: var(--serif); }
a { color: var(--brand); text-decoration: none; }
.header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 4.2mm; padding-bottom: 2.3mm;
  border-bottom: 0.6pt solid var(--border);
}
.header > div:first-child { flex-shrink: 0; }
.name {
  font-family: var(--serif); font-size: 26.5pt; font-weight: 500;
  letter-spacing: 0.5pt; color: var(--near-black); line-height: 1;
  display: flex; align-items: baseline; gap: 2.2mm; white-space: nowrap;
}
.alias { font-size: 12.5pt; font-weight: 400; color: var(--stone); letter-spacing: 0.2pt; }
.contact { text-align: right; font-size: 9pt; color: var(--stone); line-height: 1.5; margin-bottom: -0.5mm; }
.contact a { color: var(--dark-warm); }
.contact .loc { color: var(--olive); font-weight: 500; }
.contact .role { color: var(--brand); font-size: 10.5pt; font-weight: 500; }
.contact .sep { color: var(--border); margin: 0 0.4em; }
.metrics {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  column-gap: 6mm; margin-bottom: 3mm; margin-left: 0; margin-right: 0;
}
.metric {
  background: transparent; padding: 1mm 0 1.2mm;
  display: flex; flex-direction: column; align-items: flex-start;
  gap: 0.7mm; min-width: 0; break-inside: avoid;
}
.metric-value {
  font-family: var(--serif); font-size: 13pt; font-weight: 500;
  color: var(--brand); line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap;
}
.metric-label { font-size: 9pt; color: var(--olive); line-height: 1.2; white-space: nowrap; }
.metric-value .unit { font-size: 10.5pt; margin-left: 0.3mm; font-weight: 500; color: var(--brand); }
.section-title {
  font-family: var(--serif); font-size: 12.5pt; font-weight: 500;
  color: var(--near-black); border-bottom: 0.5pt solid var(--border);
  padding: 0 0 1mm 0; margin: 5.8mm 0 1.7mm 0;
  display: flex; align-items: baseline; justify-content: space-between; gap: 2mm;
}
.section-title .sub { font-family: var(--serif); font-weight: 400; font-size: 9pt; color: var(--stone); letter-spacing: 0.3pt; }
section:first-of-type .section-title { margin-top: 0; }
.page-break > .section-title { margin-top: 0; }
.summary { font-size: 9.2pt; line-height: 1.42; color: var(--near-black); }
.summary .hl { color: var(--brand); }
.job { padding: 2.6mm 0; break-inside: avoid; }
.job:first-of-type { padding-top: 1.2mm; }
.job-head { display: flex; align-items: baseline; justify-content: space-between; gap: 2mm; margin-bottom: 0.75mm; }
.job-name { font-family: var(--serif); font-size: 11pt; font-weight: 500; color: var(--near-black); }
.job-kind { font-size: 11pt; color: var(--olive); margin-left: 1.5mm; }
.job-period { font-size: 9pt; color: var(--stone); font-variant-numeric: tabular-nums; white-space: nowrap; }
.job-role { font-size: 9pt; color: var(--brand); font-weight: 500; }
.job-bullets { display: table; width: 100%; }
.job-row { display: table-row; }
.job-label {
  display: table-cell; width: 11mm; font-size: 9pt; color: var(--brand);
  font-weight: 500; letter-spacing: 0.2pt; padding: 0.2mm 0 0.4mm 0; vertical-align: top;
}
.job-text {
  display: table-cell; font-size: 9pt; color: var(--near-black);
  line-height: 1.4; letter-spacing: 0.3pt; padding: 0 0 0.4mm 0.5mm;
}
.job-text .hl { color: var(--brand); }
.placeholder {
  color: var(--brand); background: var(--brand-tint);
  padding: 0 1mm; border-radius: 2pt; font-size: 8.5pt;
}
.skill-row { display: flex; gap: 2.5mm; padding: 1.7mm 0; border-bottom: 0.3pt dotted var(--border); align-items: baseline; }
.skill-row:last-of-type { border-bottom: none; }
.skill-label { font-size: 9pt; font-weight: 500; color: var(--brand); letter-spacing: 0.3pt; width: 22mm; flex-shrink: 0; line-height: 1.36; }
.skill-body { font-size: 9pt; color: var(--near-black); line-height: 1.4; letter-spacing: 0.3pt; flex: 1; }
.skill-body .em-brand { color: var(--brand); }
.edu-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 9.5pt; padding: 1.7mm 0; }
.edu-row .school { font-family: var(--serif); font-weight: 500; font-size: 10.7pt; }
.edu-row .major { color: var(--olive); font-size: 9.5pt; }
.edu-row .date { color: var(--stone); font-variant-numeric: tabular-nums; font-size: 9pt; }
.page-break { break-before: page; }
@media print { @page { margin: 11mm 13mm; } body { padding: 0; max-width: none; } }
`;
