# Themes

[![jsr badge](https://jsr.io/badges/@iv/themes)](https://jsr.io/@iv/themes)

A fork of Hundredrabbits'
[theme framework](https://github.com/hundredrabbits/Themes), rewritten in
typescript.

It is licensed under [ISC](/LICENSE.txt), which is compatible with MIT, the
original license that Hundredrabbits' framework was licensed under.

## Use

This package is published on [jsr](https://jsr.io/@iv/themes). To use it, it is
suggested to create an
[import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap).
Currently, jsr [does not allow](https://github.com/jsr-io/jsr/issues/133)
importing staight from the browser, so you should use a cdn instead.

### Import Map

```html
<script type="importmap">
  {
    "imports": {
      "jsr:@iv/themes": "https://esm.sh/jsr/@iv/themes@<current ver>"
    }
  }
</script>
```

It is suggested to pin a specific version, sp you will need to replace
`<current ver>` with the version shown above in the badge.

Then, you can it like this:

```javascript
import Theme from "jsr:@iv/themes";
```

Or, you can also use a http import:

### HTTP Import

```javascript
import Theme from "https://esm.sh/jsr/@iv/themes@<current ver>";
```

Same as above, you should replace `<current ver>` with the current version shown
in the badge above.

**Note**: a browser that supports [es6-module](https://caniuse.com/es6-module)
is required.
