import { FontFace, FontList, FontListKey, State } from './font_list';
import { TimeDelta, TimeTicks } from '@neditor/core/base/time/time';
import { Typeface, TypefaceId } from '../render_tree/typeface';
import { Font, FontStyle } from '../render_tree/font';
import { Entry, FontFaceSource, FontFaceStyleSet } from './font_face';
import { GlyphBuffer } from '../render_tree/glyph_buffer';
import { ResourceProvider } from '../render_tree/resource_provider';
import { DCHECK } from '@neditor/core/base/check';
import { UnicodeString } from '@neditor/icu';
import { Ptr } from '@neditor/core/base/common/typescript';
import { CachedRemoteTypeface, CachedRemoteTypefaceReferenceWithCallbacks, RemoteTypefaceCache } from '../loader/font/remote_typeface_cache';
import { Closure } from '@neditor/core/base/callback';
import { CachedResourceReferenceWithCallbacks } from '../loader/resource_cache';
import { DLOG, INFO } from '@neditor/core/base/logging';
import { OneShotTimer } from '@neditor/core/base/timer/timer';

interface FontListInfo {
  font_list: FontList;
  inactive_time: TimeTicks;
}

class FontKey {
  typeface_id: TypefaceId;
  size: number;
  constructor(key_typeface_id: TypefaceId, key_size: number) {
    this.typeface_id = key_typeface_id;
    this.size = key_size;
  }
  LT(rhs: FontKey): boolean {
    if (this.typeface_id != rhs.typeface_id) {
      return this.typeface_id < rhs.typeface_id;
    } else {
      return this.size < rhs.size;
    }
  }
}

const CharacterFallbackKeyInstanceMap = new WeakMap<FontStyle, CharacterFallbackKey>();

class CharacterFallbackKey {
  style: FontStyle;
  static create(style: FontStyle): CharacterFallbackKey {
    if (!CharacterFallbackKeyInstanceMap.has(style)) {
      let instance = new CharacterFallbackKey(style);
      CharacterFallbackKeyInstanceMap.set(style, instance);
    }
    return CharacterFallbackKeyInstanceMap.get(style)!;
  }
  constructor(key_style: FontStyle) {
    this.style = key_style;
  }

  LT(rhs: CharacterFallbackKey): boolean {
    if (this.style.weight != rhs.style.weight) {
      return this.style.weight < rhs.style.weight;
    } else {
      return this.style.slant < rhs.style.slant;
    }
  }
}

// Font-face related
export type FontFaceMap = Map<string, FontFaceStyleSet>
// Font list related
export type FontListMap = Map<FontListKey, FontListInfo>
// Typeface/Font related
export type TypefaceMap = Map<TypefaceId, Typeface>
// export type InactiveFontSet = Set<InactiveFontKey>
// Character fallback related
export type CharacterFallbackTypefaceMap = Map<number, Typeface>
export type CharacterFallbackTypefaceMaps = Map<CharacterFallbackKey, CharacterFallbackTypefaceMap>
type RequestedRemoteTypefaceMap = Map<string, RequestedRemoteTypefaceInfo>
// const kInactiveFontListPurgeDelayMs = 300000;
// const kInactiveFontPurgeDelayMs = 900000;
// const kTotalFontCountPurgeThreshold = 64;

class RequestedRemoteTypefaceInfo {
  // The request timer delay, after which the requesting font list's fallback
  // font becomes visible.
  // NOTE: While using a timer of exactly 3 seconds is not specified by the
  // spec, it is the delay used by both Firefox and Webkit, and thus matches
  // user expectations.
  static kRequestTimerDelay = 3000;
  constructor(
    cached_remote_typeface: CachedRemoteTypeface,
    typeface_load_event_callback: Closure
  ) {
    this.cached_remote_typeface_reference_ = new CachedResourceReferenceWithCallbacks<RemoteTypefaceCache>(
      cached_remote_typeface, typeface_load_event_callback,
      typeface_load_event_callback);
    this.request_timer_ = new OneShotTimer();
    this.request_timer_.Start(TimeDelta.FromMilliseconds(RequestedRemoteTypefaceInfo.kRequestTimerDelay), typeface_load_event_callback);
  }

  HasActiveRequestTimer(): boolean { return !!this.request_timer_; }
  ClearRequestTimer() { this.request_timer_ = undefined; }

// The cached remote typeface reference both provides load event callbacks
// to the remote typeface cache for this remote typeface, and also ensures
// that the remote typeface is retained in the remote typeface cache's
// memory for as long as this reference exists.
  cached_remote_typeface_reference_: CachedRemoteTypefaceReferenceWithCallbacks;

// The request timer is started on object creation and triggers a load event
// callback when the timer expires. Before the timer expires, font lists
// that use this font will be rendered transparently to avoid a flash of
// text from briefly displaying a fallback font. However, permanently hiding
// the text while waiting for it to load is considered non-conformant
// behavior by the spec, so after the timer expires, the fallback font
// becomes visible (https://www.w3.org/TR/css3-fonts/#font-face-loading).
  request_timer_: Ptr<OneShotTimer>;
}

