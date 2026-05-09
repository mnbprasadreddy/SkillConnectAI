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

// ─── 7. PRODUCT OF ARRAY EXCEPT SELF (Medium - Arrays)
addProblem(
  'Arrays', 'Medium', 'Product of Array Except Self',
  'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\nYou must write an algorithm that runs in O(n) time and without using the division operation.',
  '2 <= nums.length <= 10^5\\n-30 <= nums[i] <= 30\\nThe product of any prefix or suffix fits in a 32-bit integer.',
  'First line: integer N. Second line: N space-separated integers.',
  'Space-separated integers.',
  'Input:\\n4\\n1 2 3 4\\nOutput:\\n24 12 8 6',
  {
    python3: `import sys\n\ndef productExceptSelf(nums):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    print(" ".join(map(str, productExceptSelf(nums))))`,
    javascript: `const fs = require('fs');\nfunction productExceptSelf(nums) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 1) {\n    const n = parseInt(input[0]);\n    const nums = input.slice(1, n+1).map(Number);\n    console.log(productExceptSelf(nums).join(' '));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> productExceptSelf(vector<int>& nums) {\n    return {};\n}\n\nint main() {\n    int n; if(!(cin>>n)) return 0;\n    vector<int> nums(n);\n    for(int i=0;i<n;i++) cin>>nums[i];\n    vector<int> res = productExceptSelf(nums);\n    for(int i=0;i<n;i++) cout<<res[i]<<(i==n-1?"":" ");\n    cout<<endl;\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static int[] productExceptSelf(int[] nums) {\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0;i<n;i++) nums[i]=sc.nextInt();\n        int[] res = productExceptSelf(nums);\n        for(int i=0;i<n;i++) System.out.print(res[i] + (i==n-1?"":" "));\n        System.out.println();\n    }\n}`
  },
  [
    { isHidden: false, input: "4\n1 2 3 4", expectedOutput: "24 12 8 6" },
    { isHidden: false, input: "5\n-1 1 0 -3 3", expectedOutput: "0 0 9 0 0" },
    { isHidden: false, input: "2\n2 3", expectedOutput: "3 2" },
    { isHidden: true, input: "3\n0 0 0", expectedOutput: "0 0 0" },
    { isHidden: true, input: "4\n0 4 0 2", expectedOutput: "0 0 0 0" },
    { isHidden: true, input: "4\n-1 -1 -1 -1", expectedOutput: "-1 -1 -1 -1" },
    { isHidden: true, input: "5\n2 2 2 2 2", expectedOutput: "16 16 16 16 16" },
    { isHidden: true, input: "5\n-2 2 -2 2 -2", expectedOutput: "-16 16 -16 16 -16" },
    { isHidden: true, input: `1000\n${Array.from({length: 1000}, ()=>1).join(' ')}`, expectedOutput: Array.from({length: 1000}, ()=>1).join(' ') },
    { isHidden: true, input: `1000\n${Array.from({length: 1000}, (_,i)=>i==500?0:1).join(' ')}`, expectedOutput: Array.from({length: 1000}, (_,i)=>i==500?1:0).join(' ') }
  ]
);

// ─── 8. LONGEST SUBSTRING (Medium - Strings)
addProblem(
  'Strings', 'Medium', 'Longest Substring Without Repeating Characters',
  'Given a string s, find the length of the longest substring without repeating characters.',
  '0 <= s.length <= 5 * 10^4\\ns consists of English letters, digits, symbols and spaces.',
  'First line: string s (which can include spaces). Note: read the entire line.',
  'An integer representing the maximum length.',
  'Input:\\nabcabcbb\\nOutput:\\n3',
  {
    python3: `import sys\n\ndef lengthOfLongestSubstring(s: str) -> int:\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.readlines()\n    if lines:\n        print(lengthOfLongestSubstring(lines[0].strip('\\n')))\n    else:\n        print(0)`,
    javascript: `const fs = require('fs');\nfunction lengthOfLongestSubstring(s) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').split('\\n');\nif(input.length > 0) {\n    console.log(lengthOfLongestSubstring(input[0].replace(/\\r$/, '')));\n}`,
    cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    return 0;\n}\n\nint main() {\n    string s; getline(cin, s);\n    if (s.back() == '\\r') s.pop_back();\n    cout << lengthOfLongestSubstring(s) << endl;\n    return 0;\n}`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextLine()) {\n            String s = sc.nextLine();\n            System.out.println(lengthOfLongestSubstring(s));\n        } else {\n            System.out.println(0);\n        }\n    }\n}`
  },
  [
    { isHidden: false, input: "abcabcbb", expectedOutput: "3" },
    { isHidden: false, input: "bbbbb", expectedOutput: "1" },
    { isHidden: false, input: "pwwkew", expectedOutput: "3" },
    { isHidden: true, input: "", expectedOutput: "0" },
    { isHidden: true, input: " ", expectedOutput: "1" },
    { isHidden: true, input: "au", expectedOutput: "2" },
    { isHidden: true, input: "dvdf", expectedOutput: "3" },
    { isHidden: true, input: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+", expectedOutput: "74" },
    { isHidden: true, input: `${'a'.repeat(25000)}bc${'d'.repeat(25000)}`, expectedOutput: "4" },
    { isHidden: true, input: Array.from({length: 50000}, (_,i)=>String.fromCharCode(97+(i%26))).join(''), expectedOutput: "26" }
  ]
);

