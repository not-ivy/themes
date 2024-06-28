type Palette = Record<
  | "background"
  | "f_high"
  | "f_med"
  | "f_low"
  | "f_inv"
  | "b_high"
  | "b_med"
  | "b_low"
  | "b_inv",
  HexColor
>;

type HexColor = `#${string}`;

type LoadCallback = (palette: Palette) => unknown;

type Options = Partial<{
  host: Document;
  onload: LoadCallback;
  defaultTheme: Palette;
  parser: DOMParser;
  quiet: boolean;
}>;

/**
 * Fork of 100r's [theme framework]{@link https://github.com/hundredrabbits/Themes}, rewritten using ts + esm.
 *
 * Quick start:
 * ```typescript
 * const theme = new Theme();
 * theme.install(); // see {@link install}
 * theme.start(); // see {@link start}
 * ```
 */
export default class Theme {
  readonly defaultTheme: Palette;

  #el: HTMLElement;

  active?: Palette | undefined;
  host: Document;
  #parser: DOMParser;
  readonly #quiet: boolean;

  onLoad?: LoadCallback | undefined;

  /**
   * Adds drag and drop listeners and appends the style element the to the {@link host}.
   */
  install = (): void => {
    this.host.addEventListener("dragover", this.drag);
    this.host.addEventListener("drop", this.drop);
    this.host.body.appendChild(this.#el);
  };

  /**
   * Try to load an existing theme in `localStorage`, or load the [default theme]{@link defaultTheme}.
   *
   * @see {@link load}
   */
  start = (): void => {
    this.#log("Starting..");
    try {
      this.#log("Loading theme in localStorage...");
      this.load(localStorage["theme"]);
    } catch {
      this.#log("Loading failed, falling back to default...");
      this.load(this.defaultTheme);
    }
  };

  /**
   * Opens a dialog for the user to choose the theme file to {@link load}.
   *
   * @deprecated current non-functional.
   */
  open = (): void => {
    this.#log("Open theme..");
    const input = this.host.createElement("input");
    input.type = "file";
    input.onchange = (e) => {
      if (!e.target) return;
      this.#log(e.target);
      // this.read(e.target.files[0], this.load);
    };
    input.click();
  };

  /**
   * Parse and load the provided theme.
   *
   * @param data an object or a string containing valid `application/json` or `image/svg+xml`.
   */
  load = (data: Palette | string): void => {
    const theme = this.parse(data);
    this.#el.innerHTML = `:root {${
      Object.entries(theme).map(([key, val]) => `--${key}: ${val};`).join(" ")
    }}`;
    this.#log("Loaded theme.");
    localStorage.setItem("theme", JSON.stringify(theme));
    this.active = theme;
    this.#log("Saved theme.");
    if (this.onLoad) this.onLoad(theme);
  };

  /**
   * Loads the default theme.
   */
  reset = (): void => {
    this.load(this.defaultTheme);
  };

  /**
   * Sets a color by the key to the current [active theme]{@link active}.
   *
   * @param key the color key of the {@link Palette}
   * @param val a hex formatted color string
   */
  set = (key: keyof Palette, val: string): void => {
    if (!this.isColor(val)) {
      throw new Error("Theme: invalid color provided.");
    }
    if (!this.active) {
      throw new Error("Theme: theme have not been started yet.");
    }
    this.active[key] = val as HexColor; // check on above
  };

  /**
   * Gets a color by the key in the current [active palette]{@link active}.
   *
   * @param key color key in a {@link Palette}
   * @returns a hex formatted string that represents the selected color
   */
  get = (key: keyof Palette): string => {
    if (!this.active) {
      throw new Error("Theme: theme have not been started yet.");
    }
    return this.active[key];
  };

  /**
   * Transforms the provided data into a parsed theme as an object.
   *
   * @param data an object or a string containing valid `application/json` or `image/svg+xml`
   * @returns an object representing the provided theme
   * @see {@link load}
   */
  parse = (data: unknown): Palette => {
    switch (typeof data) {
      case "string":
        if (this.isJson(data)) return this.parse(JSON.parse(data));
        if (this.isSvg(data)) return this.extract(data);
        break;
      case "object":
        if (this.isValid(data)) return data as Palette;
        throw new Error("Theme: invalid palette provided.");
    }
    throw new Error("Theme: Unrecognized data format.");
  };

  drag = (e: DragEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = "copy";
  };

  drop = (e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.name.indexOf(".svg") > -1) {
      this.read(file, this.load);
    }
    e.stopPropagation();
  };

  read = (file: File, callback: typeof this.load): void => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result !== "string") return;
      callback(event.target.result);
    };
    reader.readAsText(file, "UTF-8");
  };

  isColor = (hex: string): boolean => /^#([0-9A-F]{3}){1,2}$/i.test(hex);

  isJson = (text: string): boolean => {
    try {
      JSON.parse(text);
    } catch {
      return false;
    }
    return true;
  };

  isSvg = (text: string): boolean => {
    try {
      this.#parser.parseFromString(text, "image/svg+xml");
    } catch {
      return false;
    }
    return true;
  };

  /**
   * Checks if the provided object is a valid theme.
   *
   * @param palette an object containing possible valid {@link Palette}.
   * @returns true if provided palette is not undefined or null, contains all colors, and all colors are valid hex.
   */
  isValid = (palette?: object | null): boolean =>
    palette !== undefined &&
    palette !== null &&
    Object.keys(palette).length > 0 &&
    Object.keys(palette).sort().every((el, i) =>
      el === Object.keys(this.defaultTheme).sort()[i] // probably not a very efficient check
    ) &&
    Object.values(palette).map(this.isColor).every((el) => el === true);

  /**
   * Transforms the provided xml into a valid {@link Palette} object.
   *
   * @param xml a string containing valid `image/svg+xml`.
   * @returns
   */
  extract = (xml: string): Palette => {
    const svg = this.#parser.parseFromString(xml, "image/svg+xml");
    const theme = (Object.keys(this.defaultTheme) as (keyof Palette)[])
      .reduce((palette, key) => {
        const color = svg.getElementById(key)?.getAttribute("fill");
        if (!color) throw new Error("Theme: Incomplete SVG theme.");
        if (!this.isColor(color)) {
          throw new Error("Theme: Invalid color provided in SVG.");
        }
        palette[key] = color as HexColor;
        return palette;
      }, {} as Palette);
    return theme;
  };

  #log = (...data: unknown[]) => {
    if (!this.#quiet) console.log("Theme:", ...data);
  };

  constructor(opts?: Options) {
    if (opts?.defaultTheme && !this.isValid(opts?.defaultTheme)) {
      throw new Error("Theme: invalid defaultTheme supplied.");
    }
    this.defaultTheme = opts?.defaultTheme || {
      background: "#eeeeee",
      f_high: "#0a0a0a",
      f_med: "#4a4a4a",
      f_low: "#6a6a6a",
      f_inv: "#111111",
      b_high: "#a1a1a1",
      b_med: "#c1c1c1",
      b_low: "#ffffff",
      b_inv: "#ffb545",
    };
    this.host = opts?.host || globalThis.document;
    this.onLoad = opts?.onload;
    this.#el = this.host.createElement("style");
    this.#el.id = "theme-framework";
    this.#parser = opts?.parser || new globalThis.DOMParser();
    this.#quiet = opts?.quiet || false;
  }
}
