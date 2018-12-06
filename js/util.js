
export const assert = (console ? console.assert : function () {})

// frontend

export function mkel(tag, opts) {
  opts = opts || {}
  let e = document.createElement(tag)
  if (opts.classes) {
    e.classList.add(...opts.classes)
    delete opts.classes
  }
  if (opts.text) {
    e.textContent = opts.text
    delete opts.text
  }
  for (let p in opts) {
    e[p] = opts[p]
  }
  return e
}