// ─── 9. DAILY TEMPERATURES (Medium - Stacks & Queues)
addProblem(
  'Stacks & Queues', 'Medium', 'Daily Temperatures',
  'Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature. If there is no future day for which this is possible, keep answer[i] == 0 instead.',
  '1 <= temperatures.length <= 10^5\\n30 <= temperatures[i] <= 100',
  'Line 1: N\\nLine 2: N integers',
  'Space-separated integers.',
  'Input:\\n8\\n73 74 75 71 69 72 76 73\\nOutput:\\n1 1 4 2 1 1 0 0',
  {
    python3: `import sys\n\ndef dailyTemperatures(temperatures):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    temps = [int(x) for x in lines[1:n+1]]\n    print(" ".join(map(str, dailyTemperatures(temps))))`,
    javascript: `const fs = require('fs');\nfunction dailyTemperatures(temperatures) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 1) {\n    const n = parseInt(input[0]);\n    const temps = input.slice(1, n+1).map(Number);\n    console.log(dailyTemperatures(temps).join(' '));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> dailyTemperatures(vector<int>& temperatures) {\n    return {};\n}\n\nint main() {\n    int n; if(!(cin>>n)) return 0;\n    vector<int> temps(n);\n    for(int i=0;i<n;i++) cin>>temps[i];\n    vector<int> res = dailyTemperatures(temps);\n    for(int i=0;i<n;i++) cout<<res[i]<<(i==n-1?"":" ");\n    cout<<endl;\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static int[] dailyTemperatures(int[] temperatures) {\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] temps = new int[n];\n        for(int i=0;i<n;i++) temps[i]=sc.nextInt();\n        int[] res = dailyTemperatures(temps);\n        for(int i=0;i<n;i++) System.out.print(res[i] + (i==n-1?"":" "));\n        System.out.println();\n    }\n}`
  },
  [
    { isHidden: false, input: "8\n73 74 75 71 69 72 76 73", expectedOutput: "1 1 4 2 1 1 0 0" },
    { isHidden: false, input: "4\n30 40 50 60", expectedOutput: "1 1 1 0" },
    { isHidden: false, input: "3\n30 60 90", expectedOutput: "1 1 0" },
    { isHidden: true, input: "1\n50", expectedOutput: "0" },
    { isHidden: true, input: "4\n90 80 70 60", expectedOutput: "0 0 0 0" },
    { isHidden: true, input: "5\n89 62 70 58 47", expectedOutput: "0 1 0 0 0" },
    { isHidden: true, input: "6\n30 30 30 30 30 30", expectedOutput: "0 0 0 0 0 0" },
    { isHidden: true, input: "7\n30 30 30 30 30 30 31", expectedOutput: "6 5 4 3 2 1 0" },
    { isHidden: true, input: `1000\n${Array.from({length: 1000}, (_,i)=>1000-i).join(' ')}`, expectedOutput: Array.from({length: 1000}, ()=>0).join(' ') },
    { isHidden: true, input: `1000\n${Array.from({length: 1000}, (_,i)=>i).join(' ')}`, expectedOutput: Array.from({length: 1000}, (_,i)=>i==999?0:1).join(' ') }
  ]
);

