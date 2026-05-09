const fs = require('fs');
const path = require('path');

const problems = [];

function addProblem(topic, difficulty, title, description, constraints, inputFormat, outputFormat, examples, starterCode, testCases) {
  problems.push({
    title, topic, difficulty, description, constraints, inputFormat, outputFormat, examples,
    starterCode: JSON.stringify(starterCode),
    testCases
  });
}

// ─── 13. SORT COLORS (Medium - Sorting)
addProblem(
  'Sorting', 'Medium', 'Sort Colors',
  'Given an array nums with n objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue. We will use the integers 0, 1, and 2 to represent the color red, white, and blue, respectively. You must solve this problem without using the librarys sort function.',
  'n == nums.length\n1 <= n <= 300\nnums[i] is either 0, 1, or 2.',
  'Line 1: N. Line 2: N integers.',
  'Space-separated integers.',
  'Input:\n6\n2 0 2 1 1 0\nOutput:\n0 0 1 1 2 2',
  {
    python3: `import sys\n\ndef sortColors(nums):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    sortColors(nums)\n    print(" ".join(map(str, nums)))`,
    javascript: `const fs = require('fs');\nfunction sortColors(nums) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 1) {\n    const n = parseInt(input[0]);\n    const nums = input.slice(1, n+1).map(Number);\n    sortColors(nums);\n    console.log(nums.join(' '));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid sortColors(vector<int>& nums) {\n}\n\nint main() {\n    int n; if(!(cin>>n)) return 0;\n    vector<int> nums(n);\n    for(int i=0;i<n;i++) cin>>nums[i];\n    sortColors(nums);\n    for(int i=0;i<n;i++) cout<<nums[i]<<(i==n-1?"":" ");\n    cout<<endl;\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static void sortColors(int[] nums) {\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n        sortColors(nums);\n        for(int i=0;i<n;i++) System.out.print(nums[i] + (i==n-1?"":" "));\n        System.out.println();\n    }\n}`
  },
  [
    { isHidden: false, input: "6\n2 0 2 1 1 0", expectedOutput: "0 0 1 1 2 2" },
    { isHidden: false, input: "3\n2 0 1", expectedOutput: "0 1 2" },
    { isHidden: false, input: "1\n0", expectedOutput: "0" },
    { isHidden: true, input: "2\n2 0", expectedOutput: "0 2" },
    { isHidden: true, input: "5\n1 1 1 1 1", expectedOutput: "1 1 1 1 1" },
    { isHidden: true, input: "6\n0 0 0 0 0 0", expectedOutput: "0 0 0 0 0 0" },
    { isHidden: true, input: "4\n2 2 2 2", expectedOutput: "2 2 2 2" },
    { isHidden: true, input: "9\n1 0 2 1 0 2 1 0 2", expectedOutput: "0 0 0 1 1 1 2 2 2" },
    { isHidden: true, input: `300\n${Array.from({length: 300}, ()=>2).join(' ')}`, expectedOutput: Array.from({length: 300}, ()=>2).join(' ') },
    { isHidden: true, input: `300\n${Array.from({length: 300}, (_,i)=>2-(i%3)).join(' ')}`, expectedOutput: `${Array.from({length: 100}, ()=>0).join(' ')} ${Array.from({length: 100}, ()=>1).join(' ')} ${Array.from({length: 100}, ()=>2).join(' ')}` }
  ]
);

