// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

class Theme {
    defaultTheme;
    #el;
    active;
    host;
    #parser;
    #quiet;
    onLoad;
    install = ()=>{
        this.host.addEventListener("dragover", this.drag);
        this.host.addEventListener("drop", this.drop);
        this.host.body.appendChild(this.#el);
    };
    start = ()=>{
        this.#log("Starting..");
        try {
            this.#log("Loading theme in localStorage...");
            this.load(localStorage["theme"]);
        } catch  {
            this.#log("Loading failed, falling back to default...");
            this.load(this.defaultTheme);
        }
    };
    open = ()=>{
        this.#log("Open theme..");
        const input = this.host.createElement("input");
        input.type = "file";
        input.onchange = (e)=>{
            if (!e.target) return;
            this.#log(e.target);
        };
        input.click();
    };
    load = (data)=>{
        const theme = this.parse(data);
        this.#el.innerHTML = `:root {${Object.entries(theme).map(([key, val])=>`--${key}: ${val};`).join(" ")}}`;
        this.#log("Loaded theme.");
        localStorage.setItem("theme", JSON.stringify(theme));
        this.active = theme;
        this.#log("Saved theme.");
        if (this.onLoad) this.onLoad(theme);
    };
    reset = ()=>{
        this.load(this.defaultTheme);
    };
    set = (key, val)=>{
        if (!this.isColor(val)) {
            throw new Error("Theme: invalid color provided.");
        }
        if (!this.active) {
            throw new Error("Theme: theme have not been started yet.");
        }
        this.active[key] = val;
    };
    get = (key)=>{
        if (!this.active) {
            throw new Error("Theme: theme have not been started yet.");
        }
        return this.active[key];
    };
    parse = (data)=>{
        switch(typeof data){
            case "string":
                if (this.isJson(data)) return this.parse(JSON.parse(data));
                if (this.isSvg(data)) return this.extract(data);
                break;
            case "object":
                if (this.isValid(data)) return data;
                throw new Error("Theme: invalid palette provided.");
        }
        throw new Error("Theme: Unrecognized data format.");
    };
    drag = (e)=>{
        e.stopPropagation();
        e.preventDefault();
        if (!e.dataTransfer) return;
        e.dataTransfer.dropEffect = "copy";
    };
    drop = (e)=>{
        e.preventDefault();
        if (!e.dataTransfer) return;
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (file.name.indexOf(".svg") > -1) {
            this.read(file, this.load);
        }
        e.stopPropagation();
    };
    read = (file, callback)=>{
        const reader = new FileReader();
        reader.onload = (event)=>{
            if (typeof event.target?.result !== "string") return;
            callback(event.target.result);
        };
        reader.readAsText(file, "UTF-8");
    };
    isColor = (hex)=>/^#([0-9A-F]{3}){1,2}$/i.test(hex);
    isJson = (text)=>{
        try {
            JSON.parse(text);
        } catch  {
            return false;
        }
        return true;
    };
    isSvg = (text)=>{
        try {
            this.#parser.parseFromString(text, "image/svg+xml");
        } catch  {
            return false;
        }
        return true;
    };
    isValid = (palette)=>palette !== undefined && palette !== null && Object.keys(palette).length > 0 && Object.keys(palette).sort().every((el, i)=>el === Object.keys(this.defaultTheme).sort()[i]) && Object.values(palette).map(this.isColor).every((el)=>el === true);
    extract = (xml)=>{
        const svg = this.#parser.parseFromString(xml, "image/svg+xml");
        const theme = Object.keys(this.defaultTheme).reduce((palette, key)=>{
            const color = svg.getElementById(key)?.getAttribute("fill");
            if (!color) throw new Error("Theme: Incomplete SVG theme.");
            if (!this.isColor(color)) {
                throw new Error("Theme: Invalid color provided in SVG.");
            }
            palette[key] = color;
            return palette;
        }, {});
        return theme;
    };
    #log = (...data)=>{
        if (!this.#quiet) console.log("Theme:", ...data);
    };
    constructor(opts){
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
            b_inv: "#ffb545"
        };
        this.host = opts?.host || globalThis.document;
        this.onLoad = opts?.onload;
        this.#el = this.host.createElement("style");
        this.#el.id = "theme-framework";
        this.#parser = opts?.parser || new globalThis.DOMParser();
        this.#quiet = opts?.quiet || false;
    }
}

