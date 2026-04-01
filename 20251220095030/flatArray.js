const flatArray = (arr, dep = 1) => {
  let newArr = [];
  console.log(arr, 'arr', arr.length);
  for (let i = 0; i < arr.length; i++) {
    console.log(i, arr[i]);
    if (Array.isArray(arr[i]) && dep > 0) {
      newArr = newArr.concat(flatArray(arr[i], dep - 1));
    } else {
      newArr.push(arr[i]);
    }
    console.log(newArr, 'new');
  }
  return newArr;
};

// 测试代码
const testArray = [1, [2, [3, [4]]], 5];
console.log('原数组:', testArray);
console.log('深度1:', flatArray(testArray, 1));
console.log('深度2:', flatArray(testArray, 2));
console.log('深度无限:', flatArray(testArray, Infinity));