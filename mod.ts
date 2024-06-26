/// <reference lib="DOM" />

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

export default class Theme {
  readonly defaultTheme: Palette;

  #el: HTMLElement;

  active?: Palette | undefined;
  host: Document;
  #parser: DOMParser;
  readonly #quiet: boolean;

  onLoad?: LoadCallback | undefined;

  install = () => {
    this.host.addEventListener("dragover", this.drag);
    this.host.addEventListener("drop", this.drop);
    this.host.body.appendChild(this.#el);
  };

  start = () => {
    this.#log("Starting..");
    try {
      this.#log("Loading theme in localStorage...");
      this.load(localStorage["theme"]);
    } catch {
      this.#log("Loading failed, falling back to default...");
      this.load(this.defaultTheme);
    }
  };

  open = () => {
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

  load = (data: Palette | string) => {
    const theme = this.parse(data);
    this.#el.innerHTML = `:root {${
      Object.entries(theme).map(([key, val]) => `--${key}: ${val};`)
    }};`;
    this.#log("Loaded theme.");
    localStorage.setItem("theme", JSON.stringify(theme));
    this.active = theme;
    this.#log("Saved theme.");
    if (this.onLoad) this.onLoad(theme);
  };

  reset = () => {
    this.load(this.defaultTheme);
  };

  set = (key: keyof Palette, val: string) => {
    if (!this.isColor(val)) {
      throw new Error("Theme: invalid color provided.");
    }
    if (!this.active) {
      throw new Error("Theme: theme have not been started yet.");
    }
    this.active[key] = val as HexColor; // check on above
  };

  get = (key: keyof Palette): string => {
    if (!this.active) {
      throw new Error("Theme: theme have not been started yet.");
    }
    return this.active[key];
  };

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

  read = (file: File, callback: typeof this.load) => {
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
   * @param palette
   * @returns true if provided <palette> is not undefined or null, contains all colors, and all colors are valid hex.
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
   * @param xml a svg document that should have
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
