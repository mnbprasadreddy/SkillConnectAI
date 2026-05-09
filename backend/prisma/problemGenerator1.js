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

// ─── 1. TWO SUM II (Easy - Arrays)
addProblem(
  'Arrays', 'Easy', 'Two Sum II - Input Array Is Sorted',
  'Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.',
  '2 <= numbers.length <= 3 * 10^4\\n-1000 <= numbers[i] <= 1000',
  'First line: integer N. Second line: N space-separated integers. Third line: target integer.',
  'Two space-separated integers representing the 1-based indices.',
  'Input:\\n4\\n2 7 11 15\\n9\\nOutput:\\n1 2',
  {
    python3: `import sys\n\ndef twoSum(numbers, target):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    target = int(lines[n+1])\n    res = twoSum(nums, target)\n    print(f"{res[0]} {res[1]}")`,
    javascript: `const fs = require('fs');\nfunction twoSum(numbers, target) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length > 1) {\n    const n = parseInt(input[0]);\n    const nums = input.slice(1, n + 1).map(Number);\n    const target = parseInt(input[n + 1]);\n    const res = twoSum(nums, target);\n    console.log(res.join(' '));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nvector<int> twoSum(vector<int>& numbers, int target) {\n    return {};\n}\n\nint main() {\n    int n; if (!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int i=0; i<n; i++) cin >> nums[i];\n    int target; cin >> target;\n    vector<int> res = twoSum(nums, target);\n    cout << res[0] << " " << res[1] << endl;\n    return 0;\n}`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static int[] twoSum(int[] numbers, int target) {\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i=0; i<n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        int[] res = twoSum(nums, target);\n        System.out.println(res[0] + " " + res[1]);\n    }\n}`
  },
  [
    { isHidden: false, input: "4\n2 7 11 15\n9", expectedOutput: "1 2" },
    { isHidden: false, input: "3\n2 3 4\n6", expectedOutput: "1 3" },
    { isHidden: false, input: "2\n-1 0\n-1", expectedOutput: "1 2" },
    { isHidden: true, input: "2\n0 0\n0", expectedOutput: "1 2" },
    { isHidden: true, input: "5\n-1000 -500 0 500 1000\n0", expectedOutput: "2 4" },
    { isHidden: true, input: "5\n-1000 -500 0 500 1000\n-1500", expectedOutput: "1 2" },
    { isHidden: true, input: "4\n1 2 3 4\n7", expectedOutput: "3 4" },
    { isHidden: true, input: "6\n-10 -8 -2 1 5 9\n7", expectedOutput: "3 6" },
    { isHidden: true, input: `10000\n${Array.from({length: 10000}, (_,i) => i).join(' ')}\n19997`, expectedOutput: "9999 10000" },
    { isHidden: true, input: `10000\n${Array.from({length: 10000}, (_,i) => i).join(' ')}\n1`, expectedOutput: "1 2" }
  ]
);

// ─── 2. VALID ANAGRAM (Easy - Strings)
addProblem(
  'Strings', 'Easy', 'Valid Anagram',
  'Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
  '1 <= s.length, t.length <= 5 * 10^4\\ns and t consist of lowercase English letters.',
  'First line: string s. Second line: string t.',
  'true or false',
  'Input:\\nanagram\\nnagaram\\nOutput:\\ntrue',
  {
    python3: `import sys\n\ndef isAnagram(s: str, t: str) -> bool:\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if len(lines) >= 2:\n        print(str(isAnagram(lines[0], lines[1])).lower())\n    elif len(lines) == 1:\n        print('false')`,
    javascript: `const fs = require('fs');\nfunction isAnagram(s, t) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(isAnagram(input[0], input[1]) ? 'true' : 'false');\n}`,
    cpp: `#include <iostream>\n#include <string>\nusing namespace std;\n\nbool isAnagram(string s, string t) {\n    return false;\n}\n\nint main() {\n    string s, t; if(cin >> s >> t) {\n        cout << (isAnagram(s, t) ? "true" : "false") << endl;\n    }\n    return 0;\n}`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static boolean isAnagram(String s, String t) {\n        return false;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNext()) {\n            String s = sc.next();\n            String t = sc.hasNext() ? sc.next() : "";\n            System.out.println(isAnagram(s, t));\n        }\n    }\n}`
  },
  [
    { isHidden: false, input: "anagram\nnagaram", expectedOutput: "true" },
    { isHidden: false, input: "rat\ncar", expectedOutput: "false" },
    { isHidden: false, input: "a\na", expectedOutput: "true" },
    { isHidden: true, input: "a\nb", expectedOutput: "false" },
    { isHidden: true, input: "ab\na", expectedOutput: "false" },
    { isHidden: true, input: "zzzz\nzzzz", expectedOutput: "true" },
    { isHidden: true, input: "nl\ncx", expectedOutput: "false" },
    { isHidden: true, input: `${'a'.repeat(50000)}\n${'a'.repeat(50000)}`, expectedOutput: "true" },
    { isHidden: true, input: `${'a'.repeat(49999)}b\n${'a'.repeat(50000)}`, expectedOutput: "false" },
    { isHidden: true, input: `${'a'.repeat(25000)}${'b'.repeat(25000)}\n${'b'.repeat(25000)}${'a'.repeat(25000)}`, expectedOutput: "true" }
  ]
);

