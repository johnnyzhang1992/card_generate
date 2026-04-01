// 测试文本分割逻辑
import { splitTextToCards } from './src/utils/textSplitter.js'

// 测试卡片样式
const cardStyle = {
  width: 300,
  height: 200,
  padding: 20,
  fontSize: 16,
  fontFamily: 'Arial',
  lineSpacing: 4
}

// 测试用例1：不会跨卡片的段落
const testText1 = "这是一个较长的段落，这个段落应该被拆分成多行，但不会跨卡片，因为卡片有足够的空间容纳整个段落。"

// 测试用例2：需要跨卡片的段落
const testText2 = "这是一个非常长的段落，这个段落需要被拆分成多行，而且会跨多个卡片，因为卡片的空间有限，无法容纳整个段落的内容。这是一个非常长的段落，这个段落需要被拆分成多行，而且会跨多个卡片，因为卡片的空间有限，无法容纳整个段落的内容。"

// 测试用例3：包含空行的文本
const testText3 = "第一段落\n\n第二段落\n\n第三段落"

function testSplitter() {
  console.log('=== 测试文本分割逻辑 ===')
  
  // 测试用例1
  console.log('\n测试用例1：不会跨卡片的段落')
  const cards1 = splitTextToCards(testText1, cardStyle)
  console.log(`生成卡片数量: ${cards1.length}`)
  cards1.forEach((card, index) => {
    console.log(`卡片 ${index + 1} (split: ${card.isSplit}):`)
    card.lines.forEach(line => {
      console.log(`  "${line.text}" (split: ${line.isSplit})`)
    })
  })
  
  // 测试用例2
  console.log('\n测试用例2：需要跨卡片的段落')
  const cards2 = splitTextToCards(testText2, cardStyle)
  console.log(`生成卡片数量: ${cards2.length}`)
  cards2.forEach((card, index) => {
    console.log(`卡片 ${index + 1} (split: ${card.isSplit}):`)
    card.lines.forEach(line => {
      console.log(`  "${line.text}" (split: ${line.isSplit})`)
    })
  })
  
  // 测试用例3
  console.log('\n测试用例3：包含空行的文本')
  const cards3 = splitTextToCards(testText3, cardStyle)
  console.log(`生成卡片数量: ${cards3.length}`)
  cards3.forEach((card, index) => {
    console.log(`卡片 ${index + 1} (split: ${card.isSplit}):`)
    card.lines.forEach(line => {
      console.log(`  "${line.text}" (split: ${line.isSplit})`)
    })
  })
}

// 运行测试
testSplitter()