// ─── 14. MINIMUM SIZE SUBARRAY SUM (Medium - Sliding Window)
addProblem(
  'Sliding Window', 'Medium', 'Minimum Size Subarray Sum',
  'Given an array of positive integers nums and a positive integer target, return the minimal length of a contiguous subarray of which the sum is greater than or equal to target. If there is no such subarray, return 0 instead.',
  '1 <= target <= 10^9\n1 <= nums.length <= 10^5\n1 <= nums[i] <= 10^4',
  'Line 1: target. Line 2: N (size of nums). Line 3: N space-separated integers.',
  'A single integer.',
  'Input:\n7\n6\n2 3 1 2 4 3\nOutput:\n2',
  {
    python3: `import sys\n\ndef minSubArrayLen(target, nums):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    target = int(lines[0])\n    n = int(lines[1])\n    nums = [int(x) for x in lines[2:n+2]]\n    print(minSubArrayLen(target, nums))`,
    javascript: `const fs = require('fs');\nfunction minSubArrayLen(target, nums) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 2) {\n    const target = parseInt(input[0]);\n    const n = parseInt(input[1]);\n    const nums = input.slice(2, n+2).map(Number);\n    console.log(minSubArrayLen(target, nums));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint minSubArrayLen(int target, vector<int>& nums) {\n    return 0;\n}\n\nint main() {\n    int target, n; if(!(cin>>target>>n)) return 0;\n    vector<int> nums(n);\n    for(int i=0;i<n;i++) cin>>nums[i];\n    cout<<minSubArrayLen(target, nums)<<endl;\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static int minSubArrayLen(int target, int[] nums) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int target = sc.nextInt();\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n        System.out.println(minSubArrayLen(target, nums));\n    }\n}`
  },
  [
    { isHidden: false, input: "7\n6\n2 3 1 2 4 3", expectedOutput: "2" },
    { isHidden: false, input: "4\n3\n1 4 4", expectedOutput: "1" },
    { isHidden: false, input: "11\n8\n1 1 1 1 1 1 1 1", expectedOutput: "0" },
    { isHidden: true, input: "100\n5\n10 20 30 40 50", expectedOutput: "3" },
    { isHidden: true, input: "50\n5\n10 10 10 10 10", expectedOutput: "5" },
    { isHidden: true, input: "10\n1\n10", expectedOutput: "1" },
    { isHidden: true, input: "15\n1\n10", expectedOutput: "0" },
    { isHidden: true, input: "20\n6\n1 2 3 4 5 6", expectedOutput: "5" },
    { isHidden: true, input: `10000\n1000\n${Array.from({length: 1000}, ()=>10).join(' ')}`, expectedOutput: "1000" },
    { isHidden: true, input: `10000\n1000\n${Array.from({length: 1000}, (_,i)=>i==999?10000:1).join(' ')}`, expectedOutput: "1" }
  ]
);

// ─── 15. GROUP ANAGRAMS (Medium - Hashing)
addProblem(
  'Hashing', 'Medium', 'Group Anagrams',
  'Given an array of strings strs, group the anagrams together. Print the groups where each group has its strings sorted, and the groups themselves are sorted by their first element lexicographically.',
  '1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.',
  'Line 1: N. Line 2 to N+1: The strings.',
  'Each line contains a group of space-separated strings.',
  'Input:\n6\neat\ntea\ntan\nate\nnat\nbat\nOutput:\nate eat tea\nbat\nnat tan',
  {
    python3: `import sys\n\ndef groupAnagrams(strs):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    strs = lines[1:n+1]\n    res = groupAnagrams(strs)\n    for group in res:\n        group.sort()\n    res.sort(key=lambda x: x[0])\n    for group in res:\n        print(" ".join(group))`,
    javascript: `const fs = require('fs');\nfunction groupAnagrams(strs) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 0) {\n    const n = parseInt(input[0]);\n    const strs = input.slice(1, n+1);\n    let res = groupAnagrams(strs);\n    res.forEach(g => g.sort());\n    res.sort((a,b) => a[0].localeCompare(b[0]));\n    res.forEach(g => console.log(g.join(' ')));\n}`,
    cpp: `// Starter C++ Group Anagrams`,
    java: `// Starter Java Group Anagrams`
  },
  [
    { isHidden: false, input: "6\neat\ntea\ntan\nate\nnat\nbat", expectedOutput: "ate eat tea\nbat\nnat tan" },
    { isHidden: false, input: "1\na", expectedOutput: "a" },
    { isHidden: false, input: "1\n ", expectedOutput: "" },
    { isHidden: true, input: "2\nab\nba", expectedOutput: "ab ba" },
    { isHidden: true, input: "4\nabc\nbca\ncab\ncba", expectedOutput: "abc bca cab cba" },
    { isHidden: true, input: "3\na\na\na", expectedOutput: "a a a" },
    { isHidden: true, input: "4\nxyz\nabc\nzyx\ncba", expectedOutput: "abc cba\nxyz zyx" },
    { isHidden: true, input: "3\nzzz\nzzz\nzzz", expectedOutput: "zzz zzz zzz" },
    { isHidden: true, input: `10\n${Array.from({length: 10}, ()=> 'a'.repeat(50)).join('\n')}`, expectedOutput: Array.from({length: 10}, ()=> 'a'.repeat(50)).join(' ') },
    { isHidden: true, input: "2\nlisten\nsilent", expectedOutput: "listen silent" }
  ]
);

