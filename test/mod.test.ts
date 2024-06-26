/// <reference lib="deno.ns" />

import { DOMParser } from "jsr:@b-fuze/deno-dom";
import Theme from "../mod.ts";
import { assert, assertEquals, assertExists, assertFalse } from "@std/assert";

const document = new DOMParser().parseFromString(
  Deno.readTextFileSync(new URL("index.html", import.meta.url)),
  "text/html",
);

let theme: Theme;

Deno.test("main", async (t) => {
  await t.step("init", () => {
    theme = new Theme({
      host: document as unknown as Document,
      parser: new DOMParser() as unknown as globalThis.DOMParser,
      quiet: true,
    });
  });

  await t.step("install", () => {
    theme.install();
    assertExists(document.body.getElementById("theme-framework"));
  });

  await t.step("start", () => {
    theme.start();
    assert(document.body.getElementById("theme-framework"));
    console.log(document.body.getElementById("theme-framework")?.innerHTML);
    assertEquals(
      document.body.getElementById("theme-framework")?.innerHTML,
      ":root {--background: #eeeeee; --f_high: #0a0a0a; --f_med: #4a4a4a; --f_low: #6a6a6a; --f_inv: #111111; --b_high: #a1a1a1; --b_med: #c1c1c1; --b_low: #ffffff; --b_inv: #ffb545;}",
    );
  });

  await t.step("get", () => {
    Object.keys(theme.defaultTheme).forEach((key) => {
      const k = key as keyof typeof theme["defaultTheme"];
      assertEquals(theme.get(k), theme.defaultTheme[k]);
    });
  });

  await t.step("set", () => {
    theme.set("background", "#000000");
    assertEquals(theme.get("background"), "#000000");
  });
});

Deno.test("helpers", async (t) => {
  await t.step("isColor", () => {
    assert(theme.isColor("#9b90ff"));
    assertFalse(theme.isColor("#fffffg"));
    assertFalse(theme.isColor("abcdef"));
  });

  await t.step("isJson", () => {
    assert(theme.isJson("{}"));
    assertFalse(theme.isJson("{asd}"));
  });

  // await t.step("isHtml", () => {
  //   assert(
  //     theme.isHtml(
  //       `<svg xmlns="http://www.w3.org/2000/svg" baseProfile="full" version="1.1"></svg>`,
  //     ),
  //   );
  // });

  await t.step("isValid", () => {
    assertFalse(theme.isValid({}));
    assert(theme.isValid(theme.defaultTheme));
  });
});
