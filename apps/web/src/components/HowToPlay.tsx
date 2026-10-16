import { Tile } from "./Tile";

export function HowToPlay() {
  return (
    <div className="flex flex-col gap-4 text-[15px]">
      <p>Six puzzles a day: a <b>film</b>, a <b>song or artist</b> and an <b>icon</b>, in a Global and an India edition. Everyone gets the same six.</p>
      <ul className="flex list-disc flex-col gap-1.5 pl-5">
        <li>You get six guesses. Hint 1 shows at the start; every miss or skip reveals the next.</li>
        <li>Pick from the list. Typos never cost a guess.</li>
        <li>On your sixth guess, four options appear.</li>
        <li>Points: 6 for a first-guess solve, down to 1 on guess six.</li>
        <li>Play one puzzle a day to keep your streak. A new set unlocks at midnight IST.</li>
      </ul>
      <div className="flex flex-col gap-2">
        <p className="t-label text-muted">Reading the board</p>
        <Tile state="correct">Sholay</Tile>
        <p className="t-meta -mt-1 text-muted">Green ✓ — solved.</p>
        <Tile state="present">Sholay</Tile>
        <p className="t-meta -mt-1 text-muted">Yellow ~ — solved from the four options.</p>
        <Tile state="absent">Deewaar</Tile>
        <p className="t-meta -mt-1 text-muted">Grey × — not it. A new hint opens.</p>
      </div>
    </div>
  );
}