// The font cache is typically owned by dom::Document and handles the following:
//   - Tracking of font faces, which it uses to determine if a specified
//     font family is local or remote, and for url determination in requesting
//     remote typefaces.
//   - Creation and caching of font lists, which it provides to the used
//     style provider as requested. Font lists handle most layout-related font
//     cache interactions. Layout objects only interact with the font cache
//     through their font lists.
//   - Retrieval of typefaces, either locally from the resource provider or
//     remotely from the remote typeface cache, and caching of both typefaces
//     and fonts to facilitate sharing of them across font lists.
//   - Determination of the fallback typeface for a specific character using a
//     specific font style, and caching of that information for subsequent
//     lookups.
//   - Creation of glyph buffers, which is accomplished by passing the request
//    to the resource provider.
// NOTE: The font cache is not thread-safe and must only used within a single
// thread.
export class FontCache {
  resource_provider_: ResourceProvider;

  // TODO: Explore eliminating the remote typeface cache and moving its
  // logic into the font cache when the loader interface improves.
  remote_typeface_cache_: RemoteTypefaceCache;
  external_typeface_load_event_callback_: Closure;
  language_script_: string;

  // Font-face related
  // The cache contains a map of font faces and handles requesting typefaces by
  // url on demand from |remote_typeface_cache_| with a load event callback
  // provided by the constructor. Cached remote typeface returned by
  // |remote_typeface_cache_| have a reference retained by the cache for as long
  // as the cache contains a font face with the corresponding url, to ensure
  // that they remain in memory.
  font_face_map_: FontFaceMap = new Map<string, FontFaceStyleSet>();
  requested_remote_typeface_cache_: RequestedRemoteTypefaceMap = new Map;

  // Font list related
  // This maps unique font property combinations that are currently in use
  // within the document to the font lists that provides the functionality
  // associated with those font property combinations.
  font_list_map_: FontListMap = new Map<FontListKey, FontListInfo>();

  // Typeface/Font related
  // Maps of the local typefaces and fonts currently cached. These are used so
  // that the same typefaces and fonts can be shared across multiple font lists,
  // thereby also sharing the internal caching within typeface and font objects.
  // NOTE: Remote typefaces are not cached in |local_typeface_map_|, as the
  // RemoteTypefaceCache handles caching of them.
  local_typeface_map_: TypefaceMap = new Map<TypefaceId, Typeface>();
  // font_map_: FontMap = new Map<FontKey, FontInfo>();
  // inactive_font_set_: InactiveFontSet = new Set<InactiveFontKey>();

  // Fallback font related
  // Contains maps of both the unique typeface to use with a specific
  // character-style combination and a prototype font for the typeface, which
  // can be used to provide copies of the font at any desired size, without
  // requiring an additional request of the resource provider for each newly
  // encountered size.
  character_fallback_typeface_maps_: CharacterFallbackTypefaceMaps = new Map<CharacterFallbackKey, CharacterFallbackTypefaceMap>();

  // The last time the cache was checked for inactivity.
  // last_inactive_process_time_: TimeTicks;

  constructor(
    resource_provider: ResourceProvider,
    remote_typeface_cache: RemoteTypefaceCache,
    external_typeface_load_event_callback: Closure,
    language_script: string
  ) {
    this.remote_typeface_cache_ = remote_typeface_cache;
    this.external_typeface_load_event_callback_ = external_typeface_load_event_callback;
    this.resource_provider_ = resource_provider;
    this.language_script_ = language_script;
  }

  // Looks up and returns the font list in |font_list_map_|. If the font list
  // doesn't already exist, then a new one is created and added to the cache.
  GetFontList(font_list_key: FontListKey): FontList {
    //  DCHECK_CALLED_ON_VALID_THREAD(thread_checker_);
    // let font_list_info = this.font_list_map_.get(font_list_key);
    // if (!font_list_info) {
    //   throw new Error('500');
    // }
    // if (!font_list_info.font_list) {
    //   font_list_info.font_list = new FontList(this, font_list_key);
    // }
    // return font_list_info.font_list;
    return new FontList(this, font_list_key);
  }

