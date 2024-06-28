"use strict";

document.getElementById('content').style.display = 'none';

const progress = document.getElementById('progress-bar');
const title = progress.parentElement.getElementsByTagName('h1')[0];
title.innerText = 'Loading themes framework';

console.log('importing');

const Theme = (await import("https://esm.sh/jsr/@iv/themes@0.0.1-alpha")).default;
progress.style.width = '50%';
title.innerText = 'Loading a11y tools'
const { hex, wcag } = (await import("https://esm.sh/jsr/@sondr3/a11y-color-contrast@0.2.0"));
progress.style.width = '50%';

console.log('import finished');

title.parentElement.style.opacity = 0;
await new Promise((resolve) => {setInterval(resolve, 300)})
title.parentElement.remove();
document.getElementById('content').style.display = 'block';

const theme = new Theme();
theme.install();
document.getElementById('theme-framework').remove();
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
  const score = passed / 9;
  document.getElementById("score").innerText = `${(score * 100).toFixed(2)}% ${score > 0.9 ? 'perfect' : (score > 0.7 ? 'great' : (score > 0.5 ? 'good' : (score > 0.3 ? 'okay' : 'bad' )))}`;
};

calculate();

theme.onLoad = calculate;