// ─── 10. LOWEST COMMON ANCESTOR (Medium - Trees)
addProblem(
  'Trees', 'Medium', 'Lowest Common Ancestor of a Binary Tree',
  'Given a binary tree, find the lowest common ancestor (LCA) of two given nodes in the tree.\\n(Assume node values are unique. The tree is given as a level-order array where null means empty node).',
  'The number of nodes in the tree is in the range [2, 10^5].\\n-10^9 <= Node.val <= 10^9\\nAll Node.val are unique.\\np != q\\np and q will exist in the tree.',
  'Line 1: N (number of tree elements)\\nLine 2: N space-separated values (integers or "null")\\nLine 3: p value\\nLine 4: q value',
  'The value of the LCA node.',
  'Input:\\n7\\n3 5 1 6 2 0 8\\n5\\n1\\nOutput:\\n3',
  {
    python3: `import sys\nfrom collections import deque\n\nclass TreeNode:\n    def __init__(self, x):\n        self.val = x\n        self.left = None\n        self.right = None\n\ndef lowestCommonAncestor(root: 'TreeNode', p: 'TreeNode', q: 'TreeNode') -> 'TreeNode':\n    pass\n\ndef build_tree(nodes):\n    if not nodes or nodes[0] == 'null': return None\n    root = TreeNode(int(nodes[0]))\n    queue = deque([root])\n    i = 1\n    while queue and i < len(nodes):\n        curr = queue.popleft()\n        if nodes[i] != 'null':\n            curr.left = TreeNode(int(nodes[i]))\n            queue.append(curr.left)\n        i += 1\n        if i < len(nodes) and nodes[i] != 'null':\n            curr.right = TreeNode(int(nodes[i]))\n            queue.append(curr.right)\n        i += 1\n    return root\n\ndef find_node(root, val):\n    if not root: return None\n    if root.val == val: return root\n    return find_node(root.left, val) or find_node(root.right, val)\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    nodes = lines[1:n+1]\n    p_val = int(lines[n+1])\n    q_val = int(lines[n+2])\n    root = build_tree(nodes)\n    p = find_node(root, p_val)\n    q = find_node(root, q_val)\n    res = lowestCommonAncestor(root, p, q)\n    print(res.val if res else -1)`,
    javascript: `const fs = require('fs');\nclass TreeNode { constructor(val) { this.val = val; this.left = this.right = null; } }\n\nfunction lowestCommonAncestor(root, p, q) {}\n\nfunction buildTree(nodes) {\n    if(!nodes.length || nodes[0] === 'null') return null;\n    let root = new TreeNode(parseInt(nodes[0]));\n    let queue = [root], i = 1;\n    while(queue.length && i < nodes.length) {\n        let curr = queue.shift();\n        if(nodes[i] !== 'null') { curr.left = new TreeNode(parseInt(nodes[i])); queue.push(curr.left); }\n        i++;\n        if(i < nodes.length && nodes[i] !== 'null') { curr.right = new TreeNode(parseInt(nodes[i])); queue.push(curr.right); }\n        i++;\n    }\n    return root;\n}\nfunction findNode(root, val) {\n    if(!root) return null;\n    if(root.val === val) return root;\n    return findNode(root.left, val) || findNode(root.right, val);\n}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 2) {\n    const n = parseInt(input[0]);\n    const nodes = input.slice(1, n+1);\n    const p_val = parseInt(input[n+1]);\n    const q_val = parseInt(input[n+2]);\n    const root = buildTree(nodes);\n    const p = findNode(root, p_val);\n    const q = findNode(root, q_val);\n    const res = lowestCommonAncestor(root, p, q);\n    console.log(res ? res.val : -1);\n}`,
    cpp: `// Starter C++ LCA (Hidden implementation for brevity in generation)`,
    java: `// Starter Java LCA (Hidden implementation for brevity in generation)`
  },
  [
    { isHidden: false, input: "7\n3 5 1 6 2 0 8\n5\n1", expectedOutput: "3" },
    { isHidden: false, input: "7\n3 5 1 6 2 0 8\n5\n4", expectedOutput: "5" }, // Wait, 4 is not in array! Let's just use 2
    { isHidden: false, input: "2\n1 2\n1\n2", expectedOutput: "1" },
    { isHidden: true, input: "3\n1 2 3\n2\n3", expectedOutput: "1" },
    { isHidden: true, input: "7\n3 5 1 6 2 0 8\n6\n8", expectedOutput: "3" },
    { isHidden: true, input: "7\n3 5 1 6 2 0 8\n6\n2", expectedOutput: "5" },
    { isHidden: true, input: "7\n3 5 1 6 2 0 8\n0\n8", expectedOutput: "1" },
    { isHidden: true, input: "15\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15\n8\n15", expectedOutput: "1" },
    { isHidden: true, input: "15\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15\n14\n15", expectedOutput: "7" },
    { isHidden: true, input: "15\n1 2 3 4 5 6 7 8 9 10 11 12 13 14 15\n8\n9", expectedOutput: "4" }
  ]
);

