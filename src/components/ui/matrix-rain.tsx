import { cn } from "@/lib/utils";
import "./matrix-rain.css";

const COLUMNS_PER_PATTERN = 40;

export interface MatrixRainProps {
  /**
   * How many times to repeat the 1000px column pattern side by side.
   *
   * The stylesheet positions 40 columns at fixed 25px offsets up to 975px, so a
   * single pattern covers exactly 1000px and leaves anything wider empty. The
   * container is a flex row precisely so patterns can be tiled; two covers a
   * half-width panel on a 2560px display.
   */
  repeat?: number;
  className?: string;
}

export function MatrixRain({ repeat = 2, className }: MatrixRainProps) {
  return (
    // aria-hidden: this is decoration. The glyphs are meaningless, and a screen
    // reader announcing several hundred katakana characters would be hostile.
    <div className={cn("matrix-container", className)} aria-hidden="true">
      {Array.from({ length: repeat }, (_, pattern) => (
        <div className="matrix-pattern" key={pattern}>
          {Array.from({ length: COLUMNS_PER_PATTERN }, (_, column) => (
            <div className="matrix-column" key={column} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default MatrixRain;