// ─── 16. TRAPPING RAIN WATER (Hard - Arrays)
addProblem(
  'Arrays', 'Hard', 'Trapping Rain Water',
  'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
  'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
  'Line 1: N. Line 2: N space-separated integers.',
  'Integer.',
  'Input:\n12\n0 1 0 2 1 0 1 3 2 1 2 1\nOutput:\n6',
  {
    python3: `import sys\n\ndef trap(height):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    height = [int(x) for x in lines[1:n+1]]\n    print(trap(height))`,
    javascript: `const fs = require('fs');\nfunction trap(height) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 1) {\n    const n = parseInt(input[0]);\n    const height = input.slice(1, n+1).map(Number);\n    console.log(trap(height));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint trap(vector<int>& height) { return 0; }\n\nint main() { int n; if(!(cin>>n)) return 0; vector<int> h(n); for(int i=0;i<n;i++) cin>>h[i]; cout<<trap(h)<<endl; return 0; }`,
    java: `import java.util.*; public class Main { public static int trap(int[] height) { return 0; } public static void main(String[] args) { Scanner sc = new Scanner(System.in); if(!sc.hasNextInt()) return; int n = sc.nextInt(); int[] h = new int[n]; for(int i=0;i<n;i++) h[i]=sc.nextInt(); System.out.println(trap(h)); } }`
  },
  [
    { isHidden: false, input: "12\n0 1 0 2 1 0 1 3 2 1 2 1", expectedOutput: "6" },
    { isHidden: false, input: "6\n4 2 0 3 2 5", expectedOutput: "9" },
    { isHidden: false, input: "1\n10", expectedOutput: "0" },
    { isHidden: true, input: "2\n10 10", expectedOutput: "0" },
    { isHidden: true, input: "3\n10 0 10", expectedOutput: "10" },
    { isHidden: true, input: "4\n10 5 5 10", expectedOutput: "10" },
    { isHidden: true, input: "5\n0 0 0 0 0", expectedOutput: "0" },
    { isHidden: true, input: "7\n1 2 3 4 5 6 7", expectedOutput: "0" },
    { isHidden: true, input: "7\n7 6 5 4 3 2 1", expectedOutput: "0" },
    { isHidden: true, input: `1000\n${Array.from({length: 1000}, (_,i)=> i%2==0 ? 10 : 0).join(' ')}`, expectedOutput: "4990" }
  ]
);

