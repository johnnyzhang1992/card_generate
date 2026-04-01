function convert(s, numRows) {
    if (numRows === 1 || s.length <= numRows) return s;
    
    const rows = new Array(numRows).fill('');
    let currentRow = 0;
    let goingDown = false;
    
    for (let char of s) {
        rows[currentRow] += char;
        
        // 当到达第一行或最后一行时，改变方向
        if (currentRow === 0 || currentRow === numRows - 1) {
            goingDown = !goingDown;
        }
        
        currentRow += goingDown ? 1 : -1;
    }
    
    return rows.join('');
}

// 测试代码
console.log("测试1:");
console.log("输入: s = 'PAYPALISHIRING', numRows = 3");
console.log("输出:", convert('PAYPALISHIRING', 3));
console.log("预期: PAHNAPLSIIGYIR");
console.log("结果:", convert('PAYPALISHIRING', 3) === 'PAHNAPLSIIGYIR' ? '✓ 正确' : '✗ 错误');

console.log("\n测试2:");
console.log("输入: s = 'PAYPALISHIRING', numRows = 4");
console.log("输出:", convert('PAYPALISHIRING', 4));
console.log("预期: PINALSIGYAHRPI");
console.log("结果:", convert('PAYPALISHIRING', 4) === 'PINALSIGYAHRPI' ? '✓ 正确' : '✗ 错误');

console.log("\n测试3:");
console.log("输入: s = 'A', numRows = 1");
console.log("输出:", convert('A', 1));
console.log("预期: A");
console.log("结果:", convert('A', 1) === 'A' ? '✓ 正确' : '✗ 错误');

console.log("\n测试4:");
console.log("输入: s = 'AB', numRows = 1");
console.log("输出:", convert('AB', 1));
console.log("预期: AB");
console.log("结果:", convert('AB', 1) === 'AB' ? '✓ 正确' : '✗ 错误');