  // Looks up and returns the font with the matching typeface and size in
  // |font_map_|. If it doesn't already exist in the cache, then a new font is
  // created from typeface and added to the cache.
  GetFontFromTypefaceAndSize(typeface: Typeface, size: number): Font {
    // //  DCHECK_CALLED_ON_VALID_THREAD(thread_checker_);
    // let font_key = new FontKey(typeface.GetId(), size);
    // // Check to see if the font is already in the cache. If it is not, then
    // // create it from the typeface and size and ADD_ASSIGN it to the cache.
    // let cached_font_info = this.font_map_.get(font_key);
    // if (!cached_font_info) {
    //   throw new Error('500');
    // }
    // if (!cached_font_info.font) {
    //   cached_font_info.font = typeface.CreateFontWithSize(size);
    // }
    // return cached_font_info.font;
    return typeface.CreateFontWithSize(size);
  }

  GetFacesForFamilyAndStyle(
    family: string, style: FontStyle): FontFace[] {
    let faces: FontFace[] = [];
    let font_face_set = this.font_face_map_.get(family);
    if (font_face_set) {
      // Add all font-face entries that match the family.
      let entries = font_face_set.GetEntriesThatMatchStyle(style);
      for (let entry of entries) {
        let face = new FontFace();
        face.entry = entry;
        faces.push(face);
      }
    } else {
      // This is a local font. One face can represent it.
      let face = new FontFace();
      faces.push(face);
    }
    return faces;
  }

  // Attempts to retrieve a font. If the family maps to a font face, then this
  // makes a request to |TryGetRemoteFont()|; otherwise, it makes a request
  // to |TryGetLocalFont()|. This function may return NULL.
  TryGetFont(family: string,
             style: FontStyle,
             size: number,
             maybe_style_set_entry: Ptr<Entry>): { font?: Font, state: State } {
    //  DCHECK_CALLED_ON_VALID_THREAD(thread_checker_);
    // let request_time_start = TimeTicks.Now().ToInternalValue();
    if (maybe_style_set_entry) {
      // Walk the entry's sources:
      // - If a remote source is encountered, always return the results of its
      //   attempted retrieval, regardless of its success.
      // - If a local source is encountered, only return the local font if it is
      //   successfully retrieved. In the case where the font is not locally
      //   available, the next font in the source list should be attempted
      //   instead.
      // https://www.w3.org/TR/css3-fonts/#src-desc
      for (let source_iterator = 0; source_iterator < maybe_style_set_entry.sources.length; source_iterator++) {
        const src = maybe_style_set_entry.sources[source_iterator];
        let { font, state } = this.TryGetRemoteFont(src.GetName(), size);
        return { font, state };
      }

      return {
        state: State.kUnavailableState
      };
    } else {
      let { font, state } = this.TryGetLocalFont(family, style, size);
      // GlobalStats::GetInstance()->OnFontRequestComplete(request_time_start);
      return { font, state };
    }
  }

  // Returns the character fallback typeface map associated with the specified
  // style. Each unique style has its own exclusive map. If it doesn't already
  // exist in the cache, then it is created during the request.
  // NOTE: This map is provided by the font cache so that all font lists with
  // the same style can share the same map. However, the cache itself does not
  // populate or query the map.
  GetCharacterFallbackTypefaceMap(
    style: FontStyle): CharacterFallbackTypefaceMap {
    let key = CharacterFallbackKey.create(style);
    if (!this.character_fallback_typeface_maps_.has(key)) {
      this.character_fallback_typeface_maps_.set(key, new Map<number, Typeface>());
    }
    return this.character_fallback_typeface_maps_.get(key)!;
  }

  // Retrieves the typeface associated with a UTF-32 character and style from
  // the resource provider.
  // NOTE: |character_fallback_typeface_maps_| is not queried before retrieving
  // the typeface from the resource provider. It is expected that the font list
  // will query its specific map first.
  GetCharacterFallbackTypeface(utf32_character: number, style: FontStyle): Typeface {
    DCHECK(this.resource_provider());
    return this.GetCachedLocalTypeface(
      this.resource_provider().GetCharacterFallbackTypeface(utf32_character, style,
        this.language_script_));
  }

  // Given a string of text, returns the glyph buffer needed to render it.
  CreateGlyphBuffer(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    is_rtl: boolean,
    font_list: FontList): GlyphBuffer {
    DCHECK(this.resource_provider());
    return this.resource_provider().CreateGlyphBuffer(
      text,
      text_start,
      text_length,
      this.language_script_, is_rtl,
      font_list);
  }

  // Given a string of text, return its width. This is faster than
  // CreateGlyphBuffer().
  GetTextWidth(
    text: UnicodeString,
    text_start: number,
    text_length: number,
    is_rtl: boolean,
    font_list: FontList,
    maybe_used_fonts?: Font[]): number {
    DCHECK(this.resource_provider());
    return this.resource_provider().GetTextWidth(
      text, text_start, text_length, this.language_script_, is_rtl,
      font_list, maybe_used_fonts);
  }

