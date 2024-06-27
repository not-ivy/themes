import Theme from "https://esm.sh/jsr/@iv/themes@0.0.1-alpha";

const theme = new Theme();
theme.install();
theme.start();

['f_high', 'f_med', 'f_low'].forEach((fg) => {
  [...document.getElementsByClassName(fg)].forEach((el) => {
    el.children[0].innerHTML = fg
    el.children[1].innerHTML = theme.get(fg)
  })
})