// ─── 17. MINIMUM WINDOW SUBSTRING (Hard - Strings)
addProblem(
  'Strings', 'Hard', 'Minimum Window Substring',
  'Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window. If there is no such substring, return the empty string.',
  'm == s.length\nn == t.length\n1 <= m, n <= 10^5\ns and t consist of uppercase and lowercase English letters.',
  'Line 1: string s. Line 2: string t.',
  'The minimum window substring.',
  'Input:\nADOBECODEBANC\nABC\nOutput:\nBANC',
  {
    python3: `import sys\n\ndef minWindow(s, t):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if len(lines) >= 2:\n        print(minWindow(lines[0], lines[1]))\n    else:\n        print("")`,
    javascript: `const fs = require('fs');\nfunction minWindow(s, t) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length >= 2) {\n    console.log(minWindow(input[0], input[1]));\n}`,
    cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nstring minWindow(string s, string t) { return ""; }\nint main() { string s, t; if(cin>>s>>t) cout<<minWindow(s,t)<<endl; return 0; }`,
    java: `import java.util.*; public class Main { public static String minWindow(String s, String t) { return ""; } public static void main(String[] args) { Scanner sc = new Scanner(System.in); if(sc.hasNext()) { String s = sc.next(); String t = sc.hasNext() ? sc.next() : ""; System.out.println(minWindow(s,t)); } } }`
  },
  [
    { isHidden: false, input: "ADOBECODEBANC\nABC", expectedOutput: "BANC" },
    { isHidden: false, input: "a\na", expectedOutput: "a" },
    { isHidden: false, input: "a\naa", expectedOutput: "" },
    { isHidden: true, input: "a\nb", expectedOutput: "" },
    { isHidden: true, input: "ab\nb", expectedOutput: "b" },
    { isHidden: true, input: "abcab\nab", expectedOutput: "ab" },
    { isHidden: true, input: "aabdec\nabc", expectedOutput: "abdec" },
    { isHidden: true, input: "zzzzzzzzz\nz", expectedOutput: "z" },
    { isHidden: true, input: `${'A'.repeat(50000)}B${'A'.repeat(50000)}\nAB`, expectedOutput: "AB" },
    { isHidden: true, input: `${'A'.repeat(50000)}B${'A'.repeat(50000)}\nBAA`, expectedOutput: "BAA" }
  ]
);

// ─── 18. EDIT DISTANCE (Hard - Dynamic Programming)
addProblem(
  'Dynamic Programming', 'Hard', 'Edit Distance',
  'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\nYou have the following three operations permitted on a word: Insert a character, Delete a character, Replace a character.',
  '0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.',
  'Line 1: word1. Line 2: word2.',
  'An integer.',
  'Input:\nhorse\nros\nOutput:\n3',
  {
    python3: `import sys\n\ndef minDistance(word1, word2):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    w1 = lines[0] if len(lines) > 0 else ""\n    w2 = lines[1] if len(lines) > 1 else ""\n    if w1 == "-" and len(lines)==1: w1=""\n    print(minDistance(w1, w2))`,
    javascript: `const fs = require('fs');\nfunction minDistance(word1, word2) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nconst w1 = input[0] || ""; const w2 = input[1] || "";\nconsole.log(minDistance(w1, w2));`,
    cpp: `#include <iostream>\n#include <string>\nusing namespace std;\nint minDistance(string word1, string word2) { return 0; }\nint main() { string w1, w2; cin>>w1>>w2; cout<<minDistance(w1,w2)<<endl; return 0; }`,
    java: `import java.util.*; public class Main { public static int minDistance(String word1, String word2) { return 0; } public static void main(String[] args) { Scanner sc = new Scanner(System.in); String w1 = sc.hasNext() ? sc.next() : ""; String w2 = sc.hasNext() ? sc.next() : ""; System.out.println(minDistance(w1,w2)); } }`
  },
  [
    { isHidden: false, input: "horse\nros", expectedOutput: "3" },
    { isHidden: false, input: "intention\nexecution", expectedOutput: "5" },
    { isHidden: false, input: "a\nb", expectedOutput: "1" },
    { isHidden: true, input: "abc\nabc", expectedOutput: "0" },
    { isHidden: true, input: "abc\n", expectedOutput: "3" },
    { isHidden: true, input: "\nabc", expectedOutput: "3" },
    { isHidden: true, input: "abcdef\nfedcba", expectedOutput: "6" },
    { isHidden: true, input: "z\nzzzz", expectedOutput: "3" },
    { isHidden: true, input: `${'a'.repeat(500)}\n${'b'.repeat(500)}`, expectedOutput: "500" },
    { isHidden: true, input: `${'a'.repeat(500)}\n${'a'.repeat(499)}b`, expectedOutput: "1" }
  ]
);

