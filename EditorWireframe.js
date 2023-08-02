// ==UserScript==
// @name        Playcanvas - Wireframe
// @namespace   defektu
// @match       https://playcanvas.com/editor/*
// @exclude-match https://playcanvas.com/editor/code/*
// @grant       none
// @version     0.1
// @author      @defektu
// @description Adds Wireframe View for editor
// ==/UserScript==

(function () {
  "use strict";
  var wireframe = false;
  const logCssStyle = "color: white; background-color: #2ecc71";
  const onEngineLoaded = function () {
    console.log("%c Wireframe script loaded ", logCssStyle);
    createButton();
  };

  function toggleView() {
    wireframe = !wireframe;
    var renderComponents = pc.app.root.findComponents("render");
    renderComponents.forEach((element) => {
      // console.log(element)
      element.renderStyle = wireframe
        ? pc.RENDERSTYLE_WIREFRAME
        : pc.RENDERSTYLE_SOLID;
    });
  }

  function createButton() {
    console.log("createButton");
    const btn = new pcui.Button({ text: "Toggle Wireframe" });
    btn.style.position = "absolute";
    btn.style.bottom = "10px";
    btn.style.right = "10px";
    editor.call("layout.viewport").append(btn);

    btn.on("click", () => {
      toggleView();
    });
  }

  const intervalId = setInterval(function () {
    if (pc.Application.getApplication()) {
      onEngineLoaded();
      clearInterval(intervalId);
    }
  }, 200);
})();
