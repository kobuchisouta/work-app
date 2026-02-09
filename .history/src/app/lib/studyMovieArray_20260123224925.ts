import type { StudyMovieType } from "@/app/type/StudyMovieType";

export const studyMovieArray: StudyMovieType[] = [
  {
    title: "バージョンと宣言",
    text: "初めてでも大丈夫",
    videoId: "KkXRYCwlbIE",
    about:
      "HTMLのバージョンの変遷と、DOCTYPE宣言の役割について学習します。HTML1.0からHTML5までの進化を振り返り、なぜDOCTYPE宣言が必要なのか、ブラウザの描画モードにどのような影響を与えるのかを理解することで、正しいHTML文書構造の基礎を身につけます。",
    skillTags: ["HTML"],
    durationSec: 1024,
  },
  {
    title: "JS 入門1",
    text: "初めてでも大丈夫",
    videoId: "QCjFPSO96RU",
    about:
      "JavaScriptの基本構文と役割について学習します。変数、条件分岐、簡単な処理の流れを理解し、Webページに動きを与えるための考え方を身につけます。プログラミング未経験者でも理解できる内容から始め、今後のReact学習につながる基礎を固めます。",
    skillTags: ["JS"],
    durationSec: 3000,
  },
  {
    title: "React",
    text: "Reactの入門",
    about:
      "Reactの基本（コンポーネント・props・state）を学びます。UIを部品として組み立てる考え方を理解し、再利用できる設計や状態管理の基礎を身につけます。実際の画面開発の流れに触れながら、Next.jsへ進むための土台を作ります。",
    videoId: "nRCNL9T3J98",
    skillTags: ["React"],
    durationSec: 1800,
  },
  {
    title: "CSS",
    text: "アニメーション",
    about:
      "CSSアニメーションの基礎（transition / keyframes）を学習します。動きのあるUIを作るために必要なプロパティや、自然に見える動きの付け方を理解し、学習サイト全体の見た目をレベルアップさせるための実践力を身につけます。",
    videoId: "AcG9T2BRA6E",
    skillTags: ["CSS"],
    durationSec: 1200,
  },
  {
    title: "HTML 入門1",
    text: "初めてでも大丈夫",
    about:
      "HTMLの基本タグと文書構造を学びます。見出し・段落・リンク・画像などWebページの骨組みを作るための必須知識を身につけ、CSSやJavaScriptへ進むための土台を固めます。",
    videoId: "eEP7CLqnRr0",
    skillTags: ["HTML"],
    durationSec: 900,
  },

  // ↓↓ 以下、あなたの元データの同じ動画が続く部分も
  // 同じ形式で skillTags と durationSec を追加してください。
  // （videoIdが同じなら、基本的に同じskillTagsでOKです）

  {
    title: "HTML 入門1",
    text: "初めてでも大丈夫",
    about:
      "HTMLの基本タグと文書構造を学びます。見出し・段落・リンク・画像などWebページの骨組みを作るための必須知識を身につけ、CSSやJavaScriptへ進むための土台を固めます。",
    videoId: "KkXRYCwlbIE",
    skillTags: ["HTML"],
    durationSec: 1024,
  },
  {
    title: "HTML 入門1",
    text: "初めてでも大丈夫",
    about:
      "HTMLの基本タグと文書構造を学びます。見出し・段落・リンク・画像などWebページの骨組みを作るための必須知識を身につけ、CSSやJavaScriptへ進むための土台を固めます。",
    videoId: "QCjFPSO96RU",
    skillTags: ["JS"],
    durationSec: 3000,
  },
];
