// renderResumeHtml 确定性单测（无 LLM 依赖）
import { renderResumeHtml } from './services/resumeLayout.js';
import type { TailoredResume } from './types.js';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${msg}`);
  }
}

const full: TailoredResume = {
  name: '张三',
  englishName: 'Zhang San',
  targetTitle: '高级产品经理',
  contact: { phone: '13800000000', email: 'a@b.c', location: '杭州' },
  summary: '5 年 SaaS 产品经验，主导 **数据中台** 落地，GMV 提升 [待补充: 具体百分比]。',
  highlights: [
    { value: '3000万', unit: '元', label: '主导产品 GMV' },
    { value: '[待补充: 增长数]', label: '用户增长' },
  ],
  experience: [
    {
      company: '某SaaS公司',
      role: '产品经理',
      period: '2021-2024',
      tag: '方向主导',
      bullets: [
        '设计并上线数据中台，**报表产出**效率提升 [待补充: 具体数值]',
        '搭建 A/B 实验体系，覆盖 12 条产品线',
      ],
    },
  ],
  skills: [{ label: '数据', body: 'SQL、用户增长分析、A/B 实验' }],
  education: ['浙江大学 计算机 本科 2017-2021'],
  changes: [{ section: '工作经历', change: '突出数据中台项目', reason: '对应 JD 数据产品要求' }],
  placeholders: ['[待补充: 具体百分比]', '[待补充: 具体数值]'],
};

// 1) 占位统计：summary 1 + highlights 1 + experience 1 = 3
const r1 = renderResumeHtml(full);
assert(r1.placeholderCount === 3, `占位统计 = 3（实际 ${r1.placeholderCount}）`);

// 2) 高亮数字渲染
assert(r1.html.includes('3000万'), '含数字高亮 3000万');
assert(r1.html.includes('metric-value'), '含 metric 版式类');

// 3) [待补充] 转成占位 span，且原样保留文字
assert(r1.html.includes('placeholder'), '待补充渲染为 placeholder 样式');
assert(r1.html.includes('待补充：具体百分比'), '占位文案保留');

// 4) HTML 注入防护：contact 含 <script> 必须被转义
const r2 = renderResumeHtml({
  ...full,
  contact: { phone: '<script>alert(1)</script>', email: 'x"onerror"y@z', location: 'a&b' },
});
assert(!r2.html.includes('<script>alert'), 'script 注入被转义');
assert(r2.html.includes('&lt;script&gt;'), '尖括号被实体转义');
assert(r2.html.includes('a&amp;b'), 'ampersand 被转义');

// 5) section 省略：空 skills/education/certifications 不渲染对应 section
const minimal: TailoredResume = {
  targetTitle: '测试岗',
  contact: {},
  summary: '简介',
  highlights: [],
  experience: [{ company: 'X', role: 'Y', bullets: ['做了一件事'] }],
  skills: [],
  changes: [],
  placeholders: [],
};
const r3 = renderResumeHtml(minimal);
assert(!r3.html.includes('>技能<') && !r3.html.includes('技能</div>'), '无技能则省略技能 section');
assert(!r3.html.includes('教育背景'), '无教育则省略教育 section');
assert(r3.html.includes('工作经历'), '有经历则渲染工作经历');
assert(r3.placeholderCount === 0, '无占位时 placeholderCount=0');

// 6) 文件名安全化
const r4 = renderResumeHtml({ ...full, targetTitle: '高级产品经理/资深' });
assert(r4.fileName.includes('简历_'), '文件名前缀');
assert(!r4.fileName.includes('/'), '文件名去除斜杠');

// 7) 含 kami 版式 CSS 设计语言
assert(r4.html.includes('parchment') || r4.html.includes('TsangerJinKai02') || r4.html.includes('--brand'), '内嵌 kami 版式 CSS');
assert(r4.html.includes('@page'), '含 @page A4（可打印 PDF）');
assert(r4.html.includes('window.print'), '含打印按钮（交付用）');

console.log(process.exitCode === 1 ? '\nrenderResumeHtml: 有失败' : '\nrenderResumeHtml: 全部通过 ✅');
