// FontFaceSource contains a single font-face source, representing either an
// external reference or a locally-installed font face name.
// https://www.w3.org/TR/css3-fonts/#descdef-src
import { FontStyle, Slant } from '../render_tree/font';
import { Optional } from '@neditor/core/base/common/typescript';
import { DCHECK } from '@neditor/core/base/check';

export class FontFaceSource {
  static fromName(name: string) {
    let instance = new FontFaceSource();
    instance.name_ = name;
    return instance;
  }
  static fromUrl(url: string) {
    let instance = new FontFaceSource();
    instance.url_ = url;
    return instance;
  }
  url_: Optional<string>;
  name_: Optional<string>;

  protected constructor() {}

  IsUrlSource(): boolean { return !!this.url_; }
  GetName(): string { return this.name_!; }
  GetUrl(): string { return this.url_!; }

  EQ(other: FontFaceSource): boolean {
//    return name_ == other.name_ && url_ == other.url_;
    return this.name_ == other.name_;
  }
}

export type  FontFaceSources = FontFaceSource[]

export function arrayShallowEqual<T extends { EQ(other: T): boolean }>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;

  }
  return true;
}

export class UnicodeRange {
  // Sorts ranges primarily based on start and secondarily based on end.
  LT(range: UnicodeRange): boolean {
    if (this.start == range.start) {
      return this.end < range.end;
    }
    return this.start < range.start;
  }
  _start: Optional<number>;
  _end: Optional<number>;

  get start(): number {
    DCHECK(this._start);
    return this._start!;
  }
  set start(val: number) {
    this._start = val;
  }

  get end(): number {
    DCHECK(this._end);
    return this._end!;
  }
  set end(val: number) {
    this._end = val;
  }
}

export class Entry {
  EQ(other: Entry) {
    return this.style.weight === other.style.weight && this.style.slant == other.style.slant && arrayShallowEqual(this.sources, other.sources);
  }

  style: FontStyle = new FontStyle();
  sources: FontFaceSources = [];
  unicode_range = new Set<UnicodeRange>();
}

type  Entries = Entry[]
// FontFaceStyleSet contains a collection of @font-face rules with a matching
// font-family, providing the ability to add additional entries to the
// collection and to retrieve the entry from the collection that most closely
// matches a given style.
// https://www.w3.org/TR/css3-fonts/#font-face-rule
export class FontFaceStyleSet {
  entries_: Entries = [];
  // FontFaceStyleSet::Entry contains the style and source information for a
  // single @font-face rule.
  // https://www.w3.org/TR/css3-fonts/#descdef-src
  // https://www.w3.org/TR/css3-fonts/#font-prop-desc
  AddEntry(entry: Entry) {
    this.entries_.push(entry);
  }

  // Walk all of the style set's entries, inserting any url sources encountered
  // into the set. All pre-existing url entries within the set are retained.
//  void CollectUrlSources(std::set<GURL>* urls) const;

  EQ(other: FontFaceStyleSet) {
    return arrayShallowEqual(this.entries_, other.entries_);
  }

  // Returns the match score between two patterns. The score logic matches that
  // within SkFontStyleSet_Cobalt::match_score().
  MatchScore(pattern: FontStyle, candidate: FontStyle): number {
    // This logic is taken from Skia and is based upon the algorithm specified
    // within the spec:
    //   https://www.w3.org/TR/css-fonts-3/#font-matching-algorithm

    let score = 0;

    // CSS style (italic/oblique)
    // Being italic trumps all valid weights which are not italic.
    // Note that newer specs differentiate between italic and oblique.
    if ((pattern.slant == Slant.kItalicSlant) ==
      (candidate.slant == Slant.kItalicSlant)) {
      score += 1001;
    }

    // The 'closer' to the target weight, the higher the score.
    // 1000 is the 'heaviest' recognized weight
    if (pattern.weight == candidate.weight) {
      score += 1000;
    } else if (pattern.weight <= 500) {
      if (400 <= pattern.weight && pattern.weight < 450) {
        if (450 <= candidate.weight && candidate.weight <= 500) {
          score += 500;
        }
      }
      if (candidate.weight <= pattern.weight) {
        score += 1000 - pattern.weight + candidate.weight;
      } else {
        score += 1000 - candidate.weight;
      }
    } else if (pattern.weight > 500) {
      if (candidate.weight > pattern.weight) {
        score += 1000 + pattern.weight - candidate.weight;
      } else {
        score += candidate.weight;
      }
    }

    return score;
  }

  GetEntriesThatMatchStyle(
    pattern: FontStyle): Entry[] {
    let entries: Entry[] = [];
    let max_score = Number.MIN_SAFE_INTEGER;
    for (let entry of this.entries_) {
      let score = this.MatchScore(pattern, entry.style);
      if (score >= max_score) {
        if (score > max_score) {
          max_score = score;
          entries.length = 0;
        }
        entries.push(entry);
      }
    }
    return entries;
  }
}