  private resource_provider() {
    return this.resource_provider_;
  }

// Looks up and returns the cached typeface in |local_typeface_map_|. If it
// doesn't already exist in the cache, then the passed in typeface is added to
// the cache.
  GetCachedLocalTypeface(typeface: Typeface): Typeface {
    DCHECK(typeface);
    // Check to see if a typeface with a matching id is already in the cache. If
    // it is not, then ADD_ASSIGN the passed in typeface to the cache.
    let cached_typeface = this.local_typeface_map_.get(typeface.GetId());
    if (!cached_typeface) {
      cached_typeface = typeface;
    }
    return cached_typeface;
  }

  // Returns the font if it is in the remote typeface cache and available;
  // otherwise returns NULL.
  // If the font is in the cache, but is not loaded, this call triggers an
  // asynchronous load of it. Both an external load even callback, provided by
  // the constructor and an |OnRemoteFontLoadEvent| callback provided by the
  // font are registered with the remote typeface cache to be called when the
  // load finishes.
  TryGetRemoteFont(url: string, size: number): { font?: Font, state: State } {
    // Retrieve the font from the remote typeface cache, potentially triggering a
    // load.
    let cached_remote_typeface = this.remote_typeface_cache_.GetOrCreateCachedResource(url);

    let requested_remote_typeface = this.requested_remote_typeface_cache_.get(url);

    // If the requested url is not currently cached, then create a cached
    // reference and request timer, providing callbacks for when the load is
    // completed or the timer expires.
    if (!requested_remote_typeface) {
      DLOG(INFO, 'Requested remote font from ', url);
      // Create the remote typeface load event's callback. This callback occurs on
      // successful loads, failed loads, and when the request's timer expires.
      let typeface_load_event_callback = this.OnRemoteTypefaceLoadEvent.bind(this, url);

      // Insert the newly requested remote typeface's info into the cache, and set
      // the iterator from the return value of the map insertion.

      requested_remote_typeface = new RequestedRemoteTypefaceInfo(
        cached_remote_typeface, typeface_load_event_callback);
      this.requested_remote_typeface_cache_.set(url, requested_remote_typeface);
    }

    let typeface = cached_remote_typeface.TryGetResource();
    let state: State;
    if (typeface) {
      return {
        font: this.GetFontFromTypefaceAndSize(typeface, size),
        state: State.kLoadedState,
      };
    } else {
      if (cached_remote_typeface.IsLoadingComplete()) {
        state = State.kUnavailableState;
      } else if (requested_remote_typeface.HasActiveRequestTimer()) {
        state = State.kLoadingWithTimerActiveState;
      } else {
        state = State.kLoadingWithTimerExpiredState;
      }
      return { state };
    }
  }

  // Returns NULL if the requested family is not empty and is not available in
  // the resource provider. Otherwise, returns the best matching local font.
  private TryGetLocalFont(family: string,
                          style: FontStyle,
                          size: number,
  ): { font?: Font, state: State } {
    DCHECK(this.resource_provider());
    // Only request the local font from the resource provider if the family is
    // empty or the resource provider actually has the family. The reason for this
    // is that the resource provider's |GetLocalTypeface()| is guaranteed to
    // return a non-NULL value, and in the case where a family is not supported,
    // the subsequent fonts in the font list need to be attempted. An empty family
    // signifies using the zero font.
    if (family && !this.resource_provider().HasLocalFontFamily(family)) {
      return {
        state: State.kUnavailableState
      };
    } else {
      let font = this.GetFontFromTypefaceAndSize(
        this.GetCachedLocalTypeface(
          this.resource_provider().GetLocalTypeface(family, style)),
        size);
      return { font, state: State.kLoadedState };
    }
  }

  // Called when a remote typeface either successfully loads or fails to load.
  // In either case, the event can impact the fonts contained within the font
  // lists. As a result, the font lists need to have their loading fonts reset
  // so that they'll be re-requested from the cache.
  OnRemoteTypefaceLoadEvent(url: string) {
    // DCHECK_CALLED_ON_VALID_THREAD(thread_checker_);
    let requested_remote_typeface = this.requested_remote_typeface_cache_.get(url);
    if (requested_remote_typeface) {
      // NOTE: We can potentially track the exact font list fonts that are
      // impacted by each load event and only reset them. However, as a result of
      // the minimal amount of processing required to update the loading status of
      // a font, the small number of fonts involved, and the fact that this is an
      // infrequent event, adding this additional layer of tracking complexity
      // doesn't appear to offer any meaningful benefits.
      for (let font_list_info of this.font_list_map_.values()) {
        font_list_info.font_list.ResetLoadingFonts();
      }

      // Clear the request timer. It only runs until the first load event occurs.
      requested_remote_typeface.ClearRequestTimer();

      this.external_typeface_load_event_callback_();
    }
  }
}
