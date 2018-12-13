
export class Animator {
  constructor (canvas) {
    this.root = new Canvas(canvas)
  }
  appendChild (child) {
    this.root.appendChild(child)
  }
  draw () {
    this.root.draw()
    window.requestAnimationFrame(() => this.draw())
  }
  start () {
    this.draw()
  }
}

class Drawable {
  constructor (x, y, w, h) {
    this.box = [x, y, w, h]
    this.tgt = this.box
    this.color = 'rgb(150,150,150)'
    this.tweenCount = 0
    this.delta = null
  }
  setParent (parent) {
    this.parent = parent
  }
  setTarget (x, y, w, h) {
    let n = 50
    let now = this.box
    this.tgt = [ x, y, w, h ]
    this.delta = [ (x - now[0]) / n, (y - now[1]) / n, (w - now[2]) / n, (h - now[3]) / n ]
    this.tweenCount = n
  }
  setDelta (x, y, w, h) {
    this.setTarget(this.tgt[0] + x, this.tgt[1] + y, this.tgt[2] + w, this.tgt[3] + h)
  }
  setPosition (x, y) {
    this.setTarget(x, y, this.tgt[2], this.tgt[3])
  }
  setSize (w, h) {
    if (w !== this.tgt[2] || h !== this.tgt[3]) {
      this.setTarget(this.tgt[0], this.tgt[1], w, h)
    }
  }
  get x () {
    return this.box[0]
  }
  get y () {
    return this.box[1]
  }
  get w () {
    return this.box[2]
  }
  get h () {
    return this.box[3]
  }
  tween () {
    if (this.tweenCount > 0) {
      let now = this.box
      let delta = this.delta
      this.box = [ now[0] + delta[0], now[1] + delta[1], now[2] + delta[2], now[3] + delta[3] ]
      this.tweenCount--
      if (this.tweenCount === 0) {
        // deal with rounding errors
        this.box = this.tgt
        this.delta = null
      }
    }
  }
  draw (canvas) {
  }
}

class Container extends Drawable {
  constructor (x, y, w, h) {
    super(x, y, w, h)
    this.children = []
  }
  appendChild (child) {
    child.setParent(this)
    this.children.push(child)
  }
  tween () {
    if (this.tweenCount > 0) {
      let now = this.box
      let delta = this.delta
      this.box = [ now[0] + delta[0], now[1] + delta[1], now[2] + delta[2], now[3] + delta[3] ]
      this.tweenCount--
      if (this.tweenCount === 0) {
        // deal with rounding errors
        this.box = this.tgt
        this.delta = null
      }
    } else {
      for (let child of this.children) {
        child.tween(this)
      }
    }
  }
  draw (canvas) {
    this.drawSelf(canvas)
    if (this.tweenCount > 0) {
    } else {
      // TODO - set a transform for drawing children when animating
      for (let child of this.children) {
        canvas.ctx.save()
        // translation is at top left of this box
        child.draw(canvas, this)
        canvas.ctx.restore()
      }
    }
  }
}

class Canvas extends Container {
  constructor (canvas) {
    super(0, 0, canvas.width, canvas.height)
    this.canvas = canvas
  }
  draw () {
    let ctx = this.canvas.getContext('2d')
    ctx.clearRect(this.x, this.y, this.w, this.h)

    this.ctx = ctx
    for (let child of this.children) {
      ctx.save()
      child.tween(this)
      child.draw(this, this)
      ctx.restore()
    }
    this.ctx = null
  }
  translate (x, y) {
    this.ctx.translate(x, y)
  }
  drawRoundedRect (width, height, radius) {
    let ctx = this.ctx
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
}

export class Label extends Drawable {
  constructor (text, x, y) {
    super(x, y, 0, 0)
    this.color = 'black'
    this.text = typeof text === 'function' ? text : () => text
  }
  draw (canvas) {
    // canvas.translate(this.x, this.y)
    canvas.ctx.fillStyle = this.color
    canvas.ctx.lineWidth = 0
    canvas.ctx.textBaseline = 'top'
    canvas.ctx.font = '14px sans'
    canvas.ctx.fillText(this.text(), this.x, this.y)
  }
}

export class Box extends Container {
  constructor (x, y, w, h) {
    super(x, y, w, h)
  }
  drawSelf (canvas) {
    canvas.ctx.fillStyle = this.color
    canvas.translate(this.x, this.y)
    canvas.drawRoundedRect(this.w, this.h, 5)
  }
}