// ─── 3. MIDDLE OF THE LINKED LIST (Easy - Linked Lists)
addProblem(
  'Linked Lists', 'Easy', 'Middle of the Linked List',
  'Given the head of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.',
  'The number of nodes in the list is in the range [1, 100].',
  'First line: integer N (number of nodes). Second line: N space-separated integers.',
  'Space-separated integers representing the values of the list from the middle node to the end.',
  'Input:\\n5\\n1 2 3 4 5\\nOutput:\\n3 4 5',
  {
    python3: `import sys\n\nclass ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef middleNode(head: ListNode) -> ListNode:\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    if n == 0: exit()\n    dummy = ListNode()\n    curr = dummy\n    for x in lines[1:n+1]:\n        curr.next = ListNode(int(x))\n        curr = curr.next\n    res = middleNode(dummy.next)\n    out = []\n    while res:\n        out.append(str(res.val))\n        res = res.next\n    print(" ".join(out))`,
    javascript: `const fs = require('fs');\nclass ListNode { constructor(val, next=null) { this.val = val; this.next = next; } }\nfunction middleNode(head) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length > 1) {\n    const n = parseInt(input[0]);\n    let dummy = new ListNode(0);\n    let curr = dummy;\n    for(let i=1; i<=n; i++) { curr.next = new ListNode(parseInt(input[i])); curr = curr.next; }\n    let res = middleNode(dummy.next);\n    let out = [];\n    while(res) { out.push(res.val); res = res.next; }\n    console.log(out.join(' '));\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nstruct ListNode {\n    int val;\n    ListNode *next;\n    ListNode(int x) : val(x), next(NULL) {}\n};\n\nListNode* middleNode(ListNode* head) {\n    return head;\n}\n\nint main() {\n    int n; if (!(cin >> n)) return 0;\n    ListNode* dummy = new ListNode(0);\n    ListNode* curr = dummy;\n    for(int i=0; i<n; i++) {\n        int val; cin >> val;\n        curr->next = new ListNode(val);\n        curr = curr->next;\n    }\n    ListNode* res = middleNode(dummy->next);\n    while(res) { cout << res->val << (res->next ? " " : ""); res = res->next; }\n    cout << endl;\n    return 0;\n}`,
    java: `import java.util.Scanner;\n\nclass ListNode {\n    int val;\n    ListNode next;\n    ListNode(int x) { val = x; }\n}\n\npublic class Main {\n    public static ListNode middleNode(ListNode head) {\n        return head;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        ListNode dummy = new ListNode(0);\n        ListNode curr = dummy;\n        for (int i=0; i<n; i++) {\n            curr.next = new ListNode(sc.nextInt());\n            curr = curr.next;\n        }\n        ListNode res = middleNode(dummy.next);\n        while(res != null) {\n            System.out.print(res.val + (res.next != null ? " " : ""));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}`
  },
  [
    { isHidden: false, input: "5\n1 2 3 4 5", expectedOutput: "3 4 5" },
    { isHidden: false, input: "6\n1 2 3 4 5 6", expectedOutput: "4 5 6" },
    { isHidden: false, input: "1\n10", expectedOutput: "10" },
    { isHidden: true, input: "2\n1 2", expectedOutput: "2" },
    { isHidden: true, input: "3\n1 2 3", expectedOutput: "2 3" },
    { isHidden: true, input: "100\n" + Array.from({length: 100}, (_,i) => i).join(' '), expectedOutput: Array.from({length: 50}, (_,i) => i+50).join(' ') },
    { isHidden: true, input: "99\n" + Array.from({length: 99}, (_,i) => i).join(' '), expectedOutput: Array.from({length: 50}, (_,i) => i+49).join(' ') },
    { isHidden: true, input: "4\n100 100 100 100", expectedOutput: "100 100" },
    { isHidden: true, input: "7\n9 8 7 6 5 4 3", expectedOutput: "6 5 4 3" },
    { isHidden: true, input: "8\n1 1 1 1 2 2 2 2", expectedOutput: "2 2 2 2" }
  ]
);