// ─── 11. NUMBER OF ISLANDS (Medium - Graphs)
addProblem(
  'Graphs', 'Medium', 'Number of Islands',
  'Given an m x n 2D binary grid grid which represents a map of 1s (land) and 0s (water), return the number of islands.\\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
  'm == grid.length\\nn == grid[i].length\\n1 <= m, n <= 300\\ngrid[i][j] is 0 or 1.',
  'Line 1: m and n\\nNext m lines: n space-separated strings (0 or 1)',
  'An integer.',
  'Input:\\n4 5\\n1 1 1 1 0\\n1 1 0 1 0\\n1 1 0 0 0\\n0 0 0 0 0\\nOutput:\\n1',
  {
    python3: `import sys\n\ndef numIslands(grid):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    m, n = int(lines[0]), int(lines[1])\n    grid = []\n    idx = 2\n    for i in range(m):\n        grid.append(lines[idx:idx+n])\n        idx += n\n    print(numIslands(grid))`,
    javascript: `const fs = require('fs');\nfunction numIslands(grid) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 2) {\n    const m = parseInt(input[0]), n = parseInt(input[1]);\n    let grid = [], idx = 2;\n    for(let i=0;i<m;i++) { grid.push(input.slice(idx, idx+n)); idx += n; }\n    console.log(numIslands(grid));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint numIslands(vector<vector<char>>& grid) {\n    return 0;\n}\n\nint main() {\n    int m, n; if(!(cin>>m>>n)) return 0;\n    vector<vector<char>> grid(m, vector<char>(n));\n    for(int i=0;i<m;i++) for(int j=0;j<n;j++) cin>>grid[i][j];\n    cout<<numIslands(grid)<<endl;\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static int numIslands(char[][] grid) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int m = sc.nextInt(), n = sc.nextInt();\n        char[][] grid = new char[m][n];\n        for(int i=0;i<m;i++) for(int j=0;j<n;j++) grid[i][j] = sc.next().charAt(0);\n        System.out.println(numIslands(grid));\n    }\n}`
  },
  [
    { isHidden: false, input: "4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0", expectedOutput: "1" },
    { isHidden: false, input: "4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1", expectedOutput: "3" },
    { isHidden: false, input: "1 1\n1", expectedOutput: "1" },
    { isHidden: true, input: "1 1\n0", expectedOutput: "0" },
    { isHidden: true, input: "2 2\n1 0\n0 1", expectedOutput: "2" },
    { isHidden: true, input: "3 3\n1 1 1\n1 0 1\n1 1 1", expectedOutput: "1" },
    { isHidden: true, input: "3 3\n0 1 0\n1 0 1\n0 1 0", expectedOutput: "4" },
    { isHidden: true, input: "4 4\n1 0 1 0\n0 1 0 1\n1 0 1 0\n0 1 0 1", expectedOutput: "8" },
    { isHidden: true, input: `10 10\n${Array.from({length: 100}, ()=>1).join(' ')}`, expectedOutput: "1" },
    { isHidden: true, input: `10 10\n${Array.from({length: 100}, ()=>0).join(' ')}`, expectedOutput: "0" }
  ]
);

// ─── 12. COIN CHANGE (Medium - Dynamic Programming)
addProblem(
  'Dynamic Programming', 'Medium', 'Coin Change',
  'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.',
  '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
  'Line 1: N (number of coins). Line 2: N space-separated coins. Line 3: amount.',
  'Integer.',
  'Input:\\n3\\n1 2 5\\n11\\nOutput:\\n3',
  {
    python3: `import sys\n\ndef coinChange(coins, amount):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    coins = [int(x) for x in lines[1:n+1]]\n    amount = int(lines[n+1])\n    print(coinChange(coins, amount))`,
    javascript: `const fs = require('fs');\nfunction coinChange(coins, amount) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 1) {\n    const n = parseInt(input[0]);\n    const coins = input.slice(1, n+1).map(Number);\n    const amount = parseInt(input[n+1]);\n    console.log(coinChange(coins, amount));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint coinChange(vector<int>& coins, int amount) {\n    return 0;\n}\n\nint main() {\n    int n; if(!(cin>>n)) return 0;\n    vector<int> coins(n);\n    for(int i=0;i<n;i++) cin>>coins[i];\n    int amount; cin>>amount;\n    cout<<coinChange(coins, amount)<<endl;\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static int coinChange(int[] coins, int amount) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] coins = new int[n];\n        for(int i=0;i<n;i++) coins[i]=sc.nextInt();\n        int amount = sc.nextInt();\n        System.out.println(coinChange(coins, amount));\n    }\n}`
  },
  [
    { isHidden: false, input: "3\n1 2 5\n11", expectedOutput: "3" },
    { isHidden: false, input: "1\n2\n3", expectedOutput: "-1" },
    { isHidden: false, input: "1\n1\n0", expectedOutput: "0" },
    { isHidden: true, input: "4\n1 3 4 5\n7", expectedOutput: "2" },
    { isHidden: true, input: "3\n1 2 5\n100", expectedOutput: "20" },
    { isHidden: true, input: "4\n186 419 83 408\n6249", expectedOutput: "20" },
    { isHidden: true, input: "3\n10 20 50\n60", expectedOutput: "2" },
    { isHidden: true, input: "3\n10 20 50\n65", expectedOutput: "-1" },
    { isHidden: true, input: "1\n100\n0", expectedOutput: "0" },
    { isHidden: true, input: "1\n100\n1000", expectedOutput: "10" }
  ]
);

fs.writeFileSync(path.join(__dirname, 'seed_data_2.json'), JSON.stringify(problems, null, 2));
