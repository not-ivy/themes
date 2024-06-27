import Theme from "https://esm.sh/jsr/@iv/themes@0.0.1-alpha";
import {
  hex,
  wcag,
} from "https://esm.sh/jsr/@sondr3/a11y-color-contrast@0.2.0";

const theme = new Theme();
theme.install();
theme.start();

const calculate = () => {
  let scores = 0;
  let passed = 0;

  ["f_high", "f_med", "f_low"].forEach((fg) => {
    [...document.getElementsByClassName(fg)].forEach((el) => {
      const fgColor = theme.get(fg);
      const bg = el.classList[0];
      const bgColor = theme.get(el.classList[0]);

      el.children[0].innerHTML =
        `${fg} - <code>${fgColor}</code><br>${bg} - <code>${bgColor}</code>`;

      const score = wcag(hex(fgColor), hex(bgColor), {
        level: el.classList[2] == "aa" ? "AA" : "AAA",
      });
      el.children[1].innerHTML = `${score.level}, ${score.score.toFixed(2)}, ${
        score.pass ? "pass" : "fail"
      }`;
      scores += score.score;
      if (score.pass) passed += 1;
    });
  });

  document.getElementById("pass").innerText = `${passed}/9`;
  document.getElementById("average").innerText = `${(scores / 9).toFixed(2)}`;
};

calculate()

theme.onLoad = calculate;
