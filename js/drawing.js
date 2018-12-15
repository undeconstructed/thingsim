
import * as random from './random.js'

export class Animator {
  constructor (canvas) {
    this.root = new Canvas(canvas)
  }
  appendChild (child) {
    this.root.appendChild(child)
  }
  draw () {
    this.root.tween()
    this.root.draw(null)
    window.requestAnimationFrame(() => this.draw())
  }
  start () {
    this.draw()
  }
}

export class Rect {
  constructor (x, y, w, h) {
    this.d = [x, y, w, h]
  }
  get x () {
    return this.d[0]
  }
  get y () {
    return this.d[1]
  }
  get w () {
    return this.d[2]
  }
  get h () {
    return this.d[3]
  }
  get r () {
    return this.x + this.w
  }
  get b () {
    return this.y + this.h
  }
  get center () {
    return [this.x + this.w / 2, this.y + this.h / 2]
  }
  add (that) {
    return new Rect(that.x + this.x, that.y + this.y, that.w + this.w, that.h + this.h)
  }
  delta (that) {
    return new Rect(that.x - this.x, that.y - this.y, that.w - this.w, that.h - this.h)
  }
  divide (n) {
    return new Rect(this.x / n, this.y / n, this.w / n, this.h / n)
  }
  toString () {
    return `${this.d}`
  }
}

export class Drawable {
  constructor (rect) {
    this.rect = rect
    this.tgt = this.rect
    this.tweenCount = 0
    this.delta = null
  }
  setParent (parent) {
    this.parent = parent
  }
  setTarget (rect) {
    this.tgt = rect
    this.delta = this.rect.delta(rect).divide(50)
    this.tweenCount = 50
  }
  setPosition (x, y) {
    if (x !== this.tgt.x || y !== this.tgt.y) {
      this.setTarget(new Rect(x, y, this.tgt.w, this.tgt.h))
    }
  }
  setSize (w, h) {
    if (w !== this.tgt.w || h !== this.tgt.h) {
      this.setTarget(new Rect(this.tgt.x, this.tgt.y, w, h))
    }
  }
  absoluteTo (target) {
    let res = this.rect
    let parent = this.parent
    while (true) {
      if (parent === target) {
        return res
      }
      if (!parent) {
        throw new Error('wrong parent')
      }
      res = new Rect(parent.rect.x + res.x, parent.rect.y + res.y, res.w, res.h)
      parent = parent.parent
    }
  }
  tween () {
    if (this.delta) {
      this.tweenCount--
      if (this.tweenCount === 0) {
        // deal with rounding errors
        this.rect = this.tgt
        this.delta = null
        return true
      } else {
        this.rect = new Rect(this.rect.x + this.delta.x, this.rect.y + this.delta.y, this.rect.w + this.delta.w, this.rect.h + this.delta.h)
        return false
      }
    }
  }
  draw (ctx) {
  }
}

export class Container extends Drawable {
  constructor (rect) {
    super(rect)
    this.children = []
  }
  appendChild (child) {
    child.setParent(this)
    this.children.push(child)
  }
  tween () {
    if (this.delta) {
      super.tween()
    } else {
      for (let child of this.children) {
        child.tween()
      }
    }
  }
  draw (ctx) {
    this.drawSelf(ctx)
    if (this.delta) {
      // TODO - use a transform for drawing children when animating
    } else {
      for (let child of this.children) {
        ctx.save()
        // translation is at top left of this box
        child.draw(ctx)
        ctx.restore()
      }
    }
  }
  drawSelf (ctx) {}
}

function drawRoundedRect (width, height, radius) {
  let ctx = this
  let innerWidth = width - radius * 2
  let innerHeight = height - radius * 2
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(radius + innerWidth, 0)
  ctx.arcTo(width, 0, width, radius, radius)
  ctx.lineTo(width, innerHeight + radius)
  ctx.arcTo(width, height, width - radius, height, radius)
  ctx.lineTo(radius, height)
  ctx.arcTo(0, height, 0, radius + innerHeight, radius)
  ctx.lineTo(0, radius)
  ctx.arcTo(0, 0, radius, 0, radius)
  ctx.closePath()
  ctx.fill()
}

class Canvas extends Container {
  constructor (canvas) {
    super(new Rect(0, 0, canvas.width, canvas.height))
    this.canvas = canvas
    this.ctx = this.canvas.getContext('2d')
    this.ctx.drawRoundedRect = drawRoundedRect
  }
  draw (nothing) {
    super.draw(this.ctx)
  }
  drawSelf (ctx) {
    ctx.clearRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h)
  }
}

export class Label extends Drawable {
  constructor (text, x, y) {
    super(new Rect(x, y, 0, 0))
    this.color = 'black'
    this.text = typeof text === 'function' ? text : () => text
  }
  draw (ctx) {
    ctx.fillStyle = this.color
    ctx.lineWidth = 0
    ctx.textBaseline = 'top'
    ctx.font = '14px sans'
    ctx.fillText(this.text(), this.rect.x, this.rect.y)
  }
}

export class Coord extends Label {
  constructor (parent) {
    super(() => `${this.absoluteTo(parent)}`, 0, 0)
  }
}

export class Box extends Container {
  constructor (x, y, w, h) {
    super(new Rect(x, y, w, h))
    this.color = 'rgb(150,150,150)'
  }
  drawSelf (ctx) {
    ctx.fillStyle = this.color
    ctx.translate(this.rect.x, this.rect.y)
    ctx.drawRoundedRect(this.rect.w, this.rect.h, 5)
  }
}

export class Wire extends Drawable {
  constructor (a, b, offset) {
    super(new Rect(0, 0, 0, 0))
    this.color = 'blue'
    this.a = a
    this.b = b
    this.offset = offset || 0
    this.pa = null
    this.pb = null
  }
  tween () {
    this.pa = this.a.absoluteTo(this.parent).center
    this.pb = this.b.absoluteTo(this.parent).center
  }
  draw (ctx) {
    ctx.lineWidth = 2
    ctx.strokeStyle = this.color
    ctx.beginPath()
    ctx.moveTo(...this.pa)
    if (this.pa[0] === this.pb[0]) {
      ctx.lineTo(this.pa[0] + this.offset, this.pa[1])
      ctx.lineTo(this.pb[0] + this.offset, this.pb[1])
      ctx.lineTo(this.pb[0], this.pb[1])
    } else {
      ctx.lineTo(...this.pb)
    }
    ctx.stroke()
  }
}