// ─── 4. BINARY SEARCH (Easy - Searching)
addProblem(
  'Searching', 'Easy', 'Binary Search',
  'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
  '1 <= nums.length <= 10^4\\n-10^4 < nums[i], target < 10^4\\nAll the integers in nums are unique.\\nnums is sorted in ascending order.',
  'First line: N (array size). Second line: N space-separated integers. Third line: target.',
  'A single integer, the index of target or -1.',
  'Input:\\n6\\n-1 0 3 5 9 12\\n9\\nOutput:\\n4',
  {
    python3: `import sys\n\ndef search(nums, target):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    target = int(lines[n+1])\n    print(search(nums, target))`,
    javascript: `const fs = require('fs');\nfunction search(nums, target) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 1) {\n    const n = parseInt(input[0]);\n    const nums = input.slice(1, n+1).map(Number);\n    const target = parseInt(input[n+1]);\n    console.log(search(nums, target));\n}`,
    cpp: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint search(vector<int>& nums, int target) {\n    return -1;\n}\n\nint main() {\n    int n; if(!(cin >> n)) return 0;\n    vector<int> nums(n);\n    for(int i=0; i<n; i++) cin >> nums[i];\n    int target; cin >> target;\n    cout << search(nums, target) << endl;\n    return 0;\n}`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static int search(int[] nums, int target) {\n        return -1;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for(int i=0; i<n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        System.out.println(search(nums, target));\n    }\n}`
  },
  [
    { isHidden: false, input: "6\n-1 0 3 5 9 12\n9", expectedOutput: "4" },
    { isHidden: false, input: "6\n-1 0 3 5 9 12\n2", expectedOutput: "-1" },
    { isHidden: false, input: "1\n5\n5", expectedOutput: "0" },
    { isHidden: true, input: "1\n5\n-5", expectedOutput: "-1" },
    { isHidden: true, input: "2\n2 5\n2", expectedOutput: "0" },
    { isHidden: true, input: "2\n2 5\n5", expectedOutput: "1" },
    { isHidden: true, input: "2\n2 5\n0", expectedOutput: "-1" },
    { isHidden: true, input: `10000\n${Array.from({length: 10000}, (_,i) => i-5000).join(' ')}\n4999`, expectedOutput: "9999" },
    { isHidden: true, input: `10000\n${Array.from({length: 10000}, (_,i) => i-5000).join(' ')}\n-5000`, expectedOutput: "0" },
    { isHidden: true, input: `10000\n${Array.from({length: 10000}, (_,i) => i-5000).join(' ')}\n10000`, expectedOutput: "-1" }
  ]
);

