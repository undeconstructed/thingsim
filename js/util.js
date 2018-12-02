
export const assert = (console ? console.assert : function () {})

// frontend

export function mkel(tag, opts) {
  opts = opts || {}
  let e = document.createElement(tag)
  if (opts.classes) {
    e.classList.add(...opts.classes)
  }
  if (opts.style) {
    e.style = opts.style
  }
  if (opts.text) {
    e.textContent = opts.text
  }
  return e
}
