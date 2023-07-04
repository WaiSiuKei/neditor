// Collect valid FontFaces from CSSStyleSheets and StyleSheetLists and provide
// them to the FontCache, which replaces its previous set with them.
import { FontCache, FontFaceMap } from './font_cache';
import { Entry, FontFaceStyleSet } from './font_face';
import { NotReachedPropertyValueVisitor } from '../cssom/property_value_visitor';
import { FontStyleEnum, FontStyleValue } from '../cssom/font_style_value';
import { FontWeightEnum, FontWeightValue } from '../cssom/font_weight_value';
import { KeywordValue, Value } from '../cssom/keyword_value';
import { PropertyListValue } from '../cssom/property_list_value';
import { NOTIMPLEMENTED, NOTREACHED } from '@neditor/core/base/common/notreached';
import { StringValue } from '../cssom/string_value';
import { UnicodeRangeValue } from '../cssom/unicode_range_value';
import { FontStyle, Slant, Weight } from '../render_tree/font';

export class FontFaceUpdater /*extends CSSRuleVisitor*/ {
  constructor(cache: FontCache) {
    this.cache_ = cache;
    this.font_face_map_ = new Map<string, FontFaceStyleSet>();
  }

  update() {
    // this.cache_.SetFontFaceMap(this.font_face_map_);
  }

  // void ProcessCSSStyleSheet(
  //     const scoped_refptr<CSSStyleSheet>& style_sheet);
  // void ProcessStyleSheetList(
  //     const scoped_refptr<StyleSheetList>& style_sheet_list);

  // private:
  //  void VisitCSSStyleRule(CSSStyleRule* css_style_rule) override {}
  // void VisitCSSFontFaceRule(
  //     CSSFontFaceRule* css_font_face_rule) override;
  // void VisitCSSMediaRule(CSSMediaRule* css_media_rule) override {}
  // void VisitCSSKeyframeRule(
  //     CSSKeyframeRule* css_keyframe_rule) override {}
  // void VisitCSSKeyframesRule(
  //     CSSKeyframesRule* css_keyframes_rule) override {}

  // const GURL& document_base_url_;
  private cache_: FontCache;
  private font_face_map_: FontFaceMap;
}

// Visit a single font face rule, generating a FontFaceStyleSet::Entry from its
// values and verifying that it is valid.
// TODO: Handle unicode ranges.
class FontFaceProvider extends NotReachedPropertyValueVisitor {
  constructor() {
    super();
    this.style_set_entry_ = new Entry();
  }
//   explicit FontFaceProvider(const GURL& base_url) : base_url_(base_url) {
//     style_set_entry_ = base::MakeRefCounted<FontFaceStyleSet::Entry>();
//   }
//
  VisitFontStyle(font_style: FontStyleValue) {
    this.style_set_entry_.style.slant =
      font_style.value() == FontStyleEnum.kItalic
        ? Slant.kItalicSlant
        : Slant.kUprightSlant;
  }
  VisitFontWeight(font_weight: FontWeightValue) {
    const { style_set_entry_ } = this;
    switch (font_weight.value()) {
      case FontWeightEnum.kThinAka100:
        style_set_entry_.style.weight = Weight.kThinWeight;
        break;
      case  FontWeightEnum.kExtraLightAka200:
        style_set_entry_.style.weight =
          Weight.kExtraLightWeight;
        break;
      case  FontWeightEnum.kLightAka300:
        style_set_entry_.style.weight = Weight.kLightWeight;
        break;
      case  FontWeightEnum.kNormalAka400:
        style_set_entry_.style.weight = Weight.kNormalWeight;
        break;
      case  FontWeightEnum.kMediumAka500:
        style_set_entry_.style.weight = Weight.kMediumWeight;
        break;
      case  FontWeightEnum.kSemiBoldAka600:
        style_set_entry_.style.weight = Weight.kSemiBoldWeight;
        break;
      case  FontWeightEnum.kBoldAka700:
        style_set_entry_.style.weight = Weight.kBoldWeight;
        break;
      case  FontWeightEnum.kExtraBoldAka800:
        style_set_entry_.style.weight = Weight.kExtraBoldWeight;
        break;
      case  FontWeightEnum.kBlackAka900:
        style_set_entry_.style.weight = Weight.kBlackWeight;
        break;
    }
  }
  VisitKeyword(keyword: KeywordValue) {
    switch (keyword.value()) {
      case  Value.kCursive:
      case  Value.kFantasy:
      case  Value.kMonospace:
      case  Value.kSansSerif:
      case  Value.kSerif:
        this.font_family_ = keyword.ToString();
        break;
      // Inherit and Initial are valid font-family values. However, they are
      // meaningless in the context of an @font-face rule, as a font-family will
      // never attempt a lookup with that value. Clear the font-family name if
      // they are encountered so that the font face rule won't be created.
      case  Value.kInherit:
      case  Value.kInitial:
        this.font_family_ = '';
        break;
      default:
        NOTREACHED();
    }
  }
  // VisitLocalSrc(local_src: LocalSrcValue) {
  //   NOTIMPLEMENTED();
  // }
  VisitPropertyList(property_list: PropertyListValue) {
    for (let i = 0; i < property_list.value().length; ++i) {
      property_list.value()[i].Accept(this);
    }
  }
  VisitString(string: StringValue) {
    this.font_family_ = string.value();
  }
  VisitUnicodeRange(unicode_range: UnicodeRangeValue) {
    NOTIMPLEMENTED();
  }
  // VisitUrlSrc(url_src: UrlSrcValue) {
  //   NOTIMPLEMENTED();
  // }
  // VisitURL(url: URLValue) {
  //   NOTIMPLEMENTED();
  // }

  // The font family and src are required for the @font-face rule to be valid.
  //  https://www.w3.org/TR/css3-fonts/#descdef-font-family
  //  https://www.w3.org/TR/css3-fonts/#descdef-src
  IsFontFaceValid() {
    return !!this.font_family_ && this.style_set_entry_.sources.length > 0;
  }

  font_family(): string { return this.font_family_!; }
  style_set_entry() {
    return this.style_set_entry_;
  }

  private font_family_?: string;
  private style_set_entry_: Entry;
};