// ─── 5. FIBONACCI NUMBER (Easy - Recursion)
addProblem(
  'Recursion', 'Easy', 'Fibonacci Number',
  'The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. Given n, calculate F(n).',
  '0 <= n <= 30',
  'A single integer n.',
  'A single integer representing F(n).',
  'Input:\\n2\\nOutput:\\n1',
  {
    python3: `import sys\n\ndef fib(n: int) -> int:\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if lines: print(fib(int(lines[0])))`,
    javascript: `const fs = require('fs');\nfunction fib(n) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length) console.log(fib(parseInt(input[0])));`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint fib(int n) {\n    return 0;\n}\n\nint main() {\n    int n; if(cin >> n) cout << fib(n) << endl;\n    return 0;\n}`,
    java: `import java.util.Scanner;\n\npublic class Main {\n    public static int fib(int n) {\n        return 0;\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextInt()) System.out.println(fib(sc.nextInt()));\n    }\n}`
  },
  [
    { isHidden: false, input: "2", expectedOutput: "1" },
    { isHidden: false, input: "3", expectedOutput: "2" },
    { isHidden: false, input: "4", expectedOutput: "3" },
    { isHidden: true, input: "0", expectedOutput: "0" },
    { isHidden: true, input: "1", expectedOutput: "1" },
    { isHidden: true, input: "5", expectedOutput: "5" },
    { isHidden: true, input: "10", expectedOutput: "55" },
    { isHidden: true, input: "20", expectedOutput: "6765" },
    { isHidden: true, input: "25", expectedOutput: "75025" },
    { isHidden: true, input: "30", expectedOutput: "832040" }
  ]
);

// ─── 6. INTERSECTION OF TWO ARRAYS (Easy - Hashing)
addProblem(
  'Hashing', 'Easy', 'Intersection of Two Arrays',
  'Given two integer arrays nums1 and nums2, return an array of their intersection. Each element in the result must be unique and you may return the result in any order. (Print sorted).',
  '1 <= nums1.length, nums2.length <= 1000',
  'Line 1: N\\nLine 2: N integers\\nLine 3: M\\nLine 4: M integers',
  'Space separated sorted unique intersection.',
  'Input:\\n4\\n1 2 2 1\\n2\\n2 2\\nOutput:\\n2',
  {
    python3: `import sys\n\ndef intersection(nums1, nums2):\n    pass\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if not lines: exit()\n    n = int(lines[0])\n    nums1 = [int(x) for x in lines[1:n+1]]\n    m = int(lines[n+1])\n    nums2 = [int(x) for x in lines[n+2:n+2+m]]\n    res = intersection(nums1, nums2)\n    print(" ".join(map(str, sorted(res))))`,
    javascript: `const fs = require('fs');\nfunction intersection(nums1, nums2) {}\n\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length > 2) {\n    const n = parseInt(input[0]);\n    const nums1 = input.slice(1, n+1).map(Number);\n    const m = parseInt(input[n+1]);\n    const nums2 = input.slice(n+2, n+2+m).map(Number);\n    let res = intersection(nums1, nums2);\n    res.sort((a,b)=>a-b);\n    console.log(res.join(' '));\n}`,
    cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nvector<int> intersection(vector<int>& nums1, vector<int>& nums2) {\n    return {};\n}\n\nint main() {\n    int n; if(!(cin>>n)) return 0;\n    vector<int> n1(n); for(int i=0;i<n;i++) cin>>n1[i];\n    int m; cin>>m;\n    vector<int> n2(m); for(int i=0;i<m;i++) cin>>n2[i];\n    vector<int> res = intersection(n1, n2);\n    sort(res.begin(), res.end());\n    for(int i=0;i<res.size();i++) cout<<res[i]<<(i==res.size()-1?"":" ");\n    cout<<endl;\n    return 0;\n}`,
    java: `import java.util.*;\n\npublic class Main {\n    public static int[] intersection(int[] nums1, int[] nums2) {\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] n1 = new int[n];\n        for(int i=0;i<n;i++) n1[i]=sc.nextInt();\n        int m = sc.nextInt();\n        int[] n2 = new int[m];\n        for(int i=0;i<m;i++) n2[i]=sc.nextInt();\n        int[] res = intersection(n1, n2);\n        Arrays.sort(res);\n        for(int i=0;i<res.length;i++) System.out.print(res[i] + (i==res.length-1?"":" "));\n        System.out.println();\n    }\n}`
  },
  [
    { isHidden: false, input: "4\n1 2 2 1\n2\n2 2", expectedOutput: "2" },
    { isHidden: false, input: "3\n4 9 5\n5\n9 4 9 8 4", expectedOutput: "4 9" },
    { isHidden: false, input: "1\n1\n1\n2", expectedOutput: "" },
    { isHidden: true, input: "10\n1 1 1 1 1 1 1 1 1 1\n10\n1 1 1 1 1 1 1 1 1 1", expectedOutput: "1" },
    { isHidden: true, input: "3\n1 2 3\n3\n4 5 6", expectedOutput: "" },
    { isHidden: true, input: "5\n0 0 0 0 0\n1\n0", expectedOutput: "0" },
    { isHidden: true, input: "2\n1000 1000\n2\n1000 1000", expectedOutput: "1000" },
    { isHidden: true, input: `1000\n${Array.from({length: 1000}, (_,i) => i).join(' ')}\n1\n500`, expectedOutput: "500" },
    { isHidden: true, input: `1000\n${Array.from({length: 1000}, (_,i) => i).join(' ')}\n1000\n${Array.from({length: 1000}, (_,i) => i).join(' ')}`, expectedOutput: Array.from({length: 1000}, (_,i) => i).join(' ') },
    { isHidden: true, input: "5\n2 4 6 8 10\n5\n1 3 5 7 9", expectedOutput: "" }
  ]
);

fs.writeFileSync(path.join(__dirname, 'seed_data_1.json'), JSON.stringify(problems, null, 2));
