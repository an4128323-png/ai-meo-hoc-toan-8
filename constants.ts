
export const MATH_TOPICS = [
  {
    title: "7 Hằng đẳng thức đáng nhớ",
    slug: "identities",
    lessons: [
      { id: "id1", title: "Bình phương của một tổng", formula: "(a + b)² = a² + 2ab + b²", example: "(x + 2)² = x² + 4x + 4" },
      { id: "id2", title: "Bình phương của một hiệu", formula: "(a - b)² = a² - 2ab + b²", example: "(x - 3)² = x² - 6x + 9" },
      { id: "id3", title: "Hiệu hai bình phương", formula: "a² - b² = (a - b)(a + b)", example: "x² - 9 = (x - 3)(x + 3)" },
      { id: "id4", title: "Lập phương của một tổng", formula: "(a + b)³ = a³ + 3a²b + 3ab² + b³", example: "(x + 1)³ = x³ + 3x² + 3x + 1" },
      { id: "id5", title: "Lập phương của một hiệu", formula: "(a - b)³ = a³ - 3a²b + 3ab² - b³", example: "(x - 2)³ = x³ - 6x² + 12x - 8" },
      { id: "id6", title: "Tổng hai lập phương", formula: "a³ + b³ = (a + b)(a² - ab + b²)", example: "x³ + 8 = (x + 2)(x² - 2x + 4)" },
      { id: "id7", title: "Hiệu hai lập phương", formula: "a³ - b³ = (a - b)(a² + ab + b²)", example: "x³ - 27 = (x - 3)(x² + 3x + 9)" }
    ]
  },
  {
    title: "Phân tích đa thức thành nhân tử",
    slug: "factoring",
    lessons: [
      { id: "ft1", title: "Đặt nhân tử chung", formula: "ab + ac = a(b + c)", example: "2x + 4 = 2(x + 2)" },
      { id: "ft2", title: "Dùng hằng đẳng thức", formula: "x² - y² = (x - y)(x + y)", example: "4x² - 1 = (2x - 1)(2x + 1)" },
      { id: "ft3", title: "Nhóm hạng tử", formula: "ax + ay + bx + by", example: "(ax + ay) + (bx + by) = a(x+y) + b(x+y) = (a+b)(x+y)" }
    ]
  }
];

export const APP_COLOR = {
  primary: '#6c63ff',
  secondary: '#ff6584',
  bg: '#0b1220',
  card: '#111a2e',
  text: '#ffffff',
  muted: '#b5c0ff'
};
