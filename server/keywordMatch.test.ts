// keywordMatch 确定性单测（无 LLM 依赖，直接 tsx 运行）
import { keywordMatch } from './services/resumeService.js';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

const resume = `张伟 | 高级产品经理 | 5年互联网产品经验
工作经历：
2021-2024 某SaaS公司 产品经理：负责数据产品，用 SQL 做用户增长分析，敏捷开发流程，参与AI产品原型设计`;

// Case 1: 命中与缺失
{
  const { hitKeywords, missingKeywords } = keywordMatch(
    ['SQL', '敏捷开发', '用户增长', 'AI 产品', 'Figma', 'Kubernetes'],
    resume
  );
  assert(hitKeywords.includes('SQL'), 'SQL 命中（大小写不敏感）');
  assert(hitKeywords.includes('敏捷开发'), '中文关键词命中');
  assert(hitKeywords.includes('用户增长'), '多词中文命中');
  assert(hitKeywords.includes('AI 产品'), '含空格的混合关键词命中（AI + 产品）');
  assert(missingKeywords.includes('Figma'), 'Figma 缺失');
  assert(missingKeywords.includes('Kubernetes'), 'Kubernetes 缺失');
  assert(hitKeywords.length + missingKeywords.length === 6, '命中+缺失=总数（无遗漏无重复）');
}

// Case 2: 全缺失
{
  const { hitKeywords, missingKeywords } = keywordMatch(['Golang', 'Rust'], resume);
  assert(hitKeywords.length === 0, '全缺失时 hitKeywords 为空');
  assert(missingKeywords.length === 2, '全缺失时 missingKeywords 完整');
}

// Case 3: 空关键词
{
  const { hitKeywords, missingKeywords } = keywordMatch([], resume);
  assert(hitKeywords.length === 0 && missingKeywords.length === 0, '空关键词返回空');
}

// Case 4: 词元必须全在（"A/B testing" 只出现 "A/B" 不算命中）
{
  const r = keywordMatch(['用户增长分析'], '我做过用户增长');
  assert(r.missingKeywords.includes('用户增长分析'), '部分词元不命中（防止假阳性）');
}

console.log('\n全部通过 ✅');