// ─── 19. REVERSE NODES IN K-GROUP (Hard - Linked Lists)
addProblem(
  'Linked Lists', 'Hard', 'Reverse Nodes in k-Group',
  'Given the head of a linked list, reverse the nodes of the list k at a time, and return the modified list.\nk is a positive integer and is less than or equal to the length of the linked list. If the number of nodes is not a multiple of k then left-out nodes, in the end, should remain as it is.',
  'The number of nodes in the list is n.\n1 <= k <= n <= 5000\n0 <= Node.val <= 1000',
  'Line 1: N. Line 2: N space-separated integers. Line 3: k.',
  'Space-separated integers.',
  'Input:\n5\n1 2 3 4 5\n2\nOutput:\n2 1 4 3 5',
  {
    python3: `import sys\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\ndef reverseKGroup(head, k):\n    pass\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    dummy = ListNode()\n    curr = dummy\n    for x in lines[1:n+1]:\n        curr.next = ListNode(int(x))\n        curr = curr.next\n    k = int(lines[n+1])\n    res = reverseKGroup(dummy.next, k)\n    out = []\n    while res:\n        out.append(str(res.val))\n        res = res.next\n    print(" ".join(out))`,
    javascript: `const fs = require('fs');\nclass ListNode { constructor(val, next=null) { this.val = val; this.next = next; } }\nfunction reverseKGroup(head, k) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length > 2) {\n    const n = parseInt(input[0]);\n    let dummy = new ListNode(0);\n    let curr = dummy;\n    for(let i=1; i<=n; i++) { curr.next = new ListNode(parseInt(input[i])); curr = curr.next; }\n    const k = parseInt(input[n+1]);\n    let res = reverseKGroup(dummy.next, k);\n    let out = [];\n    while(res) { out.push(res.val); res = res.next; }\n    console.log(out.join(' '));\n}`,
    cpp: `// Starter C++ Reverse k-Group`,
    java: `// Starter Java Reverse k-Group`
  },
  [
    { isHidden: false, input: "5\n1 2 3 4 5\n2", expectedOutput: "2 1 4 3 5" },
    { isHidden: false, input: "5\n1 2 3 4 5\n3", expectedOutput: "3 2 1 4 5" },
    { isHidden: false, input: "5\n1 2 3 4 5\n1", expectedOutput: "1 2 3 4 5" },
    { isHidden: true, input: "2\n1 2\n2", expectedOutput: "2 1" },
    { isHidden: true, input: "4\n1 2 3 4\n2", expectedOutput: "2 1 4 3" },
    { isHidden: true, input: "6\n1 2 3 4 5 6\n3", expectedOutput: "3 2 1 6 5 4" },
    { isHidden: true, input: "7\n1 2 3 4 5 6 7\n4", expectedOutput: "4 3 2 1 5 6 7" },
    { isHidden: true, input: "1\n10\n1", expectedOutput: "10" },
    { isHidden: true, input: "100\n" + Array.from({length: 100}, (_,i)=>i).join(' ') + "\n10", expectedOutput: Array.from({length: 10}, (_,i) => Array.from({length: 10}, (_,j) => i*10 + (9-j)).join(' ')).join(' ') },
    { isHidden: true, input: "100\n" + Array.from({length: 100}, (_,i)=>i).join(' ') + "\n100", expectedOutput: Array.from({length: 100}, (_,i)=>99-i).join(' ') }
  ]
);

// ─── 20. N-QUEENS (Hard - Recursion/Backtracking)
addProblem(
  'Recursion', 'Hard', 'N-Queens',
  'The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.\nGiven an integer n, return the number of distinct solutions to the n-queens puzzle.',
  '1 <= n <= 9',
  'A single integer n.',
  'An integer representing the total number of distinct solutions.',
  'Input:\n4\nOutput:\n2',
  {
    python3: `import sys\n\ndef totalNQueens(n: int) -> int:\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if lines: print(totalNQueens(int(lines[0])))`,
    javascript: `const fs = require('fs');\nfunction totalNQueens(n) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length) console.log(totalNQueens(parseInt(input[0])));`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint totalNQueens(int n) { return 0; }\n\nint main() { int n; if(cin>>n) cout<<totalNQueens(n)<<endl; return 0; }`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static int totalNQueens(int n) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextInt()) System.out.println(totalNQueens(sc.nextInt()));\n    }\n}`
  },
  [
    { isHidden: false, input: "4", expectedOutput: "2" },
    { isHidden: false, input: "1", expectedOutput: "1" },
    { isHidden: false, input: "8", expectedOutput: "92" },
    { isHidden: true, input: "2", expectedOutput: "0" },
    { isHidden: true, input: "3", expectedOutput: "0" },
    { isHidden: true, input: "5", expectedOutput: "10" },
    { isHidden: true, input: "6", expectedOutput: "4" },
    { isHidden: true, input: "7", expectedOutput: "40" },
    { isHidden: true, input: "9", expectedOutput: "352" },
    { isHidden: true, input: "8", expectedOutput: "92" }
  ]
);

fs.writeFileSync(path.join(__dirname, 'seed_data_3.json'), JSON.stringify(problems, null, 2));
